// TITAN PRO · V8 — Smart-pattern fallback (works offline).
// Returns a contextually-aware canned response if LLM is unavailable.

export function smartReply({ userText, pageTitle, accountName, engagementRate, followers, totalViews }) {
  const t = (userText ?? '').toLowerCase().trim();

  if (!t) return 'Silakan tanya, Kak. Aku siap bantu jelaskan data akun ini. ⚔️';

  if (/(halo|hai|hello|hi|assalamualaikum|salam)/.test(t)) {
    return `Halo Kak! ${pageTitle === 'Beranda' ? 'Aku TITAN, siap bantu navigasi 8 akun tim.' : `Aku TITAN, maskot AI untuk akun ${accountName ?? 'ini'}. Mau tanya apa hari ini?`} 🛡️`;
  }

  if (/(engagement|er|interaksi)/.test(t)) {
    return engagementRate
      ? `Engagement rate akun ini ${engagementRate}. ${parseFloat(engagementRate) >= 3 ? '🔥 Bagus! Di atas rata-rata industri.' : '⚔️ Bisa di-push lagi dengan konten interaktif (poll, Q&A, duet).'}`
      : 'Aku belum baca data ER di konteks ini.';
  }

  if (/(followers|follower|ikuti|pengikut)/.test(t)) {
    return followers
      ? `${accountName ?? 'Akun ini'} punya ${followers} followers. Fokus growth: konsistensi posting 1-2x/hari + kolaborasi dengan kreator lokal Lumajang.`
      : 'Data followers belum tersedia di konteks ini.';
  }

  if (/(tayangan|views|view|tonton)/.test(t)) {
    return totalViews
      ? `Total tayangan ${totalViews}. Rata-rata per konten: ${estimateAvgViews(totalViews)}. Untuk naikkan views, kuncinya hook 1-2 detik pertama + caption yang bikin penasaran.`
      : 'Data tayangan belum tersedia di konteks ini.';
  }

  if (/(viral|populer|trending)/.test(t)) {
    return 'Konten viral biasanya gabungan 3 hal: hook kuat, emosi (humor/haru), dan relevansi lokal. Cek post dengan views tertinggi, lalu bikin 3 versi mirip dengan angle berbeda.';
  }

  if (/(strategi|saran|tips|rekomendasi|naikkan|tingkatkan|bikin|buat)/.test(t)) {
    return '⚔️ Strategi 7 hari:\n1. Analisa 5 post terakhir — cari pola yang perform\n2. Replikasi format dengan topik baru\n3. Posting di jam 11-13 & 19-21 WIB\n4. Engage 30 menit/hari di akun sejenis\n5. Kolab duet/stitch dengan kreator Lumajang';
  }

  if (/(makasih|terima kasih|thanks|thank you|thx)/.test(t)) {
    return 'Sama-sama, Kak! Kalau butuh strategi lain, panggil aku lagi. 🛡️';
  }

  if (/(siapa|kamu|titan|maskot)/.test(t)) {
    return 'Aku TITAN ⚔️ — maskot AI Spartan untuk TITAN PRO. Aku bantu analisa performa 8 akun tim Lumajang. Bisa jawab pertanyaan pakai AI (kalau API key aktif) atau smart-pattern lokal.';
  }

  // Default
  return `Pertanyaan menarik, Kak. Aku lihat konteks: ${pageTitle} ${accountName ? `(${accountName})` : ''}. Coba tanya soal engagement, followers, tayangan, viral, atau strategi — aku bantu jawab se-detail data yang aku punya.`;
}

function estimateAvgViews(total) {
  const s = String(total);
  if (s.endsWith('M')) return `${(parseFloat(s) * 800).toFixed(0)}K`;
  if (s.endsWith('K')) return `${(parseFloat(s) * 0.8).toFixed(0)}K`;
  return total;
}
