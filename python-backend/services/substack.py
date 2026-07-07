"""
services/substack.py
====================
Substack RSS feed fetcher, parser, and cache.

Two parsing modes (chosen automatically at startup):
  1. C parser  — rss_parser.so loaded via ctypes. Faster, teaches you C.
  2. Python parser — pure stdlib regex fallback. Always available.

Switching to your own database:
  Set USE_SUBSTACK=false in .env. The routers will call database.py instead.
  You can archive this file once you no longer use Substack.

The data shape this produces matches the database schema exactly, so the
routers don't need to know which source the data came from.
"""

import ctypes
import json
import logging
import os
import platform
import re
import sys
import time
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx

from models.post import Post

logger = logging.getLogger(__name__)

# ── SSRF allowlist ─────────────────────────────────────────────────────────────
# Only URLs on these domains are allowed as feed sources.
# This prevents an attacker from using the RSS fetcher to probe internal services.
_ALLOWED_FEED_DOMAINS = frozenset([
    "substack.com",
])

def _is_allowed_feed_url(url: str) -> bool:
    """Return True only if url's hostname is *.substack.com (or exactly substack.com)."""
    try:
        host = urlparse(url).hostname or ""
        return host == "substack.com" or host.endswith(".substack.com")
    except Exception:
        return False


# ── C extension loader ─────────────────────────────────────────────────────────
# We try to load the compiled rss_parser.so. If it doesn't exist or fails to
# load (e.g. on Windows dev machines without gcc), we fall back to the Python
# parser. The public API is identical either way.

_c_parser: Optional[ctypes.CDLL] = None

def _load_c_parser() -> Optional[ctypes.CDLL]:
    """
    Try to load the compiled C shared library.
    Returns the loaded library, or None if not available.
    Called once at module import time.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    # The .so lives one directory up (next to rss_parser.c)
    parent = os.path.dirname(here)

    if platform.system() == "Windows":
        lib_path = os.path.join(parent, "rss_parser.dll")
    else:
        lib_path = os.path.join(parent, "rss_parser.so")

    if not os.path.exists(lib_path):
        logger.info("rss_parser shared library not found — using Python parser")
        return None

    try:
        lib = ctypes.CDLL(lib_path)

        # Declare the C function signatures so ctypes marshals arguments correctly.
        # parse_rss_xml(xml: bytes, xml_len: int, out_count: *int) -> char*
        lib.parse_rss_xml.restype  = ctypes.c_char_p
        lib.parse_rss_xml.argtypes = [
            ctypes.c_char_p,    # xml bytes
            ctypes.c_int,       # length
            ctypes.POINTER(ctypes.c_int),  # out_count (written by C)
        ]

        # free_rss_result(ptr: char*) -> void
        lib.free_rss_result.restype  = None
        lib.free_rss_result.argtypes = [ctypes.c_char_p]

        logger.info("Loaded C RSS parser from %s", lib_path)
        return lib

    except (OSError, AttributeError) as exc:
        logger.warning("Could not load C parser (%s) — using Python parser", exc)
        return None


_c_parser = _load_c_parser()


# ── Cache ─────────────────────────────────────────────────────────────────────
# Stores the last successful fetch per feed URL.
# Key: feed URL string. Value: (list[Post], fetch_timestamp).
_cache: dict[str, tuple[list[Post], float]] = {}


# ── Tech keyword set (Python parser) ─────────────────────────────────────────
_TECH_KEYWORDS = frozenset([
    "tech", "cod", "program", "dev", "python", "javascript", "html",
    "css", "web", "software", "git", "react", "node", "typescript",
    "backend", "frontend", "database", "linux", "api",
])


# ── Python-only XML helpers ────────────────────────────────────────────────────

def _extract_tag(xml: str, tag: str) -> str:
    """Extract first text content of a named XML tag, handling CDATA."""
    escaped = re.escape(tag)
    m = re.search(
        rf"<{escaped}(?:\s[^>]*)?>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*</{escaped}>",
        xml, re.IGNORECASE,
    )
    if m:
        return (m.group(1) or m.group(2) or "").strip()
    return ""


def _extract_all_tags(xml: str, tag: str) -> list[str]:
    """Extract all occurrences of a named XML tag."""
    escaped = re.escape(tag)
    results = []
    for m in re.finditer(
        rf"<{escaped}(?:\s[^>]*)?>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*</{escaped}>",
        xml, re.IGNORECASE,
    ):
        val = (m.group(1) or m.group(2) or "").strip()
        if val:
            results.append(val)
    return results


def _extract_link(xml: str) -> str:
    """Extract canonical URL from <link> or <guid>."""
    m = re.search(r"<link>\s*(https?://[^\s<]+)\s*</link>", xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r'<(?:atom:)?link[^>]+href=["\']([\w:/.\-?=&%#]+)["\'][^>]*/?>',
                  xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r"<guid[^>]*>\s*(https?://[^\s<]+)\s*</guid>", xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ""


def _stable_id(url: str, index: int) -> int:
    """Stable integer ID from URL. Same URL always produces same ID."""
    if url:
        import hashlib
        return int(hashlib.md5(url.encode()).hexdigest()[:8], 16) % 999_999 + 1
    return index + 1


def _parse_feed_python(xml: str) -> list[Post]:
    """
    Pure-Python RSS parser.
    Used when the C library is not available (dev machines without gcc).
    Produces the same output shape as the C parser.
    """
    raw_items = re.split(r"<item[\s>]", xml, flags=re.IGNORECASE)
    if len(raw_items) <= 1:
        return []

    posts: list[Post] = []

    for index, chunk in enumerate(raw_items[1:]):
        end = chunk.find("</item>")
        item = chunk[:end] if end != -1 else chunk

        title = _extract_tag(item, "title")
        if not title:
            continue

        link       = _extract_link(item)
        pub_date   = _extract_tag(item, "pubDate")
        desc       = _extract_tag(item, "description")
        content    = _extract_tag(item, "content:encoded") or _extract_tag(item, "encoded") or desc
        categories = _extract_all_tags(item, "category")

        # Cover image: first <img src="..."> in content or description
        img = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', content, re.IGNORECASE)
        if not img:
            img = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', desc, re.IGNORECASE)
        cover_image = img.group(1) if img else None

        # Plain text excerpt (200 chars)
        plain = re.sub(r"<[^>]*>", "", desc).replace("\n", " ")
        plain = re.sub(r"\s+", " ", plain).strip()
        excerpt = plain[:200] + ("…" if len(plain) > 200 else "")

        # Reading time
        word_count   = len(re.sub(r"<[^>]*>", "", content).split())
        reading_time = max(1, round(word_count / 200))

        # Tags
        tags = [c.lower().replace(" ", "-") for c in categories] or ["dev"]

        # Category — "tech" or "general" (BUG FIX: was always returning "tech")
        is_tech  = any(kw in tag for tag in tags for kw in _TECH_KEYWORDS)
        category = "tech" if is_tech else "general"

        # Slug
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")

        # Parse date
        try:
            created_at = (
                datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %z")
                if pub_date
                else datetime.now(timezone.utc)
            )
        except ValueError:
            created_at = datetime.now(timezone.utc)

        posts.append(Post(
            id=_stable_id(link, index),
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            tags=tags,
            authorId="1",
            authorName="CodedChapter",
            authorUsername="codedchapter",
            category=category,
            coverImage=cover_image,
            readingTimeMinutes=reading_time,
            commentCount=0,
            createdAt=created_at,
            updatedAt=created_at,
            isHtml=True,
            substackUrl=link or None,
        ))

    return posts


def _parse_feed_c(xml: str) -> list[Post]:
    """
    Call the C shared library to parse the RSS XML.
    The C parser returns a JSON array string which we decode into Post objects.
    Falls back to the Python parser if anything goes wrong at call time.
    """
    if _c_parser is None:
        return _parse_feed_python(xml)

    xml_bytes = xml.encode("utf-8")
    out_count = ctypes.c_int(0)

    try:
        raw_ptr = _c_parser.parse_rss_xml(xml_bytes, len(xml_bytes), ctypes.byref(out_count))
    except Exception as exc:
        logger.warning("C parser call failed (%s) — falling back to Python parser", exc)
        return _parse_feed_python(xml)

    if not raw_ptr:
        return []

    try:
        json_str = raw_ptr.decode("utf-8", errors="replace")
        items    = json.loads(json_str)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        logger.warning("C parser returned bad JSON (%s) — falling back to Python parser", exc)
        _c_parser.free_rss_result(raw_ptr)
        return _parse_feed_python(xml)
    finally:
        # Always free the C-allocated buffer even if JSON parsing failed
        try:
            _c_parser.free_rss_result(raw_ptr)
        except Exception:
            pass

    # Deserialise JSON dicts into Post model instances
    posts: list[Post] = []
    for item in items:
        try:
            # Parse ISO or RFC 2822 date string from C output
            created_raw = item.get("createdAt", "")
            try:
                created_at = datetime.strptime(created_raw, "%a, %d %b %Y %H:%M:%S %z")
            except ValueError:
                try:
                    created_at = datetime.fromisoformat(created_raw)
                except ValueError:
                    created_at = datetime.now(timezone.utc)

            posts.append(Post(
                id=item["id"],
                title=item["title"],
                slug=item["slug"],
                excerpt=item["excerpt"],
                content=item.get("content", ""),
                tags=item.get("tags", ["dev"]),
                authorId=item.get("authorId", "1"),
                authorName=item.get("authorName", "CodedChapter"),
                authorUsername=item.get("authorUsername", "codedchapter"),
                category=item.get("category", "tech"),
                coverImage=item.get("coverImage"),
                readingTimeMinutes=item.get("readingTimeMinutes", 1),
                commentCount=item.get("commentCount", 0),
                createdAt=created_at,
                updatedAt=created_at,
                isHtml=item.get("isHtml", True),
                substackUrl=item.get("substackUrl"),
            ))
        except Exception as exc:
            logger.debug("Skipping malformed post from C parser: %s", exc)

    return posts


def _parse_feed(xml: str) -> list[Post]:
    """Route to C parser if available, Python parser otherwise."""
    if _c_parser is not None:
        return _parse_feed_c(xml)
    return _parse_feed_python(xml)


# ── HTTP fetch ────────────────────────────────────────────────────────────────

async def fetch_substack_posts(feed_url: str) -> list[Post]:
    """
    Fetch and parse the Substack RSS feed.

    Args:
        feed_url: Full Substack RSS URL (e.g. https://x.substack.com/feed)

    Raises:
        ValueError: If feed_url is not an allowed domain (SSRF protection)
        httpx.HTTPError: If the request fails
    """
    # SSRF guard — only *.substack.com is allowed
    if not _is_allowed_feed_url(feed_url):
        raise ValueError(f"Feed URL not allowed: {feed_url!r}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            feed_url,
            headers={"User-Agent": "CodedChapter/2.0 RSS Reader (+https://codedchapter.vercel.app)"},
            follow_redirects=True,
        )
        resp.raise_for_status()
        return _parse_feed(resp.text)


# ── Cache layer ───────────────────────────────────────────────────────────────

async def get_substack_posts(feed_url: str, ttl: int = 300) -> list[Post]:
    """
    Return cached Substack posts, refreshing when the TTL has expired.
    Serves stale content if the upstream fetch fails (graceful degradation).

    Args:
        feed_url: Full Substack RSS URL
        ttl: Cache lifetime in seconds (default 300 = 5 minutes)
    """
    now    = time.monotonic()
    cached = _cache.get(feed_url)

    if cached:
        posts, fetched_at = cached
        if now - fetched_at < ttl:
            logger.debug("Substack cache hit (age=%.0fs)", now - fetched_at)
            return posts

    try:
        logger.info("Fetching Substack RSS: %s", feed_url)
        posts = await fetch_substack_posts(feed_url)
        _cache[feed_url] = (posts, now)
        logger.info(
            "Substack RSS fetched: %d posts (parser=%s)",
            len(posts),
            "C" if _c_parser is not None else "Python",
        )
        return posts

    except Exception as exc:
        if cached:
            logger.warning("Substack fetch failed, serving stale cache: %s", exc)
            return cached[0]
        logger.error("Substack fetch failed and no cache available: %s", exc)
        raise
