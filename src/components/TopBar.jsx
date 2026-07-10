// TITAN PRO · V8 — Top navigation bar with Corinthian logo + tagline.
// API key is fully automatic (read from .env at build time). The Settings
// modal is no longer exposed; the only topbar actions are Chat (TITAN) and
// Refresh data. A small support icon opens either the Chatwoot widget (if
// configured) or a fallback info modal with setup instructions.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TitanLogo from './TitanLogo.jsx';
import Icon from './Icon.jsx';
import { isChatwootConfigured } from '../lib/chatwoot.js';

const REFRESH_KEY = 'titan-pro-v8-refresh';

function readLastRefresh() {
  try {
    const raw = localStorage.getItem(REFRESH_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function formatRelative(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 30) return 'baru saja';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

export default function TopBar({ onOpenChat }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(readLastRefresh);

  // Re-tick relative time every 30s so the label stays fresh.
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(readLastRefresh()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Re-import the static accounts module with a cache-busting query so
      // Vite re-issues the JSON request. Even if this fails, we still bump
      // the timestamp so the UI shows a fresh relative time.
      try {
        const mod = await import(`../data/accounts.js?ts=${Date.now()}`);
        void mod.accounts;
      } catch {
        /* static import — the data hasn't changed locally; the tick is the
           real signal for downstream consumers. */
      }
      const now = Date.now();
      try { localStorage.setItem(REFRESH_KEY, String(now)); } catch {}
      setLastRefresh(now);
      // Force a soft re-render of all consumers by bumping a custom event.
      window.dispatchEvent(new CustomEvent('titan:refresh'));
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refreshing]);

  // Support button: if Chatwoot is configured at build-time, open its
  // widget directly. Otherwise show a small info modal explaining the
  // VITE_CHATWOOT_* env vars the team can set to enable it.
  const handleSupport = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isChatwootConfigured()) {
      // Chatwoot SDK exposes a toggle on window.$chatwoot
      const cw = window.$chatwoot;
      if (cw && typeof cw.toggle === 'function') {
        cw.toggle();
        return;
      }
      // Fallback: bubble click (Chatwoot default selector)
      const bubble = document.querySelector('.woot-widget-bubble');
      if (bubble) bubble.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('titan:open-support-info'));
  }, []);

  return (
    <header className="tm-topbar">
      <Link to="/" className="tm-topbar__brand" aria-label="TITAN PRO home">
        <TitanLogo size={36} />
        <div className="tm-topbar__title">
          <span className="tm-topbar__name">TITAN PRO</span>
          <span className="tm-topbar__sub">SOCIAL · INTELLIGENCE</span>
        </div>
      </Link>

      <nav className="tm-topbar__nav" aria-label="Primary">
        <button
          type="button"
          className={`tm-topbar__link tm-topbar__link--btn tm-topbar__refresh ${refreshing ? 'is-loading' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label={`Refresh data (${formatRelative(lastRefresh)})`}
          title={`Refresh data — update terakhir ${formatRelative(lastRefresh)}`}
        >
          <Icon name="refresh" size={13} />
          <span className="tm-topbar__refresh-meta">{formatRelative(lastRefresh)}</span>
        </button>
        <button
          type="button"
          className="tm-topbar__link tm-topbar__link--btn tm-topbar__support"
          onClick={handleSupport}
          aria-label={isChatwootConfigured() ? 'Buka support widget' : 'Buka info support'}
          title="Support"
        >
          <Icon name="life-buoy" size={13} />
        </button>
      </nav>
    </header>
  );
}
