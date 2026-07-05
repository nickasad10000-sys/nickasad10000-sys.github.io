/* TITAN PRO AI · Mascot behavior
 * Companion / co-pilot personality
 * States: idle → peek → greeting → idle
 *         idle → reacting (on card hover) → idle
 *         idle → spin (on R-key) → greeting → idle
 *
 * Public API:
 *   window.TitanMascot.say(text, duration?)  // force a speech bubble
 *   window.TitanMascot.spin()                // for refresh state
 *   window.TitanMascot.dispose()              // for cleanup
 */
(function() {
  'use strict';
  if (window.TitanMascot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- personality lines ----------------------------------------- */
  const LINES = {
    greet: [
      "Halo! Aku Titan, analis pribadimu.",
      "Pilih akun di bawah, aku kasih insight-nya.",
      "Tip: tekan R untuk refresh data kapan aja."
    ],
    curious: [
      "Hmm, akun ini menarik. ER-nya kenceng.",
      "Konten media lokal lagi naik nih.",
      "Aku sempat liat pos viral mereka. Mantap."
    ],
    hype: [
      "Gila sih ini akun, followers naik terus!",
      "Pakai ini buat strategi konten lo.",
      "Ini top-tier. Cocok buat benchmark."
    ],
    sleepy: [
      "Sini-sini, ada yang mau dijelasin?",
      "Buka aja, aku standby.",
      "Data baru udah masuk. Yuk intip."
    ],
    react: {
      default: "Mau lihat akun ini? Gas.",
      '.tt': "TikTok performanya lagi bagus. Tengok deh.",
      '.ig': "Instagram-nya verified — kualitasnya terjaga."
    },
    refresh: "Menyegarkan data… bentar ya.",
    success: "Data berhasil diperbarui. Mantap."
  };

  /* --- DOM injection --------------------------------------------- */
  const css = `
    .titan-mascot {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 72px;
      height: 72px;
      z-index: 60;
      pointer-events: none;
      filter: drop-shadow(0 8px 24px rgba(245, 193, 75, 0.28));
      transition: bottom 480ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
    }
    .titan-mascot .orb {
      width: 100%;
      height: 100%;
      cursor: pointer;
      pointer-events: auto;
      transform-origin: 50% 50%;
      transition: transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: titanBreathe 3.6s ease-in-out infinite;
    }
    .titan-mascot .orb:hover { transform: scale(1.08) rotate(-6deg); }
    .titan-mascot .orb:active { transform: scale(0.96); }
    .titan-mascot .orb svg { display: block; width: 100%; height: 100%; }
    .titan-mascot .orb .titan-orbital {
      animation: titanOrbit 6s linear infinite;
      transform-origin: 40px 40px;
    }
    .titan-mascot .bubble {
      position: absolute;
      bottom: calc(100% + 14px);
      right: -8px;
      max-width: 280px;
      padding: 12px 16px;
      background: var(--bg-elevated, #11131a);
      border: 1px solid var(--gold-line, rgba(245, 193, 75, 0.28));
      border-radius: 18px;
      color: var(--text, #f4f6fb);
      font-family: var(--font-sans, sans-serif);
      font-size: 0.85rem;
      line-height: 1.45;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      opacity: 0;
      transform: translateY(6px) scale(0.96);
      transition: opacity 240ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1)),
                  transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .titan-mascot .bubble.is-visible { opacity: 1; transform: translateY(0) scale(1); }
    .titan-mascot .bubble::after {
      content: "";
      position: absolute;
      bottom: -7px;
      right: 26px;
      width: 14px; height: 14px;
      background: var(--bg-elevated, #11131a);
      border-right: 1px solid var(--gold-line, rgba(245, 193, 75, 0.28));
      border-bottom: 1px solid var(--gold-line, rgba(245, 193, 75, 0.28));
      transform: rotate(45deg);
    }
    .titan-mascot .bubble .face {
      position: absolute;
      top: -10px; left: -10px;
      width: 28px; height: 28px;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
    }
    .titan-mascot.is-spinning .orb { animation: titanSpin 0.8s linear infinite; }
    .titan-mascot.is-hidden { bottom: -120px; }
    @keyframes titanBreathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04) translateY(-2px); }
    }
    @keyframes titanOrbit {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes titanSpin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .titan-mascot .orb,
      .titan-mascot .orb .titan-orbital,
      .titan-mascot .bubble { animation: none !important; transition: none !important; }
    }
    @media (max-width: 768px) {
      .titan-mascot { width: 56px; height: 56px; bottom: 18px; right: 18px; }
      .titan-mascot .bubble { max-width: 220px; font-size: 0.78rem; padding: 10px 14px; }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* --- build element --------------------------------------------- */
  const mascot = document.createElement('div');
  mascot.className = 'titan-mascot is-hidden';
  mascot.setAttribute('role', 'img');
  mascot.setAttribute('aria-label', 'TITAN PRO AI — maskot analis');
  mascot.innerHTML = `
    <div class="bubble" role="status" aria-live="polite">
      <svg class="face" aria-hidden="true"><use href="#titan-face"/></svg>
      <span class="bubble-text">Halo! Aku Titan.</span>
    </div>
    <div class="orb" tabindex="0" role="button" aria-label="Mascot TITAN PRO AI — klik untuk sapa">
      <svg aria-hidden="true"><use href="#titan-orb"/></svg>
    </div>
  `;
  document.body.appendChild(mascot);

  const bubble = mascot.querySelector('.bubble');
  const bubbleText = mascot.querySelector('.bubble-text');
  const orb = mascot.querySelector('.orb');
  let state = 'idle';
  let hideTimer = null;
  let cycleIdx = 0;
  let greeted = sessionStorage.getItem('titan.greeted') === '1';

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickFromGroup(group) {
    const keys = Object.keys(group);
    if (group === LINES.react) return group.default;
    return group[keys[cycleIdx++ % keys.length]];
  }

  function show(text, duration) {
    clearTimeout(hideTimer);
    bubbleText.textContent = text;
    bubble.classList.add('is-visible');
    mascot.classList.remove('is-hidden');
    if (duration !== 0) {
      hideTimer = setTimeout(hide, duration || 4800);
    }
  }
  function hide() {
    bubble.classList.remove('is-visible');
  }

  /* --- state transitions ----------------------------------------- */
  function greet() {
    if (greeted) return;
    greeted = true;
    sessionStorage.setItem('titan.greeted', '1');
    setTimeout(() => show(pick(LINES.greet), 5500), 1200);
  }

  function react(target) {
    if (state !== 'idle') return;
    state = 'reacting';
    let line = LINES.react.default;
    if (target.matches('.tt, [data-platform="tiktok"]')) line = LINES.react['.tt'];
    else if (target.matches('.ig, [data-platform="instagram"]')) line = LINES.react['.ig'];
    const handle = target.getAttribute('data-handle') || target.querySelector('.handle')?.textContent?.trim() || '';
    const personalised = handle ? line.replace('akun ini', `@${handle}`) : line;
    show(personalised, 3800);
    setTimeout(() => { state = 'idle'; }, 4200);
  }

  function cyclePersonality() {
    if (state !== 'idle') return;
    state = 'greeting';
    const groups = [LINES.curious, LINES.hype, LINES.sleepy, LINES.greet];
    show(pick(groups[cycleIdx++ % groups.length]), 5000);
    setTimeout(() => { state = 'idle'; }, 5500);
  }

  function spin() {
    mascot.classList.add('is-spinning');
    show(LINES.refresh, 0);
    setTimeout(() => {
      mascot.classList.remove('is-spinning');
      show(LINES.success, 3000);
    }, 700);
  }

  /* --- event wiring ---------------------------------------------- */
  // Hide bubble on click anywhere outside
  document.addEventListener('click', (e) => {
    if (!mascot.contains(e.target)) hide();
  });

  // Orb click cycles personality
  orb.addEventListener('click', (e) => {
    e.stopPropagation();
    cyclePersonality();
  });
  orb.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cyclePersonality(); }
  });

  // Card hover reactions (delegated)
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('[data-handle], a[href*="index.html"]');
    if (card) react(card);
  });
  document.addEventListener('focusin', (e) => {
    const card = e.target.closest('[data-handle], a[href*="index.html"]');
    if (card) react(card);
  });

  // R-key triggers spin
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const refreshBtn = document.getElementById('refreshBtn');
      if (refreshBtn) {
        // we don't preventDefault here; the page's own R handler fires too
        spin();
      }
    }
  });

  // First-visit greeting (skip if reduced motion preferred = always show silently)
  if (!greeted) {
    // Wait for DOM ready so the orb is visible
    requestAnimationFrame(() => {
      requestAnimationFrame(greet);
    });
  } else {
    // Show orb silently on subsequent visits
    setTimeout(() => mascot.classList.remove('is-hidden'), 800);
  }

  /* --- public API ------------------------------------------------- */
  window.TitanMascot = {
    say(text, duration) { show(text, duration); },
    spin,
    react,
    hide,
    dispose() {
      clearTimeout(hideTimer);
      mascot.remove();
      style.remove();
    }
  };
})();
