// TITAN PRO · V8 — Angel wings (image-based, matches new reference).
// Photo of white wings with golden tips, used directly with subtle CSS
// animation (gentle breath/sway) and feather-fall overlay.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PHOTO_WINGS = '/mascot/wings.png';
const FEATHER_DROP_INTERVAL = 3200;

// Tiny gold feather SVG used for falling debris
function FallingFeather({ x, rot, dur, delay, dx }) {
  return (
    <div
      className="tm-feather-fall"
      style={{
        position: 'fixed',
        left: x,
        top: 0,
        width: 12,
        height: 18,
        pointerEvents: 'none',
        zIndex: 9998,
        animation: `tmFeatherFall ${dur}ms ${delay}ms cubic-bezier(0.32, 0.72, 0, 1) forwards`,
        ['--dx']: `${dx}px`,
        ['--rot']: `${rot}deg`,
      }}
    >
      <svg viewBox="0 0 12 18" width="12" height="18">
        <defs>
          <linearGradient id="tm-fall-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE5A0" />
            <stop offset="0.5" stopColor="#C8A55F" />
            <stop offset="1" stopColor="#8a6f3d" />
          </linearGradient>
        </defs>
        <path
          d="M6 1 Q10 5 8 12 Q7 16 6 17 Q5 16 4 12 Q2 5 6 1 Z"
          fill="url(#tm-fall-grad)"
          stroke="#5a4a30"
          strokeWidth="0.4"
        />
        <line x1="6" y1="2" x2="6" y2="16" stroke="#5a4a30" strokeWidth="0.4" />
      </svg>
    </div>
  );
}

function FeatherOverlay({ feathers }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <style>{`
        @keyframes tmFeatherFall {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          50%  { transform: translate(calc(var(--dx) * 0.5), 240px) rotate(calc(var(--rot) * 0.5)); }
          100% { transform: translate(var(--dx), 560px) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {feathers.map((f) => (
        <FallingFeather key={f.id} {...f} />
      ))}
    </div>,
    document.body
  );
}

export default function EagleWings({ className = '' }) {
  const [feathers, setFeathers] = useState([]);
  const counterRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      const id = counterRef.current++;
      // Spawn from the wing tip area
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft
        ? rect.left + rect.width * (0.05 + Math.random() * 0.10)
        : rect.left + rect.width * (0.85 + Math.random() * 0.10);
      const startY = rect.top + rect.height * (0.30 + Math.random() * 0.25);

      const feather = {
        id,
        x: `${startX}px`,
        rot: 360 + Math.random() * 540,
        dur: 2200 + Math.random() * 1400,
        delay: 0,
        dx: (fromLeft ? -1 : 1) * (60 + Math.random() * 80),
      };
      setFeathers((prev) => [...prev, feather]);
      setTimeout(() => {
        setFeathers((prev) => prev.filter((f) => f.id !== id));
      }, feather.dur + 400);
    }, FEATHER_DROP_INTERVAL);
    return () => clearInterval(tick);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`tm-wings ${className}`}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'tmWingSway 4s ease-in-out infinite',
          transformOrigin: '50% 40%',
        }}
      >
        <img
          src={PHOTO_WINGS}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            // Subtle highlight boost
            filter: 'contrast(1.08) saturate(1.05)',
          }}
        />
        <style>{`
          @keyframes tmWingSway {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50%      { transform: scale(1.012) rotate(0.4deg); }
          }
        `}</style>
      </div>
      <FeatherOverlay feathers={feathers} />
    </>
  );
}
