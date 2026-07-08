// TITAN PRO · V8 — LLM client for OpenRouter + Google Studio.
// Uses the OpenAI-compatible SDK endpoints.
//
// API keys are read from Vite env vars at build time so the user never has to
// paste them in Settings. Set these in `.env` at the project root:
//   VITE_OPENROUTER_API_KEY=sk-or-v1-...
//   VITE_GOOGLE_STUDIO_API_KEY=AIza...
//   VITE_LLM_PROVIDER=openrouter          (or 'google')
//   VITE_LLM_MODEL=anthropic/claude-3.5-sonnet
//
// The localStorage "settings" key still works as a runtime override — useful
// for testing different keys without rebuilding.

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/';
const GOOGLE_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai/';

const MODELS = {
  openrouter: [
    'anthropic/claude-3-haiku',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet', // may 404 on some keys
    'google/gemini-2.0-flash-exp:free', // may 404 on some keys
  ],
  google: [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
};

export const modelOptions = (provider) => MODELS[provider] ?? [];

// Resolved at module load from VITE_* env vars (build-time injected)
export const DEFAULT_PROVIDER = import.meta.env.VITE_LLM_PROVIDER || 'openrouter';
export const DEFAULT_MODEL =
  import.meta.env.VITE_LLM_MODEL || MODELS[DEFAULT_PROVIDER]?.[0] || MODELS.openrouter[0];
export const DEFAULT_OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
export const DEFAULT_GOOGLE_KEY = import.meta.env.VITE_GOOGLE_STUDIO_API_KEY || '';

// Pick the right env-baked key for the chosen provider
export const envApiKeyFor = (provider) =>
  provider === 'google' ? DEFAULT_GOOGLE_KEY : DEFAULT_OPENROUTER_KEY;

const endpoint = (provider) => (provider === 'google' ? GOOGLE_BASE : OPENROUTER_BASE);

export async function chat({ messages, apiKey, provider, model, signal }) {
  const p = provider || DEFAULT_PROVIDER;
  const m = model || DEFAULT_MODEL;
  const k = apiKey || envApiKeyFor(p);
  if (!k) throw new Error('API key belum diset. Isi VITE_OPENROUTER_API_KEY atau VITE_GOOGLE_STUDIO_API_KEY di .env, atau lewat Settings.');

  const res = await fetch(`${endpoint(p)}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${k}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://titan-pro.local',
      'X-Title': 'TITAN PRO V8',
    },
    body: JSON.stringify({
      model: m,
      messages,
      max_tokens: 600,
      temperature: 0.7,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}
