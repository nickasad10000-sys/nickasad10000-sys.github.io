// One-time script to normalize all Indonesian-formatted numbers in accounts-full.json
// from "892.000" → "892K", "1.234.567" → "1.23M", etc.
// Run: node scripts/normalize-numbers.mjs
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/data/accounts-full.json';
const data = JSON.parse(readFileSync(file, 'utf8'));

// Convert "892.000" (Indonesian thousands) → "892K", "1.234.567" → "1.23M"
function toCanonical(s) {
  if (typeof s !== 'string') return s;
  // Already has K/M/B suffix → keep
  if (/[KMB]$/i.test(s.trim())) return s;
  // Must look like Indo thousands: 1-3 digits, dot, exactly 3 digits (e.g. "892.000")
  // Or stacked: "1.234.567" (1-3 digits, dot, 3 digits, dot, 3 digits)
  const m = s.match(/^(\d{1,3}(?:\.\d{3})+)$/);
  if (!m) return s;
  // Strip dots, parse as int
  const n = parseInt(s.replace(/\./g, ''), 10);
  if (isNaN(n)) return s;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    // 2 decimals if < 10, 1 if < 100, 0 if >= 100
    return (m < 10 ? m.toFixed(2).replace(/\.?0+$/, '') : m < 100 ? m.toFixed(1).replace(/\.?0+$/, '') : Math.round(m).toString()) + 'M';
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return (k < 10 ? k.toFixed(1).replace(/\.0$/, '') : Math.round(k).toString()) + 'K';
  }
  return n.toString();
}

let totalChanged = 0;
function walk(obj) {
  if (Array.isArray(obj)) { obj.forEach(walk); return; }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') {
        const before = obj[k];
        const after = toCanonical(before);
        if (after !== before) { obj[k] = after; totalChanged++; }
      } else if (typeof obj[k] === 'object') {
        walk(obj[k]);
      }
    }
  }
}

walk(data);

writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`Normalized ${totalChanged} string values.`);
