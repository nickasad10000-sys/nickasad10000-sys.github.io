/* TITAN PRO AI · Mascot system (V4)
 * ------------------------------------------------------------------
 *  - 3D robot character (titan-bot): glass head, glowing eyes,
 *    antenna, body with cyan chest + gold accent, left hand waving,
 *    right hand holding a glowing tablet. SVG sprite + behavior.
 *  - Interactive:
 *      · eyes follow the cursor (CSS vars --eye-x / --eye-y)
 *      · natural blink every 3–6s (CSS, 150ms)
 *      · mood API: .sad() / .happy() / .celebrate() / .pointTo(sel)
 *      · R-key spin (refresh)
 *  - Reduced motion safe. Public API on window.TitanMascot.
 *  - Loaded via <script src="./titan-mascot.js" defer></script>
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.TitanMascot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================== */
  /* 1. SVG SPRITE                                                  */
  /* ============================================================== */
  const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <!-- Glossy glass material (head + body) -->
    <linearGradient id="tm-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"  stop-color="#e8fbff" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="#6df8f3" stop-opacity="0.55"/>
      <stop offset="1"  stop-color="#0a3b46" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="tm-glass-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"  stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="#25f4ee" stop-opacity="0.6"/>
      <stop offset="1"  stop-color="#0a3b46" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="tm-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#11323b"/>
      <stop offset="1" stop-color="#06141b"/>
    </linearGradient>
    <linearGradient id="tm-chest" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"  stop-color="#25f4ee"/>
      <stop offset="0.5" stop-color="#5be7ff"/>
      <stop offset="1"  stop-color="#fe2c55"/>
    </linearGradient>
    <radialGradient id="tm-eye" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0"  stop-color="#ffffff"/>
      <stop offset="0.25" stop-color="#a8feff"/>
      <stop offset="0.7" stop-color="#25f4ee"/>
      <stop offset="1"  stop-color="#0a4a55"/>
    </radialGradient>
    <radialGradient id="tm-gold" cx="0.3" cy="0.3" r="0.9">
      <stop offset="0"  stop-color="#fff4c2"/>
      <stop offset="0.45" stop-color="#f5c14b"/>
      <stop offset="1"  stop-color="#8b6914"/>
    </radialGradient>
    <radialGradient id="tm-screen" cx="0.3" cy="0.3" r="0.95">
      <stop offset="0"  stop-color="#a8feff"/>
      <stop offset="0.6" stop-color="#25f4ee"/>
      <stop offset="1"  stop-color="#06494f"/>
    </radialGradient>
    <!-- Soft glow filter -->
    <filter id="tm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tm-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="0.6"/>
    </filter>
    <!-- Specular highlight (claymorphism gloss) -->
    <filter id="tm-spec" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b"/>
      <feSpecularLighting in="b" surfaceScale="3" specularConstant="0.6"
                          specularExponent="22" lighting-color="#ffffff" result="s">
        <fePointLight x="-60" y="-60" z="120"/>
      </feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
      <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
  </defs>

  <!-- =================== TITAN BOT (full 3D) 200x220 =================== -->
  <symbol id="titan-bot" viewBox="0 0 200 220">
    <!-- Antenna -->
    <g class="tm-antenna">
      <line x1="100" y1="20" x2="100" y2="34" stroke="url(#tm-gold)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="100" cy="18" r="4.2" fill="url(#tm-gold)" filter="url(#tm-glow)"/>
      <circle cx="99"  cy="17" r="1.3" fill="#fff" opacity="0.9"/>
    </g>

    <!-- Shadow under bot -->
    <ellipse cx="100" cy="208" rx="55" ry="6" fill="#000" opacity="0.35"/>

    <!-- Body / torso (claymorphism) -->
    <g class="tm-body-grp">
      <path d="M64 116 Q60 108 70 100 L130 100 Q140 108 136 116 L138 178
               Q140 192 124 196 L76 196 Q60 192 62 178 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.4"/>
      <!-- Chest panel with cyan/pink gradient -->
      <rect x="78" y="118" width="44" height="44" rx="10" fill="url(#tm-chest)" opacity="0.92"/>
      <!-- Chest "T" mark -->
      <text x="100" y="148" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui"
            font-size="22" font-weight="800" fill="#0a0b10" opacity="0.92">T</text>
      <!-- Gold belt -->
      <rect x="64" y="160" width="72" height="6" fill="url(#tm-gold)" opacity="0.85"/>
      <circle cx="100" cy="163" r="3.2" fill="#fff4c2"/>
    </g>

    <!-- Left arm (waving) -->
    <g class="tm-arm-l" style="transform-origin:68px 120px">
      <path d="M68 120 Q44 110 36 76 Q34 64 46 60 Q56 60 60 70
               L70 110 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- Hand (waving palm) -->
      <g class="tm-hand-l">
        <circle cx="42" cy="58" r="11" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
        <circle cx="39" cy="55" r="2" fill="#fff" opacity="0.8"/>
        <path d="M37 60 Q42 64 47 60" stroke="#0a4a55" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
    </g>

    <!-- Right arm holding tablet -->
    <g class="tm-arm-r" style="transform-origin:132px 120px">
      <path d="M132 120 Q156 112 162 134 Q164 144 154 148
               L138 144 Z"
            fill="url(#tm-body)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- Hand -->
      <circle cx="156" cy="140" r="9" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
      <!-- Tablet / screen -->
      <g class="tm-tablet">
        <rect x="148" y="118" width="34" height="44" rx="5" fill="#0a0b10" stroke="url(#tm-glass-rim)" stroke-width="1.2"/>
        <rect x="151" y="121" width="28" height="36" rx="3" fill="url(#tm-screen)" filter="url(#tm-glow)"/>
        <!-- mini chart bars on screen -->
        <rect x="153" y="148" width="3" height="6" fill="#0a0b10" opacity="0.7"/>
        <rect x="158" y="144" width="3" height="10" fill="#0a0b10" opacity="0.7"/>
        <rect x="163" y="140" width="3" height="14" fill="#0a0b10" opacity="0.7"/>
        <rect x="168" y="136" width="3" height="18" fill="#0a0b10" opacity="0.7"/>
        <rect x="173" y="130" width="3" height="24" fill="#0a0b10" opacity="0.7"/>
        <!-- T-mark on tablet -->
        <circle cx="165" cy="129" r="3" fill="url(#tm-gold)"/>
      </g>
    </g>

    <!-- HEAD (glass orb) — the main visual -->
    <g class="tm-head">
      <!-- outer rim with gold accent -->
      <ellipse cx="100" cy="70" rx="48" ry="42" fill="url(#tm-glass-rim)"/>
      <!-- glass interior -->
      <ellipse cx="100" cy="70" rx="42" ry="36" fill="url(#tm-glass)"/>
      <!-- specular highlight (top-left) -->
      <ellipse cx="80" cy="50" rx="20" ry="10" fill="#ffffff" opacity="0.45" transform="rotate(-25 80 50)"/>
      <ellipse cx="76" cy="46" rx="6" ry="3" fill="#ffffff" opacity="0.9"/>
      <!-- gold chin band -->
      <path d="M58 96 Q100 116 142 96 L142 100 Q100 120 58 100 Z" fill="url(#tm-gold)" opacity="0.85"/>
      <circle cx="100" cy="106" r="2.2" fill="#fff4c2"/>

      <!-- Ear pods (gold + cyan) -->
      <g class="tm-ear tm-ear-l">
        <rect x="50" y="60" width="10" height="20" rx="3" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.2"/>
        <circle cx="55" cy="70" r="2" fill="url(#tm-gold)"/>
      </g>
      <g class="tm-ear tm-ear-r">
        <rect x="140" y="60" width="10" height="20" rx="3" fill="url(#tm-body)" stroke="url(#tm-gold)" stroke-width="1.2"/>
        <circle cx="145" cy="70" r="2" fill="url(#tm-gold)"/>
      </g>

      <!-- EYES (track cursor) -->
      <g class="tm-eyes">
        <g class="tm-eye tm-eye-l">
          <ellipse cx="84" cy="72" rx="11" ry="13" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:84px 72px">
            <circle cx="84" cy="72" r="7.2" fill="url(#tm-eye)"/>
            <circle cx="82" cy="69" r="2.2" fill="#fff"/>
            <circle cx="86" cy="75" r="1"   fill="#fff" opacity="0.7"/>
          </g>
        </g>
        <g class="tm-eye tm-eye-r">
          <ellipse cx="116" cy="72" rx="11" ry="13" fill="#04141a"/>
          <g class="tm-pupil" style="transform-origin:116px 72px">
            <circle cx="116" cy="72" r="7.2" fill="url(#tm-eye)"/>
            <circle cx="114" cy="69" r="2.2" fill="#fff"/>
            <circle cx="118" cy="75" r="1"   fill="#fff" opacity="0.7"/>
          </g>
        </g>
        <!-- Eyelids (used for blink via scaleY) -->
        <rect class="tm-lid tm-lid-l" x="73" y="59" width="22" height="26" rx="11" fill="url(#tm-glass)" opacity="0.95"/>
        <rect class="tm-lid tm-lid-r" x="105" y="59" width="22" height="26" rx="11" fill="url(#tm-glass)" opacity="0.95"/>
      </g>

      <!-- Smile (mouth) -->
      <g class="tm-mouth">
        <path class="tm-mouth-shape" d="M88 92 Q100 102 112 92"
              stroke="#0a4a55" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Cheek glow -->
      <circle cx="68" cy="86" r="6" fill="#fe2c55" opacity="0.18" class="tm-cheek tm-cheek-l"/>
      <circle cx="132" cy="86" r="6" fill="#fe2c55" opacity="0.18" class="tm-cheek tm-cheek-r"/>
    </g>
  </symbol>

  <!-- =================== TITAN BOT SMALL (topbar) 40x44 =================== -->
  <symbol id="titan-bot-sm" viewBox="0 0 200 220">
    <use href="#titan-bot" />
  </symbol>

  <!-- =================== WAVE-HAND (separate, for use as decoration) =================== -->
  <symbol id="titan-hand-wave" viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="22" fill="url(#tm-glass)" stroke="url(#tm-glass-rim)" stroke-width="1.5"/>
    <path d="M20 32 Q30 40 40 32" stroke="#0a4a55" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="3" fill="#fff" opacity="0.8"/>
  </symbol>
</svg>
`;

  /* ============================================================== */
  /* 2. INJECT SPRITE                                               */
  /* ============================================================== */
  function injectSprite() {
    if (document.getElementById('tm-sprite')) return;
    const wrap = document.createElement('div');
    wrap.id = 'tm-sprite';
    wrap.innerHTML = SPRITE;
    document.body.appendChild(wrap);
  }

  /* ============================================================== */
  /* 3. CSS for bot + behaviors                                     */
  /* ============================================================== */
  const CSS = `
/* === Brand mark sizing (topbar + hero) === */
.brand-mark { display: block; }
.brand-mark svg, .brand-mark use { display: block; }

/* === Hero bot (large, expressive) === */
.hero-mascot {
  width: clamp(72px, 9vw, 120px);
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(37, 244, 238, 0.25))
          drop-shadow(0 2px 6px rgba(245, 193, 75, 0.18));
  --eye-x: 0px;
  --eye-y: 0px;
  cursor: pointer;
  transition: transform 360ms var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
  animation: tm-float 4.2s ease-in-out infinite;
  will-change: transform;
}
.hero-mascot:hover { transform: scale(1.06) rotate(-2deg); }
.hero-mascot:active { transform: scale(0.97); }
@keyframes tm-float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(-6px) rotate(-1.2deg); }
}

/* Pupils track cursor (CSS var driven by JS) */
.hero-mascot .tm-pupil,
.tm-floating-bot .tm-pupil {
  transform: translate(var(--eye-x, 0px), var(--eye-y, 0px));
  transition: transform 180ms ease-out;
}

/* Blink (eyelids slide down) */
.hero-mascot .tm-lid,
.tm-floating-bot .tm-lid {
  transform-origin: center;
  transform: scaleY(0);
  animation: tm-blink 0s infinite;
  animation-play-state: paused;
}
.tm-blinking .tm-lid { animation-name: tm-blink; animation-play-state: running; }
@keyframes tm-blink {
  0%, 92%, 100% { transform: scaleY(0); }
  94%, 98%      { transform: scaleY(1); }
}

/* Wave — left hand */
.hero-mascot .tm-hand-l,
.tm-floating-bot .tm-hand-l {
  transform-origin: 46px 70px;
  animation: tm-wave 2.4s ease-in-out infinite;
  animation-delay: 1.4s;
}
@keyframes tm-wave {
  0%, 70%, 100% { transform: rotate(0deg); }
  76%           { transform: rotate(-22deg); }
  84%           { transform: rotate(18deg); }
  92%           { transform: rotate(-12deg); }
}

/* Tablet screen flicker */
.hero-mascot .tm-tablet rect:nth-child(2),
.tm-floating-bot .tm-tablet rect:nth-child(2) {
  animation: tm-screen-flicker 3.2s ease-in-out infinite;
}
@keyframes tm-screen-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.78; }
}

/* Antenna pulse */
.hero-mascot .tm-antenna circle:first-child,
.tm-floating-bot .tm-antenna circle:first-child {
  transform-origin: 100px 18px;
  animation: tm-antenna-pulse 1.8s ease-in-out infinite;
}
@keyframes tm-antenna-pulse {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 0 #f5c14b); }
  50%      { transform: scale(1.2); filter: drop-shadow(0 0 6px #f5c14b); }
}

/* === Mood states === */
.tm-happy .tm-mouth-shape { stroke: #0a4a55; }
.tm-happy .tm-cheek       { opacity: 0.45; }

.tm-sad .tm-mouth-shape   { transform: scaleY(-1) translateY(-8px); transform-origin: 100px 92px; }
.tm-sad .tm-pupil         { opacity: 0.6; }
.tm-sad .tm-hand-l        { animation: none; transform: rotate(40deg); transform-origin: 46px 70px; }
.tm-sad .tm-arm-l         { transform: rotate(8deg); transform-origin: 68px 120px; }
.tm-sad                   { animation: tm-sad-droop 2s ease-in-out infinite; }
@keyframes tm-sad-droop {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(3px); }
}

.tm-celebrate { animation: tm-jump 0.6s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)); }
@keyframes tm-jump {
  0%   { transform: translateY(0) rotate(0); }
  35%  { transform: translateY(-18px) rotate(-4deg); }
  60%  { transform: translateY(-4px) rotate(3deg); }
  100% { transform: translateY(0) rotate(0); }
}

/* === Topbar mini bot === */
.topbar-bot {
  width: 32px; height: 36px;
  filter: drop-shadow(0 1px 4px rgba(37, 244, 238, 0.4));
  flex-shrink: 0;
}
.topbar-bot .tm-pupil {
  transform: translate(var(--eye-x, 0px), var(--eye-y, 0px));
  transition: transform 180ms ease-out;
}
.topbar-bot .tm-lid { transform-origin: center; transform: scaleY(0); }
.topbar-bot.tm-blinking .tm-lid { animation: tm-blink-mini 0s infinite; animation-play-state: running; }
@keyframes tm-blink-mini {
  0%, 92%, 100% { transform: scaleY(0); }
  94%, 98%      { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-mascot, .tm-floating-bot, .topbar-bot,
  .hero-mascot *, .topbar-bot * {
    animation: none !important;
    transition: none !important;
  }
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
  /* 4. EYE TRACKING (delegated to all bots in the doc)             */
  /* ============================================================== */
  function setupEyeTracking() {
    if (reduced) return;
    const EYE_RANGE = 4; // px max pupil displacement

    const bots = () => Array.from(document.querySelectorAll('.hero-mascot, .topbar-bot, .tm-floating-bot'));

    function onMove(e) {
      const cx = e.clientX, cy = e.clientY;
      bots().forEach((bot) => {
        const r = bot.getBoundingClientRect();
        // The "face center" is roughly at 50%/55% of the bot box
        const fx = r.left + r.width * 0.5;
        const fy = r.top  + r.height * 0.55;
        // Normalize by half the larger axis (so diagonal is at max range)
        const range = Math.max(r.width, r.height) * 0.6;
        let dx = (cx - fx) / range;
        let dy = (cy - fy) / range;
        // Clamp to unit circle
        const d = Math.hypot(dx, dy);
        if (d > 1) { dx /= d; dy /= d; }
        bot.style.setProperty('--eye-x', (dx * EYE_RANGE).toFixed(2) + 'px');
        bot.style.setProperty('--eye-y', (dy * EYE_RANGE).toFixed(2) + 'px');
      });
    }
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0]);
    }, { passive: true });
  }

  /* ============================================================== */
  /* 5. BLINK SCHEDULER (human-like, not metronome)                 */
  /* ============================================================== */
  function setupBlink() {
    if (reduced) return;
    function scheduleBlink() {
      const delay = 2800 + Math.random() * 3600; // 2.8–6.4s
      setTimeout(() => {
        document.querySelectorAll('.hero-mascot, .topbar-bot, .tm-floating-bot').forEach((b) => {
          b.classList.add('tm-blinking');
          setTimeout(() => b.classList.remove('tm-blinking'), 220);
        });
        // double-blink 20% of the time
        if (Math.random() < 0.22) {
          setTimeout(() => {
            document.querySelectorAll('.hero-mascot, .topbar-bot, .tm-floating-bot').forEach((b) => {
              b.classList.add('tm-blinking');
              setTimeout(() => b.classList.remove('tm-blinking'), 220);
            });
          }, 320);
        }
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
  }

  /* ============================================================== */
  /* 6. POINT-TO (CTA directional cue)                              */
  /* ============================================================== */
  function pointTo(selector) {
    if (reduced) return;
    const bot = document.querySelector('.hero-mascot');
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!bot || !target) return;
    const b = bot.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const angle = Math.atan2(
      (t.top + t.height / 2) - (b.top + b.height / 2),
      (t.left + t.width / 2)  - (b.left + b.width / 2)
    ) * 180 / Math.PI;
    // Make the head tilt toward the target (subtle, max ±15deg)
    const tilt = Math.max(-15, Math.min(15, angle));
    bot.style.transition = 'transform 600ms cubic-bezier(0.32, 0.72, 0, 1)';
    bot.style.transform = `translateY(-2px) rotate(${tilt}deg)`;
    setTimeout(() => {
      bot.style.transform = '';
      bot.style.transition = '';
    }, 900);
  }

  /* ============================================================== */
  /* 7. UPGRADE EXISTING TOPBAR ORBS TO BOTS                        */
  /*    find <use href="#titan-orb-sm"> in topbar → swap to bot      */
  /* ============================================================== */
  function upgradeTopbar() {
    document.querySelectorAll('.topbar .brand-mark').forEach((el) => {
      // If the existing symbol is titan-orb-sm, replace it with the new bot
      const use = el.querySelector('use');
      if (use && use.getAttribute('href') === '#titan-orb-sm') {
        el.classList.add('topbar-bot');
        use.setAttribute('href', '#titan-bot-sm');
      }
    });
    // Also upgrade any .hero-mascot already in the DOM
    document.querySelectorAll('.hero-mascot').forEach((el) => {
      const use = el.querySelector('use');
      if (use && use.getAttribute('href') === '#titan-orb') {
        use.setAttribute('href', '#titan-bot');
      }
    });
  }

  /* ============================================================== */
  /* 8. INIT                                                        */
  /* ============================================================== */
  function init() {
    injectSprite();
    injectStyles();
    upgradeTopbar();
    setupEyeTracking();
    setupBlink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ============================================================== */
  /* 9. PUBLIC API                                                  */
  /* ============================================================== */
  const heroBot = () => document.querySelector('.hero-mascot');

  window.TitanMascot = {
    sad() {
      const b = heroBot();
      if (!b) return;
      b.classList.add('tm-sad');
      b.classList.remove('tm-happy');
    },
    happy() {
      const b = heroBot();
      if (!b) return;
      b.classList.remove('tm-sad');
      b.classList.add('tm-happy');
    },
    celebrate() {
      const b = heroBot();
      if (!b) return;
      b.classList.remove('tm-sad');
      b.classList.add('tm-happy', 'tm-celebrate');
      setTimeout(() => b.classList.remove('tm-celebrate'), 700);
    },
    pointTo,
    say(text, duration) {
      // Reuse existing speech bubble from v3 if present
      const bubble = document.querySelector('.titan-bubble');
      if (bubble) {
        const span = bubble.querySelector('.bubble-text') || bubble;
        span.textContent = text;
        bubble.classList.add('is-visible');
        setTimeout(() => bubble.classList.remove('is-visible'), duration || 4200);
      }
    },
    spin() {
      const b = heroBot();
      if (!b || reduced) return;
      b.style.transition = 'transform 700ms linear';
      b.style.transform = 'rotate(360deg)';
      setTimeout(() => { b.style.transform = ''; b.style.transition = ''; }, 750);
    },
    dispose() {
      document.getElementById('tm-sprite')?.remove();
      document.getElementById('tm-style')?.remove();
    }
  };
})();
