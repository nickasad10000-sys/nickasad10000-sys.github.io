// TITAN PRO · V8 — Hook: pointer-following eye tracking.
// Returns a normalized {x, y} where -1..1 maps to viewport.

import { useEffect, useState } from 'react';

export function useEyeTracking(ref, { smoothing = 0.12 } = {}) {
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [current, setCurrent] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setTarget({ x, y });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      setCurrent((c) => {
        const nx = c.x + (target.x - c.x) * smoothing;
        const ny = c.y + (target.y - c.y) * smoothing;
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, smoothing]);

  return current;
}
