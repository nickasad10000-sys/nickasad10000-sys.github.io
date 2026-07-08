// TITAN PRO · V8 — Hook: auto-blink.
// Triggers `blink` flag at random intervals (2.5–5s), stays true for 120ms.

import { useEffect, useState } from 'react';

export function useBlink({ minMs = 2500, maxMs = 5000, durationMs = 120 } = {}) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer;
    const schedule = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), durationMs);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [minMs, maxMs, durationMs]);

  return blinking;
}
