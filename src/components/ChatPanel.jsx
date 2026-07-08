// TITAN PRO · V8 — Chat panel: mascot conversation with LLM + smart fallback.

import { useEffect, useRef, useState } from 'react';
import TitanLogo from './TitanLogo.jsx';
import Icon from './Icon.jsx';
import { useLlmChat } from '../hooks/useLlmChat.js';
import { QUICK_PROMPTS } from '../data/prompts.js';
import { getApiKey, clearChatHistory, getProvider } from '../lib/storage.js';
import { envApiKeyFor, DEFAULT_PROVIDER } from '../lib/llm.js';

function fmt(ts) {
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatPanel({ open, onClose, context }) {
  const { messages, send, loading, error } = useLlmChat(context);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const hasKey = !!getApiKey() || !!envApiKeyFor(getProvider() || DEFAULT_PROVIDER);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const submit = async (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t || loading) return;
    setText('');
    await send(t);
  };

  if (!open) return null;

  return (
    <aside className="tm-chat" role="dialog" aria-modal="false" aria-label="Chat dengan TITAN">
      <header className="tm-chat__head">
        <div className="tm-chat__avatar"><TitanLogo size={32} /></div>
        <div className="tm-chat__title">
          <strong>TITAN</strong>
          <span>{hasKey ? 'AI aktif' : 'Smart-pattern'}</span>
        </div>
        <div className="tm-chat__head-actions">
          <button type="button" onClick={() => { clearChatHistory(); window.location.reload(); }} title="Hapus history" aria-label="Hapus history"><Icon name="trash" size={13} /></button>
          <button type="button" onClick={onClose} aria-label="Close chat"><Icon name="close" size={14} /></button>
        </div>
      </header>

      <div className="tm-chat__body" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="tm-chat__welcome">
            <p><b>Halo, Kak.</b></p>
            <p>{context?.pageTitle === 'Beranda'
              ? 'Aku TITAN — maskot AI untuk 8 akun tim. Tanya soal performa, strategi, atau tren konten di akun manapun.'
              : `Aku TITAN — aku bisa jelasin data lengkap akun ${context?.accountName ?? 'ini'}: KPI, top konten viral, kelemahan, sampai saran strategi.`}</p>
            <p className="tm-chat__welcome-sub">Langsung ketik pertanyaan di bawah.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`tm-chat__row tm-chat__row--${m.role}`}>
            {m.role === 'assistant' && <div className="tm-chat__bubble-avatar"><TitanLogo size={20} /></div>}
            <div className="tm-chat__bubble">
              <div className="tm-chat__text">{m.text}</div>
              <div className="tm-chat__meta">
                {fmt(m.ts)} {m.fallback && '· smart'}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="tm-chat__row tm-chat__row--assistant">
            <div className="tm-chat__bubble-avatar"><TitanLogo size={20} /></div>
            <div className="tm-chat__bubble tm-chat__bubble--typing">
              <span className="tm-chat__dot" /><span className="tm-chat__dot" /><span className="tm-chat__dot" />
            </div>
          </div>
        )}
      </div>

      {QUICK_PROMPTS.length > 0 && (
        <div className="tm-chat__quick">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} type="button" onClick={() => send(q)} disabled={loading}>{q}</button>
          ))}
        </div>
      )}

      {error && (
        <div className="tm-chat__error" role="alert" title={error}>
          ⚠ AI error — pakai smart-pattern. Cek Settings.
        </div>
      )}

      <form className="tm-chat__form" onSubmit={submit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pertanyaan..."
          disabled={loading}
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !text.trim()} aria-label="Kirim"><Icon name="paperPlane" size={14} /></button>
      </form>
    </aside>
  );
}
