// TITAN PRO · V8 — localStorage helpers (settings, chat history).
//
// localStorage "settings" key still works as a runtime override. If the user
// hasn't typed anything in the Settings modal, we fall back to the VITE_*
// env vars that were baked in at build time.

import { envApiKeyFor, DEFAULT_PROVIDER, DEFAULT_MODEL } from './llm.js';

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

export const getSettings = () => {
  const stored = read().settings ?? {};
  // Layered resolution: localStorage > env (build-time) > undefined
  return {
    provider: stored.provider ?? DEFAULT_PROVIDER,
    model: stored.model ?? DEFAULT_MODEL,
    apiKey: stored.apiKey ?? envApiKeyFor(stored.provider ?? DEFAULT_PROVIDER),
  };
};

export const saveSettings = (patch) => {
  const state = read();
  state.settings = { ...state.settings, ...patch };
  write(state);
};

export const getApiKey = () => getSettings().apiKey || '';
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
