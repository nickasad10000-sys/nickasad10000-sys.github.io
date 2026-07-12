"""TITAN PRO V8 — TikTok public profile scraper.

Uses Scrapling (stealth HTTP fetcher) to load the public profile page and
extract the `__UNIVERSAL_DATA_FOR_REHYDRATION__` JSON, which contains the
user's nickname, signature, bio link, and aggregate stats (follower, video,
heart counts). The post itemList may be empty for anonymous requests —
that's why we need cookies for full post scraping (see tiktok_posts.py).
"""

from __future__ import annotations
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

# Force UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from scrapling.fetchers import Fetcher

from .config import (
    ACCOUNTS,
    RAW_DIR,
    RETRY_BACKOFF,
    RETRY_MAX,
    USER_AGENTS,
    profile_url,
)


def _extract_universal_data(html: str) -> dict[str, Any] | None:
    """Locate and parse the __UNIVERSAL_DATA_FOR_REHYDRATION__ script block."""
    m = re.search(
        r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    )
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def _user_stats_from_universal(data: dict) -> dict[str, Any] | None:
    """Walk to webapp.user-detail.userInfo and return user + stats."""
    try:
        scope = data["__DEFAULT_SCOPE__"]
        user_info = scope["webapp.user-detail"]["userInfo"]
    except (KeyError, TypeError):
        return None
    user = user_info.get("user") or {}
    stats = user_info.get("stats") or {}
    return {
        "user": {
            "id": user.get("id"),
            "uniqueId": user.get("uniqueId"),
            "nickname": user.get("nickname"),
            "signature": user.get("signature"),
            "bioLink": (user.get("bioLink") or {}).get("link"),
            "avatarLarger": user.get("avatarLarger"),
            "avatarMedium": user.get("avatarMedium"),
            "avatarThumb": user.get("avatarThumb"),
            "verified": user.get("verified"),
            "createTime": user.get("createTime"),
            "region": user.get("region"),
            "language": user.get("language"),
        },
        "stats": {
            "followerCount": stats.get("followerCount"),
            "followingCount": stats.get("followingCount"),
            "heartCount": stats.get("heartCount"),
            "videoCount": stats.get("videoCount"),
            "diggCount": stats.get("diggCount"),
            "friendCount": stats.get("friendCount"),
        },
        "itemList": user_info.get("itemList") or [],
    }


def fetch_profile(handle: str) -> dict[str, Any] | None:
    """Fetch TikTok public profile page. Returns user+stats dict or None.

    Retries on transient errors with exponential backoff.
    """
    url = profile_url("tiktok", handle)
    last_err: str = ""
    for attempt in range(1, RETRY_MAX + 1):
        try:
            page = Fetcher.get(
                url,
                stealthy_headers=True,
                timeout=20,
                impersonate="chrome",
            )
            if page.status != 200:
                last_err = f"HTTP {page.status}"
                time.sleep(RETRY_BACKOFF * attempt)
                continue
            data = _extract_universal_data(page.html_content)
            if not data:
                last_err = "no __UNIVERSAL_DATA in page"
                time.sleep(RETRY_BACKOFF * attempt)
                continue
            parsed = _user_stats_from_universal(data)
            if not parsed or not parsed["user"].get("uniqueId"):
                last_err = "user-detail not found in payload"
                time.sleep(RETRY_BACKOFF * attempt)
                continue
            return parsed
        except Exception as e:  # network, timeout, etc.
            last_err = f"{type(e).__name__}: {str(e)[:100]}"
            time.sleep(RETRY_BACKOFF * attempt)

    return {"_error": last_err, "_url": url, "_handle": handle}


def scrape_all_tiktok() -> dict[str, dict]:
    """Scrape all TikTok accounts in ACCOUNTS. Returns {slug: result}."""
    out: dict[str, dict] = {}
    for acc in ACCOUNTS:
        if acc["platform"] != "tiktok":
            continue
        slug = acc["slug"]
        print(f"[tiktok] {acc['handle']}...", end=" ", flush=True)
        result = fetch_profile(acc["handle"])
        if result and not result.get("_error"):
            u = result["user"]
            s = result["stats"]
            print(
                f"OK  followers={s['followerCount']:,}  videos={s['videoCount']:,}  "
                f"itemList={len(result['itemList'])}"
            )
        else:
            err = result.get("_error") if result else "unknown"
            print(f"FAIL  {err}")
        out[slug] = result or {"_error": "fetch returned None"}
        out[slug]["_meta"] = {
            "handle": acc["handle"],
            "display": acc["display"],
            "niche": acc["niche"],
            "scrapedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        # Save raw to disk regardless of success
        path = RAW_DIR / f"{slug}.json"
        path.write_text(json.dumps(out[slug], indent=2, ensure_ascii=False), encoding="utf-8")
        time.sleep(2.5)  # throttle between accounts
    return out


if __name__ == "__main__":
    scrape_all_tiktok()
