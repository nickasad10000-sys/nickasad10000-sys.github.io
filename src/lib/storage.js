// TITAN PRO · V8 — localStorage helpers (settings, chat history).
//
// localStorage "settings" key still works as a runtime override. If the user
// hasn't typed anything in the Settings modal, we fall back to the VITE_*
// env vars that were baked in at build time.

import { envApiKeysFor, DEFAULT_PROVIDER, DEFAULT_MODEL } from './llm.js';

const KEY = 'titan-pro-v8';

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const write = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('localStorage write failed', e);
  }
};

// Resolve a settings record (provider, model, apiKey) by layering:
//   localStorage value > env-baked pool (for the chosen provider).
// apiKey may be a single string OR an array of strings (key pool).
export const getSettings = () => {
  const stored = read().settings ?? {};
  const provider = stored.provider ?? DEFAULT_PROVIDER;
  const envPool = envApiKeysFor(provider);
  // Stored apiKey: if absent, fall back to entire env pool.
  // If a string, treat as single-key pool. If array, use as-is.
  let apiKey = stored.apiKey;
  if (apiKey == null || apiKey === '') {
    apiKey = envPool.length ? envPool : '';
  }
  return {
    provider,
    model: stored.model ?? DEFAULT_MODEL,
    apiKey,
    apiKeyCount: Array.isArray(apiKey) ? apiKey.length : 1,
  };
};

export const saveSettings = (patch) => {
  const state = read();
  state.settings = { ...state.settings, ...patch };
  write(state);
};

export const getApiKey = () => {
  const s = getSettings();
  if (Array.isArray(s.apiKey)) return s.apiKey[0] || '';
  return s.apiKey || '';
};

export const getApiKeyPool = () => {
  const s = getSettings();
  if (Array.isArray(s.apiKey)) return s.apiKey.filter(Boolean);
  if (typeof s.apiKey === 'string' && s.apiKey.trim()) return [s.apiKey.trim()];
  return [];
};

export const getProvider = () => getSettings().provider || DEFAULT_PROVIDER;
export const getModel = () => getSettings().model || DEFAULT_MODEL;

export const getChatHistory = () => {
  const s = read();
  return s.history ?? [];
};

export const saveChatHistory = (history) => {
  const state = read();
  state.history = history.slice(-50); // cap to last 50
  write(state);
};

export const clearChatHistory = () => {
  const state = read();
  delete state.history;
  write(state);
};
