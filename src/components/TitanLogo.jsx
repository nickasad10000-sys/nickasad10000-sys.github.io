// TITAN PRO · V8 — Logo (image-based).
// Uses the extracted horned warrior silhouette from the reference photo.
// Sits inside a square viewBox; SVG fallback draws a minimal helmet if the
// image fails to load.

import { useState } from 'react';

const PHOTO_LOGO = '/mascot/logo.png';

export default function TitanLogo({
  size = 64,
  className = '',
  glow = true,
  ...props
}) {
  const [errored, setErrored] = useState(false);

  return (
    <span
      className={`titan-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative',
        filter: glow
          ? 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.45)) drop-shadow(0 0 8px rgba(165, 0, 0, 0.35))'
          : 'none',
      }}
      role="img"
      aria-label="TITAN PRO"
      {...props}
    >
      {!errored ? (
        <img
          src={PHOTO_LOGO}
          alt=""
          width={size}
          height={size}
          onError={() => setErrored(true)}
          style={{
            display: 'block',
            objectFit: 'contain',
            width: '100%',
            height: '100%',
          }}
        />
      ) : (
        // Minimal SVG fallback — horned helm only
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <defs>
            <linearGradient id="tm-fb-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a3d44" />
              <stop offset="1" stopColor="#0a0c10" />
            </linearGradient>
            <linearGradient id="tm-fb-cyan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0aa6c4" />
              <stop offset="1" stopColor="#00e5ff" />
            </linearGradient>
          </defs>
          {/* Horns */}
          <path d="M22 22 Q18 8 24 6 Q26 14 26 22 Z" fill="#1a1c20" stroke="#444" strokeWidth="0.6" />
          <path d="M42 22 Q46 8 40 6 Q38 14 38 22 Z" fill="#1a1c20" stroke="#444" strokeWidth="0.6" />
          {/* Helm */}
          <path
            d="M 14 28 Q 14 16 32 14 Q 50 16 50 28 L 50 42 L 48 54 L 32 60 L 16 54 L 14 42 Z"
            fill="url(#tm-fb-shade)"
            stroke="#5a5c64"
            strokeWidth="1.2"
          />
          {/* Cyan visor line */}
          <line x1="18" y1="34" x2="46" y2="34" stroke="url(#tm-fb-cyan)" strokeWidth="2" />
        </svg>
      )}
    </span>
  );
}
