// TITAN PRO · V8 — System prompts for the mascot LLM.
// The mascot is TITAN — a Spartan warrior AI analyst.

/**
 * Build a human-readable context block from the full account object (or a
 * summary for the home page). This is the "knowledge" the mascot can use to
 * answer questions about any account on the dashboard.
 */
export function buildAccountContext(a) {
  if (!a) return '';
  const lines = [];

  lines.push(`Akun: @${a.profile.handle} (${a.profile.displayName})`);
  lines.push(`Platform: ${a.profile.platform} | Lokasi: ${a.profile.lokasi || '—'} | Niche: ${a.profile.niche || '—'}`);
  if (a.profile.bio) lines.push(`Bio: ${a.profile.bio}`);
  lines.push(`URL: ${a.profile.url}`);

  // KPIs — one per line
  lines.push('');
  lines.push('KPI utama:');
  for (const k of a.kpis) lines.push(`- ${k.label}: ${k.value}`);

  // Top by views (most viral)
  if (a.topByViews?.length) {
    lines.push('');
    lines.push('Top 5 konten paling viral (by views):');
    for (const p of a.topByViews.slice(0, 5)) {
      lines.push(`- ${p.date} | ${p.views} views | ${p.likes} likes | ${p.comments} komen | ER ${p.er} | "${p.caption}"`);
    }
  }

  // Top by likes
  if (a.topByLikes?.length) {
    lines.push('');
    lines.push('Top 5 konten paling disukai:');
    for (const p of a.topByLikes.slice(0, 5)) {
      lines.push(`- ${p.date} | ${p.views} views | ${p.likes} likes | "${p.caption}"`);
    }
  }

  // Top by comments
  if (a.topByComments?.length) {
    lines.push('');
    lines.push('Top 5 konten paling banyak komentar:');
    for (const p of a.topByComments.slice(0, 5)) {
      lines.push(`- ${p.date} | ${p.comments} komen | ER ${p.er} | "${p.caption}"`);
    }
  }

  // Tier distribution
  if (a.tierDist?.length) {
    lines.push('');
    lines.push('Distribusi tier views per konten:');
    for (const t of a.tierDist) lines.push(`- ${t.label}: ${t.count} (${t.pct})`);
  }

  // Hashtags
  if (a.hashtags?.length) {
    lines.push('');
    lines.push('Top hashtag:');
    for (const h of a.hashtags.slice(0, 8)) lines.push(`- ${h.tag}: ${h.uses} penggunaan`);
  }

  // Insight (kekuatan, kelemahan, rekomendasi, analisis, posisi)
  if (a.insight && (a.insight.kekuatan?.length || a.insight.kelemahan?.length || a.insight.rekomendasi?.length || a.insight.analisis || a.insight.posisi)) {
    lines.push('');
    lines.push('Insight akun:');
    if (a.insight.posisi) lines.push(`- Posisi: ${a.insight.posisi}`);
    if (a.insight.analisis) lines.push(`- Analisis: ${a.insight.analisis}`);
    if (a.insight.kekuatan?.length) {
      lines.push('- Kekuatan:');
      for (const k of a.insight.kekuatan) lines.push(`  * ${k}`);
    }
    if (a.insight.kelemahan?.length) {
      lines.push('- Kelemahan:');
      for (const k of a.insight.kelemahan) lines.push(`  * ${k}`);
    }
    if (a.insight.rekomendasi?.length) {
      lines.push('- Rekomendasi:');
      for (const k of a.insight.rekomendasi) lines.push(`  * ${k}`);
    }
  }

  // Benchmark
  if (a.benchmark && (a.benchmark.industri || a.benchmark.catatan)) {
    lines.push('');
    lines.push('Benchmark industri:');
    if (a.benchmark.industri) lines.push(`- Industri: ${a.benchmark.industri}`);
    if (a.benchmark.catatan) lines.push(`- Catatan: ${a.benchmark.catatan}`);
  }

  // Growth
  if (a.growth && (a.growth.target || a.growth.langkah?.length)) {
    lines.push('');
    lines.push('Target & langkah pertumbuhan:');
    if (a.growth.target) lines.push(`- Target: ${a.growth.target}`);
    if (a.growth.langkah?.length) {
      lines.push('- Langkah:');
      for (const l of a.growth.langkah) lines.push(`  * ${l}`);
    }
  }

  // Daily / monthly / yearly performance (compact)
  if (a.dailyPerf?.length) {
    lines.push('');
    lines.push('Performa 7 hari terakhir:');
    for (const d of a.dailyPerf) lines.push(`- ${d.date} | ${d.views} views | ${d.engagement} ER`);
  }
  if (a.monthlyPerf?.length) {
    lines.push('');
    lines.push('Performa bulanan:');
    for (const m of a.monthlyPerf) lines.push(`- ${m.month} | ${m.views} views | ${m.followers} followers | ${m.posts} posting`);
  }
  if (a.yearly?.length) {
    lines.push('');
    lines.push('Performa tahunan:');
    for (const y of a.yearly) lines.push(`- ${y.year} | ${y.views} views | ${y.followers} followers | ${y.posts} posting`);
  }
  if (a.duration?.length) {
    lines.push('');
    lines.push('Performa berdasarkan durasi konten:');
    for (const d of a.duration) lines.push(`- ${d.label}: ${d.count} video | ${d.avgViews} avg views`);
  }

  return lines.join('\n');
}

const BASE_PROMPT = `Kamu adalah TITAN — maskot AI untuk TITAN PRO, dashboard analitik media sosial untuk akun TikTok & Instagram di Lumajang, Indonesia.

Karaktermu:
- Prajurit Spartan yang bijak, sigap, dan sedikit humoris.
- Bicara dalam Bahasa Indonesia, singkat, jelas, dan penuh percaya diri.
- Maksimal 120 kata per jawaban. Tidak bertele-tele.
- TIDAK BOLEH pakai emoji sama sekali dalam jawaban.
- Kalau ditanya hal yang tidak ada di data, jujur saja: "Aku belum punya data itu."
- Selalu jawab dengan gaya: "Kak" untuk sapaan ke user, "Bos" untuk pertanyaan bisnis.

ATURAN KERAS MEMBACA ANGKA:
- SEMUA angka di data sudah dinormalisasi ke format K/M (contoh: 2.8K = 2.800, 4.9M = 4.900.000, 892K = 892.000).
- JANGAN tambahkan nol ekstra. "2.8K" adalah 2.800 (BUKAN 28.000, BUKAN 280.000).
- JANGAN konversi dari K ke format Indonesia "28.000" — formatnya tetap "2.8K" atau "2800".
- Setiap field punya LABEL sendiri. Field "Followers" TIDAK sama dengan field "Total Tayangan" atau "Total Suka" atau nilai per-bulan di "Performa bulanan". Baca label dengan teliti.
- Kalau user tanya "berapa followers", jawab PERSIS dari field KPI yang labelnya "Followers".
- Kalau user tanya "berapa total tayangan", jawab dari field KPI "Total Tayangan" — BUKAN dari "Rata-rata Views" atau "Performa bulanan" atau per-video views.

Cara menjawab pertanyaan analisa:
- Pakai data konkret dari konteks akun di bawah (angka, tanggal, nama konten, ER, dsb).
- Kalau user tanya "konten apa yang paling viral", lihat "Top 5 konten paling viral (by views)" dan jawab dengan judul + views + ER + tanggal.
- Kalau user tanya "kelemahan akun", lihat "Insight > Kelemahan".
- Kalau user tanya "saran strategi", lihat "Insight > Rekomendasi" + "Target & langkah pertumbuhan > Langkah".
- Kalau user tanya "performa bulan ini vs bulan lalu", lihat "Performa bulanan".
- Kalau ditanya sesuatu yang TIDAK ADA di data, bilang jujur.

{dataBlock}

Jawablah dalam Bahasa Indonesia, kecuali user menulis dalam bahasa lain.`;

/**
 * Build the system prompt from a context object. Two shapes:
 *   { pageTitle, accountContext } → accountContext is the rich data block (string)
 *   { pageTitle, accountName, ... } → fallback to the simple 4-field context
 */
export const buildSystemPrompt = (ctx = {}) => {
  const pageTitle = ctx.pageTitle ?? 'Beranda';
  const dataBlock = ctx.accountContext
    ? `Konteks halaman saat ini: ${pageTitle}\n\nData lengkap akun yang sedang dilihat:\n${ctx.accountContext}`
    : `Konteks halaman saat ini: ${pageTitle}\nAkun: ${ctx.accountName ?? '—'}\nPlatform: ${ctx.platform ?? '—'}\nFollowers: ${ctx.followers ?? '—'}\nEngagement Rate: ${ctx.engagementRate ?? '—'}\nTotal Tayangan: ${ctx.totalViews ?? '—'}`;
  return BASE_PROMPT.replace('{dataBlock}', dataBlock);
};

export const QUICK_PROMPTS = [
  'Konten paling viral bulan ini?',
  'Akun dengan engagement tertinggi?',
  'Bandingkan TikTok vs Instagram',
  'Kelemahan utama tim?',
  'Rekomendasi strategi minggu ini',
];

