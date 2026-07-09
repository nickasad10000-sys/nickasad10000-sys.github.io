// TITAN PRO · V8 — Settings modal for API keys + provider/model.
// Build-time .env vars (VITE_OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY_2/3/4
// and VITE_GOOGLE_STUDIO_API_KEY) are read automatically. This dialog is only
// needed to override at runtime — and accepts MULTIPLE keys (one per line)
// so the chat can failover through them if one hits a credit or rate limit.

import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { getSettings, saveSettings } from '../lib/storage.js';
import { modelOptions, DEFAULT_PROVIDER, DEFAULT_MODEL, envApiKeysFor, parseKeyPool } from '../lib/llm.js';

function poolToText(pool) {
  if (Array.isArray(pool)) return pool.join('\n');
  return pool || '';
}

function textToPool(text) {
  // Split on newlines, also accept comma-separated entries; drop blanks.
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SettingsModal({ open, onClose }) {
  const [provider, setProvider] = useState('openrouter');
  const [apiKeyText, setApiKeyText] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (!open) return;
    const s = getSettings();
    setProvider(s.provider ?? 'openrouter');
    setApiKeyText(poolToText(s.apiKey));
    setModel(s.model ?? modelOptions(s.provider ?? 'openrouter')[0] ?? '');
  }, [open]);

  if (!open) return null;

  const envKeys = envApiKeysFor(provider);
  const envKeyCount = envKeys.length;
  const userPool = textToPool(apiKeyText);
  const userKeyCount = userPool.length;
  const totalKeyCount = userKeyCount > 0 ? userKeyCount : envKeyCount;

  const save = () => {
    const pool = textToPool(apiKeyText);
    saveSettings({
      provider,
      apiKey: pool.length ? pool : '',
      model,
    });
    onClose();
  };

  const clear = () => {
    saveSettings({ apiKey: '', model: modelOptions(provider)[0] ?? '' });
    setApiKeyText('');
  };

  const resetAll = () => {
    try { localStorage.removeItem('titan-pro-v8'); } catch {}
    setProvider(DEFAULT_PROVIDER);
    setApiKeyText('');
    setModel(DEFAULT_MODEL);
  };

  return (
    <div className="tm-modal" role="dialog" aria-modal="true" aria-label="Settings TITAN">
      <div className="tm-modal__backdrop" onClick={onClose} />
      <div className="tm-modal__panel">
        <header className="tm-modal__head">
          <h2><Icon name="cog" size={16} /> AI TITAN</h2>
          <button type="button" className="tm-modal__close" onClick={onClose} aria-label="Close"><Icon name="close" size={14} /></button>
        </header>
        <div className="tm-modal__body">
          <p className="tm-modal__status">
            {envKeyCount > 0 ? (
              <><Icon name="check" size={12} /> {envKeyCount} key dari <code>.env</code> aktif — round-robin & failover</>
            ) : (
              <><Icon name="circleInfo" size={12} /> Belum ada key. Isi di bawah, atau pakai smart-pattern.</>
            )}
          </p>

          <label className="tm-field">
            <span>Provider</span>
            <select value={provider} onChange={(e) => {
              const p = e.target.value;
              setProvider(p);
              setModel(modelOptions(p)[0] ?? '');
            }}>
              <option value="openrouter">OpenRouter</option>
              <option value="google">Google Studio (Gemini)</option>
            </select>
          </label>

          <label className="tm-field">
            <span>Model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {modelOptions(provider).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="tm-field">
            <span>
              API Key (override)
              {userKeyCount > 1 && (
                <span className="tm-field__hint"> — {userKeyCount} key, round-robin</span>
              )}
            </span>
            <textarea
              rows={Math.max(2, Math.min(6, userKeyCount + 1))}
              value={apiKeyText}
              onChange={(e) => setApiKeyText(e.target.value)}
              placeholder={
                provider === 'openrouter'
                  ? 'sk-or-v1-...\nsk-or-v1-...\n(satu key per baris, atau dipisah koma)'
                  : 'AIza...\nAIza...'
              }
              autoComplete="off"
              spellCheck={false}
            />
            {userKeyCount === 0 && envKeyCount > 0 && (
              <span className="tm-field__hint">
                Kosongkan untuk pakai {envKeyCount} key dari .env
              </span>
            )}
          </label>

          {totalKeyCount > 1 && (
            <p className="tm-modal__status tm-modal__status--muted">
              <Icon name="wand" size={12} /> {totalKeyCount} key akan dipakai round-robin. Kalau satu gagal (402/429/5xx), otomatis lanjut ke key berikutnya.
            </p>
          )}
        </div>
        <footer className="tm-modal__foot">
          <button type="button" className="tm-btn tm-btn--ghost" onClick={clear}><Icon name="trash" size={12} /> Hapus</button>
          <button type="button" className="tm-btn tm-btn--ghost" onClick={resetAll} title="Hapus cache localStorage dan pakai default .env"><Icon name="refresh" size={12} /> Reset .env</button>
          <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose}>Batal</button>
          <button type="button" className="tm-btn tm-btn--primary" onClick={save}><Icon name="save" size={12} /> Simpan</button>
        </footer>
      </div>
    </div>
  );
}
