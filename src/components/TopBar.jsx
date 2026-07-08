// TITAN PRO · V8 — Top navigation bar with Corinthian logo + tagline.

import { Link, useLocation } from 'react-router-dom';
import TitanLogo from './TitanLogo.jsx';
import Icon from './Icon.jsx';
import { getApiKey } from '../lib/storage.js';

export default function TopBar({ onOpenSettings, onOpenChat }) {
  const loc = useLocation();
  const hasKey = !!getApiKey();
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
        <Link to="/" className={`tm-topbar__link ${loc.pathname === '/' ? 'is-active' : ''}`}>Beranda</Link>
        <button
          type="button"
          className="tm-topbar__link tm-topbar__link--btn"
          onClick={onOpenChat}
          aria-label="Tanya TITAN"
          title="Tanya TITAN"
        >
          <Icon name="comments" size={13} />
        </button>
        <button
          type="button"
          className={`tm-topbar__settings ${hasKey ? 'is-on' : ''}`}
          onClick={onOpenSettings}
          aria-label="Buka settings"
          title={hasKey ? 'API key aktif' : 'API key belum diisi'}
        >
          <Icon name={hasKey ? 'wand' : 'cog'} size={13} /> {hasKey ? 'AI' : 'Setup'}
        </button>
      </nav>
    </header>
  );
}
