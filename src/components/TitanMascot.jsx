// TITAN PRO · V8d — Titan Mascot.
// Composition: ONE full photo of the silver angel-warrior (m-full.png)
// with a separate golden sun-burst halo (m-halo.png) behind it.
// The mascot is intentionally a single visual layer so head, eyes, sword,
// wings, and halo all sit in correct photo-relative positions.
//
// Motion:
//   - halo slowly rotates
//   - mascot body bobs gently
//   - icon-only ask button (no text label) on the mascot
//
// Drag-to-move functionality via useDrag hook.

import { useDrag } from '../hooks/useDrag.js';
import Icon from './Icon.jsx';
import '../styles/mascot.css';

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

function MascotSvg() {
  return (
    <div
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
          filter: 'contrast(1.06) saturate(1.08) drop-shadow(0 10px 22px rgba(0,0,0,0.50))',
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
    </div>
  );
}

export default function TitanMascot({ onClick, onAsk, variant = 'floating' }) {
  const { ref, pos, onPointerDown } = useDrag({ bounds: true });
    const isDragging = pos.x !== 0 || pos.y !== 0;

  if (variant === 'inline') {
    return (
      <div className="tm-mascot tm-mascot--inline" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            width: 120px;
            height: 160px;
            right: 10px;
            bottom: 10px;
            opacity: 0.9;
          }
          .tm-mascot--floating:hover { opacity: 1; }
          /* keep ask button and handle visible on mobile */
        }
      `}</style>
      <div
        ref={ref}
        className="tm-mascot tm-mascot--floating"
        style={{
          position: 'fixed',
          ...(isDragging
            ? {
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                right: 'auto',
                bottom: 'auto',
              }
            : {}),
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
              boxShadow: '0 6px 18px rgba(0,0,0,0.55), 0 0 0 3px rgba(10,10,10,1), 0 0 18px rgba(245,183,51,0.45)',
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
                0%, 100% { box-shadow: 0 6px 18px rgba(0,0,0,0.55), 0 0 0 3px rgba(10,10,10,1), 0 0 12px rgba(245,183,51,0.35); }
                50%      { box-shadow: 0 6px 18px rgba(0,0,0,0.55), 0 0 0 3px rgba(10,10,10,1), 0 0 24px rgba(245,183,51,0.65); }
              }
            `}</style>
          </button>
        )}
      </div>
    </>
  );
}