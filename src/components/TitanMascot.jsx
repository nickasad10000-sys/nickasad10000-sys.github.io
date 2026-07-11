// TITAN PRO · V8d — Titan Mascot.
// Composition: ONE full photo of the silver angel-warrior (m-full.png)
// with a separate golden sun-burst halo (m-halo.png) behind it.
// The mascot is intentionally a single visual layer so head, eyes, sword,
// wings, and halo all sit in correct photo-relative positions.
//
// Motion:
//   - halo slowly rotates
//   - mascot body bobs gently
//   - golden feathers drop from the wing tips every ~2s
//   - icon-only ask button (no text label) on the mascot

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDrag } from '../hooks/useDrag.js';
import Icon from './Icon.jsx';

const PHOTO_MASCOT = '/mascot/m-full.png';
const PHOTO_HALO = '/mascot/m-halo.png';

// Golden ring halo — sits at the top of the mascot, with the head poking
// through the bottom of the ring. Spins slowly around its own center.
// The ring is positioned ABOVE the mascot (higher z-index at the top
// half) so it remains visible as a separate, smaller ring rotating
// inside the larger glow of the head's helmet.
function Halo() {
  return (
    <div
      aria-hidden="true"
      className="tm-mascot__halo"
      style={{
        position: 'absolute',
        top: '4%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '44%',
        aspectRatio: '1 / 1',
        pointerEvents: 'none',
        zIndex: 5,
        animation: 'tmHaloSpin 22s linear infinite',
      }}
    >
      <img
        src={PHOTO_HALO}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 12px rgba(255, 200, 100, 0.90)) drop-shadow(0 0 26px rgba(255, 170, 60, 0.55))',
        }}
      />
      <style>{`
        @keyframes tmHaloSpin {
          from { transform: translateX(-50%) rotate(0deg); }
          to   { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Tiny gold/cream feather SVG used for falling debris.
// Real-feather physics: gentle horizontal sway, slow rotation, long descent.
function FallingFeather({ x, rot, dur, delay, dx, sway, swayDur }) {
  return (
    <div
      className="tm-feather-fall"
      style={{
        position: 'fixed',
        left: x,
        top: 0,
        width: 12,
        height: 16,
        pointerEvents: 'none',
        zIndex: 9998,
        animation: `tmFeatherFall ${dur}ms ${delay}ms cubic-bezier(0.32, 0.72, 0, 1) forwards, tmFeatherSway ${swayDur}ms ${delay}ms ease-in-out infinite`,
        ['--dx']: `${dx}px`,
        ['--rot']: `${rot}deg`,
        ['--sway']: `${sway}px`,
      }}
    >
      <svg viewBox="0 0 12 16" width="12" height="16">
        <defs>
          <linearGradient id="tm-fall-grad-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6D6" />
            <stop offset="0.5" stopColor="#FFD17A" />
            <stop offset="1" stopColor="#9a7218" />
          </linearGradient>
        </defs>
        <path
          d="M6 1 Q9 4 8 11 Q7 14 6 15 Q5 14 4 11 Q3 4 6 1 Z"
          fill="url(#tm-fall-grad-gold)"
          stroke="#7a5a20"
          strokeWidth="0.3"
        />
        <line x1="6" y1="2" x2="6" y2="14" stroke="#7a5a20" strokeWidth="0.3" />
      </svg>
    </div>
  );
}

function FeatherOverlay({ feathers }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <style>{`
        /* Real-feather fall: long descent, gentle horizontal sway */
        @keyframes tmFeatherFall {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          8%   { opacity: 0.9; }
          50%  { transform: translate(calc(var(--dx) * 0.5 + var(--sway) * 0.6), 320px) rotate(calc(var(--rot) * 0.5)); }
          100% { transform: translate(var(--dx), 720px) rotate(var(--rot)); opacity: 0; }
        }
        /* Independent horizontal sway loop (independent of fall) */
        @keyframes tmFeatherSway {
          0%   { margin-left: 0; }
          50%  { margin-left: var(--sway); }
          100% { margin-left: 0; }
        }
      `}</style>
      {feathers.map((f) => (
        <FallingFeather key={f.id} {...f} />
      ))}
    </div>,
    document.body
  );
}

function MascotSvg() {
  const [feathers, setFeathers] = useState([]);
  const counterRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Real-feather cadence: a small steady stream of slow descents.
    // 2-3 feathers spawning per second gives a constant gentle shower
    // without overwhelming the scene.
    const tick = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // Spawn 1-2 feathers per tick (so total cadence ≈ 2-3/s)
      const spawnCount = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < spawnCount; i++) {
        const id = counterRef.current++;
        const fromLeft = Math.random() < 0.5;
        // Spread spawn X across the wing-tip area
        const startX = fromLeft
          ? rect.left + rect.width * (0.04 + Math.random() * 0.16)
          : rect.left + rect.width * (0.80 + Math.random() * 0.16);
        const startY = rect.top + rect.height * (0.12 + Math.random() * 0.20);

        const feather = {
          id,
          x: `${startX}px`,
          // Slow rotation over a long fall
          rot: 240 + Math.random() * 480,
          // Long descent (5-8 seconds) for realistic feather-fall timing
          dur: 5000 + Math.random() * 3000,
          delay: 0,
          // Horizontal drift: gentle, in the direction of the wind
          dx: (fromLeft ? -1 : 1) * (80 + Math.random() * 140),
          // Sway amplitude: independent side-to-side wiggle
          sway: 18 + Math.random() * 30,
          // Sway period: 1.5-3s side-to-side wobble
          swayDur: 1500 + Math.random() * 1500,
        };
        setFeathers((prev) => [...prev, feather]);
        setTimeout(() => {
          setFeathers((prev) => prev.filter((f) => f.id !== id));
        }, feather.dur + 600);
      }
    }, 450);
    return () => clearInterval(tick);
  }, []);

  return (
    <div
      ref={containerRef}
      className="tm-mascot-svg"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        aspectRatio: '360 / 520',
      }}
    >
      <Halo />

      {/* SINGLE mascot layer — silver angel-warrior. */}
      <img
        src={PHOTO_MASCOT}
        alt=""
        draggable={false}
        className="tm-mascot__full"
        style={{
          position: 'absolute',
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '98%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'contrast(1.06) saturate(1.08) drop-shadow(0 10px 22px rgba(0, 0, 0, 0.50))',
          zIndex: 2,
        }}
      />

      <style>{`
        .tm-mascot__full {
          transform-origin: 50% 70%;
          animation: tmBodyBob 3.8s ease-in-out infinite;
        }
        @keyframes tmBodyBob {
          0%, 100% { transform: translateX(-50%) translateY(0)    rotate(0deg); }
          50%      { transform: translateX(-50%) translateY(-4px) rotate(0.5deg); }
        }
      `}</style>

      <FeatherOverlay feathers={feathers} />
    </div>
  );
}

export default function TitanMascot({ onClick, onAsk, variant = 'floating' }) {
  const { ref, pos, onPointerDown } = useDrag({ bounds: true });

  if (variant === 'inline') {
    return (
      <div className="tm-mascot tm-mascot--inline" style={{ width: '100%', maxWidth: 360 }}>
        <MascotSvg />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .tm-mascot--floating {
          right: 24px;
          bottom: 24px;
          width: 220px;
          height: 300px;
        }
        @media (max-width: 1280px) {
          .tm-mascot--floating {
            width: 180px;
            height: 250px;
            right: 18px;
            bottom: 18px;
          }
        }
        @media (max-width: 1024px) {
          .tm-mascot--floating {
            width: 150px;
            height: 200px;
            right: 16px;
            bottom: 16px;
            opacity: 0.95;
          }
        }
        @media (max-width: 640px) {
          .tm-mascot--floating {
            width: 104px;
            height: 140px;
            right: 8px;
            bottom: 8px;
            opacity: 0.8;
          }
          .tm-mascot--floating:hover { opacity: 1; }
          .tm-mascot--floating .tm-mascot__ask { display: none; }
          .tm-mascot--floating .tm-mascot__handle { display: none; }
        }
      `}</style>
      <div
        ref={ref}
        className="tm-mascot tm-mascot--floating"
        style={{
          position: 'fixed',
          left: pos.x || 'auto',
          top: pos.y || 'auto',
          right: pos.x ? 'auto' : 'auto',
          bottom: pos.y ? 'auto' : 'auto',
          width: 220,
          height: 300,
          zIndex: 60,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onClick}
        role="button"
        aria-label="TITAN PRO"
      >
        <button
          type="button"
          className="tm-mascot__handle"
          onPointerDown={onPointerDown}
          title="Drag untuk pindah"
          aria-label="Drag mascot"
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 11,
            lineHeight: 1,
            cursor: 'grab',
            zIndex: 10,
            opacity: 0,
            transition: 'opacity 200ms',
          }}
        >
          ⋮⋮
        </button>
        <MascotSvg />

        {/* Icon-only "ask" button (no text). Sits at top-right of the mascot. */}
        {onAsk && (
          <button
            type="button"
            className="tm-mascot__ask"
            onClick={(e) => { e.stopPropagation(); onAsk(); }}
            aria-label="Tanya TITAN"
            title="Tanya TITAN"
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #f5b733',
              background: 'linear-gradient(135deg, #1a1a1c, #0a0a0a)',
              color: '#FFE5A0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(10, 10, 10, 1), 0 0 18px rgba(245, 183, 51, 0.45)',
              zIndex: 11,
              animation: 'tmAskPulse 2.2s ease-in-out infinite',
              transition: 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)',
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
          >
            <Icon name="comments" size={18} />
            <style>{`
              @keyframes tmAskPulse {
                0%, 100% { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(10, 10, 10, 1), 0 0 12px rgba(245, 183, 51, 0.35); }
                50%      { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(10, 10, 10, 1), 0 0 24px rgba(245, 183, 51, 0.65); }
              }
            `}</style>
          </button>
        )}
      </div>
    </>
  );
}
