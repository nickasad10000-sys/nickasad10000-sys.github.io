/* TITAN PRO · Living Mascot System (V6)
 * ------------------------------------------------------------------
 *  - TITAN PRO face logo (compact, used as topbar mark, hero face,
 *    profile avatar, and the mascot's head — one symbol, every size).
 *  - Human-like robot mascot: head + neck + shoulders + arms with
 *    5-finger hands + waist + hover base. Glassmorphism material,
 *    TikTok palette + gold accents.
 *  - Free-roam: autonomous walker using requestAnimationFrame +
 *    bezier path planning. Pauses to read DOM elements, react to
 *    events, then walks on.
 *  - Dynamic speech: reads live DOM data (KPIs, sections, rows,
 *    buttons). Tutorial mode on first visit. Reports scroll progress.
 *  - Public API: window.TitanMascot.{say, pointTo, celebrate, sad,
 *    happy, walkTo, mood, dispose, ...}.
 *  - prefers-reduced-motion safe. Accessible.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.TitanMascot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POS_KEY    = 'titan.mascot.pos.v6';
  const GREET_KEY  = 'titan.greeted.v6';
  const TUTOR_KEY  = 'titan.tutorial.v6';

  /* ============================================================== */
  /* 1. SVG SPRITE — TITAN PRO face + human-like robot              */
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
      <stop offset="0.5" stop-color="#25f4ee" stop-opacity="0.7"/>
      <stop offset="1"   stop-color="#0a3b46" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="tm-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="#dff8fb"/>
      <stop offset="0.5" stop-color="#7be6f1"/>
      <stop offset="1"   stop-color="#0a3b46"/>
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
    <filter id="tm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tm-bubble-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feOffset in="b" dx="0" dy="6" result="o"/>
      <feFlood flood-color="#000" flood-opacity="0.55"/>
      <feComposite in2="o" operator="in" result="o2"/>
      <feMerge><feMergeNode in="o2"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ============== TITAN PRO FACE LOGO (64x64) ============== -->
  <!-- Compact brand mark. Used as: topbar, hero, profile, mascot head. -->
  <symbol id="titan-face" viewBox="0 0 64 64">
    <!-- Outer glow ring -->
    <circle cx="32" cy="32" r="30" fill="url(#tm-gold)" opacity="0.18" filter="url(#tm-glow)"/>
    <!-- Rim -->
    <circle cx="32" cy="32" r="28" fill="url(#tm-glass-rim)"/>
    <!-- Glass face -->
    <circle cx="32" cy="32" r="24" fill="url(#tm-glass)"/>
    <!-- Specular highlight (top-left) -->
    <ellipse cx="22" cy="20" rx="9" ry="4" fill="#fff" opacity="0.55" transform="rotate(-25 22 20)"/>
    <ellipse cx="20" cy="18" rx="3" ry="1.4" fill="#fff" opacity="0.95"/>
    <!-- Antenna -->
    <line x1="32" y1="2" x2="32" y2="8" stroke="url(#tm-gold)" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="32" cy="2" r="1.8" fill="url(#tm-gold)"/>
    <!-- Ear pods -->
    <rect x="3" y="26" width="4" height="12" rx="2" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="0.8"/>
    <rect x="57" y="26" width="4" height="12" rx="2" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="0.8"/>
    <circle cx="5" cy="32" r="1" fill="url(#tm-gold)"/>
    <circle cx="59" cy="32" r="1" fill="url(#tm-gold)"/>
    <!-- Eyes (the soul of the logo) -->
    <g class="tm-eyes">
      <ellipse cx="22" cy="30" rx="4.5" ry="6" fill="#04141a"/>
      <circle class="tm-pupil" cx="22" cy="30" r="2.8" fill="url(#tm-eye)"/>
      <circle cx="20.5" cy="28" r="0.9" fill="#fff"/>
      <ellipse cx="42" cy="30" rx="4.5" ry="6" fill="#04141a"/>
      <circle class="tm-pupil" cx="42" cy="30" r="2.8" fill="url(#tm-eye)"/>
      <circle cx="40.5" cy="28" r="0.9" fill="#fff"/>
      <!-- Eyelids for blink -->
      <rect class="tm-lid tm-lid-l" x="17" y="24" width="10" height="12" rx="5" fill="url(#tm-glass)" opacity="0.96"/>
      <rect class="tm-lid tm-lid-r" x="37" y="24" width="10" height="12" rx="5" fill="url(#tm-glass)" opacity="0.96"/>
    </g>
    <!-- Smile -->
    <path class="tm-mouth" d="M25 42 Q32 47 39 42" stroke="#0a4a55" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <!-- Cheeks -->
    <circle cx="15" cy="40" r="2.5" fill="#fe2c55" opacity="0.25"/>
    <circle cx="49" cy="40" r="2.5" fill="#fe2c55" opacity="0.25"/>
    <!-- Chin gold band -->
    <path d="M14 50 Q32 56 50 50 L50 52 Q32 58 14 52 Z" fill="url(#tm-gold)" opacity="0.85"/>
    <circle cx="32" cy="53" r="0.9" fill="#fff4c2"/>
  </symbol>

  <!-- ============== HUMAN-LIKE ROBOT MASCOT (240x320) ============== -->
  <symbol id="titan-bot" viewBox="0 0 240 320">
    <!-- Antenna -->
    <g class="tm-antenna">
      <line x1="120" y1="14" x2="120" y2="34" stroke="url(#tm-gold)" stroke-width="2.8" stroke-linecap="round"/>
      <circle class="tm-ant-ball" cx="120" cy="12" r="5.5" fill="url(#tm-gold)" filter="url(#tm-glow)"/>
      <circle cx="119" cy="10" r="1.6" fill="#fff" opacity="0.95"/>
    </g>

    <!-- Floating shadow under feet -->
    <ellipse class="tm-shadow" cx="120" cy="306" rx="56" ry="7" fill="#000" opacity="0.4"/>

    <!-- Hover base / feet pads -->
    <ellipse cx="100" cy="298" rx="14" ry="5" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
    <ellipse cx="140" cy="298" rx="14" ry="5" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
    <circle cx="100" cy="298" r="2" fill="url(#tm-gold)"/>
    <circle cx="140" cy="298" r="2" fill="url(#tm-gold)"/>

    <!-- Legs / hover stand -->
    <rect x="92" y="262" width="16" height="38" rx="6" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
    <rect x="132" y="262" width="16" height="38" rx="6" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
    <!-- gold knee joints -->
    <circle cx="100" cy="278" r="2.4" fill="url(#tm-gold)"/>
    <circle cx="140" cy="278" r="2.4" fill="url(#tm-gold)"/>

    <!-- Waist / belt -->
    <rect x="78" y="252" width="84" height="14" rx="4" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
    <rect x="78" y="258" width="84" height="3" fill="url(#tm-gold)" opacity="0.85"/>
    <circle cx="120" cy="259" r="2.8" fill="#fff4c2"/>

    <!-- Torso / chest -->
    <g class="tm-body-grp">
      <path d="M76 172 Q70 158 86 148 L154 148 Q170 158 164 172 L168 244
               Q170 256 152 258 L88 258 Q70 256 72 244 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.6"/>
      <!-- Chest panel with TikTok palette -->
      <rect class="tm-chest-panel" x="92" y="170" width="56" height="60" rx="10" fill="url(#tm-chest)" opacity="0.95"/>
      <!-- T-mark -->
      <text class="tm-chest-t" x="120" y="212" text-anchor="middle"
            font-family="Plus Jakarta Sans, system-ui" font-size="30" font-weight="900"
            fill="#0a0b10" opacity="0.95">T</text>
      <!-- Small status LEDs -->
      <circle cx="98" cy="240" r="2" fill="url(#tm-gold)"/>
      <circle cx="106" cy="240" r="2" fill="#25f4ee"/>
      <circle cx="134" cy="240" r="2" fill="#fe2c55"/>
      <circle cx="142" cy="240" r="2" fill="url(#tm-gold)"/>
    </g>

    <!-- LEFT ARM (waving, with 5-finger hand) -->
    <g class="tm-arm-l" style="transform-origin:82px 170px">
      <!-- shoulder joint -->
      <circle cx="82" cy="170" r="8" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- upper arm -->
      <rect x="68" y="170" width="22" height="38" rx="10" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- elbow -->
      <circle cx="79" cy="208" r="6" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <circle cx="79" cy="208" r="2" fill="url(#tm-gold)"/>
      <!-- forearm -->
      <g class="tm-forearm-l" style="transform-origin:79px 208px">
        <rect x="68" y="208" width="22" height="34" rx="10" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
        <!-- 5-finger hand -->
        <g class="tm-hand-l" style="transform-origin:79px 250px">
          <ellipse cx="79" cy="252" rx="14" ry="13" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
          <!-- thumb -->
          <ellipse cx="64" cy="252" rx="3.5" ry="6" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.8" transform="rotate(-25 64 252)"/>
          <!-- 4 fingers (when waving: spread) -->
          <rect x="71" y="240" width="3" height="9" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6"/>
          <rect x="76" y="239" width="3" height="10" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6"/>
          <rect x="81" y="240" width="3" height="9" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6"/>
          <rect x="86" y="242" width="3" height="7" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6"/>
          <!-- Palm highlight -->
          <ellipse cx="76" cy="254" rx="6" ry="3" fill="#fff" opacity="0.3"/>
        </g>
      </g>
    </g>

    <!-- RIGHT ARM (with tablet, hand gives thumbs up) -->
    <g class="tm-arm-r" style="transform-origin:158px 170px">
      <circle cx="158" cy="170" r="8" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <rect x="150" y="170" width="22" height="38" rx="10" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <circle cx="161" cy="208" r="6" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <circle cx="161" cy="208" r="2" fill="url(#tm-gold)"/>
      <g class="tm-forearm-r" style="transform-origin:161px 208px">
        <rect x="150" y="208" width="22" height="34" rx="10" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
        <!-- Hand giving thumbs up -->
        <g class="tm-hand-r" style="transform-origin:161px 250px">
          <ellipse cx="161" cy="252" rx="13" ry="12" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
          <!-- thumb up (raised) -->
          <rect x="158" y="232" width="6" height="14" rx="3" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.8"/>
          <ellipse cx="161" cy="232" rx="3" ry="2" fill="#fff" opacity="0.5"/>
          <!-- curled fingers -->
          <rect x="153" y="252" width="3" height="8" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6" transform="rotate(20 154 252)"/>
          <rect x="158" y="254" width="3" height="8" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6" transform="rotate(5 159 254)"/>
          <rect x="163" y="254" width="3" height="8" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6" transform="rotate(-10 164 254)"/>
          <rect x="168" y="252" width="3" height="8" rx="1.5" fill="url(#tm-skin)" stroke="url(#tm-glass-rim)" stroke-width="0.6" transform="rotate(-25 169 252)"/>
        </g>
        <!-- Tablet (held in hand) -->
        <g class="tm-tablet">
          <rect x="172" y="220" width="42" height="56" rx="6" fill="#0a0b10" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
          <rect class="tm-tablet-screen" x="176" y="224" width="34" height="48" rx="4" fill="url(#tm-screen)" filter="url(#tm-glow)"/>
          <rect x="178" y="260" width="3" height="10" fill="#0a0b10" opacity="0.7"/>
          <rect x="184" y="254" width="3" height="16" fill="#0a0b10" opacity="0.7"/>
          <rect x="190" y="248" width="3" height="22" fill="#0a0b10" opacity="0.7"/>
          <rect x="196" y="242" width="3" height="28" fill="#0a0b10" opacity="0.7"/>
          <rect x="202" y="234" width="3" height="36" fill="#0a0b10" opacity="0.7"/>
          <circle cx="193" cy="234" r="3.5" fill="url(#tm-gold)"/>
        </g>
      </g>
    </g>

    <!-- NECK -->
    <rect x="110" y="140" width="20" height="12" rx="3" fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
    <rect x="112" y="146" width="16" height="2" fill="url(#tm-gold)" opacity="0.8"/>

    <!-- HEAD (uses the face design from titan-face) -->
    <g class="tm-head">
      <!-- Head dome -->
      <ellipse cx="120" cy="86" rx="60" ry="56" fill="url(#tm-glass-rim)"/>
      <ellipse cx="120" cy="86" rx="54" ry="48" fill="url(#tm-glass)"/>
      <!-- Specular -->
      <ellipse cx="96" cy="60" rx="26" ry="11" fill="#fff" opacity="0.5" transform="rotate(-25 96 60)"/>
      <ellipse cx="90" cy="56" rx="8" ry="3.6" fill="#fff" opacity="0.95"/>
      <!-- Antenna mount on head -->
      <rect x="115" y="30" width="10" height="6" rx="2" fill="url(#tm-gold)" opacity="0.9"/>
      <!-- Ear pods (headphones) -->
      <g class="tm-ear tm-ear-l">
        <rect x="54" y="74" width="14" height="26" rx="5" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.4"/>
        <circle cx="61" cy="87" r="3" fill="url(#tm-gold)"/>
        <path d="M68 76 Q72 70 76 76" stroke="url(#tm-gold)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <g class="tm-ear tm-ear-r">
        <rect x="172" y="74" width="14" height="26" rx="5" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.4"/>
        <circle cx="179" cy="87" r="3" fill="url(#tm-gold)"/>
        <path d="M164 76 Q168 70 172 76" stroke="url(#tm-gold)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <!-- Chin band -->
      <path d="M68 122 Q120 144 172 122 L172 128 Q120 150 68 128 Z" fill="url(#tm-gold)" opacity="0.85"/>
      <circle cx="120" cy="134" r="2.6" fill="#fff4c2"/>

      <!-- EYES (expressive: track cursor) -->
      <g class="tm-eyes">
        <g class="tm-eye tm-eye-l">
          <ellipse cx="100" cy="88" rx="14" ry="17" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:100px 88px">
            <circle cx="100" cy="88" r="9.5" fill="url(#tm-eye)"/>
            <circle cx="97" cy="84" r="2.8" fill="#fff"/>
            <circle cx="103" cy="92" r="1.4" fill="#fff" opacity="0.7"/>
          </g>
          <!-- sparkle -->
          <circle class="tm-sparkle tm-sparkle-l" cx="93" cy="82" r="1.4" fill="#fff" opacity="0.9"/>
        </g>
        <g class="tm-eye tm-eye-r">
          <ellipse cx="140" cy="88" rx="14" ry="17" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:140px 88px">
            <circle cx="140" cy="88" r="9.5" fill="url(#tm-eye)"/>
            <circle cx="137" cy="84" r="2.8" fill="#fff"/>
            <circle cx="143" cy="92" r="1.4" fill="#fff" opacity="0.7"/>
          </g>
          <circle class="tm-sparkle tm-sparkle-r" cx="133" cy="82" r="1.4" fill="#fff" opacity="0.9"/>
        </g>
        <!-- Eyebrows (animate with mood) -->
        <path class="tm-brow tm-brow-l" d="M86 70 Q100 64 114 70" stroke="#0a4a55" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.85"/>
        <path class="tm-brow tm-brow-r" d="M126 70 Q140 64 154 70" stroke="#0a4a55" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.85"/>
        <!-- Eyelids (blink) -->
        <rect class="tm-lid tm-lid-l" x="86" y="71" width="28" height="34" rx="14" fill="url(#tm-glass)" opacity="0.96"/>
        <rect class="tm-lid tm-lid-r" x="126" y="71" width="28" height="34" rx="14" fill="url(#tm-glass)" opacity="0.96"/>
      </g>

      <!-- Mouth (animates with mood) -->
      <g class="tm-mouth">
        <path class="tm-mouth-shape" d="M104 114 Q120 126 136 114"
              stroke="#0a4a55" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Cheeks -->
      <circle class="tm-cheek tm-cheek-l" cx="78" cy="108" r="8" fill="#fe2c55" opacity="0.22"/>
      <circle class="tm-cheek tm-cheek-r" cx="162" cy="108" r="8" fill="#fe2c55" opacity="0.22"/>
    </g>
  </symbol>

  <!-- TITAN FACE (alias for back-compat / new) -->
  <symbol id="titan-bot-sm" viewBox="0 0 64 64">
    <use href="#titan-face"/>
  </symbol>
</svg>
`;

  /* ============================================================== */
  /* 2. PERSONALITY + DYNAMIC INSTRUCTIONS                          */
  /* ============================================================== */
  const LINES = {
    greet: [
      "Halo! Aku Titan, analis pribadimu 👋",
      "Pilih akun di bawah, aku kasih insight-nya.",
      "Tip: pencet R untuk refresh data kapan aja."
    ],
    curious: [
      "Hmm, akun ini menarik. ER-nya kenceng.",
      "Konten media lokal lagi naik nih.",
      "Aku sempat liat pos viral mereka. Mantap.",
      "Coba cek pos teratasnya, ada yang gila."
    ],
    hype: [
      "Gila sih performa ini! Followers naik terus 🚀",
      "Cocok banget buat benchmark konten lo.",
      "Top-tier. Strategi nih!"
    ],
    sleepy: [
      "Sini, ada yang mau dijelasin?",
      "Aku standby di sini.",
      "Data baru udah masuk. Yuk intip."
    ],
    return: [
      "Aku balik! Lagi ngapain?",
      "Hei! Halo lagi 👋",
      "Wah, ada yang baru nih."
    ],
    leave: [
      "Kok pergi? Aku standby ya...",
      "Hati-hati! ✨",
      "Balik lagi ya, aku nunggu."
    ],
    success: [
      "Data berhasil diperbarui! ✨",
      "Done! Cek deh hasilnya.",
      "Mantap, semua udah update."
    ],
    error: [
      "Hmm, kayaknya ada masalah...",
      "Waduh error. Sabar ya.",
      "Aku gak bisa ambil datanya."
    ],
    point: [
      "Ini dia! 👉",
      "Lihat yang aku tunjuk!",
      "Coba cek yang ini."
    ],
    subpage: {
      'ardiantanah/ardiantanah-tiktok.html': [
        "Akun ardiantanah! Mix properti & komedi, kocak banget.",
        "Konten khas Lumajang, vibe-nya asik."
      ],
      'ardiantanah/index.html': [
        "ardiantanah ada di TikTok + IG, lengkap!",
        "Cek performa IG-nya juga, biasanya kuat di Reels."
      ],
      'majangmejeng-ig.html': [
        "Berita lokal Lumajang, hits di sore hari.",
        "Liputan viral mereka selalu rame."
      ],
      'majangmejeng/index.html': [
        "majangmejeng_ — jurnalis lokal yang konsisten.",
        "Update tiap hari, perfect buat referensi."
      ],
      'marketing/index.html': [
        "Kreator marketing, performanya stabil.",
        "Konten marketing-nya selalu on-point."
      ],
      'marketing/nisyanandaa-instagram.html': [
        "Nisyanandaa, kreator marketing aesthetic.",
        "Feed IG-nya rapi, branding kuat!"
      ],
      'syahfalahproperti-ig/index.html': [
        "Akun properti, listing-nya menarik.",
        "Properti lokal Lumajang, lengkap!"
      ],
      'syahfalahproperti/index.html': [
        "Syahfalah Properti, listing terbaik di Lumajang.",
        "Cek harganya, biasanya kompetitif."
      ]
    }
  };

  /* ============================================================== */
  /* 3. STATE                                                       */
  /* ============================================================== */
  const state = {
    mood: 'idle',        // idle | greeting | reacting | celebrating | sad | pointing
    cycleIdx: 0,
    pos: { x: 0, y: 0 },  // current viewport coords (top-left of bot)
    target: null,         // {x, y} destination
    speed: 0.4,           // px per frame at 60fps
    paused: false,        // true when reading / reacting
    pauseUntil: 0,
    greeted: sessionStorage.getItem(GREET_KEY) === '1',
    tutorialDone: localStorage.getItem(TUTOR_KEY) === '1',
    typing: false,
    eyes: { x: 0, y: 0 },
    walkStart: null,
    queue: [],
    dragging: false,
    scrollReporter: null
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
  width: 180px;
  height: 240px;
  user-select: none;
  touch-action: none;
  will-change: transform;
  filter: drop-shadow(0 18px 36px rgba(37, 244, 238, 0.18))
          drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
  transform: translate3d(0, 0, 0);
  transition: filter 300ms ease;
}
.titan-mascot svg {
  width: 100%; height: 100%;
  pointer-events: auto;
  cursor: grab;
  overflow: visible;
}
.titan-mascot.dragging svg { cursor: grabbing; }

/* Continuous motion on the bot */
.titan-mascot .tm-bot-grp {
  transform-origin: 120px 300px;
  animation: tm-bob 3.6s ease-in-out infinite;
}
@keyframes tm-bob {
  0%, 100% { transform: translateY(0) rotate(0); }
  25%      { transform: translateY(-4px) rotate(-1deg); }
  50%      { transform: translateY(-7px) rotate(0); }
  75%      { transform: translateY(-3px) rotate(1deg); }
}

.titan-mascot .tm-head {
  transform-origin: 120px 100px;
  animation: tm-head-tilt 5s ease-in-out infinite;
}
@keyframes tm-head-tilt {
  0%, 100% { transform: rotate(0); }
  30%      { transform: rotate(-2.5deg) translateY(-1px); }
  70%      { transform: rotate(2deg) translateY(1px); }
}

.titan-mascot .tm-ant-ball {
  transform-origin: 120px 12px;
  animation: tm-antenna-pulse 1.6s ease-in-out infinite;
}
@keyframes tm-antenna-pulse {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 0 #f5c14b); }
  50%      { transform: scale(1.3); filter: drop-shadow(0 0 8px #f5c14b); }
}

.titan-mascot .tm-shadow {
  transform-origin: 120px 306px;
  animation: tm-shadow-pulse 3.6s ease-in-out infinite;
}
@keyframes tm-shadow-pulse {
  0%, 100% { transform: scaleX(1); opacity: 0.4; }
  50%      { transform: scaleX(0.78); opacity: 0.24; }
}

.titan-mascot .tm-hand-l {
  transform-origin: 79px 252px;
  animation: tm-wave 2.4s ease-in-out infinite;
  animation-delay: 1.2s;
}
@keyframes tm-wave {
  0%, 65%, 100% { transform: rotate(0); }
  72%           { transform: rotate(-22deg); }
  80%           { transform: rotate(18deg); }
  88%           { transform: rotate(-12deg); }
}

.titan-mascot .tm-forearm-l {
  animation: tm-forearm-wave 2.4s ease-in-out infinite;
  animation-delay: 1.2s;
}
@keyframes tm-forearm-wave {
  0%, 65%, 100% { transform: rotate(0); }
  72%           { transform: rotate(-8deg); }
  80%           { transform: rotate(6deg); }
}

.titan-mascot .tm-tablet-screen {
  animation: tm-screen-flicker 2.8s ease-in-out infinite;
}
@keyframes tm-screen-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.8; }
}

.titan-mascot .tm-chest-panel {
  animation: tm-chest-shimmer 2.2s ease-in-out infinite;
}
@keyframes tm-chest-shimmer {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.2); }
}

.titan-mascot .tm-sparkle {
  animation: tm-sparkle 2s ease-in-out infinite;
}
.titan-mascot .tm-sparkle-r { animation-delay: 0.6s; }
@keyframes tm-sparkle {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(0.6); }
}

/* === Walking animation (leg swing) === */
.titan-mascot.walking .tm-arm-l { animation: tm-leg-swing 0.6s ease-in-out infinite; transform-origin: 82px 170px; }
.titan-mascot.walking .tm-arm-r { animation: tm-leg-swing 0.6s ease-in-out infinite reverse; transform-origin: 158px 170px; }
@keyframes tm-leg-swing {
  0%, 100% { transform: rotate(20deg); }
  50%      { transform: rotate(-20deg); }
}
.titan-mascot.walking .tm-bot-grp {
  animation: tm-walk-bounce 0.4s ease-in-out infinite;
}
@keyframes tm-walk-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
.titan-mascot.walking .tm-hand-l { animation: none; }  /* override wave while walking */

/* Pupils track cursor (CSS var) */
.titan-mascot .tm-pupil {
  transform: translate(var(--eye-x, 0px), var(--eye-y, 0px));
  transition: transform 220ms ease-out;
}

/* Blink */
.titan-mascot .tm-lid {
  transform-origin: center;
  transform: scaleY(0);
}
.titan-mascot.tm-blinking .tm-lid { animation: tm-blink 220ms ease-in-out; }
@keyframes tm-blink {
  0%, 100% { transform: scaleY(0); }
  50%      { transform: scaleY(1); }
}

/* === Mood: sad === */
.titan-mascot.tm-sad .tm-mouth-shape {
  transform: scaleY(-1) translateY(-12px);
  transform-origin: 120px 124px;
  stroke: #0a4a55;
}
.titan-mascot.tm-sad .tm-brow { transform: translateY(4px); }
.titan-mascot.tm-sad .tm-eye ellipse:first-child { fill: #0a1a22; }
.titan-mascot.tm-sad .tm-pupil { opacity: 0.55; }
.titan-mascot.tm-sad .tm-hand-l { animation: none; transform: rotate(30deg); transform-origin: 79px 252px; }
.titan-mascot.tm-sad .tm-arm-l { transform: rotate(8deg); transform-origin: 82px 170px; }
.titan-mascot.tm-sad .tm-head { animation: tm-sad-droop 2.4s ease-in-out infinite; }
@keyframes tm-sad-droop {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(3px) rotate(0.5deg); }
}

/* === Mood: happy (extra cheek + raise brows) === */
.titan-mascot.tm-happy .tm-cheek { opacity: 0.5; }
.titan-mascot.tm-happy .tm-brow { transform: translateY(-3px); }
.titan-mascot.tm-celebrate .tm-bot-grp { animation: tm-jump 800ms cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes tm-jump {
  0%   { transform: translateY(0) rotate(0); }
  30%  { transform: translateY(-28px) rotate(-5deg); }
  55%  { transform: translateY(-8px) rotate(3deg); }
  100% { transform: translateY(0) rotate(0); }
}

/* === Off-screen === */
.titan-mascot.tm-hidden { opacity: 0; }

/* === Speech bubble === */
.titan-bubble {
  position: absolute;
  z-index: 71;
  bottom: 100%;
  right: -20px;
  margin-bottom: 22px;
  max-width: 340px;
  min-width: 220px;
  padding: 16px 20px 18px 56px;
  background: linear-gradient(180deg, rgba(20, 24, 36, 0.95), rgba(10, 11, 16, 0.95));
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(245, 193, 75, 0.36);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(37, 244, 238, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: var(--text, #f4f6fb);
  font-family: var(--font-sans, 'Plus Jakarta Sans', sans-serif);
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.01em;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(10px) scale(0.94);
  transition: opacity 280ms ease, transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.titan-bubble.is-visible { opacity: 1; transform: translateY(0) scale(1); }
.titan-bubble::after {
  content: "";
  position: absolute;
  bottom: -8px;
  right: 40px;
  width: 18px; height: 18px;
  background: linear-gradient(135deg, rgba(20, 24, 36, 0.95), rgba(10, 11, 16, 0.95));
  border-right: 1px solid rgba(245, 193, 75, 0.36);
  border-bottom: 1px solid rgba(245, 193, 75, 0.36);
  transform: rotate(45deg);
}
.titan-bubble .face {
  position: absolute;
  top: 14px; left: 14px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #0a0b10;
  box-shadow: 0 2px 8px rgba(37, 244, 238, 0.5);
  font-family: var(--font-display, sans-serif);
}
.titan-bubble .voice {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #25f4ee;
  margin-right: 8px;
  vertical-align: middle;
  animation: tm-voice 1.4s ease-in-out infinite;
}
@keyframes tm-voice {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1.2); }
}
.titan-bubble .text { display: inline; }
.titan-bubble .text::after {
  content: "▌";
  margin-left: 2px;
  color: #25f4ee;
  animation: tm-caret 800ms steps(1) infinite;
}
.titan-bubble.done .text::after { content: ""; }
.titan-bubble .close {
  position: absolute;
  top: 8px; right: 8px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.16);
  color: #f4f6fb;
}
.titan-bubble .next {
  position: absolute;
  bottom: 8px; right: 12px;
  background: none;
  border: 0;
  color: #25f4ee;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 150ms;
}
.titan-bubble .next:hover { opacity: 1; }
.titan-bubble .next[hidden] { display: none; }
.titan-bubble .progress {
  position: absolute;
  bottom: 4px; left: 56px; right: 86px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
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
.titan-bubble .label {
  position: absolute;
  top: 8px; left: 56px;
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f5c14b;
  opacity: 0.7;
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

/* === Target highlight (pointTo) === */
.tm-target-glow {
  position: relative;
}
.tm-target-glow::after {
  content: "";
  position: absolute;
  inset: -8px;
  border: 2px solid #f5c14b;
  border-radius: 16px;
  pointer-events: none;
  animation: tm-target-ring 1.6s ease-in-out infinite;
}
@keyframes tm-target-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.04); }
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .titan-mascot, .titan-mascot *, .titan-bubble, .titan-bubble * {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
  }
  .titan-mascot { transition: opacity 200ms ease !important; }
}

/* === Topbar face === */
.brand-mark {
  width: 32px; height: 32px;
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
  let mascot, bubble, bubbleText, bubbleFace, bubbleLabel, bubbleClose, bubbleNext, bubbleProgress, groupG, bodyEl;

  function buildMascot() {
    if (mascot) return;
    mascot = document.createElement('div');
    mascot.className = 'titan-mascot tm-hidden tm-entering';
    mascot.setAttribute('role', 'img');
    mascot.setAttribute('aria-label', 'TITAN PRO — maskot analis');
    mascot.innerHTML = `
      <div class="tm-bot-grp">
        <svg viewBox="0 0 240 320" aria-hidden="true" style="overflow:visible">
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
      <span class="label" aria-hidden="true">TITAN PRO</span>
      <span class="voice" aria-hidden="true"></span>
      <span class="text"></span>
      <button class="close" type="button" aria-label="Tutup">×</button>
      <button class="next" type="button" hidden>Lanjut →</button>
      <span class="progress" aria-hidden="true"><span></span></span>
    `;
    mascot.appendChild(bubble);
    bubbleText = bubble.querySelector('.text');
    bubbleFace = bubble.querySelector('.face');
    bubbleLabel = bubble.querySelector('.label');
    bubbleClose = bubble.querySelector('.close');
    bubbleNext = bubble.querySelector('.next');
    bubbleProgress = bubble.querySelector('.progress span');

    bubbleClose.addEventListener('click', hideBubble);
    bubbleNext.addEventListener('click', nextLine);

    groupG = mascot.querySelector('.tm-bot-grp');
    bodyEl = mascot;
  }

  /* ============================================================== */
  /* 6. POSITION + PERSISTENCE                                      */
  /* ============================================================== */
  function loadPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }
  function savePos(p) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch {}
  }
  function defaultPos() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.max(20, w - 240),
      y: Math.max(20, h - 280)
    };
  }
  function applyPos(p) {
    if (!mascot || !p) return;
    mascot.style.left = p.x + 'px';
    mascot.style.top  = p.y + 'px';
    mascot.style.right = 'auto';
    mascot.style.bottom = 'auto';
  }
  function clampPos(p) {
    const w = window.innerWidth, h = window.innerHeight;
    const mw = 180, mh = 240;
    return {
      x: Math.max(8, Math.min(w - mw - 8, p.x)),
      y: Math.max(8, Math.min(h - mh - 8, p.y))
    };
  }
  function setPos(p) {
    state.pos = clampPos(p);
    applyPos(state.pos);
  }

  /* ============================================================== */
  /* 7. EYE TRACKING                                                */
  /* ============================================================== */
  const EYE_RANGE = 5.5;
  function onMouseMove(e) {
    if (state.dragging || !mascot) return;
    if (state.mood === 'sad') return;
    const cx = e.clientX, cy = e.clientY;
    const r = mascot.getBoundingClientRect();
    if (r.width === 0) return;
    const fx = r.left + r.width * 0.5;
    const fy = r.top  + r.height * 0.32;  // head center
    const range = Math.max(r.width, r.height) * 0.7;
    let dx = (cx - fx) / range;
    let dy = (cy - fy) / range;
    const d = Math.hypot(dx, dy);
    if (d > 1) { dx /= d; dy /= d; }
    state.eyes.x = dx * EYE_RANGE;
    state.eyes.y = dy * EYE_RANGE;
    mascot.style.setProperty('--eye-x', state.eyes.x.toFixed(2) + 'px');
    mascot.style.setProperty('--eye-y', state.eyes.y.toFixed(2) + 'px');
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
      const delay = 2600 + Math.random() * 3800;
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
  /* 9. SPEECH BUBBLE                                                */
  /* ============================================================== */
  function showLine(text, opts = {}) {
    if (!mascot) return;
    if (!text) return;
    bubbleText.textContent = '';
    bubble.classList.remove('done');
    bubble.classList.add('is-visible');
    bubbleProgress.style.width = '0%';
    if (bubbleLabel) {
      bubbleLabel.textContent = opts.label || 'TITAN PRO';
    }
    if (opts.queue && opts.queue.length) {
      bubbleNext.hidden = false;
    } else {
      bubbleNext.hidden = true;
    }
    typeText(text, opts.duration);
  }
  function typeText(text, durationMs) {
    state.typing = true;
    state.mood = 'greeting';
    const dur = durationMs || Math.min(8000, 1600 + text.length * 32);
    const charTime = Math.max(14, Math.min(40, dur / text.length));
    let i = 0;
    function step() {
      i++;
      bubbleText.textContent = text.slice(0, i);
      if (i < text.length) {
        setTimeout(step, charTime);
      } else {
        bubble.classList.add('done');
        state.typing = false;
        state.mood = 'idle';
        if (durationMs !== 0) {
          const elapsed = i * charTime;
          const remaining = Math.max(1500, dur - elapsed);
          setTimeout(() => hideBubble(), remaining);
        }
      }
    }
    setTimeout(step, 60);
    bubbleProgress.style.transition = `width ${dur}ms linear`;
    requestAnimationFrame(() => { bubbleProgress.style.width = '100%'; });
  }
  function hideBubble() {
    if (!bubble) return;
    bubble.classList.remove('is-visible');
    bubbleNext.hidden = true;
  }
  function nextLine() {
    if (state.queue.length === 0) { hideBubble(); return; }
    const nxt = state.queue.shift();
    showLine(nxt, { queue: state.queue });
  }
  function say(text, opts = {}) {
    state.queue = opts.queue || [];
    showLine(text, opts);
  }
  function speakFromPool(pool, opts = {}) {
    if (state.typing) { state.queue.push(...pool); return; }
    if (state.mood !== 'idle' && !opts.force) { state.queue.push(...pool); return; }
    const text = pool[state.cycleIdx++ % pool.length];
    say(text, { queue: pool.slice(state.cycleIdx % pool.length), duration: opts.duration });
  }

  /* ============================================================== */
  /* 10. MOOD API                                                   */
  /* ============================================================== */
  function setMood(m) {
    if (!mascot) return;
    mascot.classList.remove('tm-sad', 'tm-happy', 'tm-celebrate');
    state.mood = m;
  }
  function happy() { setMood('happy'); mascot.classList.add('tm-happy'); }
  function sad()   { setMood('sad');   mascot.classList.add('tm-sad'); }
  function celebrate() {
    setMood('happy');
    mascot.classList.add('tm-happy', 'tm-celebrate');
    setTimeout(() => mascot.classList.remove('tm-celebrate'), 850);
  }

  /* ============================================================== */
  /* 11. POINT-TO                                                   */
  /* ============================================================== */
  let pointTargetEl = null;
  function pointTo(selector, line) {
    if (!mascot) return;
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!target) return;
    if (state.mood === 'pointing') clearPointTo();
    state.mood = 'pointing';
    target.classList.add('tm-target-glow');
    pointTargetEl = target;
    if (line) say(line, { queue: LINES.point });
    else say(LINES.point[state.cycleIdx++ % LINES.point.length], { queue: LINES.point });
    setTimeout(() => clearPointTo(), 3500);
  }
  function clearPointTo() {
    if (pointTargetEl) pointTargetEl.classList.remove('tm-target-glow');
    pointTargetEl = null;
    if (state.mood === 'pointing') state.mood = 'idle';
  }

  /* ============================================================== */
  /* 12. FREE-ROAM (autonomous walker)                              */
  /* ============================================================== */
  function pickTarget() {
    const w = window.innerWidth, h = window.innerHeight;
    const pad = 24;
    const minX = pad, maxX = w - 180 - pad;
    const minY = pad, maxY = h - 240 - pad;
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }
  function pickDomTarget() {
    // Pick a UI element the bot could walk to
    const candidates = [
      ...document.querySelectorAll('.row[data-handle]'),
      ...document.querySelectorAll('.kpi'),
      ...document.querySelectorAll('.section-title'),
      ...document.querySelectorAll('.btn-refresh')
    ];
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - 90,  // center the 180-wide bot
      y: r.top + r.height / 2 - 120  // center the 240-tall bot
    };
  }
  function walkTo(x, y) {
    state.target = clampPos({ x, y });
    state.walkStart = { x: state.pos.x, y: state.pos.y };
    state.paused = false;
    mascot.classList.add('walking');
  }
  function stopWalking() {
    state.target = null;
    mascot.classList.remove('walking');
  }
  function tickWalk() {
    if (!mascot) return;
    if (state.dragging) return;
    if (!state.target) {
      // No target — pick a new one
      if (Date.now() < state.pauseUntil) {
        requestAnimationFrame(tickWalk);
        return;
      }
      if (Math.random() < 0.55) {
        // Walk to a random DOM element
        const el = pickDomTarget();
        if (el) {
          const c = centerOf(el);
          if (Math.hypot(c.x - state.pos.x, c.y - state.pos.y) > 80) {
            walkTo(c.x, c.y);
            requestAnimationFrame(tickWalk);
            return;
          }
        }
      }
      // Walk to a random viewport point
      const t = pickTarget();
      if (Math.hypot(t.x - state.pos.x, t.y - state.pos.y) > 60) {
        walkTo(t.x, t.y);
      } else {
        // No movement, schedule another decision
        state.pauseUntil = Date.now() + 3000 + Math.random() * 4000;
      }
      requestAnimationFrame(tickWalk);
      return;
    }
    // Move toward target
    const dx = state.target.x - state.pos.x;
    const dy = state.target.y - state.pos.y;
    const dist = Math.hypot(dx, dy);
    const SPEED = state.speed * 1.4;  // px per frame
    if (dist < SPEED) {
      setPos(state.target);
      stopWalking();
      // Pause here, then act
      onArrive();
      state.pauseUntil = Date.now() + 2500 + Math.random() * 3500;
      requestAnimationFrame(tickWalk);
      return;
    }
    const nx = state.pos.x + (dx / dist) * SPEED;
    const ny = state.pos.y + (dy / dist) * SPEED;
    setPos({ x: nx, y: ny });
    requestAnimationFrame(tickWalk);
  }
  function onArrive() {
    // Read DOM at the bot's current position
    const cx = state.pos.x + 90;
    const cy = state.pos.y + 120;
    const el = document.elementFromPoint(cx, cy);
    if (el) readElement(el);
  }
  function readElement(el) {
    if (!el) return;
    // KPI value
    const kpi = el.closest('.kpi');
    if (kpi) {
      const v = kpi.querySelector('.value')?.textContent?.trim();
      const l = kpi.querySelector('.label')?.textContent?.trim();
      if (v && l) {
        const lines = [
          `KPI ${l}: ${v}. ${commentOnKpi(l, v)}`,
          `${l} tuh ${v}. ${commentOnKpi(l, v)}`,
          `Ini ${v} di ${l}. ${commentOnKpi(l, v)}`
        ];
        say(lines[Math.floor(Math.random() * lines.length)], { duration: 5500, label: 'DATA' });
        return;
      }
    }
    // Account row
    const row = el.closest('.row[data-handle]');
    if (row) {
      const h = row.getAttribute('data-handle') || row.querySelector('.handle')?.textContent?.trim();
      if (h) say(`Akun @${h.replace('@','')}. Mau lihat detailnya?`, { duration: 4500, label: 'AKUN' });
      return;
    }
    // Section title
    const sect = el.closest('.section');
    if (sect) {
      const t = sect.querySelector('.section-title')?.textContent?.trim();
      if (t) say(`Section ${t}. Scroll buat lihat isinya.`, { duration: 4000, label: 'SECTION' });
      return;
    }
    // Refresh button
    if (el.id === 'refreshBtn' || el.closest('#refreshBtn')) {
      say('Tombol refresh! Pencet untuk ambil data terbaru.', { duration: 4000, label: 'CTA' });
    }
  }
  function commentOnKpi(label, value) {
    const v = value.toLowerCase();
    if (/^\d+(\.\d+)?[km]?$/.test(value)) {
      // numeric
      if (label.toLowerCase().includes('engagement')) {
        const num = parseFloat(v);
        if (num >= 5) return `Bagus banget, di atas rata-rata!`;
        if (num >= 3) return `Lumayan, bisa di-improve.`;
        return `Agak rendah nih, coba bikin konten yang lebih engaging.`;
      }
      if (label.toLowerCase().includes('follower')) {
        if (v.includes('k') || v.includes('m')) return `Followersnya udah solid!`;
        return `Masih tahap growth nih, semangat!`;
      }
      if (label.toLowerCase().includes('view') || label.toLowerCase().includes('tayang')) {
        return `Views yang bagus, kontennya menarik.`;
      }
    }
    return 'Menarik nih datanya.';
  }

  /* ============================================================== */
  /* 13. TUTORIAL (first visit)                                     */
  /* ============================================================== */
  function runTutorial() {
    if (state.tutorialDone) return;
    const path = (location.pathname.replace(/^\/|\/$/g, '') || 'index.html').toLowerCase();
    const isHome = path === 'index.html' || path === '' || path.endsWith('index.html') && !path.includes('/');
    const steps = [];
    if (isHome) {
      const firstRow = document.querySelector('[data-handle]');
      const tt = document.querySelector('.tt') || firstRow;
      const refresh = document.getElementById('refreshBtn');
      steps.push({ text: "Hai! Aku Titan. Aku analis pribadimu 👋 Klik salah satu akun di bawah untuk lihat detail.", label: 'TUTORIAL' });
      if (firstRow) steps.push({ selector: firstRow, text: "Coba klik akun ini buat lihat analytics lengkap.", label: 'STEP 1' });
      if (refresh) steps.push({ selector: refresh, text: "Atau pencet R di keyboard untuk refresh data.", label: 'STEP 2' });
    } else {
      const kpi = document.querySelector('.kpi');
      const firstSection = document.querySelector('.section-title');
      steps.push({ text: "Selamat datang! Aku Titan. Aku bakal guide kamu jelajah halaman ini.", label: 'TUTORIAL' });
      if (kpi) steps.push({ selector: kpi, text: "Ini KPI utama. Hover aku di atas salah satu buat aku baca angkanya.", label: 'STEP 1' });
      if (firstSection) steps.push({ selector: firstSection, text: "Gulir ke bawah buat lihat analisis lengkap per section.", label: 'STEP 2' });
    }
    let i = 0;
    function next() {
      if (i >= steps.length) {
        localStorage.setItem(TUTOR_KEY, '1');
        state.tutorialDone = true;
        return;
      }
      const s = steps[i++];
      if (s.selector) pointTo(s.selector, s.text);
      else say(s.text, { duration: 6000, label: s.label });
      setTimeout(next, 6500);
    }
    setTimeout(next, 2500);
  }

  /* ============================================================== */
  /* 14. SCROLL REPORTER                                            */
  /* ============================================================== */
  function setupScrollReporter() {
    if (reduced) return;
    let lastReport = 0;
    let lastScrollY = window.scrollY;
    let docHeight = 0;
    function recompute() {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    }
    recompute();
    window.addEventListener('resize', recompute);
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const cur = window.scrollY;
        const dir = cur - lastScrollY;
        if (Math.abs(dir) > 40) {
          const pct = docHeight > 0 ? Math.round((cur / docHeight) * 100) : 0;
          if (Date.now() - lastReport > 8000 && state.mood === 'idle' && !state.typing) {
            if (pct >= 25 && pct < 35) {
              say(`Kamu udah di ${pct}% halaman. Lanjut!`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            } else if (pct >= 55 && pct < 65) {
              say(`Hampir setengah jalan! ${pct}% done.`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            } else if (pct >= 85) {
              say(`Wow, ${pct}%! Hampir selesai!`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            }
          }
        }
        lastScrollY = cur;
      });
    }, { passive: true });
  }

  /* ============================================================== */
  /* 15. DRAGGING (overrides walk)                                  */
  /* ============================================================== */
  function setupDrag() {
    if (reduced) return;
    let startX, startY, origX, origY, didDrag = false;
    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const pt = pointerXY(e);
      startX = pt.x; startY = pt.y;
      const r = mascot.getBoundingClientRect();
      origX = r.left; origY = r.top;
      mascot.classList.add('dragging');
      state.dragging = true;
      stopWalking();
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
      mascot.style.transition = 'none';
      mascot.style.left = (origX + dx) + 'px';
      mascot.style.top  = (origY + dy) + 'px';
    }
    function onUp() {
      mascot.classList.remove('dragging');
      state.dragging = false;
      window.removeEventListener('pointermove', onMove);
      const r = mascot.getBoundingClientRect();
      setPos({ x: r.left, y: r.top });
      savePos(state.pos);
      if (didDrag) {
        happy();
        const lines = [
          "Oke, aku di sini ya!",
          "Hati-hati ya, jangan jatuhkan aku 😅",
          "Mantap! Posisiku tersimpan.",
          "Wkwk, mau ditaruh dimana nih?"
        ];
        say(lines[Math.floor(Math.random() * lines.length)], { duration: 3500 });
      }
      setTimeout(() => { mascot.style.transition = ''; }, 50);
    }
    function pointerXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    mascot.addEventListener('pointerdown', onDown);
    mascot.addEventListener('touchstart', onDown, { passive: true });
  }

  /* ============================================================== */
  /* 16. IDLE / AWAY                                                */
  /* ============================================================== */
  function setupAway() {
    let away = false;
    function leave() {
      if (away) return;
      away = true;
      sad();
      const lines = ["Kok pergi? Aku nunggu ya...", "Hati-hati! ✨", "Balik lagi ya."];
      say(lines[Math.floor(Math.random() * lines.length)], { duration: 3500 });
    }
    function back() {
      if (!away) return;
      away = false;
      happy();
      const lines = ["Aku balik! Kangen gak?", "Halo! Lagi ngapain?", "Wah, ada yang baru nih!"];
      say(lines[Math.floor(Math.random() * lines.length)], { duration: 3500 });
    }
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', back);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) leave(); else back();
    });
  }
  function setupIdleChatter() {
    function schedule() {
      const delay = 25000 + Math.random() * 25000;
      setTimeout(() => {
        if (!mascot || mascot.classList.contains('tm-hidden')) { schedule(); return; }
        if (state.mood === 'idle' && !state.typing && !state.dragging) {
          const groups = [LINES.curious, LINES.hype, LINES.sleepy];
          speakFromPool(groups[state.cycleIdx++ % groups.length]);
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  /* ============================================================== */
  /* 17. ROW HOVER REACTIONS                                        */
  /* ============================================================== */
  function setupReactions() {
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('[data-handle]');
      if (card) reactToCard(card);
      const cta = e.target.closest('[data-cta], .btn-refresh');
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
    say(line, { duration: 4500, label: 'AKUN' });
    setMood('idle');
  }
  function ctaReaction(cta) {
    if (state.mood !== 'idle') return;
    if (cta.id === 'refreshBtn') {
      const lines = ["Tekan R untuk refresh!", "Pencet aku untuk ambil data baru.", "Refresh?"];
      say(lines[Math.floor(Math.random() * lines.length)], { duration: 3000, label: 'CTA' });
    }
  }

  /* ============================================================== */
  /* 18. R-KEY                                                      */
  /* ============================================================== */
  function setupRKey() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const btn = document.getElementById('refreshBtn');
        if (btn) {
          say("Menyegarkan data…", { duration: 1500, label: 'REFRESH' });
          setTimeout(() => {
            if (Math.random() < 0.8) {
              celebrate();
              say("Data berhasil diperbarui! ✨", { duration: 3000, label: 'SUCCESS' });
            } else {
              sad();
              say("Waduh, kayaknya ada masalah...", { duration: 3000, label: 'ERROR' });
            }
          }, 1200);
        }
      }
    });
  }

  /* ============================================================== */
  /* 19. CLICK ON MASCOT                                            */
  /* ============================================================== */
  function setupClick() {
    mascot.addEventListener('click', (e) => {
      if (state.dragging) return;
      e.stopPropagation();
      const groups = [LINES.curious, LINES.hype, LINES.sleepy, LINES.greet];
      happy();
      speakFromPool(groups[state.cycleIdx++ % groups.length], { force: true });
    });
  }

  /* ============================================================== */
  /* 20. UPGRADE BRAND MARKS (everywhere)                            */
  /* ============================================================== */
  function upgradeBrandMarks() {
    // All .brand-mark use href="#titan-orb-sm" / "#titan-bot-sm" → "#titan-face"
    document.querySelectorAll('.brand-mark').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(orb-sm|bot-sm|mark-sm)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
    // Profile marks (sub-page avatar)
    document.querySelectorAll('.profile-mark').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(mark|orb|bot)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
    // Hero mascots
    document.querySelectorAll('.hero-mascot').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(orb|bot|mark)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
  }

  /* ============================================================== */
  /* 21. INIT                                                        */
  /* ============================================================== */
  function init() {
    injectSprite();
    injectStyles();
    buildMascot();
    upgradeBrandMarks();

    // Position
    state.pos = loadPos() || defaultPos();
    state.pos = clampPos(state.pos);
    applyPos(state.pos);

    setupEyeTracking();
    setupBlink();
    setupDrag();
    setupAway();
    setupIdleChatter();
    setupReactions();
    setupRKey();
    setupClick();
    setupScrollReporter();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mascot.classList.remove('tm-hidden');
        setTimeout(() => mascot.classList.remove('tm-entering'), 900);

        if (!state.greeted) {
          state.greeted = true;
          sessionStorage.setItem(GREET_KEY, '1');
          setTimeout(() => {
            say(LINES.greet[0], { queue: LINES.greet.slice(1), duration: 7000, label: 'GREETING' });
            setTimeout(() => {
              runTutorial();
            }, 7000);
          }, 1200);
        } else {
          setTimeout(() => {
            say(LINES.greet[state.cycleIdx++ % LINES.greet.length], { duration: 4500, label: 'WELCOME' });
          }, 800);
        }
        // Start free-roam
        state.pauseUntil = Date.now() + 2000;
        requestAnimationFrame(tickWalk);
      });
    });

    window.addEventListener('resize', () => {
      state.pos = clampPos(state.pos);
      applyPos(state.pos);
    });
  }

  /* ============================================================== */
  /* 22. PUBLIC API                                                  */
  /* ============================================================== */
  window.TitanMascot = {
    say, happy, sad, celebrate, pointTo,
    walkTo(x, y) {
      const t = typeof x === 'number' ? { x, y } : x;
      walkTo(t.x, t.y);
    },
    spin() {
      if (!mascot || reduced) return;
      const grp = mascot.querySelector('.tm-bot-grp');
      if (grp) {
        grp.style.transition = 'transform 700ms linear';
        grp.style.transform = 'rotate(360deg)';
        setTimeout(() => { grp.style.transition = ''; grp.style.transform = ''; }, 750);
      }
    },
    hide() { mascot.classList.add('tm-hidden'); stopWalking(); },
    show() { mascot.classList.remove('tm-hidden'); state.pauseUntil = Date.now(); requestAnimationFrame(tickWalk); },
    get mood() { return state.mood; },
    get pos() { return { ...state.pos }; },
    dispose() {
      mascot?.remove();
      document.getElementById('tm-sprite')?.remove();
      document.getElementById('tm-style')?.remove();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
