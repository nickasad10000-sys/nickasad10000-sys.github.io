#!/usr/bin/env python3
"""
Apply unified TITAN PRO design system to 8 sub-page HTML files.
- Replaces the <style> block with the new shared design system (gold logo, bento, etc.)
- Replaces the <nav class="topbar"> with the new topbar (gold mark, R-shortcut, refresh)
- Replaces <h1><span class="emoji-prefix">X</span> with the new hero h1
- Strips emoji prefixes from <span class="ico">X</span> in section titles and replaces with SVG icons
- Preserves all body content (KPI data, tables, charts)
"""
import re
from pathlib import Path

REPO = Path(r"C:\Users\Syahfalah\nickasad10000-sys.github.io")

# Map of file path -> (platform, handle, account_slug)
PAGES = [
    ("ardiantanah/ardiantanah-tiktok.html", "tiktok", "ardian.tanah", "ardiantanah-tiktok"),
    ("ardiantanah/index.html", "instagram", "ardiantanah", "ardiantanah"),
    ("majangmejeng-ig.html", "instagram", "majangmejeng_", "majangmejeng-ig"),
    ("majangmejeng/index.html", "tiktok", "majangmejeng_", "majangmejeng"),
    ("marketing/index.html", "tiktok", "itsnisyananda", "itsnisyananda-tiktok"),
    ("marketing/nisyanandaa-instagram.html", "instagram", "nisyanandaa", "nisyanandaa-ig"),
    ("syahfalahproperti-ig/index.html", "instagram", "syahfalahproperti", "syahfalahproperti-ig"),
    ("syahfalahproperti/index.html", "tiktok", "syahfalahproperti", "syahfalahproperti"),
]

PLATFORM_LABEL = {"tiktok": "TikTok", "instagram": "Instagram"}
PLATFORM_COLOR = {"tiktok": "var(--tt-red-soft)", "instagram": "#ff8d9c"}

# Map of section-title emoji -> SVG icon name
# These are the emojis that appear in <span class="ico">EMOJI</span> inside <h2 class="section-title">
EMOJI_TO_ICON = {
    "👤": "i-user",
    "🏆": "i-trophy",
    "❤️": "i-heart",
    "💬": "i-comment",
    "🔁": "i-share",
    "📈": "i-trend",
    "📉": "i-trend-down",
    "📊": "i-chart",
    "🎯": "i-target",
    "🔥": "i-flame",
    "⏰": "i-clock",
    "📅": "i-calendar",
    "🌟": "i-spark",
    "📌": "i-pin",
    "🏷️": "i-tag",
    "💡": "i-bulb",
    "📋": "i-list",
    "🔍": "i-search",
    "📹": "i-video",
    "📷": "i-image",
    "⚡": "i-zap",
    "📍": "i-pin",
    "🌐": "i-globe",
    "💰": "i-coin",
    "📞": "i-phone",
    "✉️": "i-mail",
    "✅": "i-check-circle",
    "🎬": "i-video",
    "📑": "i-doc",
    "📝": "i-doc",
    "🎨": "i-spark",
    "🏠": "i-home",
    "📂": "i-folder",
    "🌍": "i-globe",
    "⭐": "i-star",
    "🎁": "i-gift",
    "🔔": "i-bell",
    "💎": "i-spark",
    "🚀": "i-zap",
    "👥": "i-user",
    "🤝": "i-handshake",
    "📈": "i-trend",
    "📊": "i-chart",
    "🔬": "i-search",
    "🎪": "i-spark",
}

# =====================================================================
# NEW DESIGN SYSTEM (shared across all 9 files)
# =====================================================================

NEW_STYLE = r"""<style>
/* =====================================================================
   TITAN PRO · Design System v2 (Gold mark edition)
   Asymmetrical bento · ethereal glass · gold + dual-platform accents
   ===================================================================== */

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  /* Surfaces */
  --bg-deep:        #06070b;
  --bg-base:        #0a0b10;
  --bg-elevated:    #11131a;
  --bg-card:        #14171f;
  --bg-card-hover:  #181b24;
  --surface-glass:  rgba(20, 23, 31, 0.72);
  --surface-line:   rgba(255, 255, 255, 0.06);
  --surface-line-2: rgba(255, 255, 255, 0.10);
  --surface-line-3: rgba(255, 255, 255, 0.14);

  /* Text */
  --text:        #f4f6fb;
  --text-strong: #ffffff;
  --text-muted:  #8a90a4;
  --text-dim:    #5a6075;
  --text-faint:  #3d4252;

  /* Gold (signature mark) */
  --gold-1:      #fff4c2;
  --gold-2:      #f5c14b;
  --gold-3:      #d4a017;
  --gold-4:      #8b6914;
  --gold-gradient: linear-gradient(135deg, #fff4c2 0%, #f5c14b 35%, #d4a017 70%, #8b6914 100%);
  --gold-gradient-bright: linear-gradient(135deg, #fff8d4 0%, #ffd866 40%, #f5c14b 75%, #b8861e 100%);
  --gold-glow:   rgba(245, 193, 75, 0.35);
  --gold-bg:     rgba(245, 193, 75, 0.08);
  --gold-line:   rgba(245, 193, 75, 0.28);

  /* TikTok (red/cyan) */
  --tt-red:        #fe2c55;
  --tt-red-soft:   #ff5d7c;
  --tt-cyan:       #25f4ee;
  --tt-cyan-soft:  #6df8f3;
  --tt-gradient:   linear-gradient(135deg, #25f4ee 0%, #ffffff 50%, #fe2c55 100%);
  --tt-glow:       rgba(254, 44, 85, 0.40);

  /* Instagram (purple/pink/orange) */
  --ig-purple:   #833ab4;
  --ig-pink:     #fd1d1d;
  --ig-orange:   #fcb045;
  --ig-gradient: linear-gradient(135deg, #fcb045 0%, #fd1d1d 45%, #833ab4 100%);
  --ig-glow:     rgba(253, 29, 29, 0.35);

  /* Semantic */
  --pos:        #00d4a4;
  --pos-soft:   #4ce0bd;
  --pos-bg:     rgba(0, 212, 164, 0.10);
  --pos-line:   rgba(0, 212, 164, 0.32);
  --neg:        #ff5470;
  --neg-bg:     rgba(255, 84, 112, 0.10);
  --warn:       #ffb84d;
  --warn-bg:    rgba(255, 184, 77, 0.10);
  --premium:    #7c5cff;
  --premium-bg: rgba(124, 92, 255, 0.10);

  /* Geometry */
  --radius-xs: 10px;
  --radius-sm: 14px;
  --radius:    18px;
  --radius-lg: 26px;
  --radius-xl: 36px;
  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-fluid:   cubic-bezier(0.32, 0.72, 0, 1);
  --t-fast:    150ms var(--ease-out);
  --t-med:     240ms var(--ease-out);
  --t-slow:    420ms var(--ease-out);

  /* Type — Plus Jakarta + Geist Mono (linear-tier) */
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', monospace;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.30);
  --shadow:    0 4px 12px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.40), 0 2px 6px rgba(0,0,0,0.20);
  --shadow-gold: 0 6px 24px rgba(245, 193, 75, 0.18), 0 1px 2px rgba(0,0,0,0.20);
}

html, body {
  background: var(--bg-base);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
  font-size: 15px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  text-rendering: optimizeLegibility;
  font-variant-numeric: tabular-nums;
}

body {
  background:
    radial-gradient(ellipse 80% 50% at 15% 0%, rgba(245, 193, 75, 0.05), transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 20%, rgba(254, 44, 85, 0.05), transparent 50%),
    radial-gradient(ellipse 70% 50% at 50% 100%, rgba(131, 58, 180, 0.05), transparent 50%),
    var(--bg-base);
  min-height: 100vh;
  min-height: 100dvh;
}

a { color: var(--tt-cyan-soft); text-decoration: none; transition: color var(--t-fast); }
a:hover { color: var(--tt-red-soft); }
::selection { background: var(--tt-red); color: var(--text-strong); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 5px; border: 2px solid var(--bg-base); }
::-webkit-scrollbar-thumb:hover { background: var(--surface-line-3); }
:focus-visible { outline: 2px solid var(--gold-2); outline-offset: 3px; border-radius: 4px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* LAYOUT */
.app { max-width: 1240px; margin: 0 auto; padding: 0 24px 80px; }

/* TOP BAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  margin: 0 -24px 24px;
  background: rgba(10, 11, 16, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--surface-line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
}
.brand:hover { color: var(--text-strong); }
.brand-mark {
  width: 32px; height: 32px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 10px var(--gold-glow));
  transition: transform var(--t-med);
}
.brand:hover .brand-mark { transform: rotate(-8deg) scale(1.05); }
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-text .name {
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}
.brand-text .tag {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 500;
  color: var(--text-dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 1px;
}

.topbar-nav { flex: 1; display: flex; gap: 4px; align-items: center; }
.topbar-nav .crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.topbar-nav .crumb a { color: var(--text-muted); }
.topbar-nav .crumb a:hover { color: var(--gold-2); }
.topbar-nav .crumb .sep { color: var(--text-faint); }
.topbar-nav .crumb .here { color: var(--text); }

.topbar-actions { display: flex; align-items: center; gap: 8px; }

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--pos-bg);
  border: 1px solid var(--pos-line);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--pos-soft);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.live-pill .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--pos);
  box-shadow: 0 0 0 0 var(--pos);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 212, 164, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(0, 212, 164, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 212, 164, 0); }
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--surface-line-2);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--t-fast);
  min-height: 44px;
}
.btn-refresh:hover {
  background: var(--bg-card-hover);
  border-color: var(--gold-line);
  color: var(--gold-2);
  transform: translateY(-1px);
}
.btn-refresh:active { transform: translateY(0); }
.btn-refresh .icon { width: 14px; height: 14px; transition: transform var(--t-med); }
.btn-refresh:hover .icon { transform: rotate(-25deg); }
.btn-refresh.is-loading .icon { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* HERO */
.hero {
  position: relative;
  padding: 48px 0 20px;
  text-align: center;
}
.hero .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--surface-line-2);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}
.hero .eyebrow .pip {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--gold-gradient);
  box-shadow: 0 0 10px var(--gold-glow);
}

.hero .profile-mark {
  width: 80px; height: 80px;
  margin: 0 auto 16px;
  filter: drop-shadow(0 8px 32px var(--gold-glow));
}

.hero h1 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2.2rem, 4.5vw + 1rem, 3.4rem);
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 0 0 8px;
  color: var(--text-strong);
}
.hero h1 .platform-prefix {
  font-family: var(--font-mono);
  font-size: 0.35em;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  display: block;
  margin-bottom: 8px;
}
.hero .handle {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-top: 8px;
}
.hero .handle::before { content: "@"; color: var(--text-faint); }

/* HERO meta strip (ER, followers, posts) */
.hero-meta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 1px;
  margin-top: 24px;
  background: var(--surface-line);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.hero-meta .item {
  background: var(--bg-card);
  padding: 12px 22px;
  text-align: left;
  min-width: 120px;
}
.hero-meta .item .l {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.hero-meta .item .v {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}
.hero-meta .item .v.gold { color: var(--gold-2); }
.hero-meta .item .v.pos { color: var(--pos-soft); }

/* KPI GRID (sub-pages) */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  background: var(--surface-line);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius);
  overflow: hidden;
  margin: 24px 0 16px;
  box-shadow: var(--shadow);
}
.kpi {
  position: relative;
  background: var(--bg-card);
  padding: 18px 16px;
  transition: background var(--t-fast);
  cursor: default;
}
.kpi:hover { background: var(--bg-card-hover); }
.kpi::after {
  content: "";
  position: absolute;
  left: 16px; right: 16px; bottom: 0;
  height: 1px;
  background: var(--gold-gradient);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--t-med);
}
.kpi:hover::after { transform: scaleX(1); }
.kpi .value {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.kpi .label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-top: 6px;
}
.kpi.gold .value { color: var(--gold-2); }
.kpi.pos .value { color: var(--pos-soft); }

/* SECTION */
.section { margin: 48px 0; }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
h2.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}
h2.section-title .ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  background: var(--gold-bg);
  border: 1px solid var(--gold-line);
  color: var(--gold-2);
}
h2.section-title .ico svg { width: 16px; height: 16px; }
h2.section-title .meta {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-dim);
  font-weight: 500;
  margin-left: 6px;
}
h3.sub-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin: 20px 0 8px;
}

/* CARD */
.card {
  background: var(--bg-card);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius);
  padding: 22px;
  margin: 14px 0;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.card:hover { border-color: var(--surface-line-2); }

/* TABLE */
.table-wrap { overflow-x: auto; margin: 12px 0; border-radius: var(--radius-sm); border: 1px solid var(--surface-line); background: var(--bg-card); }
table { width: 100%; border-collapse: collapse; font-size: 0.86rem; font-family: var(--font-sans); }
thead th {
  background: var(--bg-elevated);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--surface-line);
  white-space: nowrap;
}
tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--surface-line);
  vertical-align: middle;
  color: var(--text);
}
tbody tr:last-child td { border-bottom: none; }
tbody tr { transition: background var(--t-fast); }
tbody tr:hover { background: var(--surface-glass); }
.num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.caption { max-width: 360px; word-wrap: break-word; font-size: 0.85rem; }
.caption .muted { color: var(--text-muted); font-family: var(--font-mono); font-size: 0.75rem; }

.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--surface-line);
}
.rank-pill.top1 { background: var(--gold-gradient); color: #1a1408; border-color: transparent; }
.rank-pill.top2 { background: linear-gradient(135deg, #e8e8ec, #a0a0a8); color: #1a1a1f; border-color: transparent; }
.rank-pill.top3 { background: linear-gradient(135deg, #cd7f32, #8b5a2b); color: #fff; border-color: transparent; }

/* BUTTONS */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--t-fast);
  border: 1px solid var(--surface-line);
  min-height: 44px;
  cursor: pointer;
}
.btn-platform {
  background: var(--tt-gradient);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px var(--tt-glow);
}
.btn-platform:hover { transform: translateY(-1px); box-shadow: 0 6px 22px var(--tt-glow); color: #fff; }
.btn-platform-2 {
  background: var(--ig-gradient);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 16px var(--ig-glow);
}
.btn-platform-2:hover { transform: translateY(-1px); box-shadow: 0 6px 22px var(--ig-glow); color: #fff; }

/* TAGS */
.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 500;
  margin: 2px 4px 2px 0;
  background: var(--bg-elevated);
  border: 1px solid var(--surface-line);
  color: var(--text);
  font-family: var(--font-mono);
}
.tag-red    { color: var(--tt-red-soft); border-color: rgba(254, 44, 85, 0.3); background: rgba(254, 44, 85, 0.08); }
.tag-cyan   { color: var(--tt-cyan-soft); border-color: rgba(37, 244, 238, 0.3); background: rgba(37, 244, 238, 0.08); }
.tag-gold   { color: var(--gold-2); border-color: var(--gold-line); background: var(--gold-bg); }
.tag-purple { color: #c4a4ff; border-color: rgba(124, 92, 255, 0.3); background: rgba(124, 92, 255, 0.08); }
.tag-green  { color: var(--pos-soft); border-color: var(--pos-line); background: var(--pos-bg); }

/* CALLOUTS */
.callout {
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  border-left: 3px solid;
  background: var(--surface-glass);
  margin: 10px 0;
  font-size: 0.9rem;
}
.callout ul, .callout ol { margin: 6px 0 0 18px; padding: 0; }
.callout li { margin: 4px 0; }
.callout strong { font-weight: 600; color: var(--text); }
.callout-success { border-color: var(--pos); background: var(--pos-bg); }
.callout-warn    { border-color: var(--warn); background: var(--warn-bg); }
.callout-info    { border-color: var(--gold-2); background: var(--gold-bg); }

/* STATUS BADGES */
.status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-sangat-baik, .status-di-atas-rata-rata, .status-baik, .status-top {
  background: var(--pos-bg); color: var(--pos-soft); border: 1px solid var(--pos-line);
}
.status-rata-rata, .status-sedang, .status-cukup {
  background: var(--warn-bg); color: var(--warn); border: 1px solid rgba(255, 184, 77, 0.3);
}
.status-perlu-perbaikan, .status-rendah, .status-kurang {
  background: var(--neg-bg); color: var(--neg); border: 1px solid rgba(255, 84, 112, 0.3);
}

/* MENTION LIST */
.mention-list { display: flex; flex-wrap: wrap; gap: 6px; }
.mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--surface-line);
  font-family: var(--font-mono);
  font-size: 0.76rem;
}
.mention .count { color: var(--text-muted); font-size: 0.7rem; }

/* BAR CHART */
.bar-chart { display: flex; flex-direction: column; gap: 10px; padding: 16px 0; }
.bar-row {
  display: grid;
  grid-template-columns: 130px 1fr 70px;
  gap: 12px;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.bar-row .label { color: var(--text-muted); font-size: 0.78rem; }
.bar-row .count { text-align: right; color: var(--text); font-weight: 600; }
.bar-track {
  height: 10px;
  background: var(--bg-elevated);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}
.bar-fill {
  height: 100%;
  background: var(--gold-gradient);
  border-radius: 5px;
  box-shadow: 0 0 12px var(--gold-glow);
  transition: width 800ms var(--ease-out);
}

/* CHART CARD */
.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin: 12px 0;
  position: relative;
}
.chart-card .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.chart-card .chart-title { font-family: var(--font-sans); font-size: 0.95rem; font-weight: 600; color: var(--text); margin: 0; }
.chart-card .chart-legend { display: flex; flex-wrap: wrap; gap: 12px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); }
.chart-card .chart-legend .item { display: flex; align-items: center; gap: 6px; }
.chart-card .chart-legend .dot { width: 10px; height: 10px; border-radius: 2px; }
.chart-card .chart-legend .value { color: var(--text); font-weight: 600; margin-left: 4px; }
.chart-svg { width: 100%; height: auto; display: block; font-family: var(--font-mono); }
.chart-svg .grid-line { stroke: var(--surface-line); stroke-width: 1; stroke-dasharray: 2 4; }
.chart-svg .axis-label { fill: var(--text-muted); font-size: 10px; }
.chart-svg .axis-line { stroke: var(--surface-line-2); stroke-width: 1; }
.chart-svg .data-line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.chart-svg .data-line-fill { opacity: 0.12; }
.chart-svg .data-point { stroke: var(--bg-card); stroke-width: 2; }
.chart-svg .data-point:hover { r: 6; }
.chart-svg .data-bar { transition: opacity 200ms; }
.chart-svg .data-bar:hover { opacity: 0.85; }
.chart-svg .donut-slice { transition: transform 200ms; transform-origin: center; }
.chart-svg .donut-slice:hover { transform: scale(1.04); }
.chart-svg .donut-center-label { fill: var(--text); font-size: 28px; font-weight: 700; font-family: var(--font-sans); }
.chart-svg .donut-center-sub { fill: var(--text-muted); font-size: 11px; }
.chart-svg .donut-legend { fill: var(--text); font-size: 11px; }
.chart-svg .donut-legend-value { fill: var(--text-muted); font-size: 10px; }

/* FOOTER */
.footer {
  margin-top: 64px;
  padding: 32px 16px;
  border-top: 1px solid var(--surface-line);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.footer a { color: var(--text); }
.footer a:hover { color: var(--gold-2); }
.footer .made-by {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-top: 8px;
}

/* TOAST */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--gold-line);
  border-radius: 999px;
  box-shadow: var(--shadow-lg);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 500;
  z-index: 100;
  transition: transform var(--t-med) var(--ease-spring);
  pointer-events: none;
  max-width: 90vw;
}
.toast.is-visible { transform: translateX(-50%) translateY(0); }
.toast .ico { width: 18px; height: 18px; color: var(--pos-soft); flex-shrink: 0; }
.toast .ico.spin { animation: spin 0.8s linear infinite; }
.toast code { font-family: var(--font-mono); font-size: 0.78rem; color: var(--gold-2); background: var(--gold-bg); padding: 2px 6px; border-radius: 4px; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .app { padding: 0 16px 60px; }
  .topbar { margin: 0 -16px 16px; padding: 10px 16px; flex-wrap: wrap; gap: 8px; }
  .brand-text .tag { display: none; }
  .topbar-nav { order: 3; flex-basis: 100%; font-size: 0.72rem; }
  .topbar-actions { gap: 6px; }
  .btn-refresh span:not(.icon) { display: none; }
  .btn-refresh { width: 44px; padding: 0; }
  .live-pill { display: none; }
  .hero { padding: 32px 0 16px; }
  .hero h1 { font-size: 1.6rem; }
  .hero-meta { gap: 1px; }
  .hero-meta .item { padding: 10px 14px; min-width: 100px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 1px; }
  .kpi { padding: 12px 10px; }
  .kpi .value { font-size: 1.05rem; }
  .kpi .label { font-size: 0.6rem; }
  .table-wrap { margin-left: -16px; margin-right: -16px; border-radius: 0; border-left: none; border-right: none; }
  table { font-size: 0.74rem; min-width: 540px; }
  thead th, tbody td { padding: 8px 6px; }
  .caption { max-width: 160px; font-size: 0.74rem; }
  .bar-row { grid-template-columns: 80px 1fr 50px; font-size: 0.78rem; }
  .card { padding: 14px; }
  .btn { min-height: 44px; padding: 8px 14px; font-size: 0.85rem; }
  .section { margin: 32px 0; }
  .section-head { margin-bottom: 14px; }
  .top-table thead th:nth-child(4),
  .top-table tbody td:nth-child(4),
  .top-table thead th:nth-child(5),
  .top-table tbody td:nth-child(5),
  .top-table thead th:nth-child(6),
  .top-table tbody td:nth-child(6) { display: none; }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .hero h1 { font-size: 1.4rem; }
}
</style>"""

# =====================================================================
# ICON SYMBOLS (TITAN mark in gold + 20+ inline icons)
# =====================================================================

NEW_SVG_SYMBOLS = r"""<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="tpGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff4c2"/>
      <stop offset="35%" stop-color="#f5c14b"/>
      <stop offset="70%" stop-color="#d4a017"/>
      <stop offset="100%" stop-color="#8b6914"/>
    </linearGradient>
    <linearGradient id="tpGoldShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff8d4"/>
      <stop offset="40%" stop-color="#ffd866"/>
      <stop offset="75%" stop-color="#f5c14b"/>
      <stop offset="100%" stop-color="#b8861e"/>
    </linearGradient>
    <radialGradient id="tpGoldShineRadial" cx="0.3" cy="0.25" r="0.7">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="50%" stop-color="#f5c14b" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tpTT" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#25f4ee"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fe2c55"/>
    </linearGradient>
  </defs>

  <!-- TITAN PRO master mark (gold, with inner shine) -->
  <symbol id="titan-mark" viewBox="0 0 64 64">
    <!-- Hex shield base -->
    <path d="M32 2 L58 14 V36 C58 49 47 58 32 62 C17 58 6 49 6 36 V14 Z" fill="url(#tpGold)"/>
    <!-- Inner shine overlay -->
    <path d="M32 2 L58 14 V36 C58 49 47 58 32 62 C17 58 6 49 6 36 V14 Z" fill="url(#tpGoldShineRadial)"/>
    <!-- Inner stroke -->
    <path d="M32 10 L51 19 V35 C51 45 43 51 32 54 C21 51 13 45 13 35 V19 Z" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="2 3"/>
    <!-- Data bars (ascending) -->
    <rect x="20" y="38" width="4" height="10" rx="1" fill="#1a1408" opacity="0.45"/>
    <rect x="27" y="33" width="4" height="15" rx="1" fill="#1a1408" opacity="0.55"/>
    <rect x="34" y="28" width="4" height="20" rx="1" fill="#1a1408" opacity="0.65"/>
    <rect x="41" y="22" width="4" height="26" rx="1" fill="#1a1408" opacity="0.80"/>
    <!-- T monogram (engraved look) -->
    <path d="M22 14 H42 M32 14 V26" stroke="#1a1408" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M22 14 H42 M32 14 V26" stroke="rgba(255,244,194,0.35)" stroke-width="0.8" stroke-linecap="round" fill="none" transform="translate(0, -0.6)"/>
  </symbol>

  <!-- Small mark (solid gold) for topbar -->
  <symbol id="titan-mark-sm" viewBox="0 0 64 64">
    <path d="M32 2 L58 14 V36 C58 49 47 58 32 62 C17 58 6 49 6 36 V14 Z" fill="url(#tpGoldShine)"/>
    <path d="M22 14 H42 M32 14 V26" stroke="#1a1408" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  </symbol>

  <!-- Icon set (consistent stroke 1.6px) -->
  <symbol id="i-tiktok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/>
    <path d="M14 3c.5 2.5 2.5 4.5 5 5"/>
  </symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor"/>
  </symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/>
    <path d="M3 21v-5h5"/>
  </symbol>
  <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12l5 5L20 6"/>
  </symbol>
  <symbol id="i-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
  </symbol>
  <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/>
    <path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4"/>
  </symbol>
  <symbol id="i-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </symbol>
  <symbol id="i-comment" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4l-5 2 1.5-4.5A8.4 8.4 0 1 1 21 11.5z"/>
  </symbol>
  <symbol id="i-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>
    <path d="M16 6l-4-4-4 4M12 2v14"/>
  </symbol>
  <symbol id="i-trend" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 17l6-6 4 4 8-9"/>
    <path d="M14 6h7v7"/>
  </symbol>
  <symbol id="i-trend-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 7l6 6 4-4 8 9"/>
    <path d="M14 18h7v-7"/>
  </symbol>
  <symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v18h18"/>
    <rect x="7" y="12" width="3" height="6"/>
    <rect x="12" y="8" width="3" height="10"/>
    <rect x="17" y="5" width="3" height="13"/>
  </symbol>
  <symbol id="i-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </symbol>
  <symbol id="i-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-1-3s2 1 2 5a6 6 0 0 1-12 0c0-6 7-7 7-11z"/>
  </symbol>
  <symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 2"/>
  </symbol>
  <symbol id="i-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </symbol>
  <symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>
  </symbol>
  <symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </symbol>
  <symbol id="i-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 12L12 4H4v8l8 8z"/>
    <circle cx="8" cy="8" r="1.5"/>
  </symbol>
  <symbol id="i-bulb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a7 7 0 0 0-4-12z"/>
  </symbol>
  <symbol id="i-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.3-4.3"/>
  </symbol>
  <symbol id="i-video" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="6" width="14" height="12" rx="2"/>
    <path d="M17 10l4-2v8l-4-2z"/>
  </symbol>
  <symbol id="i-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </symbol>
  <symbol id="i-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2L3 14h7l-1 8 10-12h-7z"/>
  </symbol>
  <symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
  </symbol>
  <symbol id="i-coin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="12" cy="6" rx="9" ry="3"/>
    <path d="M3 6v6c0 1.7 4 3 9 3s9-1.3 9-3V6M3 12v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/>
  </symbol>
  <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2.4z"/>
  </symbol>
  <symbol id="i-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </symbol>
  <symbol id="i-check-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M8 12l3 3 5-6"/>
  </symbol>
  <symbol id="i-doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M8 13h8M8 17h5"/>
  </symbol>
  <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12L12 3l9 9M5 10v10h14V10"/>
  </symbol>
  <symbol id="i-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </symbol>
  <symbol id="i-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2l3 7 7 .5-5.5 4.5L18 22l-6-4-6 4 1.5-8L2 9.5 9 9z"/>
  </symbol>
  <symbol id="i-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="9" width="18" height="11" rx="1"/>
    <path d="M3 13h18M12 9v11M8 9a2 2 0 0 1 0-4c2 0 4 4 4 4M16 9a2 2 0 0 0 0-4c-2 0-4 4-4 4"/>
  </symbol>
  <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0"/>
  </symbol>
  <symbol id="i-handshake" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 17l-1 1a2 2 0 0 1-3 0l-3-3 4-4 3 3M9 14l4-4 3 3M14 11l3-3 4 4-3 3a2 2 0 0 1-3 0l-1-1"/>
  </symbol>
</svg>"""

# =====================================================================
# Shared client behavior script (refresh + keyboard)
# =====================================================================

NEW_BODY_SCRIPT = r"""<div class="toast" id="toast" role="status" aria-live="polite">
  <svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>
  <span id="toastMsg">Data berhasil diperbarui</span>
</div>
<script>
(function() {
  'use strict';
  const refreshBtn = document.getElementById('refreshBtn');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = toast.querySelector('.ico');
  let toastTimer = null;
  function showToast(msg, isLoading) {
    clearTimeout(toastTimer);
    toastMsg.textContent = msg;
    if (isLoading) {
      toastIcon.classList.add('spin');
      toastIcon.innerHTML = '<use href="#i-refresh"/>';
    } else {
      toastIcon.classList.remove('spin');
      toastIcon.innerHTML = '<use href="#i-check"/>';
    }
    toast.classList.add('is-visible');
  }
  function hideToast(delay) { toastTimer = setTimeout(() => toast.classList.remove('is-visible'), delay || 3000); }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (refreshBtn.classList.contains('is-loading')) return;
      refreshBtn.classList.add('is-loading');
      refreshBtn.disabled = true;
      showToast('Menyegarkan data…', true);
      const url = new URL(window.location.href);
      url.searchParams.set('t', Date.now().toString());
      url.searchParams.set('refreshed', '1');
      setTimeout(() => { window.location.replace(url.toString()); }, 650);
    });
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('refreshed') === '1') {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    setTimeout(() => {
      showToast('Data berhasil diperbarui', false);
      hideToast(3500);
    }, 200);
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (refreshBtn) refreshBtn.click();
    }
  });
})();
</script>
"""


def build_topbar(platform, handle, account_slug):
    """Return the new <nav class='topbar'>...</nav> block."""
    platform_label = PLATFORM_LABEL[platform]
    return f'''<nav class="topbar" aria-label="Top navigation">
  <a href="../" class="brand" aria-label="TITAN PRO home">
    <svg class="brand-mark" aria-hidden="true"><use href="#titan-mark-sm"/></svg>
    <span class="brand-text">
      <span class="name">TITAN PRO</span>
      <span class="tag">Social Analytics</span>
    </span>
  </a>

  <div class="topbar-nav" aria-label="Breadcrumb">
    <span class="crumb"><a href="../">TITAN PRO</a><span class="sep">/</span><a href="../">{platform_label}</a><span class="sep">/</span><span class="here">{account_slug}</span></span>
  </div>

  <div class="topbar-actions">
    <span class="live-pill" title="Data terbaru"><span class="dot" aria-hidden="true"></span>Live</span>
    <button type="button" class="btn-refresh" id="refreshBtn" aria-label="Refresh data manual">
      <svg class="icon" aria-hidden="true"><use href="#i-refresh"/></svg>
      <span>Refresh</span>
    </button>
  </div>
</nav>'''


def build_hero(platform, handle, account_slug):
    """Return the new <header class='hero'>...</header> block."""
    platform_label = PLATFORM_LABEL[platform]
    return f'''<header class="hero">
  <span class="eyebrow"><span class="pip" aria-hidden="true"></span> {platform_label} Analytics</span>
  <svg class="profile-mark" aria-hidden="true"><use href="#titan-mark"/></svg>
  <h1><span class="platform-prefix">{platform_label}</span>@{handle}</h1>
  <p class="handle" style="margin:0; visibility:hidden;">placeholder</p>
</header>'''


def replace_emoji_in_ico(text):
    """Replace <span class="ico">EMOJI</span> with <span class="ico"><svg...><use href="#i-..."/></svg></span>."""
    pattern = re.compile(r'<span class="ico"[^>]*>([^<]+)</span>')
    def repl(m):
        emoji = m.group(1).strip()
        icon = EMOJI_TO_ICON.get(emoji, "i-spark")
        return f'<span class="ico" aria-hidden="true"><svg><use href="#{icon}"/></svg></span>'
    return pattern.sub(repl, text)


def replace_emoji_prefix_h1(text):
    """Replace <h1><span class="emoji-prefix">EMOJI</span>TEXT</h1> with new hero pattern (already replaced by hero block)."""
    return text


def update_subpage(path: Path, platform: str, handle: str, slug: str):
    print(f"  → {path}")
    text = path.read_text(encoding="utf-8")

    # 1. Replace the entire <style>...</style> block with new design system.
    #    Match from first `<style>` to closing `</style>` before `</head>`.
    new_text = re.sub(
        r"<style>.*?</style>",
        NEW_STYLE,
        text,
        count=1,
        flags=re.DOTALL,
    )

    # 2. Inject the SVG symbol library right after </style> (before </head>).
    if 'id="titan-mark"' not in new_text:
        new_text = new_text.replace("</style>", "</style>\n" + NEW_SVG_SYMBOLS, 1)

    # 3. Replace the <nav class="topbar">...</nav> block.
    new_text = re.sub(
        r'<nav class="topbar"[^>]*>.*?</nav>',
        build_topbar(platform, handle, slug),
        new_text,
        count=1,
        flags=re.DOTALL,
    )

    # 4. Replace the <header class="hero">...</header> block.
    new_text = re.sub(
        r'<header class="hero">.*?</header>',
        build_hero(platform, handle, slug),
        new_text,
        count=1,
        flags=re.DOTALL,
    )

    # 5. Strip emoji prefixes from <span class="ico">...</span> in section titles.
    new_text = replace_emoji_in_ico(new_text)

    # 6. Inject toast + behavior script right before </body>.
    if 'id="toast"' not in new_text:
        new_text = new_text.replace("</body>", NEW_BODY_SCRIPT + "\n</body>", 1)

    # 7. Update <title> to brand-aligned.
    new_text = re.sub(
        r"<title>.*?</title>",
        f"<title>TITAN PRO · @{handle} — {PLATFORM_LABEL[platform]} Analytics</title>",
        new_text,
        count=1,
        flags=re.DOTALL,
    )

    # 8. Update theme-color meta to gold.
    new_text = re.sub(
        r'<meta name="theme-color" content="[^"]*"\s*/?>',
        '<meta name="theme-color" content="#0a0b10">',
        new_text,
        count=1,
    )

    path.write_text(new_text, encoding="utf-8")
    print(f"    ✓ Updated ({path.stat().st_size:,} bytes)")


def main():
    print("=" * 60)
    print("TITAN PRO · Sub-page Design System Migration")
    print("=" * 60)
    for relpath, platform, handle, slug in PAGES:
        path = REPO / relpath
        if not path.exists():
            print(f"  ✗ MISSING: {relpath}")
            continue
        update_subpage(path, platform, handle, slug)
    print("=" * 60)
    print("Done.")


if __name__ == "__main__":
    main()
