"""TITAN PRO V8 — Aggregator.

Converts raw scraped posts (from scripts/scrape/raw/*.json) into the
dashboard sections: tierDist, hashtags, mentions, dailyPerf, monthlyPerf,
yearly, duration.

Pure functions, no I/O. Input shape is the union of TikTok and IG post
dicts from tiktok_posts.py / instagram_profile.py.
"""

from __future__ import annotations
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any


# ---- Hashtag / mention parsing ---------------------------------------------

HASHTAG_RE = re.compile(r"#([\wÀ-ɏḀ-ỿ]+)", re.UNICODE)
MENTION_RE = re.compile(r"@([\w.]+)", re.UNICODE)


def extract_hashtags(text: str) -> list[str]:
    """Return normalized hashtag list, lowercase, no '#'."""
    if not text:
        return []
    return [m.group(1).lower() for m in HASHTAG_RE.finditer(text)]


def extract_mentions(text: str) -> list[str]:
    """Return normalized @mentions, lowercase, no '@'."""
    if not text:
        return []
    return [m.group(1).lower() for m in MENTION_RE.finditer(text)]


# ---- Post normalization -----------------------------------------------------

def _post_views(p: dict[str, Any]) -> int:
    """Unified view count accessor (TikTok playCount / IG view_count)."""
    return p.get("play_count") or p.get("view_count") or p.get("views") or 0


def _post_likes(p: dict[str, Any]) -> int:
    return p.get("like_count") or p.get("likes") or 0


def _post_comments(p: dict[str, Any]) -> int:
    return p.get("comment_count") or p.get("comments") or 0


def _post_shares(p: dict[str, Any]) -> int:
    return p.get("share_count") or p.get("shares") or 0


def _post_saves(p: dict[str, Any]) -> int:
    return p.get("save_count") or p.get("saves") or 0


def _post_caption(p: dict[str, Any]) -> str:
    return p.get("desc") or p.get("caption") or ""


def _post_timestamp(p: dict[str, Any]) -> int:
    """Unix epoch seconds. 0 if unknown."""
    ts = p.get("create_time") or p.get("taken_at_timestamp") or p.get("taken_at")
    return int(ts) if ts else 0


def _post_id(p: dict[str, Any]) -> str:
    return str(p.get("id") or p.get("pk") or "")


def _post_url(p: dict[str, Any], platform: str) -> str:
    """Best-effort URL for the post (shortcode preferred)."""
    sc = p.get("shortcode") or p.get("code")
    if platform == "instagram" and sc:
        return f"https://www.instagram.com/p/{sc}/"
    pid = _post_id(p)
    if platform == "tiktok" and pid:
        return f"https://www.tiktok.com/@_/video/{pid}/"
    return ""


# ---- Date helpers -----------------------------------------------------------

def _ts_to_date(ts: int) -> str:
    if not ts:
        return ""
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")


def _ts_to_month(ts: int) -> str:
    if not ts:
        return ""
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m")


def _ts_to_year(ts: int) -> int:
    if not ts:
        return 0
    return datetime.fromtimestamp(ts, tz=timezone.utc).year


# ---- Aggregations -----------------------------------------------------------

def aggregate_tier_dist(posts: list[dict], platform: str) -> list[dict]:
    """Bucket posts by view count.

    TikTok threshold (much higher): 100K/10K/1K/100/<100
    IG threshold: 10K/1K/100/10/<10
    """
    if platform == "tiktok":
        buckets = [
            ("Viral (≥100.000)", 100_000, float("inf")),
            ("Tinggi (≥10.000)",  10_000, 100_000),
            ("Bagus (≥1.000)",     1_000,  10_000),
            ("Rata-rata (≥100)",     100,   1_000),
            ("Rendah (<100)",          0,     100),
        ]
    else:
        buckets = [
            ("Viral (≥10.000)",  10_000, float("inf")),
            ("Tinggi (≥1.000)",   1_000,  10_000),
            ("Bagus (≥100)",        100,   1_000),
            ("Rata-rata (≥10)",      10,     100),
            ("Rendah (<10)",          0,      10),
        ]
    counts = [0] * len(buckets)
    total = 0
    max_count = 0
    for p in posts:
        v = _post_views(p)
        total += 1
        for i, (_label, lo, hi) in enumerate(buckets):
            if lo <= v < hi:
                counts[i] += 1
                if counts[i] > max_count:
                    max_count = counts[i]
                break
    out: list[dict] = []
    for i, (label, _, _) in enumerate(buckets):
        c = counts[i]
        pct = (c / total * 100) if total else 0.0
        # Width is a visualization hint: scaled to the largest bucket.
        width = (c / max_count * 100) if max_count else 0
        out.append({
            "label": label,
            "width": round(width, 1),
            "count": str(c),
            "pct": f"{pct:.1f}%",
        })
    return out


def aggregate_hashtags(posts: list[dict], top: int = 10) -> list[dict]:
    """Top hashtags with count, pct, avgViews."""
    counter: Counter[str] = Counter()
    views_by_tag: dict[str, list[int]] = defaultdict(list)
    for p in posts:
        cap = _post_caption(p)
        for t in extract_hashtags(cap):
            counter[t] += 1
            views_by_tag[t].append(_post_views(p))
    total = sum(counter.values()) or 1
    out: list[dict] = []
    for tag, c in counter.most_common(top):
        vlist = views_by_tag[tag]
        avg_v = sum(vlist) / len(vlist) if vlist else 0
        out.append({
            "tag": f"#{tag}",
            "count": c,
            "pct": f"{(c / total * 100):.1f}%",
            "avgViews": _fmt_short(avg_v),
        })
    return out


def aggregate_mentions(posts: list[dict], top: int = 10) -> list[dict]:
    counter: Counter[str] = Counter()
    for p in posts:
        for m in extract_mentions(_post_caption(p)):
            counter[m] += 1
    return [{"handle": f"@{h}", "count": c} for h, c in counter.most_common(top)]


def aggregate_daily(posts: list[dict]) -> list[dict]:
    """Group by date (UTC). Sorted ascending by date."""
    by_date: dict[str, dict] = defaultdict(lambda: {"views": 0, "likes": 0, "posts": 0, "comments": 0})
    for p in posts:
        d = _ts_to_date(_post_timestamp(p))
        if not d:
            continue
        by_date[d]["views"] += _post_views(p)
        by_date[d]["likes"] += _post_likes(p)
        by_date[d]["comments"] += _post_comments(p)
        by_date[d]["posts"] += 1
    return [
        {"day": d, **vals}
        for d, vals in sorted(by_date.items())
    ]


def aggregate_monthly(posts: list[dict]) -> list[dict]:
    by_month: dict[str, dict] = defaultdict(lambda: {"posts": 0, "views": 0, "likes": 0, "comments": 0})
    for p in posts:
        m = _ts_to_month(_post_timestamp(p))
        if not m:
            continue
        by_month[m]["posts"] += 1
        by_month[m]["views"] += _post_views(p)
        by_month[m]["likes"] += _post_likes(p)
        by_month[m]["comments"] += _post_comments(p)
    out: list[dict] = []
    for m, vals in sorted(by_month.items()):
        posts_n = vals["posts"]
        out.append({
            "month": m,
            "posts": posts_n,
            "views": vals["views"],
            "likes": vals["likes"],
            "comments": vals["comments"],
            "avg": (vals["views"] // posts_n) if posts_n else 0,
        })
    return out


def aggregate_yearly(posts: list[dict]) -> list[dict]:
    by_year: dict[int, dict] = defaultdict(lambda: {
        "posts": 0, "views": 0, "likes": 0, "comments": 0,
        "best_views": 0, "best_caption": "", "best_date": "",
        "best_month_views": 0, "best_month": "",
    })
    by_year_month: dict[tuple[int, str], int] = defaultdict(int)
    for p in posts:
        y = _ts_to_year(_post_timestamp(p))
        if not y:
            continue
        v = _post_views(p)
        m = _ts_to_month(_post_timestamp(p))
        by_year[y]["posts"] += 1
        by_year[y]["views"] += v
        by_year[y]["likes"] += _post_likes(p)
        by_year[y]["comments"] += _post_comments(p)
        if v > by_year[y]["best_views"]:
            by_year[y]["best_views"] = v
            by_year[y]["best_caption"] = _post_caption(p)
            by_year[y]["best_date"] = _ts_to_date(_post_timestamp(p))
        by_year_month[(y, m)] += v
    # Find best month per year
    year_best_month: dict[int, str] = {}
    for (y, m), total in by_year_month.items():
        if total > by_year[y]["best_month_views"]:
            by_year[y]["best_month_views"] = total
            year_best_month[y] = m
    out: list[dict] = []
    for y in sorted(by_year):
        d = by_year[y]
        posts_n = d["posts"]
        out.append({
            "year": str(y),
            "posts": posts_n,
            "views": d["views"],
            "likes": d["likes"],
            "comments": d["comments"],
            "avgViews": (d["views"] // posts_n) if posts_n else 0,
            "bestMonth": year_best_month.get(y, ""),
            "topPost": {
                "views": d["best_views"],
                "likes": d["likes"],  # overall (placeholder, not best post)
                "caption": d["best_caption"],
                "date": d["best_date"],
            } if d["best_caption"] else None,
        })
    return out


def aggregate_duration(posts: list[dict], platform: str) -> list[dict]:
    """Group by duration bucket (IG only meaningful)."""
    if platform != "instagram":
        return []
    buckets = [
        ("0-15s",   0,  15),
        ("15-30s", 15,  30),
        ("30-60s", 30,  60),
        ("1-3m",   60, 180),
        ("3m+",   180, float("inf")),
    ]
    # IG feed doesn't give duration; try video_duration field
    counts = [0] * len(buckets)
    eng: list[list[int]] = [[] for _ in buckets]
    for p in posts:
        d = p.get("video_duration") or 0
        # Fallback: skip if no duration info
        if not d:
            continue
        for i, (_label, lo, hi) in enumerate(buckets):
            if lo <= d < hi:
                counts[i] += 1
                eng[i].append(_post_likes(p) + _post_comments(p))
                break
    out: list[dict] = []
    for i, (label, _, _) in enumerate(buckets):
        c = counts[i]
        avg_er = (sum(eng[i]) / len(eng[i])) if eng[i] else 0
        out.append({
            "range": label,
            "posts": c,
            "views": 0,  # IG feed doesn't give post views
            "er": round(avg_er, 1),
        })
    return out


# ---- Top-N by metric --------------------------------------------------------

def top_by_metric(posts: list[dict], metric: str, n: int = 5, platform: str = "instagram") -> list[dict]:
    """Return top N posts sorted by `metric` desc.

    metric: views | likes | comments
    """
    getter = {
        "views": _post_views,
        "likes": _post_likes,
        "comments": _post_comments,
    }.get(metric, _post_views)
    sorted_posts = sorted(posts, key=getter, reverse=True)
    out: list[dict] = []
    for i, p in enumerate(sorted_posts[:n], start=1):
        views = _post_views(p)
        likes = _post_likes(p)
        comments = _post_comments(p)
        shares = _post_shares(p)
        # ER = (likes + comments) / views * 100 (views=0 → 0)
        er = ((likes + comments) / views * 100) if views else 0.0
        cap = _post_caption(p)
        out.append({
            "rank": str(i),
            "views": _fmt_short(views),
            "likes": _fmt_short(likes),
            "comments": _fmt_short(comments),
            "shares": _fmt_short(shares),
            "er": f"{er:.2f}%",
            "date": _ts_to_date(_post_timestamp(p)),
            "caption": cap[:120],
            "_url": _post_url(p, platform),
            "_id": _post_id(p),
        })
    return out


# ---- KPIs -------------------------------------------------------------------

def aggregate_kpis(posts: list[dict], profile: dict, platform: str) -> list[dict]:
    """12-KPI block matching the V8 schema."""
    followers = (
        profile.get("follower_count")  # IG
        or (profile.get("stats") or {}).get("followerCount")  # TikTok
        or 0
    )
    following = (
        profile.get("following_count")
        or (profile.get("stats") or {}).get("followingCount")
        or 0
    )
    total_posts = (
        profile.get("media_count")
        or (profile.get("stats") or {}).get("videoCount")
        or 0
    )
    total_views = sum(_post_views(p) for p in posts)
    total_likes = sum(_post_likes(p) for p in posts)
    total_comments = sum(_post_comments(p) for p in posts)
    total_shares = sum(_post_shares(p) for p in posts)
    total_saves = sum(_post_saves(p) for p in posts)
    n = len(posts)
    avg_views = (total_views // n) if n else 0
    avg_likes = (total_likes / n) if n else 0
    avg_comments = (total_comments / n) if n else 0
    er = ((total_likes + total_comments) / total_views * 100) if total_views else 0
    # Viral posts: top tier bucket
    viral_threshold = 100_000 if platform == "tiktok" else 10_000
    viral_count = sum(1 for p in posts if _post_views(p) >= viral_threshold)

    return [
        {"value": _fmt_short(followers),       "label": "Followers"},
        {"value": _fmt_short(following),       "label": "Following"},
        {"value": str(total_posts),            "label": "Total Post"},
        {"value": _fmt_short(total_views),     "label": "Total Tayangan"},
        {"value": _fmt_short(total_likes),     "label": "Total Suka"},
        {"value": _fmt_short(total_comments),  "label": "Total Komentar"},
        {"value": _fmt_short(avg_views),       "label": "Rata-rata Views"},
        {"value": f"{er:.2f}%",                "label": "Engagement Rate"},
        {"value": _fmt_short(avg_likes),       "label": "Rata-rata Suka"},
        {"value": _fmt_short(avg_comments),    "label": "Rata-rata Komentar"},
        {"value": f"{viral_count} ({(viral_count / n * 100) if n else 0:.1f}%)", "label": "Viral Posts"},
        {"value": _fmt_short(total_shares),    "label": "Total Shares"},
    ]


# ---- Helpers ----------------------------------------------------------------

def _fmt_short(n: int | float) -> str:
    """Re-export of format_short to avoid import cycle."""
    from scripts.scrape.normalize import format_short
    return format_short(n)


# ---- Public entrypoint ------------------------------------------------------

def aggregate_account(raw: dict, platform: str) -> dict:
    """Build all aggregations from a raw scraped file.

    `raw` shape: { user|profile: {...}, stats?: {...}, posts: [...], _meta: {...} }
    Returns a dict with: kpis, topByViews, topByLikes, topByComments, tierDist,
                        hashtags, mentions, dailyPerf, monthlyPerf, yearly,
                        duration.
    """
    posts = raw.get("posts") or raw.get("itemList") or []
    # Pick profile: prefer IG's "user" or TikTok's "user" (same key for both)
    profile = raw.get("user") or raw.get("profile") or {}

    return {
        "kpis": aggregate_kpis(posts, profile, platform),
        "topByViews": top_by_metric(posts, "views", n=5, platform=platform),
        "topByLikes": top_by_metric(posts, "likes", n=5, platform=platform),
        "topByComments": top_by_metric(posts, "comments", n=5, platform=platform),
        "tierDist": aggregate_tier_dist(posts, platform),
        "hashtags": aggregate_hashtags(posts, top=10),
        "mentions": aggregate_mentions(posts, top=10),
        "dailyPerf": aggregate_daily(posts),
        "monthlyPerf": aggregate_monthly(posts),
        "yearly": aggregate_yearly(posts),
        "duration": aggregate_duration(posts, platform),
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
    from scripts.scrape.config import RAW_DIR

    # Quick smoke test: aggregate all raw files
    for f in sorted(RAW_DIR.glob("*.json")):
        try:
            raw = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  {f.name}: parse fail ({e})")
            continue
        if "_error" in raw:
            print(f"  {f.name}: skip (error)")
            continue
        platform = "tiktok" if "tt-" in f.stem or "-tt" in f.stem else "instagram"
        agg = aggregate_account(raw, platform)
        n_posts = len(raw.get("posts") or raw.get("itemList") or [])
        print(f"  {f.name}: {n_posts} posts → {len(agg['topByViews'])} top, {len(agg['hashtags'])} tags, {len(agg['yearly'])} yrs")
