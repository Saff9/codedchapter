"""
build_c.py
==========
Compiles rss_parser.c into a shared library (rss_parser.so on Linux/Mac,
rss_parser.dll on Windows) that Python loads via ctypes.

Run this once before starting the server:
    python build_c.py

The Dockerfile runs it automatically during the image build step.
If compilation fails the server still starts — substack.py falls back
to the pure-Python parser.
"""

import os
import platform
import subprocess
import sys


def build() -> bool:
    """
    Try to compile rss_parser.c. Returns True on success, False if compiler
    is not available or compilation fails. Never raises.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    src  = os.path.join(here, "rss_parser.c")

    # Output filename depends on OS
    if platform.system() == "Windows":
        out = os.path.join(here, "rss_parser.dll")
        flags = ["-shared", "-o", out, src]
    else:
        out = os.path.join(here, "rss_parser.so")
        flags = ["-O2", "-shared", "-fPIC", "-o", out, src]

    if not os.path.exists(src):
        print(f"[build_c] rss_parser.c not found at {src}", file=sys.stderr)
        return False

    # Try gcc first, then cc as fallback
    for compiler in ["gcc", "cc"]:
        try:
            result = subprocess.run(
                [compiler] + flags,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                print(f"[build_c] Compiled with {compiler} -> {out}")
                return True
            else:
                print(f"[build_c] {compiler} failed:\n{result.stderr}", file=sys.stderr)
        except FileNotFoundError:
            # Compiler not installed — try next
            continue
        except subprocess.TimeoutExpired:
            print(f"[build_c] {compiler} timed out", file=sys.stderr)

    print("[build_c] No C compiler found — will use pure-Python RSS parser", file=sys.stderr)
    return False


if __name__ == "__main__":
    ok = build()
    sys.exit(0 if ok else 1)
