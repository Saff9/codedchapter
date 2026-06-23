"""
services/substack.py
====================
Substack RSS feed parser and in-memory cache.

CURRENT MODE: This service is active when USE_SUBSTACK=true (the default).

TO SWITCH TO YOUR OWN DATABASE:
    1. Set USE_SUBSTACK=false in your .env file
    2. The routers will automatically call database.py instead of this service
    3. You can safely delete or archive this file after the switch

The data shape produced here exactly matches the database schema,
so swapping data sources requires zero changes to the API responses.
"""

import re
import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Optional
from cachetools import TTLCache
import httpx

from models.post import Post

logger = logging.getLogger(__name__)

# ── In-memory LRU + TTL Cache ────────────────────────────────────────────────
# Holds the last successful Substack fetch. Avoids hammering their servers.
# TTL is configured via settings.substack_cache_ttl_seconds (default 300s = 5min)
_cache: dict[str, tuple[list[Post], float]] = {}


def _extract_tag(xml: str, tag: str) -> str:
    """Extract first content of a named XML tag, handling CDATA sections."""
    escaped = re.escape(tag)
    pattern = rf"<{escaped}(?:\s[^>]*)?>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<][\s\S]*?))\s*</{escaped}>"
    m = re.search(pattern, xml, re.IGNORECASE)
    if m:
        return (m.group(1) or m.group(2) or "").strip()
    return ""


def _extract_all_tags(xml: str, tag: str) -> list[str]:
    """Extract all occurrences of a named XML tag."""
    escaped = re.escape(tag)
    pattern = rf"<{escaped}(?:\s[^>]*)?>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<][\s\S]*?))\s*</{escaped}>"
    results = []
    for m in re.finditer(pattern, xml, re.IGNORECASE):
        val = (m.group(1) or m.group(2) or "").strip()
        if val:
            results.append(val)
    return results


def _extract_link(xml: str) -> str:
    """Extract canonical URL from RSS <link> or <guid> element."""
    m = re.search(r"<link>\s*(https?://[^\s<]+)\s*</link>", xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r'<(?:atom:)?link[^>]+href=["\']([^"\']+)["\'][^>]*/?>',xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    m = re.search(r"<guid[^>]*>\s*(https?://[^\s<]+)\s*</guid>", xml, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ""


def _stable_id(url: str, index: int) -> int:
    """
    Generate a stable integer ID from a post URL.
    This ensures the same post always gets the same ID across cache refreshes.
    Falls back to index if URL is empty.
    """
    if url:
        return int(hashlib.md5(url.encode()).hexdigest()[:8], 16) % 1_000_000 + 1
    return index + 1


def _parse_feed(xml: str) -> list[Post]:
    """
    Parse a Substack RSS XML feed into a list of Post objects.
    
    Handles:
    - CDATA sections
    - HTML content in content:encoded
    - Category extraction and tech/general classification
    - Reading time estimation
    - Cover image extraction from content HTML
    """
    # Tech-related keywords for auto-categorisation
    TECH_KEYWORDS = {
        "tech", "coding", "code", "programming", "development",
        "javascript", "python", "css", "html", "web", "software",
        "dev", "git", "react", "node", "typescript", "backend", "frontend"
    }

    raw_items = re.split(r"<item[\s>]", xml, flags=re.IGNORECASE)
    if len(raw_items) <= 1:
        return []

    posts: list[Post] = []

    for index, chunk in enumerate(raw_items[1:]):
        # Trim to first </item> boundary
        end = chunk.find("</item>")
        item = chunk[:end] if end != -1 else chunk

        title = _extract_tag(item, "title")
        if not title:
            continue

        link = _extract_link(item)
        pub_date = _extract_tag(item, "pubDate")
        description = _extract_tag(item, "description")
        content_encoded = (
            _extract_tag(item, "content:encoded")
            or _extract_tag(item, "encoded")
            or description
        )
        categories = _extract_all_tags(item, "category")

        # Cover image: first <img src="..."> in content
        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_encoded, re.IGNORECASE)
        if not img_match:
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', description, re.IGNORECASE)
        cover_image = img_match.group(1) if img_match else None

        # Plain text excerpt (strip all HTML)
        plain_text = re.sub(r"<[^>]*>", "", description).replace("\n", " ").strip()
        plain_text = re.sub(r"\s+", " ", plain_text)
        excerpt = plain_text[:200] + ("…" if len(plain_text) > 200 else "")

        # Reading time estimate
        word_count = len(re.sub(r"<[^>]*>", "", content_encoded).split())
        reading_time = max(1, round(word_count / 200))

        # Tags from Substack categories
        tags = [c.lower().replace(" ", "-") for c in categories]
        if not tags:
            tags = ["dev"]

        # Category: check if any tag is tech-related; default to "tech" for a dev blog
        is_tech = any(kw in tag for tag in tags for kw in TECH_KEYWORDS)
        category = "tech" if is_tech else "tech"  # TODO: Adjust once general logs flow

        # URL slug from title
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")

        # Parse publication date
        try:
            created_at = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %z") if pub_date else datetime.now(timezone.utc)
        except ValueError:
            created_at = datetime.now(timezone.utc)

        post_id = _stable_id(link, index)

        posts.append(Post(
            id=post_id,
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content_encoded,
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


async def fetch_substack_posts(feed_url: str) -> list[Post]:
    """
    Fetch and parse the Substack RSS feed.
    
    Args:
        feed_url: Full URL to the Substack RSS feed (e.g. https://x.substack.com/feed)
    
    Returns:
        List of Post objects parsed from the feed
    
    Raises:
        httpx.HTTPError: If the feed cannot be fetched
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            feed_url,
            headers={"User-Agent": "CodedChapter/2.0 RSS Reader (+https://codedchapter.vercel.app)"},
            follow_redirects=True,
        )
        resp.raise_for_status()
        return _parse_feed(resp.text)


async def get_substack_posts(feed_url: str, ttl: int = 300) -> list[Post]:
    """
    Return cached Substack posts, refreshing when the TTL has expired.

    Serves stale content if the upstream fetch fails (graceful degradation).

    Args:
        feed_url: Full Substack RSS URL
        ttl: Cache time-to-live in seconds (default: 300 = 5 minutes)

    Returns:
        List of Post objects
    """
    now = time.monotonic()
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
        logger.info("Substack RSS fetched: %d posts", len(posts))
        return posts
    except Exception as exc:
        if cached:
            logger.warning("Substack fetch failed, serving stale cache: %s", exc)
            return cached[0]
        logger.error("Substack fetch failed and no cache available: %s", exc)
        raise
