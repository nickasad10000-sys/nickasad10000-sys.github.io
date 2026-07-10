// TITAN PRO · V8 — Digital clock with ShinyText wrapper.
// Used inline in the Home hero (next to "TITAN PRO" title) and in the account
// page header. Live HH:MM:SS, updated every second.

import { useEffect, useState } from 'react';
import ShinyText from './ShinyText.jsx';
import './DigitalClock.css';

const pad = (n) => String(n).padStart(2, '0');

export default function DigitalClock({ className = '', compact = false }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const time = `${hh}:${mm}:${ss}`;

  const dateLabel = now
    .toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <div
      className={`digital-clock ${compact ? 'digital-clock--compact' : ''} ${className}`}
      aria-label={`Waktu saat ini ${time}, ${dateLabel}`}
    >
      <div className="digital-clock__time">
        <ShinyText
          text={time}
          speed={3.5}
          spread={120}
          color="#ffffff"
          shineColor="#a24bf5"
        />
      </div>
      {!compact && <div className="digital-clock__date">{dateLabel}</div>}
    </div>
  );
}
