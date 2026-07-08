// TITAN PRO · V8 — Hook: LLM chat with smart-pattern fallback + history.

import { useEffect, useState, useCallback } from 'react';
import { chat, envApiKeyFor, DEFAULT_PROVIDER, DEFAULT_MODEL } from '../lib/llm.js';
import { smartReply } from '../lib/smartPattern.js';
import { buildSystemPrompt } from '../data/prompts.js';
import { getApiKey, getProvider, getModel, getChatHistory, saveChatHistory } from '../lib/storage.js';

// Strip emojis + non-text symbols from the LLM output. Mascot responses must be
// pure text. Covers:
//   - BMP emoji blocks (😀-🿿)
//   - Supplemental symbols (🀄-🪿)
//   - Symbol Unicode blocks (☀-⏿, ✀-➿, etc.)
//   - Variation selectors (️)
//   - Common ASCII art emoji (•·▪►)
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F300}-\u{1F9FF}\u{FE0F}\u{200D}•·▪►▼▲◄→←↑↓★☆♥♦♠♣]/gu;
function stripEmoji(s) {
  return (s || '').replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
}

export function useLlmChat(context) {
  const [messages, setMessages] = useState(() => getChatHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const send = useCallback(
    async (text) => {
      const userMsg = { role: 'user', text, ts: Date.now() };
      const next = [...messages, userMsg];
      setMessages(next);
      setLoading(true);
      setError(null);

      const sys = buildSystemPrompt(context ?? {});

      const history = [{ role: 'system', content: sys }, ...next.slice(-10).map((m) => ({ role: m.role, content: m.text }))];

      // Layered resolution: localStorage > env (build-time)
      const apiKey = getApiKey() || envApiKeyFor(getProvider() || DEFAULT_PROVIDER);
      const provider = getProvider() || DEFAULT_PROVIDER;
      const model = getModel() || DEFAULT_MODEL;

      // Debug breadcrumb — dev only, silent in production builds
      const debug = import.meta.env.DEV;
      if (debug && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.info('[TITAN LLM] → sending', {
          provider,
          model,
          hasKey: !!apiKey,
          keyPrefix: apiKey ? apiKey.slice(0, 10) + '…' : '(none)',
          msgCount: history.length,
          ctxChars: (context?.accountContext ?? '').length,
        });
      }

      let reply = '';
      let usedFallback = false;
      try {
        if (apiKey) {
          reply = await chat({ messages: history, apiKey, provider, model });
          reply = stripEmoji(reply);
        } else {
          usedFallback = true;
          if (debug) console.warn('[TITAN LLM] no API key, using smart-pattern');
          reply = smartReply({ userText: text, ...(context ?? {}) });
        }
      } catch (e) {
        usedFallback = true;
        setError(e.message ?? String(e));
        if (debug) console.error('[TITAN LLM] request failed:', e?.message ?? e);
        reply = smartReply({ userText: text, ...(context ?? {}) });
      }

      const botMsg = { role: 'assistant', text: reply, ts: Date.now(), fallback: usedFallback };
      setMessages([...next, botMsg]);
      setLoading(false);
      return botMsg;
    },
    [messages, context]
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, send, loading, error, clear };
}
