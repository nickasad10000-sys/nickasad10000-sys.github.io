// TITAN PRO · V8 — TopBarMascot.
// A 56×56 Spartan-warrior mascot that lives in the top navigation. Click to
// open the chat panel anchored below it. Composition: single mascot image
// (m-full.png) with a golden halo (m-halo.png) behind the head.

import Icon from './Icon.jsx';

const PHOTO_MASCOT = '/mascot/m-full.png';
const PHOTO_HALO = '/mascot/m-halo.png';

const KEYFRAMES = `
  @keyframes tmTbmHaloSpin {
    from { transform: translateX(-50%) rotate(0deg); }
    to   { transform: translateX(-50%) rotate(360deg); }
  }
  @keyframes tmTbmBob {
    0%, 100% { transform: translateX(-50%) translateY(0)    rotate(0deg); }
    50%      { transform: translateX(-50%) translateY(-2px) rotate(0.4deg); }
  }
  @keyframes tmTbmAskPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 183, 51, 0.55), 0 2px 6px rgba(0,0,0,0.45); }
    50%      { box-shadow: 0 0 0 6px rgba(245, 183, 51, 0.00), 0 2px 6px rgba(0,0,0,0.45); }
  }
  @keyframes tmTbmReadyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(162, 75, 245, 0.55), 0 2px 6px rgba(0,0,0,0.45); }
    50%      { box-shadow: 0 0 0 8px rgba(162, 75, 245, 0.00), 0 2px 6px rgba(0,0,0,0.45); }
  }
`;

function Halo({ size }) {
  const haloSize = Math.round(size * 0.46);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '2%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${haloSize}px`,
        height: `${haloSize}px`,
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'tmTbmHaloSpin 22s linear infinite',
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
          filter:
            'drop-shadow(0 0 10px rgba(255, 200, 100, 0.85)) drop-shadow(0 0 22px rgba(255, 170, 60, 0.50))',
        }}
      />
    </div>
  );
}

function Body({ size }) {
  return (
    <img
      src={PHOTO_MASCOT}
      alt="TITAN"
      draggable={false}
      style={{
        position: 'absolute',
        top: '4%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${Math.round(size * 0.88)}px`,
        height: 'auto',
        maxHeight: `${Math.round(size * 0.96)}px`,
        objectFit: 'contain',
        pointerEvents: 'none',
        zIndex: 2,
        filter:
          'contrast(1.08) saturate(1.12) drop-shadow(0 4px 8px rgba(0,0,0,0.55))',
        animation: 'tmTbmBob 3.8s ease-in-out infinite',
      }}
    />
  );
}

function AskBadge({ active, size }) {
  const dot = Math.max(14, Math.round(size * 0.32));
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -2,
        right: -2,
        width: dot,
        height: dot,
        borderRadius: '50%',
        background:
          'linear-gradient(135deg, #f5b733 0%, #a24bf5 100%)',
        border: '1.5px solid #fff',
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0a0a0a',
        animation: active
          ? 'tmTbmReadyPulse 1.6s ease-out infinite'
          : 'tmTbmAskPulse 2.4s ease-out infinite',
      }}
    >
      <Icon name="comments" size={Math.max(8, Math.round(dot * 0.55))} />
    </span>
  );
}

export default function TopBarMascot({ onClick, active = false, size = 56, title = 'Tanya TITAN' }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        title={title}
        className={`tm-topbar-mascot ${active ? 'is-active' : ''}`}
        style={{
          position: 'relative',
          width: size,
          height: size,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: '50%',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), filter 200ms ease',
        }}
      >
        <Halo size={size} />
        <Body size={size} />
        <AskBadge active={active} size={size} />
      </button>
    </>
  );
}
