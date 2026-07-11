// TITAN PRO · V8 — Animated number counter with Indonesian-style formatting.
// Used in the AccountPage to animate KPI values from 0 to their final
// number when the section scrolls into view.

import { useEffect, useRef, useState } from 'react';

/**
 * Parse a string like "892K", "1.23M", "2.8jt", "5.6rb" into a number.
 * Falls back to `parseFloat` for raw numbers.
 */
function parseTarget(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const s = value.trim().toLowerCase().replace(/\s+/g, '');
  // Match the numeric part and the suffix
  const m = s.match(/^([\d.,]+)\s*([a-z%]*)/);
  if (!m) return 0;
  const numPart = m[1].replace(/\./g, '').replace(',', '.');
  const num = parseFloat(numPart);
  if (Number.isNaN(num)) return 0;
  const suffix = m[2];
  let mult = 1;
  if (suffix === 'k' || suffix === 'rb' || suffix === ' ribu') mult = 1e3;
  else if (suffix === 'jt' || suffix === 'm') mult = 1e6;
  else if (suffix === 'm' || suffix === 'jt') mult = 1e6;
  else if (suffix === 'b' || suffix === 'miliar') mult = 1e9;
  else if (suffix === '%') mult = 1;
  return num * mult;
}

/**
 * Format a number for display. Default: Indonesian dot-thousands.
 * `separator` lets the caller pick `.` (Indonesian) or `,` (Western).
 */
function formatNumber(n, separator = '.', decimals = 0) {
  if (!Number.isFinite(n)) return '—';
  const fixed = n.toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return fracPart ? `${intWithSep},${fracPart}` : intWithSep;
}

/**
 * Animate from 0 → `to` over `duration` seconds. If the target is
 * non-numeric (e.g. "—"), the value is shown immediately without
 * animation.
 */
export default function CountUp({ to, duration = 1.2, separator = '.', decimals, className = '' }) {
  const target = parseTarget(to);
  const canAnimate = Number.isFinite(target) && target > 0;
  const [value, setValue] = useState(canAnimate ? 0 : target);
  const startRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!canAnimate) {
      setValue(target);
      return undefined;
    }
    startRef.current = null;
    const animate = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic for a soft landing
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, canAnimate]);

  // Decide decimals: if the original had decimals (e.g. "1.23M"), match it
  let displayDecimals = decimals;
  if (displayDecimals == null) {
    if (typeof to === 'string' && /\./.test(to.replace(/[^\d.]/g, ''))) {
      const m = to.match(/\.(\d+)/);
      displayDecimals = m ? Math.min(m[1].length, 2) : 0;
    } else {
      displayDecimals = 0;
    }
  }

  return (
    <span className={className}>
      {canAnimate ? formatNumber(value, separator, displayDecimals) : (to ?? '—')}
    </span>
  );
}
