"""TITAN PRO V8 — TikTok post list scraper using logged-in cookies.

Strategy (proven to work with valid TikTok cookies):
  1. Load cookies, navigate to tiktok.com to set domain
  2. Navigate to profile page, extract secUid from `__UNIVERSAL_DATA__`
  3. Hit /api/post/item_list/?aid=1988&count=12&secUid={secUid}
     → 15-30 items per call, paginate with cursor
  4. Save normalized posts to raw/{slug}-tt-posts.json
  5. If endpoint returns empty body (anti-bot), retry with exponential backoff

If cookies missing/expired, returns empty list (not an error).
"""

from __future__ import annotations
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth  # type: ignore

from scripts.scrape.config import ACCOUNTS, RAW_DIR, USER_AGENTS
from scripts.scrape.cookies_loader import load_cookies

UA = USER_AGENTS[0]
TIKTOK_HOMEPAGE = "https://www.tiktok.com/"
ITEM_LIST_URL = "https://www.tiktok.com/api/post/item_list/"


def _extract_secuid_from_html(html: str) -> str | None:
    """Locate secUid in the profile page HTML/script content."""
    m = re.search(r'"secUid":"([^"]+)"', html)
    return m.group(1) if m else None


def _normalize_post(p: dict[str, Any]) -> dict[str, Any]:
    """Convert TikTok item_list item → normalized post dict.

    TikTok fields: id, desc, createTime, video.duration, stats.{playCount,
    likeCount, commentCount, shareCount, saveCount}, author.{id, uniqueId,
    nickname}, video.{cover, playAddr, duration}
    """
    stats = p.get("stats") or {}
    video = p.get("video") or {}
    author = p.get("author") or {}
    return {
        "id": p.get("id"),
        "desc": p.get("desc", ""),
        "create_time": p.get("createTime"),
        "duration": video.get("duration"),
        "cover": video.get("cover") or video.get("originCover") or video.get("dynamicCover"),
        "play_count": stats.get("playCount"),
        "like_count": stats.get("likeCount"),
        "comment_count": stats.get("commentCount"),
        "share_count": stats.get("shareCount"),
        "save_count": stats.get("saveCount"),
        "author_id": author.get("id"),
        "author_unique_id": author.get("uniqueId"),
        "author_nickname": author.get("nickname"),
        "is_video": video.get("duration") is not None,
    }


def _fetch_page(
    sec_uid: str,
    ctx,
    cursor: int = 0,
    count: int = 12,
    max_retries: int = 3,
) -> dict[str, Any] | None:
    """Fetch one page of /api/post/item_list/. Returns parsed dict or None."""
    url = f"{ITEM_LIST_URL}?aid=1988&count={count}&secUid={sec_uid}&cursor={cursor}"
    headers = {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": "https://www.tiktok.com/",
    }
    for attempt in range(max_retries):
        try:
            r = ctx.get(url, headers=headers, timeout=30000)
        except Exception as e:
            print(f"    request err attempt {attempt + 1}: {e}")
            time.sleep(2 * (attempt + 1))
            continue
        body = r.text()
        if not body.strip():
            print(f"    empty body attempt {attempt + 1} status={r.status}")
            time.sleep(2 * (attempt + 1))
            continue
        try:
            return r.json()
        except Exception as e:
            print(f"    json err attempt {attempt + 1}: {e}, body[:80]={body[:80]!r}")
            time.sleep(2 * (attempt + 1))
            continue
    return None


def fetch_posts_for_handle(
    handle: str,
    ctx,  # playwright.sync_api.BrowserContext (need new_page, not request context)
    max_pages: int = 4,
    page_size: int = 12,
) -> list[dict[str, Any]]:
    """Fetch posts for a single TikTok handle. Returns list of normalized posts."""
    # 1. Navigate to profile, get secUid. Need enough wait + scroll to "warm up"
    #    the session — without that, /api/post/item_list/ returns empty body.
    page = ctx.new_page()
    try:
        try:
            page.goto(TIKTOK_HOMEPAGE, wait_until="domcontentloaded", timeout=20000)
        except Exception:
            pass
        time.sleep(3)
        try:
            page.goto(f"https://www.tiktok.com/@{handle}", wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            print(f"  profile nav err: {e}")
        time.sleep(8)  # wait for SPA + cookies to be fully active
        # Scroll to mimic real user
        for i in range(3):
            page.evaluate("window.scrollBy(0, 500)")
            time.sleep(2)
        try:
            html = page.content()
        except Exception:
            html = ""
        sec_uid = _extract_secuid_from_html(html)
    finally:
        page.close()
    if not sec_uid:
        print(f"  no secUid for @{handle}")
        return []

    # 2. Paginate /api/post/item_list/ via context.request
    posts: list[dict[str, Any]] = []
    seen: set[str] = set()
    cursor = 0
    for page_idx in range(max_pages):
        data = _fetch_page(sec_uid, ctx.request, cursor=cursor, count=page_size)
        if not data:
            break
        items = data.get("itemList") or []
        new_count = 0
        for it in items:
            n = _normalize_post(it)
            pid = n.get("id")
            if not pid or pid in seen:
                continue
            seen.add(pid)
            posts.append(n)
            new_count += 1
        has_more = data.get("hasMore")
        next_cursor = data.get("cursor")
        print(f"  page {page_idx + 1}: {len(items)} items, {new_count} new (total {len(posts)}) hasMore={has_more}")
        if not has_more or new_count == 0 or next_cursor == cursor:
            break
        cursor = next_cursor
        time.sleep(1.5)
    return posts


def scrape_all_tiktok_posts(limit: int = 0) -> dict[str, list]:
    """Scrape posts for all TikTok accounts. Returns {slug: [posts]}.

    Returns empty dict if cookies are missing, expired, or invalid for
    authenticated post fetching. Caller should fall back to existing data
    in accounts-full.json.
    """
    cookies = load_cookies()
    if not cookies:
        print("No cookies.txt found — TikTok post scraping requires cookies.")
        print("Skipping (profile meta is already in raw/{slug}-tt.json).")
        return {}
    has_tiktok = any("tiktok" in c.get("domain", "") for c in cookies)
    if not has_tiktok:
        print("No tiktok.com cookies found in cookies.txt — only IG cookies present.")
        print("Skipping TikTok post scraping.")
        return {}

    print(f"TikTok post scraper — {len(cookies)} cookies loaded")
    out: dict[str, list] = {}
    stealth = Stealth()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=UA,
            locale="id-ID",
            timezone_id="Asia/Jakarta",
        )
        stealth.apply_stealth_sync(ctx)
        try:
            ctx.add_cookies(cookies)
        except Exception as e:
            print(f"add_cookies err: {e}")
            return {}
        try:
            # Quick auth check: visit /setting, see if redirect to login
            page = ctx.new_page()
            try:
                page.goto("https://www.tiktok.com/setting", wait_until="domcontentloaded", timeout=20000)
                time.sleep(3)
                if "login" in page.url.lower() or "/foryou" in page.url:
                    print(f"  ⚠️ TikTok cookies not authenticated (redirected to {page.url})")
                    print(f"     Posts will fall back to existing accounts-full.json data")
                    print(f"     Re-extract cookies from a logged-in session to enable post scraping")
                    page.close()
                    return {}
            except Exception:
                pass
            finally:
                try:
                    page.close()
                except Exception:
                    pass

            tt_accounts = [a for a in ACCOUNTS if a["platform"] == "tiktok"]
            if limit:
                tt_accounts = tt_accounts[:limit]
            for acc in tt_accounts:
                slug = acc["slug"]
                print(f"\n[tiktok-posts] {acc['handle']}...")
                posts = fetch_posts_for_handle(acc["handle"], ctx, max_pages=4)
                if posts:
                    print(f"  → {len(posts)} posts saved")
                else:
                    print(f"  → 0 posts (endpoint returned empty — likely anti-bot)")
                out[slug] = posts
                # Save raw even if empty (records the attempt)
                path = RAW_DIR / f"{slug}-posts.json"
                path.write_text(
                    json.dumps({
                        "posts": posts,
                        "_meta": {
                            "handle": acc["handle"],
                            "display": acc["display"],
                            "niche": acc["niche"],
                            "scrapedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                            "source": "tiktok.com/api/post/item_list/",
                        },
                    }, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                time.sleep(3.0)
        finally:
            ctx.close()
            browser.close()
    return out


if __name__ == "__main__":
    scrape_all_tiktok_posts()
