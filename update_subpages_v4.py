#!/usr/bin/env python3
"""TITAN PRO · V4 sub-page upgrade
- Apply TikTok palette to topbar brand title
- Swap titan-orb-sm logo for new titan-bot-sm (3D robot)
- Add `topbar-bot` class so the bot floats/eyes-track
- Rename "TITAN PRO" in topbar to "TITAN PRO AI"
- Topbar alignment harmonization (36x40 mark, gap, flex, glow)
"""
import re
import sys
from pathlib import Path

# Force UTF-8 stdout so the ✓ / ✗ glyphs print cleanly on Windows cp1252 consoles.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

REPO = Path(r"C:\Users\Syahfalah\nickasad10000-sys.github.io")
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

# 1. Topbar harmonization block — already partially exists on sub-pages.
#    We add / overwrite to guarantee the V4 styles.
TOPBAR_HARMONIZE = """
/* V4: Topbar harmonization */
.topbar { gap: var(--s-3); }
.brand { display: inline-flex; align-items: center; gap: 12px; flex-shrink: 0; }
.brand-mark {
  width: 36px; height: 40px;
  flex: 0 0 36px;
  display: block;
  filter: drop-shadow(0 2px 10px rgba(37, 244, 238, 0.45))
          drop-shadow(0 1px 4px rgba(245, 193, 75, 0.35));
  transition: transform var(--t-med) var(--ease-spring);
}
.brand:hover .brand-mark { transform: rotate(-8deg) scale(1.05); }
.brand-text .name {
  font-weight: 800 !important;
  background: linear-gradient(92deg,
                #25f4ee 0%, #6df8f3 14%, #ffffff 38%,
                #ffe9ed 56%, #fe2c55 78%, #f5c14b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 8px rgba(37, 244, 238, 0.18));
}
.brand-text .tag { color: var(--text-dim); }
"""


def upgrade_brand_markup(text: str) -> str:
    """Update topbar brand block to use new bot sprite + 'TITAN PRO AI' label."""
    # 1. Swap the mark icon to the new bot (handles both old orb and old mark)
    text = re.sub(
        r'(<svg class="brand-mark")(\s+aria-hidden="true"\s*>\s*<use\s+href="#)titan-(?:mark|orb)(-sm"\s*/>\s*</svg>)',
        r'\1 topbar-bot\2titan-bot\3',
        text,
        count=1,
    )
    # 2. Rename "TITAN PRO" text inside the brand to "TITAN PRO AI"
    #    Only the first match (the brand), not other occurrences.
    text = re.sub(
        r'(<span class="brand-text">\s*<span class="name">)TITAN PRO(</span>)',
        r'\1TITAN PRO AI\2',
        text,
        count=1,
    )
    return text


def inject_topbar_harmonize(text: str) -> str:
    """Insert the topbar harmonization block right before the first :root or after </style> head close? Use marker."""
    if "V4: Topbar harmonization" in text:
        return text
    # Inject right before </style> so it overrides earlier sub-page-specific rules
    return text.replace("</style>", TOPBAR_HARMONIZE + "\n</style>", 1)


def ensure_mascot_script(text: str) -> str:
    """Ensure <script src='./titan-mascot.js' defer> is present (V3 already did this on most pages)."""
    if "titan-mascot.js" in text:
        return text
    return text.replace("</head>", '<script src="./titan-mascot.js" defer></script>\n</head>', 1)


def update_subpage(relpath: str) -> None:
    path = REPO / relpath
    if not path.exists():
        print(f"  ✗ MISSING: {relpath}")
        return
    text = path.read_text(encoding="utf-8")
    orig = len(text)
    text = ensure_mascot_script(text)
    text = inject_topbar_harmonize(text)
    text = upgrade_brand_markup(text)
    path.write_text(text, encoding="utf-8")
    print(f"  ✓ {relpath}: +{len(text) - orig} bytes (now {len(text):,})")


def main() -> None:
    print("=" * 60)
    print("TITAN PRO · V4 sub-page upgrade")
    print("=" * 60)
    for p in PAGES:
        update_subpage(p)
    print("=" * 60)


if __name__ == "__main__":
    main()
