// TITAN PRO · V8 — Hook: drag-to-move the mascot container.
// Returns { ref, onPointerDown } to attach to the handle.

import { useEffect, useRef, useState } from 'react';

export function useDrag({ bounds = true } = {}) {
  const ref = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: r.left,
      origY: r.top,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      let nx = dragRef.current.origX + dx;
      let ny = dragRef.current.origY + dy;
      if (bounds) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const el = ref.current;
        const ew = el ? el.offsetWidth : 200;
        const eh = el ? el.offsetHeight : 200;
        nx = Math.max(8, Math.min(w - ew - 8, nx));
        ny = Math.max(8, Math.min(h - eh - 8, ny));
      }
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [bounds]);

  return { ref, pos, onPointerDown };
}
