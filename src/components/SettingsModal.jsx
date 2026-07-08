// TITAN PRO · V8 — Settings modal for API key + provider/model.
// Build-time .env vars (VITE_OPENROUTER_API_KEY / VITE_GOOGLE_STUDIO_API_KEY)
// are read automatically. This dialog is only needed to override at runtime.

import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { getSettings, saveSettings } from '../lib/storage.js';
import { modelOptions, DEFAULT_PROVIDER, DEFAULT_MODEL, envApiKeyFor } from '../lib/llm.js';

export default function SettingsModal({ open, onClose }) {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (!open) return;
    const s = getSettings();
    setProvider(s.provider ?? 'openrouter');
    setApiKey(s.apiKey ?? '');
    setModel(s.model ?? modelOptions(s.provider ?? 'openrouter')[0] ?? '');
  }, [open]);

  if (!open) return null;

  const envKeyPresent = !!envApiKeyFor(provider);
  const save = () => {
    saveSettings({ provider, apiKey: apiKey.trim(), model });
    onClose();
  };

  const clear = () => {
    saveSettings({ apiKey: '', model: modelOptions(provider)[0] ?? '' });
    setApiKey('');
  };

  const resetAll = () => {
    try { localStorage.removeItem('titan-pro-v8'); } catch {}
    setProvider(DEFAULT_PROVIDER);
    setApiKey('');
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
            {envKeyPresent ? (
              <><Icon name="check" size={12} /> API key dari <code>.env</code> aktif</>
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
            <span>API Key (override)</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'openrouter' ? 'sk-or-v1-...' : 'AIza...'}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
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
