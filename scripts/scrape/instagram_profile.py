"""TITAN PRO V8 — Instagram public profile + posts scraper.

Strategy:
  1. Load cookies from scripts/scrape/cookies.txt (JSON or Netscape).
  2. Playwright context with cookies → web_profile_info for full user meta.
  3. Use feed/user/{user_id}/?count=12 for 12 posts (likes, comments, views).
  4. Save raw to scripts/scrape/raw/{slug}.json for the validator.

Falls back to Scrapling og:description parse if no cookies or web_profile_info 401.
"""

from __future__ import annotations
import json
import re
import sys
import time
from typing import Any

# Force UTF-8 stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from scrapling.fetchers import Fetcher
from playwright.sync_api import sync_playwright, BrowserContext

from .config import (
    ACCOUNTS,
    RAW_DIR,
    USER_AGENTS,
    profile_url,
)
from .cookies_loader import load_cookies

UA = USER_AGENTS[0]
IG_APP_ID = "936619743392459"
WEB_PROFILE_URL = "https://www.instagram.com/api/v1/users/web_profile_info/"
FEED_USER_URL = "https://www.instagram.com/api/v1/feed/user/{user_id}/"
IG_HOMEPAGE = "https://www.instagram.com/"


def _ig_headers() -> dict[str, str]:
    return {
        "User-Agent": UA,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "X-IG-App-ID": IG_APP_ID,
    }


def _parse_user_from_profile(data: dict[str, Any]) -> dict[str, Any]:
    """Extract user meta from web_profile_info response (full data)."""
    u = data.get("data", {}).get("user") or {}
    return {
        "id": u.get("id"),
        "username": u.get("username"),
        "full_name": u.get("full_name"),
        "biography": u.get("biography"),
        "external_url": u.get("external_url"),
        "follower_count": (u.get("edge_followed_by") or {}).get("count"),
        "following_count": (u.get("edge_follow") or {}).get("count"),
        "media_count": (u.get("edge_owner_to_timeline_media") or {}).get("count"),
        "is_private": u.get("is_private"),
        "is_verified": u.get("is_verified"),
        "is_business_account": u.get("is_business_account"),
        "profile_pic_url": u.get("profile_pic_url_hd") or u.get("profile_pic_url"),
        "category": u.get("category_name"),
    }


def _normalize_feed_post(p: dict[str, Any]) -> dict[str, Any]:
    """Convert feed/user/{id} post shape → normalized post dict.

    feed/user fields: code, like_count, comment_count, view_count, taken_at,
                      media_type, caption (dict with 'text'), pk, fbid, ...
    """
    cap = p.get("caption")
    if isinstance(cap, dict):
        caption_text = cap.get("text", "")
    else:
        caption_text = cap or ""
    return {
        "id": p.get("id") or p.get("pk"),
        "shortcode": p.get("code"),
        "is_video": p.get("media_type") == 2,
        "is_carousel": p.get("media_type") == 8,
        "media_type": p.get("media_type"),
        "taken_at_timestamp": p.get("taken_at"),
        "likes": p.get("like_count"),
        "comments": p.get("comment_count"),
        "views": p.get("view_count"),
        "caption": caption_text,
    }


def _parse_og_description(og_desc: str, og_title: str) -> dict[str, Any]:
    """Parse 'X Followers, Y Following, Z Posts - ... from Name (@handle)'.

    Returns {follower_count, following_count, media_count, full_name, username}
    or empty dict on failure.
    """
    out: dict[str, Any] = {}
    m = re.match(
        r"^([\d,]+)\s*Followers?,\s*([\d,]+)\s*Following,\s*([\d,]+)\s*Posts",
        og_desc,
    )
    if m:
        out["follower_count"] = int(m.group(1).replace(",", ""))
        out["following_count"] = int(m.group(2).replace(",", ""))
        out["media_count"] = int(m.group(3).replace(",", ""))
    m2 = re.search(r"from\s+(.+?)\s+\(@([^)]+)\)", og_desc)
    if m2:
        out["full_name"] = m2.group(1).strip()
        out["username"] = m2.group(2).strip()
    elif og_title:
        m3 = re.search(r"^(.+?)\s+\((@?[^)]+)\)", og_title)
        if m3:
            out["full_name"] = m3.group(1).strip()
            out["username"] = m3.group(2).lstrip("@").strip()
    return out


def _scrape_via_og(handle: str) -> dict[str, Any] | None:
    """Fallback: Scrapling fetch, parse og:description + og:title for KPI."""
    url = profile_url("instagram", handle)
    try:
        page = Fetcher.get(url, stealthy_headers=True, timeout=15, impersonate="chrome")
    except Exception as e:
        return {"_error": f"scrapling: {type(e).__name__}: {str(e)[:80]}"}
    if page.status != 200:
        return {"_error": f"HTTP {page.status}"}
    html = page.html_content
    og_desc = re.findall(
        r'<meta[^>]+property="og:description"[^>]+content="([^"]+)"', html
    )
    og_title = re.findall(
        r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', html
    )
    og_img = re.findall(
        r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html
    )
    if not og_desc:
        return {"_error": "no og:description"}
    parsed = _parse_og_description(og_desc[0], og_title[0] if og_title else "")
    if not parsed:
        return {"_error": "parse og:description failed"}
    parsed["profile_pic_url"] = og_img[0] if og_img else None
    parsed["_source"] = "og:description"
    return {"user": parsed, "posts": [], "page_info": {}}


def fetch_feed_posts(
    user_id: str,
    ctx: BrowserContext,
    max_pages: int = 2,
    page_size: int = 12,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch posts via /api/v1/feed/user/{user_id}/. Returns (posts, page_info)."""
    posts: list[dict[str, Any]] = []
    seen: set[str] = set()
    cursor: str | None = None
    page_info: dict[str, Any] = {"has_next_page": False, "end_cursor": None}

    for page_idx in range(max_pages):
        url = FEED_USER_URL.format(user_id=user_id) + f"?count={page_size}"
        if cursor:
            url += f"&max_id={cursor}"
        try:
            r = ctx.get(url, headers=_ig_headers(), timeout=30000)
        except Exception as e:
            print(f"    feed page {page_idx + 1} error: {type(e).__name__}: {str(e)[:80]}")
            break
        if r.status != 200:
            print(f"    feed page {page_idx + 1} status={r.status}")
            break
        try:
            data = r.json()
        except Exception as e:
            print(f"    feed page {page_idx + 1} json fail: {e}")
            break
        items = data.get("items") or []
        new_count = 0
        for it in items:
            n = _normalize_feed_post(it)
            sc = n.get("shortcode")
            if not sc or sc in seen:
                continue
            seen.add(sc)
            posts.append(n)
            new_count += 1
        print(f"    feed page {page_idx + 1}: {len(items)} items, {new_count} new (total {len(posts)})")
        if not data.get("more_available"):
            page_info = {"has_next_page": False, "end_cursor": None}
            break
        cursor = data.get("next_max_id")
        if not cursor or new_count == 0:
            page_info = {"has_next_page": False, "end_cursor": None}
            break
        page_info = {"has_next_page": True, "end_cursor": cursor}
        time.sleep(1.0)
    return posts, page_info


def fetch_profile_and_posts(
    handle: str, ctx: BrowserContext, max_pages: int = 2
) -> dict[str, Any] | None:
    """Hit web_profile_info?username=handle and parse. Falls back to og:description on 401/429.

    Then fetch post list via feed/user/{user_id}/ endpoint.

    Returns user+posts dict (or empty user on failure).
    """
    url = f"{WEB_PROFILE_URL}?username={handle}"
    try:
        r = ctx.get(url, headers=_ig_headers(), timeout=30000)
    except Exception as e:
        return {"_error": f"request: {type(e).__name__}: {str(e)[:100]}"}
    if r.status == 429:
        print(f"  -> 429, falling back to og:description")
        return _scrape_via_og(handle)
    if r.status in (401, 403):
        print(f"  -> {r.status}, falling back to og:description")
        return _scrape_via_og(handle)
    if r.status != 200:
        return _scrape_via_og(handle) or {"_error": f"HTTP {r.status}"}
    try:
        data = r.json()
    except Exception:
        return _scrape_via_og(handle) or {"_error": "json parse fail"}
    if "data" not in data or not data["data"].get("user"):
        return _scrape_via_og(handle) or {"_error": "no user in response"}

    user = _parse_user_from_profile(data)
    user_id = user.get("id")
    posts: list[dict[str, Any]] = []
    page_info: dict[str, Any] = {}
    if user_id:
        posts, page_info = fetch_feed_posts(user_id, ctx, max_pages=max_pages)
    return {
        "user": user,
        "posts": posts,
        "page_info": page_info,
        "_source": "web_profile_info+feed/user",
    }


def scrape_all_instagram() -> dict[str, dict]:
    """Scrape all Instagram accounts. Returns {slug: result}."""
    out: dict[str, dict] = {}
    cookies = load_cookies()
    cookie_domains = {c["domain"] for c in cookies}
    has_ig_cookies = any("instagram" in d for d in cookie_domains)
    print(f"Instagram scraper — cookies loaded: {len(cookies)} (IG auth: {has_ig_cookies})")
    if not has_ig_cookies:
        print("  ⚠️ No instagram.com cookies — will only get og:description fallback (no posts)")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA)
        if cookies:
            try:
                ctx.add_cookies(cookies)
            except Exception as e:
                print(f"  ⚠️ add_cookies failed: {e}")
        # Visit homepage so cookies are bound to the domain before making API calls
        try:
            page = ctx.new_page()
            page.goto(IG_HOMEPAGE, wait_until="domcontentloaded", timeout=15000)
            time.sleep(1.5)
            page.close()
        except Exception as e:
            print(f"  ⚠️ homepage goto failed: {e}")
        try:
            for acc in ACCOUNTS:
                if acc["platform"] != "instagram":
                    continue
                slug = acc["slug"]
                print(f"[instagram] {acc['handle']}...", end=" ", flush=True)
                result = fetch_profile_and_posts(acc["handle"], ctx.request, max_pages=2)
                if result and not result.get("_error"):
                    u = result["user"]
                    src = result.get("_source", "unknown")
                    print(
                        f"OK  followers={u.get('follower_count', 0):,}  "
                        f"posts={u.get('media_count', 0):,}  "
                        f"fetched={len(result.get('posts', []))}  src={src}"
                    )
                else:
                    err = result.get("_error") if result else "unknown"
                    print(f"FAIL  {err}")
                out[slug] = result or {"_error": "fetch returned None"}
                out[slug]["_meta"] = {
                    "handle": acc["handle"],
                    "display": acc["display"],
                    "niche": acc["niche"],
                    "profileUrl": profile_url("instagram", acc["handle"]),
                    "scrapedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
                path = RAW_DIR / f"{slug}.json"
                path.write_text(json.dumps(out[slug], indent=2, ensure_ascii=False), encoding="utf-8")
                time.sleep(3.0)
        finally:
            ctx.close()
            browser.close()
    return out


if __name__ == "__main__":
    scrape_all_instagram()
