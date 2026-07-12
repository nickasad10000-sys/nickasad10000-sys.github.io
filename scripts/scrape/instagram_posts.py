"""TITAN PRO V8 — Instagram posts pagination via feed/user/{id}/ endpoint.

Wrapped in a separate module for clarity. In practice, scrape_all_instagram()
already calls fetch_feed_posts() — this module is a CLI for batch fetching more
posts (e.g. 4 pages × 12 = 48 posts for topByLikes ranking).
"""

from __future__ import annotations
import json
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from playwright.sync_api import sync_playwright
from scripts.scrape.config import ACCOUNTS
from scripts.scrape.cookies_loader import load_cookies
from scripts.scrape.instagram_profile import (
    UA,
    _ig_headers,
    fetch_feed_posts,
    FEED_USER_URL,
)
from scripts.scrape.instagram_profile import fetch_profile_and_posts  # re-export

# Re-export for backward compat
__all__ = ["fetch_page", "fetch_all_posts", "FEED_USER_URL", "_ig_headers"]


def fetch_page(user_id: str, ctx, max_id: str | None = None) -> dict:
    """Fetch one page of feed/user/{id}/. Returns dict with 'items' or '_error'."""
    url = FEED_USER_URL.format(user_id=user_id) + "?count=12"
    if max_id:
        url += f"&max_id={max_id}"
    try:
        r = ctx.get(url, headers=_ig_headers(), timeout=30000)
    except Exception as e:
        return {"_error": f"request: {e}"}
    if r.status != 200:
        return {"_error": f"HTTP {r.status}"}
    try:
        return r.json()
    except Exception as e:
        return {"_error": f"json: {e}"}


def fetch_all_posts(handle: str, ctx, max_pages: int = 4) -> list[dict]:
    """Fetch up to max_pages * 12 posts via feed/user. Dedupes by shortcode.

    Returns list of normalized post dicts.
    """
    # First, get user_id from web_profile_info
    r = ctx.get(
        f"https://www.instagram.com/api/v1/users/web_profile_info/?username={handle}",
        headers=_ig_headers(), timeout=30000,
    )
    if r.status != 200:
        print(f"  web_profile_info status={r.status}, cannot get user_id")
        return []
    try:
        data = r.json()
    except Exception as e:
        print(f"  json fail: {e}")
        return []
    user_id = (data.get("data") or {}).get("user", {}).get("id")
    if not user_id:
        print(f"  no user_id in response")
        return []
    posts, _ = fetch_feed_posts(user_id, ctx, max_pages=max_pages, page_size=12)
    return posts


if __name__ == "__main__":
    cookies = load_cookies()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA)
        if cookies:
            ctx.add_cookies(cookies)
        page = ctx.new_page()
        try:
            page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=15000)
            time.sleep(1.5)
        except Exception as e:
            print(f"homepage goto: {e}")
        page.close()
        for handle in ["ardiantanah", "majangmejeng_", "nisyanandaa", "syahfalahproperti"]:
            print(f"\n=== @{handle} ===")
            posts = fetch_all_posts(handle, ctx.request, max_pages=3)
            print(f"final: {len(posts)} unique posts")
        ctx.close()
        browser.close()
