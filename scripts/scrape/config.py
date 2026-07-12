# TITAN PRO V8 — Scraper configuration.
# 8 Lumajang social accounts: 4 TikTok + 4 Instagram.
# Throttle tuned to be polite (not aggressive) but resilient to anti-bot.

from __future__ import annotations
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # repo root
RAW_DIR = ROOT / "scripts" / "scrape" / "raw"
OUTPUT_DIR = ROOT / "scripts" / "scrape" / "output"
ENV_FILE = ROOT / ".env"

# Ensure dirs exist on import.
RAW_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Account list. Each entry: handle, platform, display name, niche hint.
ACCOUNTS: list[dict] = [
    {"slug": "ardian-tanah-tt",    "platform": "tiktok",    "handle": "ardian.tanah",      "display": "Ardian Tanah",      "niche": "properti"},
    {"slug": "majangmejeng-tt",     "platform": "tiktok",    "handle": "majangmejeng_",     "display": "MajanMejeng",        "niche": "info-kota-lumajang"},
    {"slug": "itsnisyananda-tt",   "platform": "tiktok",    "handle": "itsnisyananda",     "display": "Nisya Nanda",        "niche": "lifestyle"},
    {"slug": "syahfalahproperti-tt","platform": "tiktok",   "handle": "syahfalahproperti", "display": "Syahfalah Properti", "niche": "properti-lumajang"},
    {"slug": "ardiantanah-ig",     "platform": "instagram", "handle": "ardiantanah",       "display": "Ardian Tanah",       "niche": "properti"},
    {"slug": "majangmejeng-ig",    "platform": "instagram", "handle": "majangmejeng_",     "display": "MajanMejeng",        "niche": "info-kota-lumajang"},
    {"slug": "nisyanandaa-ig",     "platform": "instagram", "handle": "nisyanandaa",       "display": "Nisya Nanda",        "niche": "lifestyle"},
    {"slug": "syahfalahproperti-ig","platform": "instagram", "handle": "syahfalahproperti","display": "Syahfalah Properti", "niche": "properti-lumajang"},
]

# How many recent posts to scrape per account.
POSTS_PER_ACCOUNT = int(os.environ.get("TITAN_SCRAPE_POSTS", "30"))

# Throttle — seconds between requests, lower = faster but riskier.
DELAY_BETWEEN_ACCOUNTS = 2.5
DELAY_BETWEEN_REQUESTS = 1.5
RETRY_MAX = 3
RETRY_BACKOFF = 2.0  # multiplied per attempt: 2s, 4s, 8s

# Parallelism — keep low to avoid IP rate-limit.
MAX_PARALLEL = 2

# Random user-agents (subset of common desktop browsers, 2024-2025).
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]

# URL builders. Return public profile URL.
def profile_url(platform: str, handle: str) -> str:
    if platform == "tiktok":
        return f"https://www.tiktok.com/@{handle}"
    if platform == "instagram":
        return f"https://www.instagram.com/{handle}/"
    raise ValueError(f"unknown platform: {platform}")

# When the public profile page fails, fall back to alternate public endpoints.
def tiktok_json_endpoints(handle: str) -> list[str]:
    """Public JSON-ish endpoints we can try for TikTok. Most will be blocked,
    but listing them gives the parser multiple chances."""
    return [
        f"https://www.tiktok.com/@{handle}",
    ]

def instagram_json_endpoints(handle: str) -> list[str]:
    """Public Instagram endpoints. `?__a=1&__d=dis` returns JSON; often blocked
    for anonymous users but worth a try."""
    return [
        f"https://www.instagram.com/{handle}/?__a=1&__d=dis",
        f"https://www.instagram.com/{handle}/",
    ]

# Load .env (for OpenRouter keys used by the LLM analyzer).
def load_env() -> dict[str, str]:
    if not ENV_FILE.exists():
        return {}
    from dotenv import dotenv_values
    return {k: v for k, v in dotenv_values(ENV_FILE).items() if v}

def get_openrouter_keys() -> list[str]:
    """All VITE_OPENROUTER_API_KEY_* values, in order. Skip empties."""
    env = load_env()
    keys: list[str] = []
    for i in range(1, 10):  # 1..9 should be more than enough
        k = env.get(f"VITE_OPENROUTER_API_KEY_{i}") if i > 1 else env.get("VITE_OPENROUTER_API_KEY")
        if k and k.strip():
            keys.append(k.strip())
    return keys
