"""Inject LLM insights into accounts-full.json for 4 IG accounts.

Reads scripts/scrape/output/llm-insights.json and applies the
insight/benchmark/growth blocks to each IG key in accounts-full.json.
"""
from __future__ import annotations
import json
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "accounts-full.json"
INSIGHTS = ROOT / "scripts" / "scrape" / "output" / "llm-insights.json"

KEY_TO_SLUG = {
    "ardiantanah-instagram":       "ardiantanah-ig",
    "majangmejeng-instagram":      "majangmejeng-ig",
    "nisyanandaa-instagram":       "nisyanandaa-ig",
    "syahfalahproperti-instagram": "syahfalahproperti-ig",
}


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    insights = json.loads(INSIGHTS.read_text(encoding="utf-8"))

    date = "2026-07-12"
    bak = DATA.with_suffix(f".bak-llm-inject-{date}.json")
    shutil.copy(DATA, bak)
    print(f"backup: {bak}")

    applied = 0
    for key, slug in KEY_TO_SLUG.items():
        ins = insights.get(slug)
        if not ins:
            print(f"SKIP {key}: no insight in llm-insights.json")
            continue
        acc = data[key]
        # Replace insight, benchmark, growth with LLM output
        acc["insight"] = {
            "kekuatan":     ins.get("kekuatan", [])[:3],
            "kelemahan":    ins.get("kelemahan", [])[:3],
            "rekomendasi":  ins.get("rekomendasi", [])[:5],
            "analisis":     ins.get("analisis", ""),
            "posisi":       ins.get("posisi", ""),
        }
        acc["benchmark"] = {
            "industri": ins.get("benchmark", {}).get("industri", ""),
            "catatan":  ins.get("benchmark", {}).get("catatan", ""),
        }
        acc["growth"] = {
            "target":  ins.get("growth", {}).get("target", ""),
            "langkah": ins.get("growth", {}).get("langkah", [])[:3],
        }
        applied += 1
        print(f"  ✓ {key}: injected insight ({len(acc['insight']['kekuatan'])} kekuatan, {len(acc['insight']['rekomendasi'])} rekomendasi)")

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\napplied: {applied}/{len(KEY_TO_SLUG)}")
    print("written")


if __name__ == "__main__":
    main()
