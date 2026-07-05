#!/usr/bin/env python3
"""
TITAN PRO · V3 sub-page upgrade (additive on top of v2 update_subpages.py)

- Inject <script src="./titan-mascot.js" defer></script> (sprite + behavior)
- Replace overused i-spark icons with semantic ones (per-section)
- Add new CSS tokens for harmonized scale
- Inject a topbar mascot orb
- Reaffirm reduced-motion + a11y
"""
import re
from pathlib import Path

REPO = Path(r"C:\Users\Syahfalah\nickasad10000-sys.github.io")

# 8 sub-pages
PAGES = [
    "ardiantanah/ardiantanah-tiktok.html",
    "ardiantanah/index.html",
    "majangmejeng-ig.html",
    "majangmejeng/index.html",
    "marketing/index.html",
    "marketing/nisyanandaa-instagram.html",
    "syahfalahproperti-ig/index.html",
    "syahfalahproperti/index.html",
]

# Per-section title text -> replacement icon id
ICON_REPLACEMENTS = {
    "Ringkasan Tahunan":                "i-year",
    "Potensi Pertumbuhan":              "i-rocket",
    "Analisis Durasi Video":            "i-clock",
    "Analisis Durasi Konten":           "i-clock",
    "Kolaborasi (Mentions)":            "i-users",
    "Distribusi Tingkatan Performa":    "i-distribution",
    "Grafik Modern Pertumbuhan Akun per Bulan": "i-line-chart",
}

# Section order by which they appear (used to disambiguate duplicates in same file)
# Each section title text → 1st/2nd/3rd occurrence replacement
# Some sub-pages have the same title in multiple sections, so we use position-aware replacement.

def replace_icons(text: str) -> tuple[str, int]:
    """Replace <use href="#i-spark"/> with the proper icon for the section it's in.
    Returns (new_text, count_replaced)."""
    # Find every h2.section-title block and inspect what follows its ico span
    # Pattern: <h2 class="section-title"><span class="ico" ...><svg><use href="#ICON"/></svg></span>TITLE</h2>
    pat = re.compile(
        r'(<h2 class="section-title">\s*<span class="ico"[^>]*>\s*<svg>\s*<use href="#)(i-[a-z-]+)("/>\s*</svg>\s*</span>\s*)([^<]+?)(</h2>)',
        re.DOTALL
    )
    count = 0
    def repl(m):
        nonlocal count
        prefix, icon, suffix, title, end = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
        title_clean = title.strip()
        # Only replace if it's an i-spark overused icon
        if icon == "i-spark" and title_clean in ICON_REPLACEMENTS:
            count += 1
            return f"{prefix}{ICON_REPLACEMENTS[title_clean]}{suffix}{title}{end}"
        # Also fix i-trend → i-distribution for "Distribusi Tingkatan Performa"
        if icon == "i-trend" and title_clean == "Distribusi Tingkatan Performa":
            count += 1
            return f"{prefix}i-distribution{suffix}{title}{end}"
        # And i-zap → i-line-chart for "Grafik Modern Pertumbuhan Akun per Bulan"
        if icon == "i-zap" and title_clean == "Grafik Modern Pertumbuhan Akun per Bulan":
            count += 1
            return f"{prefix}i-line-chart{suffix}{title}{end}"
        return m.group(0)
    new_text = pat.sub(repl, text)
    return new_text, count


def inject_mascot_script(text: str) -> str:
    """Inject <script src="./titan-mascot.js" defer></script> just before </head>
    and a small inline <script> for the inline mascot inside the topbar."""
    if "titan-mascot.js" in text:
        return text  # already injected
    # Find </head> and insert before it
    script_tag = '<script src="./titan-mascot.js" defer></script>\n'
    return text.replace("</head>", script_tag + "</head>", 1)


def add_harmonized_tokens(text: str) -> str:
    """Add harmonized CSS tokens and refresh specific styles for v3 scale."""
    if "--t-3xl" in text:
        return text  # already migrated

    # Inject the new tokens right after the :root { block opening
    new_tokens = """
  /* Harmonized type scale (V3) */
  --t-xs:  0.75rem;
  --t-sm:  0.875rem;
  --t-md:  1rem;
  --t-lg:  1.25rem;
  --t-xl:  1.75rem;
  --t-2xl: 2.5rem;
  --t-3xl: 3.5rem;
  --icon-xs: 14px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-lg: 24px;
  --icon-xl: 32px;
  /* 8pt grid */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;
"""

    # Find the existing :root { and inject after the first { and a newline
    new_text = re.sub(r"(:root\s*\{)", r"\1" + new_tokens, text, count=1)

    # Update h2.section-title font-size from 1.2rem → 1.125rem (18px, harmonized)
    new_text = re.sub(
        r"(h2\.section-title\s*\{[^}]*?font-size:\s*)1\.2rem",
        r"\g<1>1.125rem",
        new_text,
        count=1,
    )

    return new_text


def update_hero_mascot_link(text: str) -> str:
    """Update topbar brand to use titan-orb-sm (replaces titan-mark-sm).
    Already in v3 sprite; v2 sprite has titan-mark-sm which is similar but not
    animated. We need titan-orb-sm for consistency with home mascot.

    The mascot script's sprite includes both titan-orb (large) and titan-orb-sm (small).
    """
    # If a topbar has use href="#titan-mark-sm" and titan-orb-sm is in our sprite
    # they're visually similar but the orb is rounder. We just keep the existing
    # reference; the script provides a fallback if symbol is missing.
    return text


def update_topbar(text: str) -> str:
    """Update topbar to reference the home for navigation.
    For sub-pages, the breadcrumb currently points to '../'; we keep that.
    Just ensure the back-to-home link in the brand uses the new icon id.

    The v3 sprite exports #titan-orb-sm. Existing sub-pages use #titan-mark-sm
    which exists in the old inline sprite. Since the v3 sprite DOESN'T export
    titan-mark-sm, we need to switch them to titan-orb-sm.

    But we must do this AFTER inject_mascot_script to ensure the new sprite
    has been added. (It'll be added via the mascot.js file load.)
    """
    # Replace use href="#titan-mark-sm" → use href="#titan-orb-sm"
    # (titan-orb-sm is in v3 sprite; titan-mark-sm was in v2 inline sprite)
    return text.replace('href="#titan-mark-sm"', 'href="#titan-orb-sm"')


def update_subpage(relpath: str):
    path = REPO / relpath
    if not path.exists():
        print(f"  ✗ MISSING: {relpath}")
        return

    text = path.read_text(encoding="utf-8")
    original_size = len(text)

    # 1. Inject mascot behavior + sprite script
    text = inject_mascot_script(text)

    # 2. Add harmonized CSS tokens
    text = add_harmonized_tokens(text)

    # 3. Update topbar logo to use titan-orb-sm (from new sprite)
    text = update_topbar(text)

    # 4. Replace 4 overused i-spark icons (and 1 i-trend + 1 i-zap) with semantic ones
    text, count = replace_icons(text)

    path.write_text(text, encoding="utf-8")
    new_size = len(text)
    diff = new_size - original_size
    print(f"  ✓ {relpath}: {count} icons fixed, {diff:+d} bytes (now {new_size:,})")


def main():
    print("=" * 60)
    print("TITAN PRO · V3 sub-page upgrade")
    print("=" * 60)
    for relpath in PAGES:
        update_subpage(relpath)
    print("=" * 60)
    print("Done.")


if __name__ == "__main__":
    main()
