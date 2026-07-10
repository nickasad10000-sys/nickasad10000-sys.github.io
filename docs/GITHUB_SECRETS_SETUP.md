# TITAN PRO V8 — GitHub Secrets Setup

Vite hanya akan inline env var ber-prefix `VITE_*` ke dalam bundle production.
Karena `.env` di-gitignore, GitHub Actions tidak bisa baca file itu saat build.
Solusinya: taruh key-nya di **repo Secrets**, dan workflow akan generate `.env`
dari secrets tersebut sebelum `npm run build` jalan.

## Cara set secrets

1. Buka https://github.com/nickasad10000-sys/nickasad10000-sys.github.io/settings/secrets/actions
2. Klik **New repository secret**
3. Tambahkan satu per satu (Name → Value):

| Name | Value |
|---|---|
| `VITE_LLM_PROVIDER` | `openrouter` |
| `VITE_LLM_MODEL` | `anthropic/claude-3-haiku` |
| `VITE_OPENROUTER_API_KEY` | `<sk-or-v1-key-1>` (ganti dengan key utuh-mu) |
| `VITE_OPENROUTER_API_KEY_2` | `<sk-or-v1-key-2>` (opsional, key ke-2 untuk round-robin) |
| `VITE_OPENROUTER_API_KEY_3` | `<sk-or-v1-key-3>` (opsional) |
| `VITE_OPENROUTER_API_KEY_4` | `<sk-or-v1-key-4>` (opsional) |
| `VITE_GOOGLE_STUDIO_API_KEY` | `<AIza...>` (opsional, fallback ke Google) |
| `VITE_CHATWOOT_BASE_URL` | (skip — user skip dulu) |
| `VITE_CHATWOOT_WEBSITE_TOKEN` | (skip) |

4. Setelah semua ter-set, push apa pun ke `main` (atau jalankan workflow
   manual dari tab Actions → Deploy Vite build to GitHub Pages →
   Run workflow).
5. Buka https://nickasad10000-sys.github.io/ dan coba chat — kalau key aktif,
   kamu dapat jawaban LLM real (bukan smart-pattern).

## Verifikasi di browser

- Buka DevTools → Network → filter `chat/completions` → kirim pesan di chat
  panel. Kalau request POST ke `openrouter.ai/api/v1/chat/completions`
  muncul dengan status 200, LLM aktif. Kalau tidak ada request dan kamu
  langsung dapat jawaban canned-pattern, berarti secrets belum ter-baca.

## Pertimbangan keamanan

Karena bundle di-host publik, semua `VITE_*` env akan **terlihat di DevTools**
oleh siapa pun yang buka situs. Key OpenRouter punya batas spend di dashboard
mereka — pastikan set limit agar tidak jebol kalau ada orang yang nyoba abuse.
Untuk produksi serius, pakai backend proxy, tapi untuk situs tim internal
pendekatan ini cukup.
