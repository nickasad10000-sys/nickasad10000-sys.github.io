import { useEffect, useState, useRef } from 'react';

/**
 * ClockDisplay — Live clock with rotating hands.
 * Used as the chest display of the mascot (replaces the static reactor).
 *
 * Props:
 *   size: clock diameter in px (default 80)
 *   showDate: whether to show date label below
 *   showSeconds: whether to render the second hand
 */
export default function ClockDisplay({
  size = 80,
  showDate = true,
  showSeconds = true,
  className = '',
}) {
  const [now, setNow] = useState(new Date());
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  const secondAngle = (s / 60) * 360;
  const minuteAngle = (m / 60) * 360 + (s / 60) * 6;
  const hourAngle = (h / 12) * 360 + (m / 60) * 30;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // 12 hour markers
  const markers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * (r - 4);
    const y1 = cy + Math.sin(rad) * (r - 4);
    const x2 = cx + Math.cos(rad) * (r - 9);
    const y2 = cy + Math.sin(rad) * (r - 9);
    return { x1, y1, x2, y2, isMain: i % 3 === 0 };
  });

  return (
    <div className={`clock-display ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Live clock" role="img" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="tm-clock-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e0c98a" />
            <stop offset="0.5" stopColor="#C8A55F" />
            <stop offset="1" stopColor="#8a6f3d" />
          </linearGradient>
          <radialGradient id="tm-clock-face" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#1c1c1e" />
            <stop offset="1" stopColor="#0a0a0a" />
          </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r - 1} fill="url(#tm-clock-face)" stroke="url(#tm-clock-ring)" strokeWidth="2" />
        {/* Inner shadow ring */}
        <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="rgba(200, 165, 95, 0.15)" strokeWidth="1" />
        {/* Hour markers */}
        {markers.map((m, i) => (
          <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
            stroke={m.isMain ? '#C8A55F' : 'rgba(200, 165, 95, 0.5)'}
            strokeWidth={m.isMain ? 1.6 : 0.8}
            strokeLinecap="round"
          />
        ))}
        {/* Hour hand */}
        <line
          x1={cx} y1={cy}
          x2={cx + Math.cos(((hourAngle - 90) * Math.PI) / 180) * (r * 0.45)}
          y2={cy + Math.sin(((hourAngle - 90) * Math.PI) / 180) * (r * 0.45)}
          stroke="#C8A55F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Minute hand */}
        <line
          x1={cx} y1={cy}
          x2={cx + Math.cos(((minuteAngle - 90) * Math.PI) / 180) * (r * 0.65)}
          y2={cy + Math.sin(((minuteAngle - 90) * Math.PI) / 180) * (r * 0.65)}
          stroke="#e0c98a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Second hand */}
        {showSeconds && (
          <line
            x1={cx} y1={cy}
            x2={cx + Math.cos(((secondAngle - 90) * Math.PI) / 180) * (r * 0.72)}
            y2={cy + Math.sin(((secondAngle - 90) * Math.PI) / 180) * (r * 0.72)}
            stroke="#A50000"
            strokeWidth="1"
            strokeLinecap="round"
          />
        )}
        {/* Center pin */}
        <circle cx={cx} cy={cy} r="2.4" fill="url(#tm-clock-ring)" />
        <circle cx={cx} cy={cy} r="1.2" fill="#0a0a0a" />
      </svg>
      {showDate && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bronze-light)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}
        </div>
      )}
    </div>
  );
}
