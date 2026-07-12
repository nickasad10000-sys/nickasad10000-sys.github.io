"""TITAN PRO V8 — Cross-validator.

Compares scraped raw data (in scripts/scrape/raw/*.json) against existing
src/data/accounts-full.json. Produces an audit report and a merge plan:

  * Profile fields: drift detection (follower, video count)
  * Posts: caption-match keeps existing entry, refresh numbers
  * Posts: in scrape but not in existing → add as new
  * Posts: in existing but not in scrape → keep (mark as stale)

The merge plan is then used by generate_accounts.mjs to write the final
accounts-full.json without losing any existing data.
"""

from __future__ import annotations
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow running as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.scrape.config import ACCOUNTS, RAW_DIR, OUTPUT_DIR
from scripts.scrape.aggregate import aggregate_account, _post_caption


ACCOUNTS_FULL = Path(__file__).resolve().parent.parent.parent / "src" / "data" / "accounts-full.json"


# ---- Slug mapping -----------------------------------------------------------

# config.py slug -> accounts-full.json key
SLUG_TO_KEY = {
    "ardian-tanah-tt":      "ardiantanah-tiktok",
    "majangmejeng-tt":      "majangmejeng-tiktok",
    "itsnisyananda-tt":     "itsnisyananda-tiktok",
    "syahfalahproperti-tt":"syahfalahproperti-tiktok",
    "ardiantanah-ig":       "ardiantanah-instagram",
    "majangmejeng-ig":      "majangmejeng-instagram",
    "nisyanandaa-ig":       "nisyanandaa-instagram",
    "syahfalahproperti-ig":"syahfalahproperti-instagram",
}


# ---- Drift helpers ----------------------------------------------------------

def _drift_pct(old: int | float | None, new: int | float | None) -> float | None:
    if old is None or new is None or old == 0:
        return None
    return abs(new - old) / old * 100.0


def _short(slug: str) -> str:
    """Normalize a caption for fuzzy match (strip whitespace, lowercase)."""
    return (slug or "").strip().lower()[:80]


# ---- Per-account validation ------------------------------------------------

def validate_account(slug: str, raw: dict, existing: dict | None) -> dict:
    """Produce an audit report for a single account.

    Returns a dict with:
      - profileDrift: { field: {old, new, driftPct, status} }
      - postDrift: { added: [...], refreshed: [...], stale: [...] }
      - newAggregations: KPI/top counts etc that the formatter should use
    """
    platform = "tiktok" if "tt" in slug else "instagram"
    raw_user = raw.get("user") or {}
    raw_stats = raw.get("stats") or {}
    raw_posts = raw.get("posts") or raw.get("itemList") or []

    report: dict = {
        "slug": slug,
        "platform": platform,
        "scrapedPosts": len(raw_posts),
        "profileDrift": {},
        "postDrift": {"added": [], "refreshed": [], "stale": []},
        "newAggregations": None,
    }

    # ---- Profile drift ----
    if existing:
        old_profile = existing.get("profile", {})
        new_profile = {
            "platform": platform,
            "handle": raw_user.get("uniqueId") or raw_user.get("username") or old_profile.get("handle"),
            "displayName": raw_user.get("nickname") or raw_user.get("full_name") or old_profile.get("displayName"),
            "bio": raw_user.get("signature") or raw_user.get("biography") or old_profile.get("bio"),
            "lokasi": old_profile.get("lokasi"),  # Not in raw
            "url": old_profile.get("url"),
            "niche": old_profile.get("niche"),
        }
        # Compare key fields
        for field in ("handle", "displayName", "bio"):
            old_v = old_profile.get(field)
            new_v = new_profile.get(field)
            if old_v != new_v:
                report["profileDrift"][field] = {
                    "old": old_v,
                    "new": new_v,
                    "status": "changed",
                }
        # Follower count drift
        new_followers = (
            raw_user.get("follower_count")
            or raw_stats.get("followerCount")
        )
        old_followers = None
        for kpi in existing.get("kpis", []):
            if kpi.get("label") == "Followers":
                # Parse the short form back to int
                from scripts.scrape.normalize import parse_int
                old_followers = parse_int(kpi.get("value"))
                break
        if new_followers and old_followers:
            drift = _drift_pct(old_followers, new_followers)
            if drift is not None and drift > 10:
                report["profileDrift"]["followers"] = {
                    "old": old_followers,
                    "new": new_followers,
                    "driftPct": round(drift, 1),
                    "status": "drifted" if drift > 30 else "minor",
                }
            elif drift is not None and drift <= 10:
                report["profileDrift"]["followers"] = {
                    "old": old_followers,
                    "new": new_followers,
                    "driftPct": round(drift, 1),
                    "status": "ok",
                }

    # ---- Post drift ----
    if existing:
        # Build a set of normalized captions from existing topBy* lists
        existing_caps: set[str] = set()
        for key in ("topByViews", "topByLikes", "topByComments"):
            for entry in existing.get(key, []):
                c = entry.get("caption")
                if c:
                    existing_caps.add(_short(c))

        # Posts from new scrape
        new_caps_seen: set[str] = set()
        for p in raw_posts:
            cap = _post_caption(p)
            norm = _short(cap)
            if not norm:
                continue
            new_caps_seen.add(norm)
            if norm in existing_caps:
                report["postDrift"]["refreshed"].append(cap[:80])
            else:
                report["postDrift"]["added"].append(cap[:80])

        # Stale = in existing but not in new scrape
        # We can only check by exact caption match
        for key in ("topByViews", "topByLikes", "topByComments"):
            for entry in existing.get(key, []):
                c = entry.get("caption")
                if c and _short(c) not in new_caps_seen:
                    report["postDrift"]["stale"].append(c[:80])

    # ---- New aggregations (only if we have new posts) ----
    if raw_posts:
        report["newAggregations"] = aggregate_account(raw, platform)

    return report


# ---- Top-level --------------------------------------------------------------

def cross_validate(limit: int = 0) -> dict:
    """Cross-validate all accounts. Returns { slug: report }."""
    if not ACCOUNTS_FULL.exists():
        print(f"  ⚠️  {ACCOUNTS_FULL} not found")
        return {}
    full = json.loads(ACCOUNTS_FULL.read_text(encoding="utf-8"))

    targets = ACCOUNTS
    if limit:
        targets = targets[:limit]

    out: dict = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": {"total": 0, "drifted": 0, "stale": 0, "added": 0, "refreshed": 0, "noNewData": 0},
        "accounts": {},
    }
    for acc in targets:
        slug = acc["slug"]
        key = SLUG_TO_KEY.get(slug)
        if not key:
            print(f"  ⚠️  no key mapping for {slug}")
            continue
        raw_path = RAW_DIR / f"{slug}.json"
        if not raw_path.exists():
            print(f"  ⚠️  no raw file for {slug}, skip")
            out["accounts"][slug] = {
                "status": "no-raw",
                "error": f"missing {raw_path.name}",
            }
            continue
        try:
            raw = json.loads(raw_path.read_text(encoding="utf-8"))
        except Exception as e:
            out["accounts"][slug] = {"status": "parse-error", "error": str(e)}
            continue
        if raw.get("_error"):
            out["accounts"][slug] = {"status": "scrape-error", "error": raw["_error"]}
            continue
        existing = full.get(key)
        report = validate_account(slug, raw, existing)
        out["accounts"][slug] = report
        out["summary"]["total"] += 1
        if not raw.get("posts") and not raw.get("itemList"):
            out["summary"]["noNewData"] += 1
        else:
            out["summary"]["added"] += len(report["postDrift"]["added"])
            out["summary"]["refreshed"] += len(report["postDrift"]["refreshed"])
            out["summary"]["stale"] += len(report["postDrift"]["stale"])
        if report["profileDrift"]:
            out["summary"]["drifted"] += 1
    return out


# ---- CLI -------------------------------------------------------------------

if __name__ == "__main__":
    report = cross_validate()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "audit.json"
    out_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"\n=== Audit summary ===")
    s = report["summary"]
    print(f"  accounts:    {s['total']}")
    print(f"  drifted:     {s['drifted']}")
    print(f"  noNewData:   {s['noNewData']}  (TikTok post list blocked)")
    print(f"  added:       {s['added']}")
    print(f"  refreshed:   {s['refreshed']}")
    print(f"  stale:       {s['stale']}")
    print(f"\n  → {out_path}")
    for slug, rep in report["accounts"].items():
        if rep.get("status"):
            print(f"  {slug}: {rep['status']} - {rep.get('error', '')[:60]}")
        else:
            drift_keys = list(rep["profileDrift"].keys())
            drift_str = ", ".join(drift_keys) if drift_keys else "ok"
            print(f"  {slug}: drift=[{drift_str}] +{len(rep['postDrift']['added'])} ~{len(rep['postDrift']['refreshed'])} stale={len(rep['postDrift']['stale'])}")
