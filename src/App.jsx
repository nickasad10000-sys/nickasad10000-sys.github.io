// TITAN PRO · V8 — App shell: topbar + routes + orb background.
// The mascot and chat panel are owned by the TopBar so the chat can anchor
// directly below the mascot in the navigation. API key is fully automatic
// (read from .env at build time). Settings modal and Chatwoot are not exposed.

import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import TopBar from './components/TopBar.jsx';
import ShinyText from './components/ShinyText.jsx';
import { accountBySlug, accounts } from './data/accounts.js';
import { buildAccountContext } from './data/prompts.js';

const Home = lazy(() => import('./routes/Home.jsx'));
const AccountPage = lazy(() => import('./routes/AccountPage.jsx'));
const NotFound = lazy(() => import('./routes/NotFound.jsx'));

/**
 * Build a compact overview of all 8 accounts for the Beranda page.
 * One line per account with the headline KPIs.
 */
function buildHomeContext() {
  const lines = ['Ringkasan 8 akun tim Lumajang:'];
  for (const a of accounts) {
    const followers = a.kpis.find((k) => /Followers/i.test(k.label))?.value ?? '—';
    const views = a.kpis.find((k) => /Total Tayangan/i.test(k.label))?.value ?? '—';
    const er = a.kpis.find((k) => /Engagement Rate/i.test(k.label))?.value ?? '—';
    const posts = a.kpis.find((k) => /Total (Video|Post)/i.test(k.label))?.value ?? '—';
    const platform = a.profile.platform === 'tiktok' ? 'TT' : 'IG';
    lines.push(`- [${platform}] @${a.profile.handle} | ${followers} followers | ${views} views | ${er} ER | ${posts} posting`);
  }
  return lines.join('\n');
}

function ChatContextForRoute(pathname) {
  if (pathname === '/') {
    return {
      pageTitle: 'Beranda',
      accountName: 'Semua Akun',
      platform: 'Multi',
      accountContext: buildHomeContext(),
    };
  }
  const m = pathname.match(/^\/account\/([^/]+)/);
  if (m) {
    const a = accountBySlug(m[1]);
    if (a) {
      return {
        pageTitle: a.profile.handle,
        accountName: `@${a.profile.handle}`,
        platform: a.profile.platform === 'tiktok' ? 'TikTok' : 'Instagram',
        accountContext: buildAccountContext(a),
      };
    }
  }
  return { pageTitle: 'Halaman' };
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const { pathname } = useLocation();
  const context = ChatContextForRoute(pathname);

  return (
    <div className="app">
      <div className="app__overlay" aria-hidden="true" />

      <TopBar
        onOpenChat={() => setChatOpen((v) => !v)}
        chatOpen={chatOpen}
        context={context}
      />

      <main className="app__main">
        <ScrollToTop />
        <Suspense fallback={<div className="route-loading">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/account/:slug" element={<AccountPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app__footer">
        <ShinyText
          text="⚔ TITAN PRO"
          speed={4}
          spread={120}
          color="#ffffff"
          shineColor="#a24bf5"
        />
      </footer>
    </div>
  );
}
