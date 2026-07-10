// TITAN PRO · V8 — Support info modal. Shown when the user clicks the
// topbar support icon and Chatwoot is not configured (no
// VITE_CHATWOOT_BASE_URL / VITE_CHATWOOT_WEBSITE_TOKEN env vars at build
// time). Explains how to enable the real support widget and offers a
// mailto fallback for the meantime.

import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

const SUPPORT_EMAIL = 'support@titanpro.example.com';
const SETUP_DOCS_URL = 'https://www.chatwoot.com/developers/sdk/';

export default function SupportInfoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('titan:open-support-info', onOpen);
    return () => window.removeEventListener('titan:open-support-info', onOpen);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="tm-modal" onClick={() => setOpen(false)} role="presentation">
      <div
        className="tm-modal__backdrop"
        aria-hidden="true"
      />
      <div
        className="tm-modal__panel tm-support-modal"
        role="dialog"
        aria-labelledby="tm-support-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tm-modal__head">
          <span className="tm-modal__icon" aria-hidden="true">
            <Icon name="life-buoy" size={18} />
          </span>
          <h2 id="tm-support-title" className="tm-modal__title">Support Widget</h2>
          <button
            type="button"
            className="tm-modal__close"
            onClick={() => setOpen(false)}
            aria-label="Tutup"
            title="Tutup"
          >
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="tm-modal__body">
          <p className="tm-support-modal__lead">
            Widget support eksternal (Chatwoot) belum diaktifkan untuk situs ini.
            Untuk sementara, hubungi tim lewat email di bawah ini.
          </p>

          <div className="tm-support-modal__row">
            <span className="tm-support-modal__label">Email</span>
            <a
              className="tm-support-modal__link"
              href={`mailto:${SUPPORT_EMAIL}?subject=Bantuan%20TITAN%20PRO`}
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          <details className="tm-support-modal__details">
            <summary>Aktifkan Chatwoot untuk tim</summary>
            <p>Tambahkan dua variabel ini ke <code>.env</code>:</p>
            <pre className="tm-support-modal__code"><code>{`VITE_CHATWOOT_BASE_URL=https://chat.tim-kamu.com
VITE_CHATWOOT_WEBSITE_TOKEN=token-dari-chatwoot`}</code></pre>
            <p>Lalu redeploy. Widget support akan muncul otomatis di pojok kanan bawah.</p>
            <p>
              Panduan lengkap:{' '}
              <a href={SETUP_DOCS_URL} target="_blank" rel="noreferrer noopener">
                Chatwoot SDK docs
              </a>
            </p>
          </details>
        </div>

        <footer className="tm-modal__foot">
          <a className="tm-btn tm-btn--primary" href={`mailto:${SUPPORT_EMAIL}?subject=Bantuan%20TITAN%20PRO`}>
            <Icon name="mail" size={13} /> Kirim Email
          </a>
          <button type="button" className="tm-btn" onClick={() => setOpen(false)}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}
