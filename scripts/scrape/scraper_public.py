"""TITAN PRO V8 — Public-only scraper (no cookies needed).

Scrapes profile meta for all 8 accounts (4 TikTok + 4 Instagram) plus
the first 12 Instagram posts per account. Saves raw JSON to
`scripts/scrape/raw/{slug}.json` for the cross-validator to consume.

Run: `python -m scripts.scrape.scraper_public`  (from repo root)
     or: `python scripts/scrape/scraper_public.py`
"""

from __future__ import annotations
import argparse
import json
import sys
import time
from pathlib import Path

# Force UTF-8 stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.scrape.config import ACCOUNTS, RAW_DIR
from scripts.scrape.tiktok_profile import scrape_all_tiktok
from scripts.scrape.instagram_profile import scrape_all_instagram


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Max accounts to scrape (0 = all)")
    parser.add_argument("--platform", choices=["tiktok", "instagram", "both"], default="both")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    print(f"TITAN scraper — public mode")
    print(f"raw output: {RAW_DIR}")
    print(f"accounts: {len(ACCOUNTS)} | limit={args.limit} | platform={args.platform}")
    print()

    targets = ACCOUNTS
    if args.limit:
        targets = targets[: args.limit]

    # TikTok
    if args.platform in ("tiktok", "both"):
        tiktok_targets = [a for a in targets if a["platform"] == "tiktok"]
        print(f"=== TikTok ({len(tiktok_targets)} akun) ===")
        t0 = time.time()
        scrape_all_tiktok()
        print(f"  done in {time.time() - t0:.1f}s\n")

    # Instagram
    if args.platform in ("instagram", "both"):
        ig_targets = [a for a in targets if a["platform"] == "instagram"]
        print(f"=== Instagram ({len(ig_targets)} akun) ===")
        t0 = time.time()
        scrape_all_instagram()
        print(f"  done in {time.time() - t0:.1f}s\n")

    # Summary
    print("=== Summary ===")
    for f in sorted(RAW_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            print(f"  {f.name}: parse fail")
            continue
        meta = data.get("_meta", {})
        if data.get("_error"):
            print(f"  {f.name}: ERROR {data['_error'][:60]}")
        elif "user" in data:
            u = data["user"]
            if "follower_count" in u:
                # IG
                print(f"  {f.name}: @{u.get('username')} followers={u.get('follower_count'):,} posts_fetched={len(data.get('posts', []))}")
            else:
                # TikTok
                s = data.get("stats", {})
                print(f"  {f.name}: @{u.get('uniqueId')} followers={s.get('followerCount', 0):,} videos={s.get('videoCount', 0):,} itemList={len(data.get('itemList', []))}")
        else:
            print(f"  {f.name}: unknown shape")
    return 0


if __name__ == "__main__":
    sys.exit(main())
