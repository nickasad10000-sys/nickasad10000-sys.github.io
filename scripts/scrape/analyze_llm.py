"""TITAN PRO V8 — LLM analyzer (OpenRouter).

Generates AI insights per account using OpenRouter (multi-key pool, round-robin
with 429-aware rotation). Model: anthropic/claude-3-haiku (cheap, fast).

Inputs:
  - Profile meta (handle, followers, bio, niche)
  - Aggregated KPIs + top posts
  - Audit drift report

Outputs (per account):
  insight: { kekuatan, kelemahan, rekomendasi, analisis, posisi }
  benchmark: { industri, catatan }
  growth: { target, langkah }
  contentAnalysis: [ { shortcode, category, sentiment, hookStrength } ]  (top 5)
"""

from __future__ import annotations
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.scrape.config import OUTPUT_DIR, get_openrouter_keys
from scripts.scrape.normalize import format_short, parse_int


# ---- OpenRouter client ------------------------------------------------------

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-3-haiku"


class KeyPool:
    """Round-robin key pool with 429-aware cooldown."""

    def __init__(self, keys: list[str]):
        self.keys = keys
        self.idx = 0
        self.cooldown: dict[str, float] = {}  # key -> free_at timestamp

    def acquire(self) -> str | None:
        """Return the next available key, or None if all in cooldown."""
        now = time.time()
        for _ in range(len(self.keys)):
            k = self.keys[self.idx]
            self.idx = (self.idx + 1) % len(self.keys)
            if self.cooldown.get(k, 0) <= now:
                return k
        return None

    def cooldown_key(self, key: str, seconds: float):
        self.cooldown[key] = time.time() + seconds


def call_openrouter(
    pool: KeyPool,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_retries: int = 3,
    timeout: int = 60,
) -> dict | None:
    """Call OpenRouter chat/completions. Returns parsed dict or None on failure.

    Retries on 429 with exponential backoff. Falls back to next key on auth error.
    """
    if not pool.keys:
        return None
    last_err: str = ""
    for attempt in range(max_retries):
        key = pool.acquire()
        if not key:
            time.sleep(2.0)
            key = pool.acquire()
            if not key:
                return None
        try:
            import httpx
            r = httpx.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://titan-pro-v8.local",
                    "X-Title": "TITAN PRO V8",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": 2000,
                    "temperature": 0.4,
                },
                timeout=timeout,
            )
            if r.status_code == 200:
                return r.json()
            if r.status_code == 429:
                # Rate limit — cool this key down
                backoff = 5 * (2 ** attempt)  # 5, 10, 20
                pool.cooldown_key(key, backoff)
                last_err = f"429: {r.text[:120]}"
                time.sleep(min(backoff, 10))
                continue
            if r.status_code in (401, 403):
                # Bad key — cool down for a long time
                pool.cooldown_key(key, 300)
                last_err = f"{r.status_code}: {r.text[:120]}"
                continue
            # Other error — short backoff, try next key
            last_err = f"{r.status_code}: {r.text[:120]}"
            pool.cooldown_key(key, 30)
            time.sleep(1.5)
        except Exception as e:
            last_err = f"exception: {e}"
            time.sleep(2.0)
    print(f"  ⚠️  OpenRouter failed after {max_retries} attempts: {last_err[:120]}")
    return None


# ---- Prompt builder ---------------------------------------------------------

def _build_prompt(
    profile: dict,
    kpis: list[dict],
    top_views: list[dict],
    top_likes: list[dict],
    audit_drift: dict | None = None,
) -> list[dict]:
    """Build the system+user message for a single account."""
    system = (
        "You are a social media analytics assistant for an Indonesian "
        "creator management dashboard. Output MUST be in Bahasa Indonesia, "
        "concise, actionable. Use the EXACT JSON schema requested."
    )

    # Compact data summary
    kpi_lines = "\n".join(f"  - {k['label']}: {k['value']}" for k in kpis)
    top_lines_v = "\n".join(
        f"  - #{p['rank']} [{p['date']}] {p['views']} views, {p['likes']} likes, "
        f"{p['comments']} comments, ER {p['er']}: {p['caption']}"
        for p in top_views
    )
    top_lines_l = "\n".join(
        f"  - #{p['rank']} [{p['date']}] {p['views']} views, {p['likes']} likes: "
        f"{p['caption']}"
        for p in top_likes
    )

    drift_note = ""
    if audit_drift and audit_drift.get("profileDrift"):
        d = audit_drift["profileDrift"]
        if "followers" in d:
            f = d["followers"]
            drift_note = (
                f"\nFollower drift detected: {format_short(f.get('old'))} → "
                f"{format_short(f.get('new'))} ({f.get('driftPct')}% {f.get('status')}). "
                "Acknowledge this in your analysis."
            )

    platform_note = ""
    if profile.get("platform") == "instagram":
        platform_note = (
            "\nNOTE: Instagram image posts have no view count (views=0); "
            "use likes and comments as the primary engagement signals. "
            "Do NOT flag 'zero views' as a weakness."
        )
    elif profile.get("platform") == "tiktok":
        platform_note = (
            "\nNOTE: TikTok post data may be sparse if scraping was blocked "
            "by anti-bot — focus on profile meta + KPI totals only."
        )

    user = f"""Analyze this social media account and respond with ONLY valid JSON (no markdown, no preamble).

ACCOUNT: {profile.get('displayName')} (@{profile.get('handle')}) on {profile.get('platform')}
NICHE: {profile.get('niche', 'lifestyle')}
BIO: {profile.get('bio', '')[:200]}

KPIs:
{kpi_lines}

TOP 5 BY VIEWS:
{top_lines_v}

TOP 5 BY LIKES:
{top_lines_l}
{drift_note}{platform_note}

JSON SCHEMA:
{{
  "kekuatan": [str, str, str],            // 3 key strengths (Bahasa Indonesia)
  "kelemahan": [str, str, str],            // 3 weaknesses
  "rekomendasi": [str, str, str, str, str], // 5 concrete recommendations
  "analisis": str,                          // 1-2 sentence overall analysis
  "posisi": str,                            // 1 sentence market position
  "benchmark": {{
    "industri": str,    // industry benchmark (e.g. "5-8% ER for lifestyle niche")
    "catatan": str      // note about whether account meets/exceeds
  }},
  "growth": {{
    "target": str,        // 3-month growth target
    "langkah": [str, str, str]  // 3 concrete steps
  }}
}}"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


# ---- JSON extractor ---------------------------------------------------------

def _extract_json(text: str) -> dict | None:
    """Extract JSON from LLM response, handling markdown code blocks."""
    if not text:
        return None
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try to find ```json ... ``` block
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # Try to find first { ... last }
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


# ---- Per-account analysis ---------------------------------------------------

def analyze_account(
    slug: str,
    profile: dict,
    kpis: list[dict],
    top_views: list[dict],
    top_likes: list[dict],
    audit_drift: dict | None,
    pool: KeyPool,
) -> dict:
    """Return insight dict for the account. Empty dict on failure."""
    messages = _build_prompt(profile, kpis, top_views, top_likes, audit_drift)
    response = call_openrouter(pool, messages)
    if not response:
        return {}
    try:
        text = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return {}
    parsed = _extract_json(text)
    if not parsed:
        return {}
    # Normalize to expected shape
    return {
        "kekuatan": _as_list(parsed.get("kekuatan"), 3),
        "kelemahan": _as_list(parsed.get("kelemahan"), 3),
        "rekomendasi": _as_list(parsed.get("rekomendasi"), 5),
        "analisis": str(parsed.get("analisis") or ""),
        "posisi": str(parsed.get("posisi") or ""),
        "benchmark": {
            "industri": str((parsed.get("benchmark") or {}).get("industri") or ""),
            "catatan": str((parsed.get("benchmark") or {}).get("catatan") or ""),
        },
        "growth": {
            "target": str((parsed.get("growth") or {}).get("target") or ""),
            "langkah": _as_list((parsed.get("growth") or {}).get("langkah"), 3),
        },
    }


def _as_list(v: Any, n: int) -> list[str]:
    if isinstance(v, list):
        out = [str(x).strip() for x in v if str(x).strip()]
    elif isinstance(v, str):
        # Try splitting on newlines or semicolons
        parts = re.split(r"[\n;]+", v)
        out = [p.strip(" -•").strip() for p in parts if p.strip(" -•").strip()]
    else:
        out = []
    return out[:n]


# ---- Top-level --------------------------------------------------------------

def analyze_all(limit: int = 0) -> dict[str, dict]:
    """Run analysis for all accounts. Returns { slug: insight_dict }."""
    keys = get_openrouter_keys()
    if not keys:
        print("  ⚠️  No OpenRouter keys in .env — skipping LLM analysis")
        return {}
    pool = KeyPool(keys)
    print(f"  OpenRouter pool: {len(keys)} keys")

    # Load audit report (from cross_validate)
    audit_path = OUTPUT_DIR / "audit.json"
    audit: dict = {}
    if audit_path.exists():
        try:
            audit = json.loads(audit_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    out: dict[str, dict] = {}
    accounts = [
        ("ardiantanah-instagram",   "ardiantanah-ig",      "instagram", "Ardian Tanah",       "properti"),
        ("majangmejeng-instagram",  "majangmejeng-ig",     "instagram", "MajanMejeng",        "info-kota-lumajang"),
        ("nisyanandaa-instagram",   "nisyanandaa-ig",      "instagram", "Nisya Nanda",        "lifestyle"),
        ("syahfalahproperti-instagram","syahfalahproperti-ig","instagram","Syahfalah Properti","properti-lumajang"),
        ("ardiantanah-tiktok",      "ardian-tanah-tt",     "tiktok",    "Ardian Tanah",       "properti"),
        ("majangmejeng-tiktok",     "majangmejeng-tt",     "tiktok",    "MajanMejeng",        "info-kota-lumajang"),
        ("itsnisyananda-tiktok",    "itsnisyananda-tt",    "tiktok",    "Nisya Nanda",        "lifestyle"),
        ("syahfalahproperti-tiktok","syahfalahproperti-tt","tiktok",    "Syahfalah Properti", "properti-lumajang"),
    ]
    if limit:
        accounts = accounts[:limit]

    for key, slug, platform, display, niche in accounts:
        print(f"\n[LLM] {slug}...")
        # Get aggregations from audit (set by cross_validate)
        acc_audit = (audit.get("accounts") or {}).get(slug) or {}
        aggs = acc_audit.get("newAggregations") or {}
        kpis = aggs.get("kpis") or []
        top_views = aggs.get("topByViews") or []
        top_likes = aggs.get("topByLikes") or []
        if not kpis or not top_views:
            # No new data — try to read from accounts-full.json
            try:
                full = json.loads((Path(__file__).resolve().parent.parent.parent / "src" / "data" / "accounts-full.json").read_text(encoding="utf-8"))
                existing = full.get(key) or {}
                kpis = existing.get("kpis") or []
                top_views = existing.get("topByViews") or []
                top_likes = existing.get("topByLikes") or []
            except Exception:
                pass
        if not kpis or not top_views:
            print(f"  no data to analyze, skip")
            continue
        profile = {
            "platform": platform,
            "handle": slug.split("-")[0] if not slug.startswith("its") and not slug.startswith("syah") else slug.split("-")[0],
            "displayName": display,
            "bio": "",
            "niche": niche,
        }
        t0 = time.time()
        insight = analyze_account(slug, profile, kpis, top_views, top_likes, acc_audit, pool)
        dt = time.time() - t0
        if insight:
            print(f"  ✓ done in {dt:.1f}s")
            out[slug] = insight
        else:
            print(f"  ✗ no insight ({dt:.1f}s)")

    return out


# ---- CLI -------------------------------------------------------------------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--mock", action="store_true", help="Skip OpenRouter, return empty")
    args = parser.parse_args()

    if args.mock:
        print("Mock mode — skipping OpenRouter")
        sys.exit(0)

    out = analyze_all(limit=args.limit)
    out_path = OUTPUT_DIR / "llm-insights.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(out, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n  → {out_path} ({len(out)} accounts)")
