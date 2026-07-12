"""TITAN PRO V8 — Pipeline orchestrator.

Runs the full refresh pipeline in order:
  1. Public scrape (TikTok profile meta + IG profile+posts)
  2. Cookie-based TikTok post scrape (if cookies.txt present)
  3. Aggregate (raw → KPIs/top/tierDist/hashtags/daily/monthly/yearly)
  4. Cross-validate (old accounts-full.json vs new raw)
  5. LLM analyze (OpenRouter insights per account)
  6. Node formatter (merge → accounts-full.json) — invoked via subprocess

CLI:
  python scripts/scrape/run.py --public-only        # skip cookies, IG only
  python scripts/scrape/run.py --full                # everything (default)
  python scripts/scrape/run.py --skip-llm            # no LLM call
  python scripts/scrape/run.py --limit N             # only first N accounts

Exit codes:
  0  success
  1  config/env error
  2  scraper error (still continues to formatter if --continue-on-error)
"""

from __future__ import annotations
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Force UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.scrape.config import ACCOUNTS, RAW_DIR, OUTPUT_DIR
from scripts.scrape.cookies_loader import has_cookies, cookies_domains


PYTHON = sys.executable
SCRAPE_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRAPE_DIR.parent.parent


def step(label: str):
    """Print a step header."""
    print()
    print(f"━━━ {label} ━━━")
    print()


def run_module(name: str, *args: str) -> int:
    """Run a sibling Python module by file path."""
    cmd = [PYTHON, str(SCRAPE_DIR / f"{name}.py"), *args]
    print(f"  $ {' '.join(cmd)}")
    t0 = time.time()
    r = subprocess.run(cmd, cwd=str(REPO_ROOT))
    dt = time.time() - t0
    print(f"  → exit={r.returncode} ({dt:.1f}s)")
    return r.returncode


def run_node(script: str) -> int:
    cmd = ["node", str(REPO_ROOT / "scripts" / f"{script}.mjs")]
    print(f"  $ {' '.join(cmd)}")
    t0 = time.time()
    r = subprocess.run(cmd, cwd=str(REPO_ROOT))
    dt = time.time() - t0
    print(f"  → exit={r.returncode} ({dt:.1f}s)")
    return r.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="TITAN PRO V8 — refresh pipeline")
    parser.add_argument("--public-only", action="store_true",
                        help="Skip cookies-based TikTok post scrape")
    parser.add_argument("--skip-llm", action="store_true",
                        help="Skip OpenRouter LLM analysis")
    parser.add_argument("--limit", type=int, default=0,
                        help="Max accounts to scrape per platform (0 = all)")
    parser.add_argument("--continue-on-error", action="store_true",
                        help="Continue even if a step fails")
    parser.add_argument("--fmt-only", action="store_true",
                        help="Skip scraping, only re-format from existing output/")
    args = parser.parse_args()

    print("╔════════════════════════════════════════════╗")
    print("║  TITAN PRO V8 — refresh pipeline           ║")
    print("╚════════════════════════════════════════════╝")
    print(f"  python: {PYTHON}")
    print(f"  raw:    {RAW_DIR}")
    print(f"  output: {OUTPUT_DIR}")
    print(f"  cookies.txt: {'yes' if has_cookies() else 'no'}")
    if has_cookies():
        print(f"    domains: {', '.join(sorted(cookies_domains()))}")
    print()

    if not args.fmt_only:
        # Step 1: Public scrape
        step("Step 1/6: Public scrape (TikTok profile + IG profile+posts)")
        rc = run_module("scraper_public",
                        "--platform", "both",
                        *(["--limit", str(args.limit)] if args.limit else []))
        if rc != 0 and not args.continue_on_error:
            print(f"  ✗ scraper_public failed (rc={rc})")
            return 2

        # Step 2: Cookies-based TikTok post scrape
        if not args.public_only and has_cookies():
            step("Step 2/6: TikTok post scrape (cookies)")
            rc = run_module("tiktok_posts",
                            *(["--limit", str(args.limit)] if args.limit else []))
            if rc != 0 and not args.continue_on_error:
                print(f"  ⚠ tiktok_posts failed, continuing with existing data")
        else:
            print()
            print("━━━ Step 2/6: TikTok post scrape (skipped) ━━━")
            if args.public_only:
                print("  --public-only flag set")
            else:
                print("  no cookies.txt — TikTok post list will use existing data")
            print()

        # Step 3: Aggregate
        step("Step 3/6: Cross-validate + aggregate")
        rc = run_module("cross_validate",
                        *(["--limit", str(args.limit)] if args.limit else []))
        if rc != 0 and not args.continue_on_error:
            print(f"  ✗ cross_validate failed (rc={rc})")
            return 2

        # Step 4: LLM analyze
        if not args.skip_llm:
            step("Step 4/6: LLM analyze (OpenRouter)")
            rc = run_module("analyze_llm",
                            *(["--limit", str(args.limit)] if args.limit else []))
            if rc != 0 and not args.continue_on_error:
                print(f"  ⚠ analyze_llm failed, continuing with empty insights")
        else:
            print()
            print("━━━ Step 4/6: LLM analyze (skipped) ━━━")
            print()
    else:
        print("━━━ --fmt-only: skipping scrape steps ━━━")

    # Step 5: Format (Node)
    step("Step 5/6: Format (merge → accounts-full.json)")
    rc = run_node("generate_accounts")
    if rc != 0:
        print(f"  ✗ generate_accounts failed (rc={rc})")
        return 2

    # Step 6: Build
    if not args.fmt_only:
        step("Step 6/6: Vite build (optional)")
        build = os.environ.get("TITAN_SCRAPE_NO_BUILD", "0") == "1"
        if not build:
            # Use shell=True on Windows so npm.cmd / npx are found
            use_shell = sys.platform == "win32"
            r = subprocess.run(
                "npm run build" if use_shell else ["npm", "run", "build"],
                cwd=str(REPO_ROOT),
                shell=use_shell,
            )
            if r.returncode != 0:
                print(f"  ⚠ build failed (rc={r.returncode})")

    print()
    print("╔════════════════════════════════════════════╗")
    print("║  Done.                                      ║")
    print("╚════════════════════════════════════════════╝")
    print(f"  audit:    {OUTPUT_DIR / 'audit.json'}")
    print(f"  insights: {OUTPUT_DIR / 'llm-insights.json'}")
    print(f"  data:     {REPO_ROOT / 'src' / 'data' / 'accounts-full.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
