// TITAN PRO · V8 — Optional Chatwoot support widget loader.
//
// To enable, set in `.env`:
//   VITE_CHATWOOT_BASE_URL=https://your-chatwoot.example.com
//   VITE_CHATWOOT_WEBSITE_TOKEN=your-website-token
//
// When both are set, the widget loads from BASE_URL/packs/js/sdk.js and runs
// automatically. When either is missing, this module is a no-op.

const baseUrl = import.meta.env.VITE_CHATWOOT_BASE_URL;
const token = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN;

let loaded = false;

export function loadChatwoot() {
  if (loaded) return;
  if (!baseUrl || !token) return;
  if (typeof window === 'undefined') return;

  loaded = true;
  window.chatwootSettings = { baseUrl, websiteToken: token };

  const s = document.createElement('script');
  s.src = baseUrl.replace(/\/$/, '') + '/packs/js/sdk.js';
  s.defer = true;
  s.async = true;
  s.onload = () => {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({ websiteToken: token, baseUrl });
    }
  };
  document.head.appendChild(s);
}

export const isChatwootConfigured = () => Boolean(baseUrl && token);
