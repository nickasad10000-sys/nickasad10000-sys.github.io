// TITAN PRO · V8 — Home page: hero with ShinyText title + 8 platform-tinted account rows.
// The live clock now lives in the TopBar (next to the refresh button).
// The data refresh button is no longer here — it lives in the TopBar too.

import ShinyText from '../components/ShinyText.jsx';
import AccountRow from '../components/AccountRow.jsx';
import Icon from '../components/Icon.jsx';
import { accounts } from '../data/accounts.js';

export default function Home() {
  return (
    <div className="home">
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
              <AccountRow key={a.slug} account={a} rank={i + 1} />
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
              <AccountRow key={a.slug} account={a} rank={i + 5} />
            ))}
        </div>
      </section>

    </div>
  );
}
