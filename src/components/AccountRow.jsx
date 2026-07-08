// TITAN PRO · V8 — Account row card (color-coded by platform).

import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const TIKTOK_GRAD = 'linear-gradient(110deg, rgba(37, 244, 238, 0.18) 0%, rgba(254, 44, 85, 0.18) 100%)';
const IG_GRAD = 'linear-gradient(110deg, rgba(252, 176, 69, 0.20) 0%, rgba(253, 29, 29, 0.18) 50%, rgba(131, 58, 180, 0.22) 100%)';

function PlatformIcon({ platform, size = 22 }) {
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="tt-row" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#25F4EE" />
            <stop offset="1" stopColor="#FE2C55" />
          </linearGradient>
        </defs>
        <path
          d="M30 6h7c0 4.4 3.6 8 8 8v7c-3 0-5.7-.7-8-2v12c0 7.7-6.3 14-14 14s-14-6.3-14-14 6.3-14 14-14c1 0 2 .1 3 .4v7.4c-1-.5-2-.8-3-.8-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7V6z"
          fill="url(#tt-row)"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="ig-row" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCB045" />
          <stop offset="0.5" stopColor="#FD1D1D" />
          <stop offset="1" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="36" height="36" rx="10" fill="url(#ig-row)" />
      <circle cx="24" cy="24" r="7" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="34" cy="14" r="1.8" fill="#fff" />
    </svg>
  );
}

export default function AccountRow({ account, rank }) {
  const { slug, profile, kpis } = account;
  const isTT = profile.platform === 'tiktok';
  const grad = isTT ? TIKTOK_GRAD : IG_GRAD;
  const acc = kpis.find((k) => /Engagement Rate/.test(k.label))?.value;
  const views = kpis.find((k) => /Total Tayangan/.test(k.label))?.value;

  return (
    <Link to={`/account/${slug}`} className={`acct-row acct-row--${profile.platform}`} style={{ background: grad }}>
      <div className="acct-row__rank">#{rank}</div>
      <div className="acct-row__icon">
        <PlatformIcon platform={profile.platform} size={28} />
      </div>
      <div className="acct-row__main">
        <div className="acct-row__handle">
          <span className="acct-row__at">@{profile.handle}</span>
          {profile.verified && <span className="acct-row__verified" title="Verified"><Icon name="check" size={11} /></span>}
          <span className="acct-row__platform">{isTT ? 'TikTok' : 'Instagram'}</span>
        </div>
        <div className="acct-row__niche">{profile.niche}</div>
        <div className="acct-row__metrics">
          <span><b>{profile.followers}</b> followers</span>
          <span className="dot">·</span>
          <span><b>{acc ?? '—'}</b> ER</span>
          <span className="dot">·</span>
          <span><b>{views ?? '—'}</b> views</span>
        </div>
      </div>
      <div className="acct-row__arrow" aria-hidden="true"><Icon name="arrowRight" size={14} /></div>
    </Link>
  );
}
