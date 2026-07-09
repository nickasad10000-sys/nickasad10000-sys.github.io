// TITAN PRO · V8 — LLM client for OpenRouter + Google Studio.
// Uses the OpenAI-compatible SDK endpoints.
//
// API keys are read from Vite env vars at build time so the user never has to
// paste them in Settings. Set these in `.env` at the project root:
//   VITE_OPENROUTER_API_KEY=sk-or-v1-...
//   VITE_OPENROUTER_API_KEY_2=sk-or-v1-...   (optional — adds a 2nd key to the pool)
//   VITE_OPENROUTER_API_KEY_3=sk-or-v1-...   (optional — 3rd)
//   VITE_OPENROUTER_API_KEY_4=sk-or-v1-...   (optional — 4th)
//   VITE_GOOGLE_STUDIO_API_KEY=AIza...
//   VITE_LLM_PROVIDER=openrouter          (or 'google')
//   VITE_LLM_MODEL=anthropic/claude-3-haiku
//
// The localStorage "settings" key still works as a runtime override — useful
// for testing different keys without rebuilding. When the runtime override is
// an ARRAY of keys, we round-robin through them; when it's a single string,
// we use that one key.

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

// Build a pool of OpenRouter keys from the 4 VITE_OPENROUTER_API_KEY_N env vars.
// Empty entries are filtered out. Order is preserved (1, 2, 3, 4).
const openrouterKeyPool = [
  import.meta.env.VITE_OPENROUTER_API_KEY,
  import.meta.env.VITE_OPENROUTER_API_KEY_2,
  import.meta.env.VITE_OPENROUTER_API_KEY_3,
  import.meta.env.VITE_OPENROUTER_API_KEY_4,
].filter(Boolean);

const googleKeyPool = [import.meta.env.VITE_GOOGLE_STUDIO_API_KEY].filter(Boolean);

export const DEFAULT_OPENROUTER_KEYS = openrouterKeyPool;
export const DEFAULT_GOOGLE_KEYS = googleKeyPool;

export const envApiKeysFor = (provider) =>
  provider === 'google' ? googleKeyPool : openrouterKeyPool;

const endpoint = (provider) => (provider === 'google' ? GOOGLE_BASE : OPENROUTER_BASE);

// Errors that should trigger a failover to the next key in the pool.
const FAILOVER_STATUSES = new Set([402, 429, 500, 502, 503, 504, 408]);

// Parse a runtime override (localStorage) into a normalized pool of keys.
// Accepts: string, comma-separated string, or JSON array of strings.
export function parseKeyPool(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((k) => String(k).trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.map((k) => String(k).trim()).filter(Boolean);
      }
    } catch {
      /* fall through to comma split */
    }
  }
  if (s.includes(',')) {
    return s.split(',').map((k) => k.trim()).filter(Boolean);
  }
  return [s];
}

// Round-robin cursor (resets on page load). Each call advances the cursor.
let rrCursor = 0;
function pickKey(pool) {
  if (pool.length === 0) return null;
  const k = pool[rrCursor % pool.length];
  rrCursor = (rrCursor + 1) % pool.length;
  return k;
}

// Try a single key against the endpoint. Throws on non-2xx so the caller
// can decide whether to failover.
async function chatWithKey({ messages, apiKey, provider, model, signal }) {
  const res = await fetch(`${endpoint(provider)}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://titan-pro.local',
      'X-Title': 'TITAN PRO V8',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 600,
      temperature: 0.7,
      stream: false,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`LLM ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    err.failover = FAILOVER_STATUSES.has(res.status);
    throw err;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

/**
 * Send a chat completion.
 *
 * Keys strategy:
 *   1. If `apiKeyPool` is provided, use it (caller-controlled).
 *   2. Otherwise, read the env pool for the chosen provider.
 *   3. Round-robin pick the first key, then failover through the rest on
 *      transient errors (402, 429, 5xx, 408). Non-failover errors (400, 401,
 *      403, 404) fail fast — they won't be fixed by trying another key.
 */
export async function chat({ messages, apiKey, apiKeyPool, provider, model, signal }) {
  const p = provider || DEFAULT_PROVIDER;
  const m = model || DEFAULT_MODEL;

  // Normalize pool: explicit pool > runtime single key > env pool.
  let pool;
  if (apiKeyPool && apiKeyPool.length) {
    pool = apiKeyPool;
  } else if (apiKey) {
    pool = parseKeyPool(apiKey);
  } else {
    pool = envApiKeysFor(p);
  }

  if (!pool || pool.length === 0) {
    throw new Error(
      'API key belum diset. Isi VITE_OPENROUTER_API_KEY (atau _2/_3/_4) di .env, atau lewat Settings.'
    );
  }

  // Try the first key, then failover. Stop early on non-failover errors.
  let lastErr = null;
  for (let i = 0; i < pool.length; i++) {
    const k = pool[i];
    try {
      return await chatWithKey({ messages, apiKey: k, provider: p, model: m, signal });
    } catch (err) {
      lastErr = err;
      if (err.failover === false) {
        // Hard error (401, 403, 400, 404) — don't waste the other keys.
        throw err;
      }
      // Otherwise, continue to the next key.
    }
  }

  throw lastErr ?? new Error('All keys exhausted');
}

/** Return the list of env-baked keys for the current provider. Useful for the
 * Settings modal to show which keys are wired up. */
export const configuredKeyCount = (provider) => envApiKeysFor(provider ?? DEFAULT_PROVIDER).length;
