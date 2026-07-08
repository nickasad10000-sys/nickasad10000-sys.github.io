# TITAN PRO · V8 — Spartan Crimson

Spartan-themed social media analytics dashboard untuk 8 akun tim Lumajang (4 TikTok + 4 Instagram). Maskot **TITAN** adalah AI analis yang bisa menjawab pertanyaan tentang data akun — top viral, kelemahan, rekomendasi, performa bulanan, dll.

Stack: **Vite 5 + React 18 + React Router 6**, deploy otomatis ke GitHub Pages.

## Stack

- **Build**: Vite 5
- **UI**: React 18, React Router 6 (lazy routes per halaman)
- **Motion**: `motion` (Framer Motion) untuk ShinyText + animasi maskot
- **LLM**: OpenAI-compatible fetch → OpenRouter (Claude, GPT, Gemini) atau Google AI Studio (Gemini)
- **Data**: JSON statis di `src/data/accounts-full.json` (8 akun × 14 section)

## Struktur

```
src/
├── components/       # Maskot, sayap elang, chat, logo, ShinyText, settings
├── routes/           # Home, AccountPage, NotFound
├── data/             # accounts-full.json (data 8 akun) + prompts.js (system prompt)
├── hooks/            # useLlmChat, useDrag, useBlink, useEyeTracking, useBattlePose
├── lib/              # llm.js (OpenRouter/Google), storage, smartPattern fallback
└── styles/           # v8.css, mascot.css, animations.css, tokens.css
```

## Setup lokal

```bash
npm install
cp .env.example .env   # lalu isi API key
npm run dev            # http://localhost:5173
```

`.env` yang dibutuhkan (semua `VITE_*` di-bundle ke client JS — situs private tim):

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_LLM_PROVIDER=openrouter
VITE_LLM_MODEL=anthropic/claude-3-haiku
# Opsional
VITE_GOOGLE_STUDIO_API_KEY=AIza...
```

Default model adalah `claude-3-haiku` (paling reliable). Model lain yang bekerja di free tier OpenRouter: `openai/gpt-4o-mini`, `google/gemini-2.0-flash-exp:free`. `claude-3.5-sonnet` mungkin 404 di sebagian key.

## Build & deploy

```bash
npm run build          # output di dist/
npm run preview        # serve dist/ lokal untuk smoke test
```

Deploy otomatis via GitHub Actions (`.github/workflows/deploy.yml`): push ke `main` → build → push `dist/` ke branch `gh-pages`.

## Data pipeline

Data 8 akun diekstrak dari sub-page V7 oleh `scripts/extract-accounts.mjs` (sekali jalan) ke `src/data/accounts-full.json`. Tiap akun punya 14 section:

1. `profile` — handle, platform, bio, niche, lokasi, URL
2. `kpis` — Followers, Engagement Rate, Total Tayangan, Total Suka, dll
3. `topByViews` / `topByLikes` / `topByComments` — 5 konten terbaik per metrik
4. `tierDist` — distribusi tier (Viral ≥100K, Tinggi ≥10K, Bagus ≥1K)
5. `hashtags` / `mentions`
6. `insight` — kekuatan, kelemahan, rekomendasi, analisis, posisi
7. `benchmark` — industri, catatan
8. `growth` — target, langkah-langkah
9. `dailyPerf` / `monthlyPerf` / `yearly` / `duration` — performa time-series

### Normalisasi angka

Sebelum dipakai LLM, semua angka di format ulang ke **K/M** (mis. "892.000" → "892K") oleh `scripts/normalize-numbers.mjs`. Ini mencegah LLM kebingungan antara format Indo (`28.000` = 28 ribu) dan format K/M (`2.8K` = 2.800).

## Maskot TITAN

- **Corinthian helmet** dengan mata merah yang selalu menyala (lid semi-transparan saat blink, flicker effect)
- **Sayap elang 3D** dengan anatomi real: coverts, secondaries, primaries, alula, dark wingtip fingers. Mengepak otomatis + jatuh bulu.
- **2 tangan** (crimson sleeve + black gauntlet) memegang tombak Spartan (dory) di tengah badan
- **Jam live** di dada, **cape** miring 8°

## LLM chat

- System prompt kaya: tiap pertanyaan LLM dapat context lengkap akun (semua 14 section)
- Hard rules: max 120 kata, no emoji, format angka konsisten, jawab "Belum ada data" kalau tidak tahu
- Fallback: smart-pattern matcher kalau LLM error / no key
- Strip emoji sebagai safety net

## 8 akun (slug, handle, platform)

| Slug | Handle | Platform |
|---|---|---|
| `ardiantanah-tiktok` | @ardian.tanah | TikTok |
| `majangmejeng-tiktok` | @majangmejeng_ | TikTok |
| `itsnisyananda-tiktok` | @itsnisyananda | TikTok |
| `syahfalahproperti-tiktok` | @syahfalahproperti | TikTok |
| `ardiantanah-instagram` | @ardiantanah | Instagram |
| `majangmejeng-instagram` | @majangmejeng_ | Instagram |
| `nisyanandaa-instagram` | @nisyanandaa | Instagram |
| `syahfalahproperti-instagram` | @syahfalahproperti | Instagram |

Routes: `/`, `/account/:slug`, `*` (404).
