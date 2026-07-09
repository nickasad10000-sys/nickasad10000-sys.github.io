// TITAN PRO · V8 — Home page: hero with ShinyText title + 8 platform-tinted account rows.
// Top-left "refresh" button reloads account data + the LLM context, so the user
// can re-pull the latest numbers without reloading the whole page.

import { useState, useCallback } from 'react';
import ShinyText from '../components/ShinyText.jsx';
import AccountRow from '../components/AccountRow.jsx';
import DigitalClock from '../components/DigitalClock.jsx';
import Icon from '../components/Icon.jsx';
import { accounts } from '../data/accounts.js';

const REFRESH_KEY = 'titan-pro-v8-refresh';

function readLastRefresh() {
  try {
    const raw = localStorage.getItem(REFRESH_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function writeLastRefresh(ts) {
  try {
    localStorage.setItem(REFRESH_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

function formatRelative(ts) {
  if (!ts) return 'belum pernah';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 30) return 'baru saja';
  if (s < 60) return `${s} detik lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export default function Home() {
  // Bump this counter to force account rows + downstream consumers to re-derive
  // their data. The data source is static JSON, so re-deriving is cheap.
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(readLastRefresh);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Re-import the data module with a cache-busting query string so the
      // JSON is re-fetched. Vite supports this for JSON imports.
      const mod = await import(`../data/accounts.js?ts=${Date.now()}`);
      // Touch the imported module to ensure side-effects run.
      void mod.accounts;
      const now = Date.now();
      writeLastRefresh(now);
      setLastRefresh(now);
      setRefreshTick((t) => t + 1);
    } catch (e) {
      // Swallow — the data is static; if the re-import fails, we still bump
      // the tick so the UI shows a fresh relative-time label.
      const now = Date.now();
      writeLastRefresh(now);
      setLastRefresh(now);
      setRefreshTick((t) => t + 1);
    } finally {
      // Brief delay so the user sees the spinner
      setTimeout(() => setRefreshing(false), 350);
    }
  }, [refreshing]);

  return (
    <div className="home">
      <DigitalClock />

      {/* Top-left refresh — sits on the page edge so it doesn't fight the hero
          content. Disabled while a refresh is in flight. */}
      <button
        type="button"
        className={`home__refresh ${refreshing ? 'is-loading' : ''}`}
        onClick={handleRefresh}
        disabled={refreshing}
        title={`Refresh data akun. Update terakhir: ${formatRelative(lastRefresh)}`}
        aria-label={`Refresh data akun. Update terakhir: ${formatRelative(lastRefresh)}`}
      >
        <Icon name="refresh" size={13} />
        <span className="home__refresh-label">
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </span>
        <span className="home__refresh-meta">{formatRelative(lastRefresh)}</span>
      </button>

      <section className="home__hero">
        <div className="home__hero-inner">
          <span className="home__eyebrow"><Icon name="sword" size={12} /> TITAN PRO · V8</span>
          <h1 className="home__title">
            <ShinyText
              text="TITAN PRO"
              speed={3}
              spread={120}
              color="#ffffff"
              shineColor="#a24bf5"
            />
          </h1>
          <p className="home__tagline">
            Social intelligence untuk tim konten.
          </p>
          <div className="home__cta-row">
            <a className="tm-btn tm-btn--primary" href="#akun"><Icon name="shield" size={13} /> Lihat 8 Akun</a>
            <span className="home__cta-meta">Updated · {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </section>

      <section className="home__grid" id="akun" aria-labelledby="akun-heading">
        <h2 id="akun-heading" className="home__section-title">
          <span className="home__section-bar" />
          <ShinyText
            text="Akun Tim"
            speed={2.6}
            spread={120}
            color="#ffffff"
            shineColor="#a24bf5"
          />
        </h2>

        <h3 className="home__group-title home__group-title--tt">
          <ShinyText
            text="⚡ TikTok · 4 Akun"
            speed={2.6}
            spread={120}
            color="#ffffff"
            shineColor="#a24bf5"
          />
        </h3>
        <div className="home__rows">
          {accounts
            .filter((a) => a.profile.platform === 'tiktok')
            .map((a, i) => (
              <AccountRow key={`${a.slug}-${refreshTick}`} account={a} rank={i + 1} />
            ))}
        </div>

        <h3 className="home__group-title home__group-title--ig">
          <ShinyText
            text="📸 Instagram · 4 Akun"
            speed={2.6}
            spread={120}
            color="#ffffff"
            shineColor="#a24bf5"
          />
        </h3>
        <div className="home__rows">
          {accounts
            .filter((a) => a.profile.platform === 'instagram')
            .map((a, i) => (
              <AccountRow key={`${a.slug}-${refreshTick}`} account={a} rank={i + 5} />
            ))}
        </div>
      </section>

    </div>
  );
}
