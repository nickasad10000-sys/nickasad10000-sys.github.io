# Panduan Extract Cookies (TikTok + Instagram)

> Untuk scraping post list lengkap. Tanpa cookies: profile meta dapet, post list kosong.

## Kenapa Perlu Cookies?

- **Tanpa cookies** (public): Profile meta dapet dari `__UNIVERSAL_DATA` dan `og:description`. Tapi post list kosong (24 skeleton cards, 0 real).
- **Dengan cookies** (logged in): Dapet 30-35 post per akun plus caption, hashtags, view count detail.

## ⚠️ Penting — Safety

1. **Jangan share file `cookies.txt` ke publik/AI/Siapa pun.** Cookies = sesi login kamu. Siapapun yang pegang = full account access.
2. File `cookies.txt` masuk `.gitignore` (sudah). Jadi tidak akan ter-commit ke GitHub.
3. Cookies expire dalam 30-90 hari. Kalau scrape mulai gagal, refresh cookies.

## Cara Extract dari Chrome (Recommended: EditThisCookie)

### Step 1: Install Extension

1. Buka Chrome Web Store → cari **"EditThisCookie"** (link: https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
2. Klik **"Add to Chrome"** → **"Add extension"**
3. Akan muncul icon 🍪 di toolbar Chrome

### Step 2: Login ke TikTok (atau Instagram)

1. Buka tab baru → https://www.tiktok.com
2. Login dengan akun kamu (username/password, atau QR code)
3. Pastikan sudah masuk (lihat avatar/profile icon di pojok kanan atas)

### Step 3: Buka EditThisCookie

1. Klik icon 🍪 di toolbar Chrome
2. Panel popup muncul di kanan

### Step 4: Export Cookies

1. Klik icon ⚙️ (gear) di pojok kanan bawah popup
2. Pilih **"Export"** → format **"Netscape HTTP Cookie File"** ⚠️ **PENTING: pilih format ini, bukan JSON**
3. Browser akan download file atau copy ke clipboard

### Step 5: Simpan ke `cookies.txt`

**Cara A (Clipboard):**
1. Klik icon 📋 (clipboard) di popup EditThisCookie → otomatis copy
2. Buka text editor (Notepad, VS Code, dll)
3. Paste
4. Save as: `C:\Users\Syahfalah\nickasad10000-sys.github.io\scripts\scrape\cookies.txt`

**Cara B (Downloaded file):**
1. File hasil download rename jadi `cookies.txt`
2. Move ke `C:\Users\Syahfalah\nickasad10000-sys.github.io\scripts\scrape\cookies.txt`

## Cara Extract dari Firefox (Cookie Editor)

### Step 1: Install Extension

1. Buka Firefox Add-ons → cari **"Cookie Editor"** (link: https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
2. Klik **"Add to Firefox"**

### Step 2: Login

Sama seperti Chrome: buka tiktok.com, login, pastikan sudah masuk.

### Step 3: Buka Cookie Editor

1. Klik icon 🟢 di toolbar Firefox
2. Panel popup muncul

### Step 4: Export

1. Klik tombol **"Export"** di pojok kanan bawah
2. Pilih format **"Netscape"**
3. Copy atau download

### Step 5: Save

Sama seperti Chrome: save as `scripts/scrape/cookies.txt`.

## Struktur File `cookies.txt` yang Benar

File harus dimulai dengan baris komentar Netscape, lalu 7 kolom per cookie:

```
# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.tiktok.com	TRUE	/	FALSE	0	sessionid	abc123def456...
.tiktok.com	TRUE	/	FALSE	1893456000	ttwid	randomstring...
.tiktok.com	TRUE	/	FALSE	0	msToken	xyz789...
.instagram.com	TRUE	/	FALSE	1893456000	sessionid	instagram_session_xyz
.instagram.com	TRUE	/	FALSE	1893456000	csrftoken	abc123...
```

7 kolom: `domain | flag | path | secure | expiration | name | value`

✅ Yang benar:
- Domain: `.tiktok.com` (dengan titik di depan, atau `tiktok.com`)
- Path: `/`
- Name: nama cookie (`sessionid`, `ttwid`, `msToken`, `csrftoken`, dll)

❌ Yang salah:
- Format JSON (bukan Netscape)
- Domain cuma `tiktok.com` tanpa `.` (tidak apa-apa, tapi `.tiktok.com` lebih reliable)
- File kosong / file download dari cookie lain

## Validasi Cookies (Optional, Sebelum Scrape)

Bisa test dengan curl kalau cookies valid:

```bash
# TikTok
curl -b scripts/scrape/cookies.txt "https://www.tiktok.com/api/post/item_list/?aid=1988&count=30&secUid=YOUR_SEC_UID" | head -c 500

# Instagram
curl -b scripts/scrape/cookies.txt "https://www.instagram.com/api/v1/users/web_profile_info/?username=ardiantanah" | head -c 500
```

Kalau JSON muncul (bukan HTML login page), cookies valid.

## Run Scrape dengan Cookies

```bash
# Setiap kali mau update data:
cd "C:\Users\Syahfalah\nickasad10000-sys.github.io"
"/c/Users/Syahfalah/AppData/Local/Programs/Python/Python314/python.exe" -m scripts.scrape.scraper_public
"/c/Users/Syahfalah/AppData/Local/Programs/Python/Python314/python.exe" -m scripts.scrape.scraper_with_cookies  # kalau cookies.txt ada
```

Scraper otomatis skip step cookies kalau file `cookies.txt` tidak ada.

## Troubleshoot

| Problem | Solusi |
|---------|--------|
| `scraper: No cookies.txt found` | File belum dibuat atau di path salah. Cek `scripts/scrape/cookies.txt` ada. |
| `cookies expired` / `redirect to login` | Refresh cookies (login ulang ke TikTok, export ulang). |
| `No posts fetched, but cookies loaded` | Cookies valid tapi IP kena rate limit. Tunggu 5-10 menit atau ganti network (WiFi → tethering HP). |
| `EditThisCookie tidak ada di Chrome Store` | Pakai alternatif: **Cookie-Editor by cgagnier** atau **Cookie Manager** |
| `Firefox Cookie Editor export = JSON` | Pilih format Netscape di dropdown sebelum export. |
| `File ditolak karena ada BOM` | Save ulang as UTF-8 tanpa BOM (di Notepad: Save As → Encoding: UTF-8) |

## Catatan Tambahan

- **Multi-account**: File `cookies.txt` 1 = 1 login. Kalau mau scrape 2 akun berbeda (misal `@ardian.tanah` + `@majangmejeng_`), bisa pakai 1 cookies.txt selama kedua akun di-follow oleh akun login kamu.
- **Rate limit**: Jangan extract + scrape + extract + scrape dalam 5 menit. Tunggu 10 menit kalau kena 429.
- **Re-extract**: Kalau scrape gagal dengan status code 401/403, re-extract cookies (mungkin session expired).

## Privacy

File `cookies.txt` di-`.gitignore`. Tapi kalau mau extra safety:
- Ganti password akun setelah selesai scrape
- Pakai akun sekunder (bukan akun utama)
- Jangan pernah paste ke AI / pastebin / GitHub
