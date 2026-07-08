// TITAN PRO · V8 — Digital clock with ShinyText wrapper.
// Used in the Home page top-right corner. Live HH:MM:SS, updated every second.

import { useEffect, useState } from 'react';
import ShinyText from './ShinyText.jsx';
import './DigitalClock.css';

const pad = (n) => String(n).padStart(2, '0');

export default function DigitalClock({ className = '' }) {
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
    <div className={`digital-clock ${className}`} aria-label={`Waktu saat ini ${time}`}>
      <div className="digital-clock__time">
        <ShinyText
          text={time}
          speed={3.5}
          spread={120}
          color="#ffffff"
          shineColor="#a24bf5"
        />
      </div>
      <div className="digital-clock__date">{dateLabel}</div>
    </div>
  );
}
