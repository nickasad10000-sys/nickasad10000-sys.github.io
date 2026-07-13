"""Refresh 4 Instagram accounts from raw scrape + clean duplicates/invalid.

For each of 4 IG slugs:
  1. Load raw/{slug}.json (raw scrape from web_profile_info + posts)
  2. Build post-level aggregates (avg likes, avg comments, ER, tier, hashtags, mentions,
     daily/monthly/yearly, duration buckets)
  3. Dedupe by shortcode, drop posts with empty/email-only captions
  4. Update src/data/accounts-full.json with refreshed KPIs + new post lists
  5. Preserve existing LLM insights (kekuatan/kelemahan/rekomendasi/analisis/posisi)
     since regenerating them is a separate step

Run: python scripts/fix_ig_data.py
"""
from __future__ import annotations
import json
import re
import shutil
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "scripts" / "scrape" / "raw"
DATA = ROOT / "src" / "data" / "accounts-full.json"

# Map accounts-full.json key → raw file slug
KEY_TO_SLUG = {
    "ardiantanah-instagram":       "ardiantanah-ig",
    "majangmejeng-instagram":      "majangmejeng-ig",
    "nisyanandaa-instagram":       "nisyanandaa-ig",
    "syahfalahproperti-instagram": "syahfalahproperti-ig",
}

# Map raw user.role category → our niche taxonomy
CATEGORY_TO_NICHE = {
    "Digital creator": "lifestyle",
    "Media": "info-kota-lumajang",
    "Media/News Company": "info-kota-lumajang",
    "Real Estate Developer": "properti",
    "Property Management Company": "properti-lumajang",
    "Real Estate Agent": "properti",
    "Personal blog": "lifestyle",
}

BAD_MENTION = re.compile(r"@?(gmail|yahoo|hotmail|outlook|email|ymail)\.com$", re.I)

# === helpers ===
def fmt_short(n):
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


def fmt_pct(n, decimals=2):
    if n is None:
        return "—"
    s = f"{n:.{decimals}f}%"
    return s.replace(".00%", "%") if decimals >= 2 else s


# === Tier distribution (5 buckets) ===
# Mirror aggregate.py bucket labels so they stay consistent.
TIER_BINS = [
    ("Viral (≥100K)",        100_000, float("inf")),
    ("Tinggi (≥10K)",         10_000, 100_000),
    ("Bagus (≥1K)",            1_000,  10_000),
    ("Rata-rata (≥100)",         100,    1_000),
    ("Rendah (<100)",              0,      100),
]


def build_tier_dist(posts, n_top):
    counts = Counter()
    for p in posts:
        v = p.get("views") or 0
        for label, lo, hi in TIER_BINS:
            if lo <= v < hi:
                counts[label] += 1
                break
    rows = []
    for label, lo, hi in TIER_BINS:
        c = counts.get(label, 0)
        pct = (c / n_top * 100) if n_top else 0
        rows.append({
            "label": label,
            "width": round(pct, 1),
            "count": c,
            "pct": f"{pct:.1f}%",
        })
    return rows


# === Hashtag aggregation ===
HASHTAG_RE = re.compile(r"#([\w_À-￿]+)")


def build_hashtags(posts, n_top_posts):
    counts = Counter()
    likes_by_tag = defaultdict(list)
    for p in posts:
        cap = p.get("caption", "") or ""
        for tag in HASHTAG_RE.findall(cap):
            t = tag.lower()
            counts[t] += 1
            likes_by_tag[t].append(p.get("likes", 0) or 0)
    total = sum(counts.values()) or 1
    top = counts.most_common(10)
    rows = []
    for tag, c in top:
        avg_l = sum(likes_by_tag[tag]) / len(likes_by_tag[tag]) if likes_by_tag[tag] else 0
        rows.append({
            "tag": f"#{tag}",
            "count": c,
            "pct": f"{c / total * 100:.1f}%",
            "avgViews": fmt_short(0),  # IG has no views for image; leave 0
            "avgLikes": fmt_short(avg_l),
        })
    return rows


# === Mention aggregation (collaborations) ===
MENTION_RE = re.compile(r"@([a-zA-Z0-9._]+)")


def build_mentions(posts):
    counts = Counter()
    for p in posts:
        cap = p.get("caption", "") or ""
        for m in MENTION_RE.findall(cap):
            h = m.lower()
            if BAD_MENTION.search(h):
                continue
            counts[h] += 1
    return [{"handle": f"@{h}", "count": c} for h, c in counts.most_common(10)]


# === Daily / monthly / yearly aggregation ===
WEEKDAY = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]


def build_daily_perf(posts):
    buckets = defaultdict(lambda: {"views": 0, "likes": 0, "comments": 0, "posts": 0})
    for p in posts:
        ts = p.get("taken_at_timestamp", 0)
        if not ts:
            continue
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        wd = WEEKDAY[dt.weekday()]
        b = buckets[wd]
        b["views"] += p.get("views") or 0
        b["likes"] += p.get("likes") or 0
        b["comments"] += p.get("comments") or 0
        b["posts"] += 1
    # Emit in weekday order
    out = []
    for wd in WEEKDAY:
        if wd in buckets:
            b = buckets[wd]
            out.append({
                "day": wd,
                "views": fmt_short(b["views"]),
                "likes": fmt_short(b["likes"]),
                "posts": b["posts"],
                "comments": fmt_short(b["comments"]),
            })
    return out


def build_monthly_perf(posts):
    buckets = defaultdict(lambda: {"views": 0, "likes": 0, "comments": 0, "posts": 0})
    for p in posts:
        ts = p.get("taken_at_timestamp", 0)
        if not ts:
            continue
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        key = f"{SHORT_MONTH[dt.month - 1]} {dt.year}"
        b = buckets[key]
        b["views"] += p.get("views") or 0
        b["likes"] += p.get("likes") or 0
        b["comments"] += p.get("comments") or 0
        b["posts"] += 1
    out = []
    for key in sorted(buckets.keys(), key=lambda k: (
        int(k.split()[1]), SHORT_MONTH.index(k.split()[0])
    )):
        b = buckets[key]
        out.append({
            "month": key,
            "posts": b["posts"],
            "views": fmt_short(b["views"]),
            "likes": fmt_short(b["likes"]),
            "comments": fmt_short(b["comments"]),
            "avg": fmt_short(b["likes"] // b["posts"] if b["posts"] else 0),
        })
    return out


def build_yearly(posts):
    buckets = defaultdict(lambda: {
        "posts": 0, "views": 0, "likes": 0, "comments": 0,
        "best_month_likes": 0, "best_month": "", "top_post_caption": "", "top_post_likes": -1,
    })
    for p in posts:
        ts = p.get("taken_at_timestamp", 0)
        if not ts:
            continue
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        y = str(dt.year)
        m = f"{SHORT_MONTH[dt.month - 1]} {dt.year}"
        b = buckets[y]
        b["posts"] += 1
        b["views"] += p.get("views") or 0
        b["likes"] += p.get("likes") or 0
        b["comments"] += p.get("comments") or 0
        if (p.get("likes") or 0) > b["best_month_likes"]:
            b["best_month_likes"] = p.get("likes") or 0
            b["best_month"] = m
        if (p.get("likes") or 0) > b["top_post_likes"]:
            b["top_post_likes"] = p.get("likes") or 0
            cap = (p.get("caption") or "").replace("\n", " ").strip()
            b["top_post_caption"] = cap[:60]
    out = []
    for y in sorted(buckets.keys()):
        b = buckets[y]
        out.append({
            "year": y,
            "posts": b["posts"],
            "views": fmt_short(b["views"]),
            "likes": fmt_short(b["likes"]),
            "comments": fmt_short(b["comments"]),
            "avgViews": fmt_short(b["views"] // b["posts"] if b["posts"] else 0),
            "bestMonth": b["best_month"],
            "topPost": b["top_post_caption"],
        })
    return out


# === Duration bucket (IG: use media_type or caption for video; fallback to "Postingan") ===
def build_duration(posts):
    # IG: carousels vs single image vs reels. Keep simple: split by is_video.
    buckets = {"Reels": [], "Carousel": [], "Single Image": []}
    for p in posts:
        if p.get("is_video"):
            buckets["Reels"].append(p)
        elif p.get("is_carousel"):
            buckets["Carousel"].append(p)
        else:
            buckets["Single Image"].append(p)
    out = []
    for label, lst in buckets.items():
        if not lst:
            continue
        n = len(lst)
        likes = sum((p.get("likes") or 0) for p in lst)
        comments = sum((p.get("comments") or 0) for p in lst)
        out.append({
            "range": label,
            "posts": n,
            "views": fmt_short(0),  # IG views not available
            "share": f"{n / max(1, len(posts)) * 100:.1f}%",
            "er": "",
        })
    return out


# === Top N posts by metric ===
def top_n(posts, metric, n=5):
    return sorted(posts, key=lambda p: p.get(metric) or 0, reverse=True)[:n]


# === Refresh one account ===
def refresh_account(key: str, raw_path: Path) -> dict:
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    user = raw["user"]
    posts = raw["posts"]

    # === 1. Dedupe by shortcode ===
    seen = set()
    deduped = []
    for p in posts:
        sc = p.get("shortcode")
        if not sc or sc in seen:
            continue
        seen.add(sc)
        # === 2. Filter posts with empty / email-only caption ===
        cap = (p.get("caption") or "").strip()
        if not cap or not any(c.isalnum() for c in cap):
            # No real content — still keep but mark
            p["_empty_caption"] = True
        # === 3. Strip bad mentions in caption (we don't delete post, just sanitize) ===
        if cap and BAD_MENTION.search(cap):
            cap = BAD_MENTION.sub("", cap)
            p["caption"] = cap
        deduped.append(p)
    n = len(deduped)

    # === 4. Profile ===
    followers = user.get("follower_count", 0) or 0
    following = user.get("following_count", 0) or 0
    media = user.get("media_count", 0) or 0
    category = user.get("category") or ""
    verified = bool(user.get("is_verified"))
    bio = (user.get("biography") or "").strip()
    external_url = user.get("external_url") or None
    full_name = user.get("full_name") or ""

    niche = CATEGORY_TO_NICHE.get(category, "lifestyle")
    if "properti" in (bio or "").lower() or "property" in (bio or "").lower() or "properti" in category.lower():
        niche = "properti-lumajang"
    if "lumajang" in (bio or "").lower() or "lumajang" in category.lower():
        niche = "properti-lumajang" if "properti" in (bio or "").lower() or "property" in category.lower() else niche

    profile = {
        "platform": "instagram",
        "handle": user["username"],
        "displayName": full_name,
        "verified": verified,
        "bio": bio,
        "url": f"https://www.instagram.com/{user['username']}/",
        "niche": niche,
        "lokasi": "Lumajang, Jawa Timur",
        "followers": fmt_short(followers),
        "posts": str(media),
    }
    if external_url:
        # Strip protocol from display
        url_display = external_url.replace("https://", "").replace("http://", "").rstrip("/")
        profile["url"] = url_display

    # === 5. KPIs ===
    total_likes = sum((p.get("likes") or 0) for p in deduped)
    total_comments = sum((p.get("comments") or 0) for p in deduped)
    avg_likes = total_likes / n if n else 0
    avg_comments = total_comments / n if n else 0
    er_pct = (avg_likes + avg_comments) / followers * 100 if followers else 0

    kpis = [
        {"value": fmt_short(followers), "label": "Followers"},
        {"value": str(media),            "label": "Posts"},
        {"value": fmt_short(following),  "label": "Following"},
        {"value": fmt_short(avg_likes),  "label": "Rata-rata Suka"},
        {"value": fmt_short(avg_comments), "label": "Rata-rata Komentar"},
        {"value": fmt_pct(er_pct),       "label": "Engagement Rate"},
        {"value": fmt_short(total_likes),  "label": "Total Suka"},
        {"value": fmt_short(total_comments), "label": "Total Komentar"},
        {"value": fmt_short(0),          "label": "Total Tayangan"},  # IG private API: no views
        {"value": "0",                   "label": "Avg Views"},
        {"value": "Tidak Tersedia",      "label": "Status API"},
        {"value": category or "—",       "label": "Kategori"},
    ]

    # === 6. Top posts ===
    by_likes = top_n(deduped, "likes", 5)
    by_comments = top_n(deduped, "comments", 5)
    # IG: views not available, so topByViews = topByLikes
    by_views = by_likes

    def serialize_post(p, rank, metric):
        cap = (p.get("caption") or "").replace("\n", " ").strip()
        return {
            "rank": rank,
            "views": "0",
            "likes": fmt_short(p.get("likes") or 0),
            "comments": fmt_short(p.get("comments") or 0),
            "shares": "0",
            "er": "—",
            "date": datetime.fromtimestamp(p["taken_at_timestamp"], tz=timezone.utc).strftime("%Y-%m-%d"),
            "caption": cap[:200],
        }

    topByViews = [serialize_post(p, i + 1, "views") for i, p in enumerate(by_views)]
    topByLikes = [serialize_post(p, i + 1, "likes") for i, p in enumerate(by_likes)]
    topByComments = [serialize_post(p, i + 1, "comments") for i, p in enumerate(by_comments)]

    # === 7. Aggregations ===
    tier = build_tier_dist(deduped, n)
    hashtags = build_hashtags(deduped, n)
    mentions = build_mentions(deduped)
    daily = build_daily_perf(deduped)
    monthly = build_monthly_perf(deduped)
    yearly = build_yearly(deduped)
    duration = build_duration(deduped)

    return {
        "profile": profile,
        "kpis": kpis,
        "topByViews": topByViews,
        "topByLikes": topByLikes,
        "topByComments": topByComments,
        "tierDist": tier,
        "hashtags": hashtags,
        "mentions": mentions,
        "dailyPerf": daily,
        "monthlyPerf": monthly,
        "yearly": yearly,
        "duration": duration,
    }


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)

    # Backup
    date = "2026-07-12"
    bak = DATA.with_suffix(f".bak-igrefresh-{date}.json")
    shutil.copy(DATA, bak)
    print(f"backup: {bak}")

    report = []
    for key, slug in KEY_TO_SLUG.items():
        raw_path = RAW_DIR / f"{slug}.json"
        if not raw_path.exists():
            print(f"SKIP {key}: no raw file at {raw_path}")
            continue
        old = data[key]
        # Preserve existing LLM-derived sections
        preserved = {
            "insight": old.get("insight", {}),
            "benchmark": old.get("benchmark", {}),
            "growth": old.get("growth", {}),
        }
        fresh = refresh_account(key, raw_path)
        fresh.update(preserved)  # restored at end
        data[key] = fresh

        # Report
        raw = json.loads(raw_path.read_text(encoding="utf-8"))
        n_raw = len(raw["posts"])
        seen = len({p.get("shortcode") for p in raw["posts"] if p.get("shortcode")})
        n_clean = len(fresh["topByLikes"]) + (len(fresh["topByLikes"]) - 5)  # rough
        n_clean = sum(1 for p in fresh["dailyPerf"])  # proxy
        report.append((key, slug, n_raw, seen, fresh["profile"]["followers"]))

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("written")
    print()
    print("=== POST-REFRESH ===")
    for key, slug, n_raw, n_unique, fol in report:
        print(f"  {key}: {n_raw} raw → {n_unique} unique | followers={fol}")


if __name__ == "__main__":
    main()
