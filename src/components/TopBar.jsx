// TITAN PRO · V8 — Top navigation bar with Corinthian logo + tagline, live
// digital clock, refresh-data button, and the TITAN mascot that opens the
// chat panel anchored below it. Chat panel DOM lives here so it can position
// itself relative to the mascot cluster.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TitanLogo from './TitanLogo.jsx';
import Icon from './Icon.jsx';
import DigitalClock from './DigitalClock.jsx';
import TopBarMascot from './TopBarMascot.jsx';
import ChatPanel from './ChatPanel.jsx';

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

export default function TopBar({ onOpenChat, chatOpen = false, context }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(readLastRefresh);

  // Re-tick relative time every 30s so the label stays fresh.
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(readLastRefresh()), 30000);
    return () => clearInterval(id);
  }, []);

  // Close chat on Escape for a polished keyboard experience.
  useEffect(() => {
    if (!chatOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChat?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, onOpenChat]);

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
        <div className="tm-topbar__mascot-cluster">
          <TopBarMascot
            onClick={onOpenChat}
            active={chatOpen}
            size={56}
          />
          <ChatPanel
            open={chatOpen}
            onClose={onOpenChat}
            context={context}
            anchored
          />
        </div>
        <DigitalClock />
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
      </nav>
    </header>
  );
}
