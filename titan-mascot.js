/* TITAN PRO AI · Living Mascot System (V5)
 * ------------------------------------------------------------------
 *  - Full-screen floating companion (180-240px) with continuous
 *    micro-animations: bob, head tilt, antenna pulse, hand wave,
 *    chest panel shimmer, eye scanning, blink.
 *  - Personality-driven speech bubble (glass UI, typing animation,
 *    carousel of contextual lines, close button, voice indicator).
 *  - Reacts to: scroll, mouse position, idle, hover on rows,
 *    CTA buttons, refresh, page nav, drag, mouse leave/return.
 *  - Draggable. Spring-settle. Position persisted in localStorage.
 *  - Public API: window.TitanMascot.{say, pointTo, celebrate, sad,
 *    happy, walkTo, drag, dispose, mood}.
 *  - prefers-reduced-motion respected.
 *  - Loaded by all 9 pages via <script src="./titan-mascot.js" defer>.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.TitanMascot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'titan.mascot.v5';
  const GREET_KEY = 'titan.greeted.v5';

  /* ============================================================== */
  /* 1. SVG SPRITE — same 3D robot, more expressive details        */
  /* ============================================================== */
  const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <linearGradient id="tm-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#e8fbff" stop-opacity="0.96"/>
      <stop offset="0.45" stop-color="#6df8f3" stop-opacity="0.55"/>
      <stop offset="1"    stop-color="#0a3b46" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="tm-glass-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"   stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#25f4ee" stop-opacity="0.6"/>
      <stop offset="1"   stop-color="#0a3b46" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="tm-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#11323b"/>
      <stop offset="1" stop-color="#06141b"/>
    </linearGradient>
    <linearGradient id="tm-chest" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"   stop-color="#25f4ee"/>
      <stop offset="0.5" stop-color="#5be7ff"/>
      <stop offset="1"   stop-color="#fe2c55"/>
    </linearGradient>
    <radialGradient id="tm-eye" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0"    stop-color="#ffffff"/>
      <stop offset="0.25" stop-color="#a8feff"/>
      <stop offset="0.7"  stop-color="#25f4ee"/>
      <stop offset="1"    stop-color="#0a4a55"/>
    </radialGradient>
    <radialGradient id="tm-gold" cx="0.3" cy="0.3" r="0.9">
      <stop offset="0"    stop-color="#fff4c2"/>
      <stop offset="0.45" stop-color="#f5c14b"/>
      <stop offset="1"    stop-color="#8b6914"/>
    </radialGradient>
    <radialGradient id="tm-screen" cx="0.3" cy="0.3" r="0.95">
      <stop offset="0"   stop-color="#a8feff"/>
      <stop offset="0.6" stop-color="#25f4ee"/>
      <stop offset="1"   stop-color="#06494f"/>
    </radialGradient>
    <radialGradient id="tm-bubble-bg" cx="0.3" cy="0.2" r="0.95">
      <stop offset="0"   stop-color="#1a2030" stop-opacity="0.96"/>
      <stop offset="1"   stop-color="#0a0b10" stop-opacity="0.96"/>
    </radialGradient>
    <filter id="tm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tm-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feOffset in="b" dx="0" dy="6" result="o"/>
      <feFlood flood-color="#000" flood-opacity="0.45"/>
      <feComposite in2="o" operator="in" result="o2"/>
      <feMerge><feMergeNode in="o2"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Full mascot (260x290 viewBox) -->
  <symbol id="titan-bot" viewBox="0 0 260 290">
    <!-- Antenna -->
    <g class="tm-antenna">
      <line x1="130" y1="20" x2="130" y2="38" stroke="url(#tm-gold)" stroke-width="2.6" stroke-linecap="round"/>
      <circle class="tm-ant-ball" cx="130" cy="18" r="5" fill="url(#tm-gold)" filter="url(#tm-glow)"/>
      <circle cx="129" cy="16" r="1.4" fill="#fff" opacity="0.9"/>
    </g>

    <!-- Floating shadow -->
    <ellipse class="tm-shadow" cx="130" cy="276" rx="62" ry="7" fill="#000" opacity="0.35"/>

    <!-- Body / torso -->
    <g class="tm-body-grp">
      <path d="M84 152 Q78 142 92 132 L168 132 Q182 142 176 152 L178 230
               Q180 248 160 252 L100 252 Q80 248 82 230 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.6"/>
      <!-- Chest panel with cyan/pink gradient -->
      <rect class="tm-chest-panel" x="100" y="156" width="60" height="56" rx="12" fill="url(#tm-chest)" opacity="0.95"/>
      <!-- Chest "T" mark -->
      <text x="130" y="194" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui"
            font-size="28" font-weight="800" fill="#0a0b10" opacity="0.95">T</text>
      <!-- Gold belt -->
      <rect x="82" y="206" width="96" height="8" fill="url(#tm-gold)" opacity="0.85"/>
      <circle cx="130" cy="210" r="4" fill="#fff4c2"/>
    </g>

    <!-- Left arm (waving) -->
    <g class="tm-arm-l" style="transform-origin:88px 160px">
      <path d="M88 160 Q56 148 46 100 Q44 84 60 80 Q72 80 78 92
               L92 148 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
      <g class="tm-hand-l">
        <circle cx="56" cy="76" r="14" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
        <circle cx="52" cy="72" r="2.6" fill="#fff" opacity="0.8"/>
        <path class="tm-mouth-shape" d="M50 80 Q56 84 62 80" stroke="#0a4a55" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      </g>
    </g>

    <!-- Right arm (pointing) -->
    <g class="tm-arm-r" style="transform-origin:172px 160px">
      <path d="M172 160 Q204 152 212 180 Q214 192 200 196
               L178 188 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
      <circle cx="202" cy="186" r="11" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- Tablet / screen -->
      <g class="tm-tablet">
        <rect x="194" y="158" width="40" height="52" rx="6" fill="#0a0b10" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
        <rect class="tm-tablet-screen" x="198" y="162" width="32" height="44" rx="4" fill="url(#tm-screen)" filter="url(#tm-glow)"/>
        <rect x="200" y="194" width="3" height="8" fill="#0a0b10" opacity="0.7"/>
        <rect x="206" y="190" width="3" height="12" fill="#0a0b10" opacity="0.7"/>
        <rect x="212" y="186" width="3" height="16" fill="#0a0b10" opacity="0.7"/>
        <rect x="218" y="180" width="3" height="22" fill="#0a0b10" opacity="0.7"/>
        <rect x="224" y="172" width="3" height="30" fill="#0a0b10" opacity="0.7"/>
        <circle cx="215" cy="170" r="3.5" fill="url(#tm-gold)"/>
      </g>
    </g>

    <!-- HEAD (glass orb) -->
    <g class="tm-head">
      <ellipse cx="130" cy="90" rx="60" ry="52" fill="url(#tm-glass-rim)"/>
      <ellipse cx="130" cy="90" rx="53" ry="44" fill="url(#tm-glass)"/>
      <!-- specular -->
      <ellipse cx="105" cy="64" rx="26" ry="12" fill="#fff" opacity="0.5" transform="rotate(-25 105 64)"/>
      <ellipse cx="100" cy="58" rx="8" ry="4" fill="#fff" opacity="0.9"/>
      <!-- gold chin band -->
      <path d="M78 122 Q130 146 182 122 L182 128 Q130 152 78 128 Z" fill="url(#tm-gold)" opacity="0.85"/>
      <circle cx="130" cy="136" r="2.6" fill="#fff4c2"/>

      <!-- Ear pods -->
      <g class="tm-ear tm-ear-l">
        <rect x="64" y="78" width="12" height="24" rx="4" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.4"/>
        <circle cx="70" cy="90" r="2.4" fill="url(#tm-gold)"/>
      </g>
      <g class="tm-ear tm-ear-r">
        <rect x="184" y="78" width="12" height="24" rx="4" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.4"/>
        <circle cx="190" cy="90" r="2.4" fill="url(#tm-gold)"/>
      </g>

      <!-- EYES -->
      <g class="tm-eyes">
        <g class="tm-eye tm-eye-l">
          <ellipse cx="110" cy="92" rx="14" ry="16" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:110px 92px">
            <circle cx="110" cy="92" r="9" fill="url(#tm-eye)"/>
            <circle cx="107" cy="88" r="2.8" fill="#fff"/>
            <circle cx="113" cy="96" r="1.4" fill="#fff" opacity="0.7"/>
          </g>
          <!-- sparkles -->
          <circle class="tm-sparkle tm-sparkle-l" cx="103" cy="86" r="1.4" fill="#fff" opacity="0.9"/>
        </g>
        <g class="tm-eye tm-eye-r">
          <ellipse cx="150" cy="92" rx="14" ry="16" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:150px 92px">
            <circle cx="150" cy="92" r="9" fill="url(#tm-eye)"/>
            <circle cx="147" cy="88" r="2.8" fill="#fff"/>
            <circle cx="153" cy="96" r="1.4" fill="#fff" opacity="0.7"/>
          </g>
          <circle class="tm-sparkle tm-sparkle-r" cx="143" cy="86" r="1.4" fill="#fff" opacity="0.9"/>
        </g>
        <!-- Eyelids (blink via scaleY) -->
        <rect class="tm-lid tm-lid-l" x="96" y="76" width="28" height="32" rx="14" fill="url(#tm-glass)" opacity="0.96"/>
        <rect class="tm-lid tm-lid-r" x="136" y="76" width="28" height="32" rx="14" fill="url(#tm-glass)" opacity="0.96"/>
      </g>

      <!-- Smile -->
      <g class="tm-mouth">
        <path class="tm-mouth-shape" d="M114 118 Q130 130 146 118"
              stroke="#0a4a55" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Cheek glow -->
      <circle class="tm-cheek tm-cheek-l" cx="88" cy="110" r="8" fill="#fe2c55" opacity="0.22"/>
      <circle class="tm-cheek tm-cheek-r" cx="172" cy="110" r="8" fill="#fe2c55" opacity="0.22"/>
    </g>

    <!-- Feet / hover pad -->
    <ellipse cx="115" cy="262" rx="10" ry="4" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1"/>
    <ellipse cx="145" cy="262" rx="10" ry="4" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1"/>
  </symbol>

  <!-- Topbar mini (40x44) -->
  <symbol id="titan-bot-sm" viewBox="0 0 260 290">
    <use href="#titan-bot"/>
  </symbol>

  <!-- Tiny avatar (for profile-mark if needed) -->
  <symbol id="titan-bot-tiny" viewBox="0 0 260 290">
    <use href="#titan-bot"/>
  </symbol>
</svg>
`;

  /* ============================================================== */
  /* 2. PERSONALITY POOL                                            */
  /* ============================================================== */
  const LINES = {
    greet: [
      "Halo! Aku Titan, analis pribadimu. 👋",
      "Pilih akun di bawah, aku kasih insight-nya.",
      "Tip: tekan R untuk refresh data kapan aja."
    ],
    curious: [
      "Hmm, akun ini menarik. ER-nya kenceng.",
      "Konten media lokal lagi naik nih.",
      "Aku sempat liat pos viral mereka. Mantap.",
      "Ini akun yang worth dipantau.",
      "Coba cek pos teratasnya, ada yang gila."
    ],
    hype: [
      "Gila sih ini akun, followers naik terus!",
      "Pakai ini buat benchmark konten lo.",
      "Ini top-tier. Cocok buat strategi.",
      "Wih, performanya konsisten banget! 🚀"
    ],
    sleepy: [
      "Sini-sini, ada yang mau dijelasin?",
      "Buka aja, aku standby.",
      "Data baru udah masuk. Yuk intip.",
      "Lagi santai nih, ayo eksplor."
    ],
    drag: [
      "Wkwk, mau ditaruh dimana nih?",
      "Oke, aku di sini ya!",
      "Hati-hati ya, jangan jatuhkan aku 😅"
    ],
    return: [
      "Aku balik! Kangen gak?",
      "Hei, aku di sini lagi 👋",
      "Halo! Lagi ngapain?"
    ],
    leave: [
      "Kok pergi? Yaudah aku tunggu ya...",
      "Hati-hati di luar sana! ✨",
      "Aku standby di sini. Balik lagi ya."
    ],
    refresh: [
      "Menyegarkan data… bentar ya.",
      "Lagi ambil data terbaru nih.",
      "Tunggu sebentar, lagi sync."
    ],
    success: [
      "Data berhasil diperbarui! Mantap. ✨",
      "Done! Cek deh hasilnya.",
      "Mantap, semua udah update."
    ],
    error: [
      "Hmm, kayaknya ada masalah nih...",
      "Waduh, error. Coba lagi ya.",
      "Aku gak bisa ambil datanya. Sabar ya."
    ],
    point: [
      "Ini dia! Tengok deh 👉",
      "Lihat yang aku tunjuk!",
      "Coba cek yang ini."
    ],
    subpage: {
      'ardiantanah/ardiantanah-tiktok.html': [
        "Akun ardiantanah! Isinya mix properti & komedi, kocak banget.",
        "Konten khas Lumajang nih, suka banget sama vibe-nya."
      ],
      'ardiantanah/index.html': [
        "Akun ardiantanah ini gabungan TikTok + IG, lengkap!",
        "Cek performa IG-nya juga, biasanya kuat di Reels."
      ],
      'majangmejeng-ig.html': [
        "Ini akun berita lokal Lumajang, hits di sore hari.",
        "Liputan viral mereka selalu dapet engagement gila."
      ],
      'majangmejeng/index.html': [
        "majangmejeng_ — jurnalis lokal yang konsisten.",
        "Update tiap hari, perfect buat referensi berita Lumajang."
      ],
      'marketing/index.html': [
        "Akun kreator marketing nih, performanya stabil.",
        "Konten marketing-nya selalu on-point, cocok dipelajari."
      ],
      'marketing/nisyanandaa-instagram.html': [
        "Ini Nisyanandaa, kreator marketing yang aesthetic banget.",
        "Feed IG-nya rapi, branding kuat. Bisa buat referensi!"
      ],
      'syahfalahproperti-ig/index.html': [
        "Akun properti, biasanya listing-nya menarik.",
        "Properti lokal Lumajang, lengkap banget datanya."
      ],
      'syahfalahproperti/index.html': [
        "Syahfalah Properti, listing properti terbaik di Lumajang.",
        "Cek harganya, biasanya kompetitif banget."
      ]
    }
  };

  /* ============================================================== */
  /* 3. STATE                                                       */
  /* ============================================================== */
  const state = {
    mood: 'idle',        // idle | greeting | reacting | celebrating | sad | pointing
    cycleIdx: 0,
    pos: null,           // {x, y} in px
    dragging: false,
    greeted: sessionStorage.getItem(GREET_KEY) === '1',
    lastSpeak: 0,
    sleepTimer: null,
    idleTimer: null,
    eyeTarget: { x: 0, y: 0 },
    bodyTilt: 0,
    handPoint: null,
    typing: false,
    closeRequested: false
  };

  /* ============================================================== */
  /* 4. INJECT SPRITE + CSS                                         */
  /* ============================================================== */
  function injectSprite() {
    if (document.getElementById('tm-sprite')) return;
    const wrap = document.createElement('div');
    wrap.id = 'tm-sprite';
    wrap.innerHTML = SPRITE;
    document.body.appendChild(wrap);
  }

  const CSS = `
/* === Mascot container === */
.titan-mascot {
  position: fixed;
  z-index: 70;
  pointer-events: none;
  width: 200px;
  height: 224px;
  transform: translate3d(0, 0, 0);
  transition: bottom 600ms cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: none;
  will-change: transform;
  filter: drop-shadow(0 16px 32px rgba(37, 244, 238, 0.18))
          drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}
.titan-mascot svg {
  width: 100%; height: 100%;
  pointer-events: auto;
  cursor: grab;
}
.titan-mascot.dragging svg { cursor: grabbing; }

/* === Continuous micro-animations on the bot === */
.titan-mascot .tm-bot-grp {
  transform-origin: 130px 200px;
  animation: tm-bob 4.2s ease-in-out infinite;
}
@keyframes tm-bob {
  0%, 100% { transform: translateY(0) rotate(0); }
  25%      { transform: translateY(-4px) rotate(-1.2deg); }
  50%      { transform: translateY(-7px) rotate(0); }
  75%      { transform: translateY(-3px) rotate(1.2deg); }
}

.titan-mascot .tm-head {
  transform-origin: 130px 100px;
  animation: tm-head-tilt 6s ease-in-out infinite;
}
@keyframes tm-head-tilt {
  0%, 100% { transform: rotate(0); }
  30%      { transform: rotate(-2.5deg); }
  70%      { transform: rotate(2deg); }
}

.titan-mascot .tm-ant-ball {
  transform-origin: 130px 18px;
  animation: tm-antenna-pulse 1.8s ease-in-out infinite;
}
@keyframes tm-antenna-pulse {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 0 #f5c14b); }
  50%      { transform: scale(1.25); filter: drop-shadow(0 0 8px #f5c14b); }
}

.titan-mascot .tm-shadow {
  transform-origin: 130px 276px;
  animation: tm-shadow-pulse 4.2s ease-in-out infinite;
}
@keyframes tm-shadow-pulse {
  0%, 100% { transform: scaleX(1); opacity: 0.35; }
  50%      { transform: scaleX(0.78); opacity: 0.22; }
}

.titan-mascot .tm-hand-l {
  transform-origin: 56px 90px;
  animation: tm-wave 2.6s ease-in-out infinite;
  animation-delay: 1.4s;
}
@keyframes tm-wave {
  0%, 70%, 100% { transform: rotate(0); }
  76%           { transform: rotate(-26deg); }
  84%           { transform: rotate(20deg); }
  92%           { transform: rotate(-14deg); }
}

.titan-mascot .tm-tablet-screen {
  animation: tm-screen-flicker 3.2s ease-in-out infinite;
}
@keyframes tm-screen-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.78; }
}

.titan-mascot .tm-chest-panel {
  animation: tm-chest-shimmer 2.4s ease-in-out infinite;
}
@keyframes tm-chest-shimmer {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.18); }
}

.titan-mascot .tm-sparkle {
  animation: tm-sparkle 2.2s ease-in-out infinite;
}
.titan-mascot .tm-sparkle-r { animation-delay: 0.6s; }
@keyframes tm-sparkle {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(0.6); }
}

/* Pupils track cursor (CSS var driven by JS) */
.titan-mascot .tm-pupil {
  transform: translate(var(--eye-x, 0px), var(--eye-y, 0px));
  transition: transform 220ms ease-out;
}

/* Blink */
.titan-mascot .tm-lid {
  transform-origin: center;
  transform: scaleY(0);
}
.titan-mascot.tm-blinking .tm-lid {
  animation: tm-blink 220ms ease-in-out;
}
@keyframes tm-blink {
  0%, 100% { transform: scaleY(0); }
  50%      { transform: scaleY(1); }
}

/* Right arm pointing */
.titan-mascot .tm-arm-r {
  transition: transform 600ms cubic-bezier(0.32, 0.72, 0, 1);
  transform: rotate(0deg);
}
.titan-mascot.tm-pointing .tm-arm-r {
  transform: rotate(-32deg) translate(0, -2px);
}

/* Mood: sad */
.titan-mascot.tm-sad .tm-mouth-shape {
  transform: scaleY(-1) translateY(-12px);
  transform-origin: 130px 124px;
  stroke: #0a4a55;
}
.titan-mascot.tm-sad .tm-eye ellipse:first-child { fill: #0a1a22; }
.titan-mascot.tm-sad .tm-pupil { opacity: 0.55; }
.titan-mascot.tm-sad .tm-hand-l {
  animation: none;
  transform: rotate(40deg);
  transform-origin: 56px 90px;
}
.titan-mascot.tm-sad .tm-arm-l { transform: rotate(8deg); transform-origin: 88px 160px; }
.titan-mascot.tm-sad .tm-head  { animation: tm-sad-droop 2.4s ease-in-out infinite; }
@keyframes tm-sad-droop {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(3px) rotate(0.5deg); }
}

/* Mood: happy (extra cheek glow) */
.titan-mascot.tm-happy .tm-cheek { opacity: 0.5; }
.titan-mascot.tm-celebrate .tm-bot-grp {
  animation: tm-jump 700ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tm-jump {
  0%   { transform: translateY(0) rotate(0); }
  30%  { transform: translateY(-22px) rotate(-5deg); }
  55%  { transform: translateY(-6px) rotate(3deg); }
  100% { transform: translateY(0) rotate(0); }
}

/* Off-screen states */
.titan-mascot.tm-hidden {
  opacity: 0;
  transform: translate3d(0, 80px, 0);
  transition: opacity 400ms ease, transform 600ms cubic-bezier(0.32, 0.72, 0, 1);
}
.titan-mascot {
  transition: transform 480ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease;
}

/* === Speech bubble === */
.titan-bubble {
  position: absolute;
  z-index: 71;
  bottom: 100%;
  right: 0;
  margin-bottom: 16px;
  max-width: 320px;
  min-width: 200px;
  padding: 14px 18px 14px 48px;
  background: linear-gradient(180deg, rgba(26, 32, 48, 0.95), rgba(10, 11, 16, 0.95));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(245, 193, 75, 0.32);
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(37, 244, 238, 0.08);
  color: var(--text, #f4f6fb);
  font-family: var(--font-sans, 'Plus Jakarta Sans', sans-serif);
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.01em;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  transition: opacity 280ms ease, transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.titan-bubble.is-visible { opacity: 1; transform: translateY(0) scale(1); }
.titan-bubble::after {
  content: "";
  position: absolute;
  bottom: -8px;
  right: 36px;
  width: 16px; height: 16px;
  background: linear-gradient(135deg, rgba(26, 32, 48, 0.95), rgba(10, 11, 16, 0.95));
  border-right: 1px solid rgba(245, 193, 75, 0.32);
  border-bottom: 1px solid rgba(245, 193, 75, 0.32);
  transform: rotate(45deg);
}
.titan-bubble .face {
  position: absolute;
  top: 12px; left: 12px;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #0a0b10;
  box-shadow: 0 2px 8px rgba(37, 244, 238, 0.4);
}
.titan-bubble .voice {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #25f4ee;
  margin-right: 6px;
  vertical-align: middle;
  animation: tm-voice 1.4s ease-in-out infinite;
}
@keyframes tm-voice {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1.2); }
}
.titan-bubble .text {
  display: inline;
}
.titan-bubble .text::after {
  content: "▌";
  margin-left: 2px;
  color: var(--tt-cyan, #25f4ee);
  animation: tm-caret 800ms steps(1) infinite;
}
.titan-bubble.done .text::after { content: ""; }
.titan-bubble .close {
  position: absolute;
  top: 8px; right: 8px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 0;
  color: var(--text-muted, #8a90a4);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.titan-bubble .close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text, #f4f6fb);
}
.titan-bubble .next {
  position: absolute;
  bottom: 8px; right: 12px;
  background: none;
  border: 0;
  color: var(--tt-cyan, #25f4ee);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 150ms;
}
.titan-bubble .next:hover { opacity: 1; }
.titan-bubble .next[hidden] { display: none; }
.titan-bubble .progress {
  position: absolute;
  bottom: 4px; left: 48px; right: 80px;
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}
.titan-bubble .progress span {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #25f4ee, #fe2c55);
  border-radius: 2px;
}

/* === Target highlight (used by pointTo) === */
.tm-target-glow {
  position: relative;
  animation: tm-target-pulse 1.2s ease-in-out infinite;
}
.tm-target-glow::after {
  content: "";
  position: absolute;
  inset: -6px;
  border: 2px solid #f5c14b;
  border-radius: 14px;
  pointer-events: none;
  animation: tm-target-ring 1.6s ease-in-out infinite;
}
@keyframes tm-target-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.04); }
}

/* === First-visit entrance === */
.titan-mascot.tm-entering {
  animation: tm-enter 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tm-enter {
  0%   { opacity: 0; transform: translate3d(0, 80px, 0) scale(0.7); }
  60%  { opacity: 1; transform: translate3d(0, -10px, 0) scale(1.05); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .titan-mascot, .titan-mascot *, .titan-bubble, .titan-bubble * {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
  }
}

/* === Topbar mini bot === */
.topbar-bot {
  width: 32px; height: 36px;
  filter: drop-shadow(0 1px 4px rgba(37, 244, 238, 0.4));
  flex-shrink: 0;
  display: block;
}
`;

  function injectStyles() {
    if (document.getElementById('tm-style')) return;
    const s = document.createElement('style');
    s.id = 'tm-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ============================================================== */
  /* 5. BUILD DOM                                                   */
  /* ============================================================== */
  let mascot, bubble, bubbleText, bubbleFace, bubbleClose, bubbleNext, bubbleProgress, groupG;

  function buildMascot() {
    if (mascot) return;
    mascot = document.createElement('div');
    mascot.className = 'titan-mascot tm-hidden tm-entering';
    mascot.setAttribute('role', 'img');
    mascot.setAttribute('aria-label', 'TITAN PRO AI — maskot analis');
    mascot.innerHTML = `
      <div class="tm-bot-grp">
        <svg viewBox="0 0 260 290" aria-hidden="true">
          <use href="#titan-bot"/>
        </svg>
      </div>
    `;
    document.body.appendChild(mascot);

    bubble = document.createElement('div');
    bubble.className = 'titan-bubble';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
    bubble.innerHTML = `
      <span class="face" aria-hidden="true">T</span>
      <span class="voice" aria-hidden="true"></span>
      <span class="text"></span>
      <button class="close" type="button" aria-label="Tutup">×</button>
      <button class="next" type="button" hidden>Lanjut →</button>
      <span class="progress" aria-hidden="true"><span></span></span>
    `;
    mascot.appendChild(bubble);
    bubbleText = bubble.querySelector('.text');
    bubbleFace = bubble.querySelector('.face');
    bubbleClose = bubble.querySelector('.close');
    bubbleNext = bubble.querySelector('.next');
    bubbleProgress = bubble.querySelector('.progress span');

    bubbleClose.addEventListener('click', hideBubble);
    bubbleNext.addEventListener('click', nextLine);
  }

  /* ============================================================== */
  /* 6. POSITION                                                    */
  /* ============================================================== */
  function loadPos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }
  function savePos(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }
  function defaultPos() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // bottom-right with margin
    return {
      x: Math.max(20, w - 240),
      y: Math.max(20, h - 260)
    };
  }
  function applyPos(p) {
    const m = mascot;
    if (!m || !p) return;
    m.style.left = p.x + 'px';
    m.style.top  = p.y + 'px';
    m.style.right = 'auto';
    m.style.bottom = 'auto';
  }
  function clampPos(p) {
    const w = window.innerWidth, h = window.innerHeight;
    const mw = 200, mh = 224;
    return {
      x: Math.max(8, Math.min(w - mw - 8, p.x)),
      y: Math.max(8, Math.min(h - mh - 8, p.y))
    };
  }

  /* ============================================================== */
  /* 7. EYE TRACKING                                                */
  /* ============================================================== */
  const EYE_RANGE = 5.5;
  function onMouseMove(e) {
    if (state.dragging) return;
    if (state.mood === 'sad') return;
    const cx = e.clientX, cy = e.clientY;
    const r = mascot.getBoundingClientRect();
    if (r.width === 0) return;
    const fx = r.left + r.width * 0.5;
    const fy = r.top  + r.height * 0.45;
    const range = Math.max(r.width, r.height) * 0.7;
    let dx = (cx - fx) / range;
    let dy = (cy - fy) / range;
    const d = Math.hypot(dx, dy);
    if (d > 1) { dx /= d; dy /= d; }
    state.eyeTarget.x = dx * EYE_RANGE;
    state.eyeTarget.y = dy * EYE_RANGE;
    mascot.style.setProperty('--eye-x', state.eyeTarget.x.toFixed(2) + 'px');
    mascot.style.setProperty('--eye-y', state.eyeTarget.y.toFixed(2) + 'px');
  }
  function setupEyeTracking() {
    if (reduced) return;
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMouseMove(e.touches[0]);
    }, { passive: true });
  }

  /* ============================================================== */
  /* 8. BLINK SCHEDULER                                             */
  /* ============================================================== */
  function setupBlink() {
    if (reduced) return;
    function schedule() {
      const delay = 2600 + Math.random() * 3800; // 2.6 – 6.4s
      setTimeout(() => {
        if (!mascot || mascot.classList.contains('tm-hidden')) { schedule(); return; }
        mascot.classList.add('tm-blinking');
        setTimeout(() => mascot.classList.remove('tm-blinking'), 240);
        if (Math.random() < 0.22) {
          setTimeout(() => {
            if (!mascot) return;
            mascot.classList.add('tm-blinking');
            setTimeout(() => mascot.classList.remove('tm-blinking'), 240);
          }, 360);
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  /* ============================================================== */
  /* 9. SCROLL LISTENER (head tilt)                                 */
  /* ============================================================== */
  let lastScroll = window.scrollY;
  function setupScroll() {
    if (reduced) return;
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const cur = window.scrollY;
        const dir = cur - lastScroll;
        // Slight head tilt in scroll direction
        const tilt = Math.max(-6, Math.min(6, dir * 0.4));
        if (mascot && groupG) {
          groupG.style.setProperty('--scroll-tilt', tilt + 'deg');
          groupG.style.transform = `translateY(0) rotate(${tilt}deg)`;
        }
        lastScroll = cur;
        raf = null;
      });
    }, { passive: true });
  }

  /* ============================================================== */
  /* 10. SPEECH BUBBLE                                              */
  /* ============================================================== */
  let queue = [];
  let currentLine = '';
  let typing = false;

  function showLine(text, opts = {}) {
    if (!mascot) return;
    if (!text) return;
    bubbleText.textContent = '';
    bubble.classList.remove('done');
    bubble.classList.add('is-visible');
    bubbleProgress.style.width = '0%';
    if (opts.queue && opts.queue.length) {
      bubbleNext.hidden = false;
    } else {
      bubbleNext.hidden = true;
    }
    typeText(text, opts.duration);
  }

  function typeText(text, durationMs) {
    typing = true;
    state.typing = true;
    state.mood = 'greeting';
    const dur = durationMs || Math.min(7000, 1400 + text.length * 28);
    const charTime = Math.max(14, Math.min(36, dur / text.length));
    let i = 0;
    function step() {
      if (state.closeRequested) { finish(); return; }
      i++;
      bubbleText.textContent = text.slice(0, i);
      if (i < text.length) {
        setTimeout(step, charTime);
      } else {
        finish();
      }
    }
    function finish() {
      bubble.classList.add('done');
      typing = false;
      state.typing = false;
      state.mood = 'idle';
      bubbleText.textContent = text;
      if (durationMs !== 0) {
        // auto-dismiss
        const elapsed = i * charTime;
        const remaining = Math.max(1500, dur - elapsed);
        setTimeout(() => {
          if (!state.closeRequested) hideBubble();
        }, remaining);
      }
    }
    setTimeout(step, 60);
    // animate progress
    bubbleProgress.style.transition = `width ${dur}ms linear`;
    requestAnimationFrame(() => { bubbleProgress.style.width = '100%'; });
  }

  function hideBubble() {
    if (!bubble) return;
    state.closeRequested = true;
    setTimeout(() => { state.closeRequested = false; }, 100);
    bubble.classList.remove('is-visible');
    bubbleNext.hidden = true;
  }

  function nextLine() {
    if (queue.length === 0) { hideBubble(); return; }
    const next = queue.shift();
    showLine(next, { queue });
  }

  function say(text, opts = {}) {
    queue = opts.queue || [];
    showLine(text, opts);
  }

  function speakFromPool(pool, opts = {}) {
    if (state.typing) { queue.push(...pool); return; }
    if (state.mood !== 'idle' && !opts.force) { queue.push(...pool); return; }
    const text = pool[state.cycleIdx++ % pool.length];
    say(text, { queue: pool.slice(state.cycleIdx % pool.length), duration: opts.duration });
  }

  /* ============================================================== */
  /* 11. MOOD API                                                   */
  /* ============================================================== */
  function setMood(m) {
    if (!mascot) return;
    mascot.classList.remove('tm-sad', 'tm-happy', 'tm-celebrate', 'tm-pointing');
    state.mood = m;
  }
  function happy() { setMood('happy'); mascot.classList.add('tm-happy'); }
  function sad()   { setMood('sad');   mascot.classList.add('tm-sad'); }
  function celebrate() {
    setMood('happy');
    mascot.classList.add('tm-happy', 'tm-celebrate');
    setTimeout(() => mascot.classList.remove('tm-celebrate'), 750);
  }

  /* ============================================================== */
  /* 12. POINT-TO                                                   */
  /* ============================================================== */
  let pointTargetEl = null;
  function pointTo(selector, line) {
    if (!mascot) return;
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!target) return;
    if (state.mood === 'pointing') clearPointTo();
    state.mood = 'pointing';
    mascot.classList.add('tm-pointing');
    target.classList.add('tm-target-glow');
    pointTargetEl = target;
    if (line) say(line, { queue: LINES.point });
    else say(LINES.point[state.cycleIdx++ % LINES.point.length], { queue: LINES.point });
    setTimeout(() => clearPointTo(), 3200);
  }
  function clearPointTo() {
    if (pointTargetEl) pointTargetEl.classList.remove('tm-target-glow');
    pointTargetEl = null;
    mascot.classList.remove('tm-pointing');
    if (state.mood === 'pointing') state.mood = 'idle';
  }

  /* ============================================================== */
  /* 13. DRAGGING                                                   */
  /* ============================================================== */
  function setupDrag() {
    if (reduced) return;
    let startX, startY, origX, origY, didDrag = false;
    function onDown(e) {
      // Only respond to primary button
      if (e.button !== undefined && e.button !== 0) return;
      didDrag = false;
      const pt = pointerXY(e);
      startX = pt.x; startY = pt.y;
      const r = mascot.getBoundingClientRect();
      origX = r.left; origY = r.top;
      mascot.classList.add('dragging');
      state.dragging = true;
      mascot.setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
      window.addEventListener('pointercancel', onUp, { once: true });
    }
    function onMove(e) {
      const pt = pointerXY(e);
      const dx = pt.x - startX, dy = pt.y - startY;
      if (!didDrag && Math.hypot(dx, dy) > 4) didDrag = true;
      if (!didDrag) return;
      const np = clampPos({ x: origX + dx, y: origY + dy });
      mascot.style.transition = 'none';
      mascot.style.left = np.x + 'px';
      mascot.style.top  = np.y + 'px';
    }
    function onUp() {
      mascot.classList.remove('dragging');
      state.dragging = false;
      window.removeEventListener('pointermove', onMove);
      const r = mascot.getBoundingClientRect();
      savePos(clampPos({ x: r.left, y: r.top }));
      if (didDrag) {
        // happy reaction
        happy();
        speakFromPool(LINES.drag);
        setTimeout(() => {
          // re-position via transition
          mascot.style.transition = '';
        }, 50);
      }
    }
    function pointerXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    mascot.addEventListener('pointerdown', onDown);
    mascot.addEventListener('touchstart', onDown, { passive: true });
  }

  /* ============================================================== */
  /* 14. IDLE / AWAY LISTENERS                                      */
  /* ============================================================== */
  function setupIdle() {
    let away = false;
    function leave() {
      if (away) return;
      away = true;
      sad();
      speakFromPool(LINES.leave, { force: true });
    }
    function back() {
      if (!away) return;
      away = false;
      happy();
      speakFromPool(LINES.return, { force: true });
    }
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', back);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) leave();
      else back();
    });
  }

  function setupIdleChatter() {
    function schedule() {
      const delay = 22000 + Math.random() * 20000; // 22 – 42s
      setTimeout(() => {
        if (!mascot || mascot.classList.contains('tm-hidden')) { schedule(); return; }
        if (state.mood === 'idle' && !state.typing) {
          const groups = [LINES.curious, LINES.hype, LINES.sleepy, LINES.curious];
          speakFromPool(groups[state.cycleIdx++ % groups.length]);
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  /* ============================================================== */
  /* 15. ROW / CTA REACTIONS                                        */
  /* ============================================================== */
  function setupReactions() {
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('[data-handle]');
      if (card) reactToCard(card);
      const cta = e.target.closest('[data-cta], .btn-refresh, .row');
      if (cta && !card) ctaReaction(cta);
    });
    document.addEventListener('focusin', (e) => {
      const card = e.target.closest('[data-handle]');
      if (card) reactToCard(card);
    });
  }
  function reactToCard(card) {
    if (state.mood !== 'idle' && state.mood !== 'happy') return;
    const handle = card.getAttribute('data-handle') || '';
    const platform = card.getAttribute('data-platform') || '';
    const path = (location.pathname.replace(/^\/|\/$/g, '') || 'index.html').toLowerCase();
    const subLines = LINES.subpage[path];
    let line;
    if (subLines && Math.random() < 0.6) {
      line = subLines[Math.floor(Math.random() * subLines.length)];
    } else {
      const base = platform === 'tiktok' || platform === 'tt'
        ? "TikTok performanya lagi bagus. Tengok deh."
        : platform === 'instagram' || platform === 'ig'
          ? "Instagram-nya verified — kualitasnya terjaga."
          : "Akun ini menarik banget.";
      line = handle ? base.replace('akun ini', `@${handle}`) : base;
    }
    happy();
    say(line, { duration: 4200 });
    setMood('idle');
  }
  function ctaReaction(cta) {
    if (state.mood !== 'idle') return;
    if (cta.id === 'refreshBtn') {
      say(LINES.refresh[Math.floor(Math.random() * LINES.refresh.length)], { duration: 3000 });
    } else {
      const t = cta.textContent?.trim().slice(0, 30) || 'ini';
      say(`Cek ${t} yuk!`, { duration: 3000 });
    }
  }

  /* ============================================================== */
  /* 16. R-KEY (refresh)                                            */
  /* ============================================================== */
  function setupRKey() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const btn = document.getElementById('refreshBtn');
        if (btn) {
          say(LINES.refresh[0], { duration: 2000 });
          setTimeout(() => {
            if (Math.random() < 0.8) {
              celebrate();
              say(LINES.success[Math.floor(Math.random() * LINES.success.length)], { duration: 3000 });
            } else {
              sad();
              say(LINES.error[Math.floor(Math.random() * LINES.error.length)], { duration: 3000 });
            }
          }, 1200);
        }
      }
    });
  }

  /* ============================================================== */
  /* 17. CLICK ON MASCOT                                            */
  /* ============================================================== */
  function setupClick() {
    mascot.addEventListener('click', (e) => {
      if (state.dragging) return;
      e.stopPropagation();
      // Cycle through 4 personality groups
      const groups = [LINES.curious, LINES.hype, LINES.sleepy, LINES.greet];
      happy();
      speakFromPool(groups[state.cycleIdx++ % groups.length], { force: true });
    });
  }

  /* ============================================================== */
  /* 18. UPGRADE TOPBAR ORBS                                        */
  /* ============================================================== */
  function upgradeTopbar() {
    document.querySelectorAll('.topbar .brand-mark').forEach((el) => {
      const use = el.querySelector('use');
      if (use && use.getAttribute('href') === '#titan-bot-sm') {
        el.classList.add('topbar-bot');
      }
    });
  }

  /* ============================================================== */
  /* 19. INIT                                                       */
  /* ============================================================== */
  function init() {
    injectSprite();
    injectStyles();
    buildMascot();
    upgradeTopbar();

    // Position
    state.pos = loadPos() || defaultPos();
    state.pos = clampPos(state.pos);
    applyPos(state.pos);

    // Setup subsystems
    setupEyeTracking();
    setupBlink();
    setupScroll();
    setupDrag();
    setupIdle();
    setupIdleChatter();
    setupReactions();
    setupRKey();
    setupClick();

    // Reveal after first paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mascot.classList.remove('tm-hidden');
        setTimeout(() => mascot.classList.remove('tm-entering'), 900);

        // First-visit greeting
        if (!state.greeted) {
          state.greeted = true;
          sessionStorage.setItem(GREET_KEY, '1');
          setTimeout(() => {
            say(LINES.greet[0], { queue: LINES.greet.slice(1), duration: 7000 });
            // After greeting, point to first account row
            setTimeout(() => {
              const first = document.querySelector('[data-handle]');
              if (first) pointTo(first, "Mulai dari sini ↓");
            }, 6000);
          }, 1200);
        } else {
          // Returning visitor — short greet
          setTimeout(() => {
            say(LINES.greet[state.cycleIdx++ % LINES.greet.length], { duration: 4500 });
          }, 800);
        }
      });
    });

    // Reposition on resize
    window.addEventListener('resize', () => {
      state.pos = clampPos(state.pos);
      applyPos(state.pos);
    });
  }

  /* ============================================================== */
  /* 20. PUBLIC API                                                  */
  /* ============================================================== */
  window.TitanMascot = {
    say, happy, sad, celebrate, pointTo,
    spin() {
      if (!mascot || reduced) return;
      const cur = mascot.style.transition;
      mascot.style.transition = 'transform 700ms linear';
      const r = mascot.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      mascot.style.transformOrigin = 'center';
      mascot.style.transform = `translate(${r.left}px, ${r.top}px) rotate(360deg)`;
      // (simpler: rely on the inner .tm-bot-grp rotation)
      const grp = mascot.querySelector('.tm-bot-grp');
      if (grp) {
        grp.style.transition = 'transform 700ms linear';
        grp.style.transform = 'rotate(360deg)';
        setTimeout(() => { grp.style.transition = ''; grp.style.transform = ''; }, 750);
      }
    },
    hide() { mascot.classList.add('tm-hidden'); },
    show() { mascot.classList.remove('tm-hidden'); },
    get mood() { return state.mood; },
    dispose() {
      mascot?.remove();
      document.getElementById('tm-sprite')?.remove();
      document.getElementById('tm-style')?.remove();
    }
  };

  /* ============================================================== */
  /* 21. BOOT                                                        */
  /* ============================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
