"""Fix legacy data quality bugs in accounts-full.json.

Post-processing pass that:
  1. Replaces Indo-decimal-comma (e.g. "428,8") with period ("428.8")
  2. Removes double-percent (e.g. "15,6%%" -> "15.6%")
  3. Updates tierDist labels (e.g. "≥100.000" -> "≥100K"; last bin "Rata-rata (≥100)" -> "Rendah (<100)")
  4. Recomputes IG ER using (likes+comments)/followers*100 (views not available for IG private API)
  5. Replaces IG topByViews with topByLikes (all views=0 for IG, so ranking is meaningless)
  6. Filters bad mentions (e.g. @gmail.com)
  7. Sanitizes LLM insight text (strips emoji)

Backs up before write. Run: python scripts/fix_legacy_data.py
"""
from __future__ import annotations
import json
import re
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "accounts-full.json"

# accounts-full.json key -> audit.json slug (for drift lookup)
KEY_TO_SLUG = {
    "ardiantanah-tiktok":       "ardian-tanah-tt",
    "majangmejeng-tiktok":      "majangmejeng-tt",
    "itsnisyananda-tiktok":     "itsnisyananda-tt",
    "syahfalahproperti-tiktok": "syahfalahproperti-tt",
    "ardiantanah-instagram":    "ardiantanah-ig",
    "majangmejeng-instagram":   "majangmejeng-ig",
    "nisyanandaa-instagram":    "nisyanandaa-ig",
    "syahfalahproperti-instagram": "syahfalahproperti-ig",
}


# === FIX 1: Indo-decimal-comma -> period ===
# e.g. "428,8" -> "428.8", "1,76%" -> "1.76%"
def fix_indo_decimal(s: str) -> str:
    if not isinstance(s, str):
        return s
    return re.sub(r"(\d+),(\d{1,2})(?=[%KkMm\s\)\]\}\.,;:]|$)", r"\1.\2", s)


# === FIX 2: Double percent -> single ===
def fix_double_pct(s: str) -> str:
    if not isinstance(s, str):
        return s
    return s.replace("%%", "%")


# === FIX 2b: Strip trailing ".0" from small numeric values (e.g. "1.0" -> "1") ===
def fix_trailing_zero(s: str) -> str:
    if not isinstance(s, str):
        return s
    return re.sub(r"\.0(?=[%KkMm\s\)\]\}\.,;:]|$)", "", s)


# === FIX 3: Tier labels with Indo number → K format ===
def fix_tier_label(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = s.replace("≥100.000", "≥100K")
    s = s.replace("≥10.000", "≥10K")
    s = s.replace("≥1.000", "≥1K")
    s = re.sub(r"≥(\d+)\.(\d{3})", r"≥\1K", s)
    return s


# === FIX 4: Last tier label ===
# "Rata-rata (≥X)" -> "Rendah (<X)" (last bin should be less-than)
def fix_last_tier_label(tier_dist: list) -> list:
    if not tier_dist or len(tier_dist) < 2:
        return tier_dist
    last = tier_dist[-1]
    label = last.get("label", "")
    # Case 1: "Rata-rata (≥X)" — this is the 4th bin in V8 design but
    # formatter left both 4th and 5th as "Rata-rata (≥X)" / "Rendah (≥X)".
    # The 5th bin (last) should be "Rendah (<X)".
    m = re.search(r"\(≥([\dKk]+)\)", label)
    if m:
        x = m.group(1)
        last["label"] = f"Rendah (<{x})"
    return tier_dist


# === FIX 5: Recompute IG ER ===
def recompute_ig_er(account: dict) -> None:
    p = account.get("profile", {})
    if p.get("platform") != "instagram":
        return
    kpis = account.get("kpis", [])
    followers = 0.0
    avg_likes = 0.0
    avg_comments = 0.0
    for k in kpis:
        label = k.get("label", "")
        v = str(k.get("value", "0"))
        mult = 1
        if v.endswith("K") or v.endswith("k"):
            mult = 1_000
            v = v[:-1]
        elif v.endswith("M") or v.endswith("m"):
            mult = 1_000_000
            v = v[:-1]
        try:
            n = float(v) * mult
        except (ValueError, TypeError):
            n = 0.0
        if label == "Followers":
            followers = n
        elif label == "Rata-rata Suka":
            avg_likes = n
        elif label == "Rata-rata Komentar":
            avg_comments = n
    if followers <= 0:
        return
    er = ((avg_likes + avg_comments) / followers) * 100
    for k in kpis:
        if k.get("label") == "Engagement Rate":
            k["value"] = f"{er:.2f}%"


# === FIX 6: IG topByViews → fallback to topByLikes (all views=0) ===
def fix_ig_topbyviews(account: dict) -> None:
    if account.get("profile", {}).get("platform") != "instagram":
        return
    tbv = account.get("topByViews", [])
    if not tbv:
        return
    # Check if all views are 0 / missing
    all_zero = True
    for p in tbv:
        v = str(p.get("views", "0"))
        if v not in ("0", "0.0", ""):
            mult = 1
            if v.endswith("K") or v.endswith("k"):
                mult = 1_000
                v = v[:-1]
            elif v.endswith("M") or v.endswith("m"):
                mult = 1_000_000
                v = v[:-1]
            try:
                if float(v) * mult > 0:
                    all_zero = False
                    break
            except (ValueError, TypeError):
                pass
    if all_zero:
        tbl = account.get("topByLikes", [])
        account["topByViews"] = list(tbl)


# === FIX 7: Filter bad mentions (e.g. @gmail.com) ===
def fix_mentions(account: dict) -> None:
    bad = re.compile(r"@?(gmail|yahoo|hotmail|outlook|email|ymail)\.com$", re.IGNORECASE)
    account["mentions"] = [
        m for m in account.get("mentions", []) if not bad.search(m.get("handle", ""))
    ]


# === FIX 8: Sanitize LLM text ===
EMOJI_RE = re.compile(
    r"[\U0001F600-\U0001F64F"
    r"\U0001F300-\U0001F5FF"
    r"\U0001F680-\U0001F6FF"
    r"\U0001F1E0-\U0001F1FF"
    r"\U00002702-\U000027B0"
    r"\U000024C2-\U0001F251"
    r"\U0001F900-\U0001F9FF]+",
    flags=re.UNICODE,
)


def sanitize_text(s):
    if not isinstance(s, str):
        return s
    s = fix_indo_decimal(s)
    s = fix_double_pct(s)
    s = fix_tier_label(s)
    s = fix_trailing_zero(s)
    s = EMOJI_RE.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def sanitize_insight(account: dict) -> None:
    ins = account.get("insight", {})
    for key in ("kekuatan", "kelemahan", "rekomendasi"):
        if key in ins and isinstance(ins[key], list):
            ins[key] = [sanitize_text(x) for x in ins[key]]
    for key in ("analisis", "posisi"):
        if key in ins:
            ins[key] = sanitize_text(ins[key])
    bench = account.get("benchmark", {})
    if isinstance(bench, dict):
        for k, v in bench.items():
            if isinstance(v, str):
                bench[k] = sanitize_text(v)
    growth = account.get("growth", {})
    if isinstance(growth, dict):
        for k, v in growth.items():
            if isinstance(v, str):
                growth[k] = sanitize_text(v)
            elif isinstance(v, list):
                growth[k] = [sanitize_text(x) for x in v]


# === FIX 9: duration[].er is actually % of total posts (mislabeled).
# Compute true share from posts count, and set er to "" since we don't have
# per-bin likes/views to compute real ER.
def fix_duration_er(account: dict) -> None:
    if account.get("profile", {}).get("platform") != "tiktok":
        return
    duration = account.get("duration", [])
    if not duration:
        return
    total = sum(int(x.get("posts", 0) or 0) for x in duration)
    if total <= 0:
        return
    for x in duration:
        try:
            posts = int(x.get("posts", 0) or 0)
        except (TypeError, ValueError):
            posts = 0
        x["share"] = f"{posts / total * 100:.1f}%"
        # Real ER cannot be computed without per-bin likes/views; clear the
        # mislabeled field so the UI doesn't show a fake engagement rate.
        x["er"] = ""


# === FIX 10: Apply follower drift from audit (new scraped follower count) ===
# Drift is a known issue: legacy V7 follower counts are way out of date.
# The audit.json file (from cross_validate) contains the new scrape values.
def apply_followers_drift(account: dict, drift_map: dict) -> None:
    """Override existing Followers KPI with the freshly scraped value.

    drift_map: {slug: new_follower_count}  (e.g. "ardian-tanah-tt": 9913)
    """
    slug = account.get("_slug")
    if not slug or slug not in drift_map:
        return
    new_n = drift_map[slug]
    if not new_n:
        return
    # Re-format with format_short
    for k in account.get("kpis", []):
        if k.get("label") == "Followers":
            k["value"] = format_short(new_n)
            break


def format_short(n):
    """Inline reimplementation to avoid circular import."""
    if n is None:
        return "—"
    n = int(n)
    if n < 0:
        return str(n)
    if n < 1_000:
        return str(n)
    if n < 1_000_000:
        k = n / 1_000
        if k < 10:
            s = f"{k:.1f}K"
            return s.replace(".0K", "K")
        return f"{int(k + 0.5):d}K"
    m = n / 1_000_000
    if m < 10:
        s = f"{m:.2f}M"
        return s.replace(".00M", "M")
    if m < 100:
        s = f"{m:.1f}M"
        return s.replace(".0M", "M")
    return f"{int(m + 0.5):d}M"


def load_drift_map() -> dict:
    """Read audit.json and extract new follower count per slug."""
    audit_path = ROOT / "scripts" / "scrape" / "output" / "audit.json"
    if not audit_path.exists():
        return {}
    try:
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    out = {}
    for slug, info in (audit.get("accounts") or {}).items():
        drift = info.get("profileDrift", {}).get("followers", {})
        new_n = drift.get("new")
        if new_n and new_n > 0:
            out[slug] = new_n
    return out


# === Apply ===
def walk(o):
    if isinstance(o, dict):
        for k, v in list(o.items()):
            if isinstance(v, str):
                new = v
                new = fix_indo_decimal(new)
                new = fix_double_pct(new)
                new = fix_tier_label(new)
                new = fix_trailing_zero(new)
                o[k] = new
            else:
                walk(v)
    elif isinstance(o, list):
        for x in o:
            walk(x)


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)

    # Backup
    date = "2026-07-12"
    bak = DATA.with_suffix(f".bak-fix1-{date}.json")
    shutil.copy(DATA, bak)
    print(f"backup: {bak}")

    # Build drift map from audit
    drift_map = load_drift_map()
    print(f"drift: {len(drift_map)} accounts with new followers")

    # Reverse-lookup: key -> slug (inject into each account for downstream)
    for key, acc in data.items():
        acc["_slug"] = KEY_TO_SLUG.get(key)

    for slug, acc in data.items():
        walk(acc)
        acc["tierDist"] = fix_last_tier_label(acc.get("tierDist", []))
        recompute_ig_er(acc)
        fix_ig_topbyviews(acc)
        fix_mentions(acc)
        sanitize_insight(acc)
        fix_duration_er(acc)
        apply_followers_drift(acc, drift_map)
        # Clean internal field
        acc.pop("_slug", None)

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("written")

    # Verify
    print("\n=== POST-FIX CHECK ===")
    for slug, acc in data.items():
        issues = []
        for k in acc.get("kpis", []):
            v = str(k.get("value", ""))
            if re.search(r"\d+,\d", v):
                issues.append(f"  INDO-COMMA: {k.get('label')}={v}")
        for t in acc.get("tierDist", []):
            if "%%" in t.get("pct", ""):
                issues.append(f"  DOUBLE PCT: {t}")
            if "Rata-rata" in t.get("label", "") and t == acc["tierDist"][-1]:
                issues.append(f"  LAST-TIER-LABEL: {t}")
        ins = acc.get("insight", {})
        for k in ("kekuatan", "kelemahan", "rekomendasi"):
            for x in ins.get(k, []):
                if EMOJI_RE.search(x):
                    issues.append(f"  EMOJI: {k}: {x!r}")
        if issues:
            print(f"\n[{slug}]")
            for i in issues:
                print(i)


if __name__ == "__main__":
    main()
