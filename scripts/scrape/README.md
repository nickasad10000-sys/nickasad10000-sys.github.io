# TITAN PRO V8 — Data Pipeline

Refresh data for 8 Lumajang social accounts (4 TikTok + 4 Instagram) and
update `src/data/accounts-full.json` for the dashboard.

## Strategy

```
Step 1: Public scrape (no auth)
  ├─ TikTok: profile meta only (follower/following/videoCount, bio, avatar)
  └─ Instagram: profile meta + 24 latest posts (via web_profile_info + feed/user)

Step 2: Cookie-based TikTok post scrape (if cookies.txt present)
  └─ Best-effort /api/post/item_list/ — likely blocked by anti-bot

Step 3: Aggregate raw → KPI/top/tierDist/hashtags/daily/monthly/yearly

Step 4: Cross-validate old accounts-full.json vs new raw (drift detection)

Step 5: LLM analyze (OpenRouter claude-3-haiku, 5-key pool)
  └─ Per-account insight + benchmark + growth recommendations

Step 6: Node formatter (merge → accounts-full.json, backup .bak-YYYY-MM-DD)
```

**TikTok post list** is blocked by TikTok's anti-bot signature
(X-Bogus/X-Gnarly/msToken) — even with valid cookies, the endpoint
returns empty body. The cross-validator falls back to existing
`accounts-full.json` TikTok posts and marks them `stale` for audit.

## Quick start

```bash
# 1. One-time setup
python -m pip install -r scripts/scrape/scrape_requirements.txt
python -m playwright install chromium

# 2. (Optional) Extract cookies for IG/TikTok
#    See COOKIES_GUIDE.md for step-by-step (Indonesian)
#    Output: scripts/scrape/cookies.txt (Netscape or JSON format)

# 3. Run the pipeline
npm run scrape:build        # full: scrape + LLM + format + vite build
npm run scrape              # full: scrape + LLM + format (no build)
npm run scrape:public       # only public scrapers (no cookies needed)
```

## Individual steps

```bash
npm run scrape:public      # step 1: profile + IG posts
npm run scrape:cookies     # step 2: TikTok posts (cookies required)
npm run scrape:aggregate   # step 3: cross-validate + aggregate
npm run scrape:llm         # step 4: OpenRouter insights
npm run scrape:fmt         # step 5: format → accounts-full.json
```

## Output files

| Path | What |
|------|------|
| `scripts/scrape/raw/{slug}.json`           | Raw scraped profile + posts per account |
| `scripts/scrape/output/audit.json`          | Drift report (old vs new) |
| `scripts/scrape/output/llm-insights.json`   | LLM insights per account |
| `src/data/accounts-full.json`               | **Final merged data** for the dashboard |
| `src/data/accounts-full.bak-YYYY-MM-DD.json` | Auto-backup before each write |

## Environment

Required (auto-loaded from `.env`):
- `VITE_OPENROUTER_API_KEY` + `VITE_OPENROUTER_API_KEY_2..5` (5 keys for rotation)
  Get keys at https://openrouter.ai/keys

Optional:
- `TITAN_SCRAPE_POSTS=N` — max posts per account (default 30)
- `TITAN_SCRAPE_NO_BUILD=1` — skip the final `vite build` step

## Files

```
scripts/scrape/
├── README.md
├── COOKIES_GUIDE.md             # how to extract cookies (Indonesian)
├── config.py                    # 8 accounts, URLs, throttle, env loader
├── scraper_public.py            # entry: public profile + IG posts
├── tiktok_profile.py            # parse __UNIVERSAL_DATA → profile meta
├── tiktok_posts.py              # TikTok post list scraper (cookies)
├── instagram_profile.py         # IG web_profile_info + feed/user
├── instagram_posts.py           # IG post list (back-compat re-export)
├── cookies_loader.py            # parse JSON or Netscape cookie files
├── aggregate.py                 # raw → tierDist/hashtags/daily/monthly/yearly
├── cross_validate.py            # old accounts-full.json vs new raw (drift)
├── analyze_llm.py               # OpenRouter → insight/benchmark/growth
├── run.py                       # orchestrator: full pipeline
├── raw/                         # output: per-account raw JSON (gitignored)
├── output/                      # output: audit + llm-insights (gitignored)
└── cookies.txt                  # your cookies (gitignored, NEVER commit)
```

## Notes

- **Anti-bot limits**: Anonymous IG `web_profile_info` may 401. Solution:
  add IG cookies to `cookies.txt` (see COOKIES_GUIDE.md).
- **LLM rate limits**: 5-key pool with round-robin + 429 cooldown
  (5s/10s/20s exponential backoff). If all 5 keys hit rate limit, the
  scraper continues with empty insights.
- **Backup policy**: Each formatter run creates `accounts-full.bak-YYYY-MM-DD.json`.
  Old backups are NOT auto-cleaned — clean up manually.
