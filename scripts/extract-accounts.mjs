// One-time script to extract structured data from V7 sub-pages into accounts.js
// Run: node scripts/extract-accounts.mjs
import { readFileSync, writeFileSync } from 'fs';

const ACCOUNTS = [
  { slug: 'ardiantanah-tiktok', file: 'ardiantanah-tiktok/index.html', platform: 'tiktok' },
  { slug: 'majangmejeng-tiktok', file: 'majangmejeng-tiktok/index.html', platform: 'tiktok' },
  { slug: 'itsnisyananda-tiktok', file: 'itsnisyananda-tiktok/index.html', platform: 'tiktok' },
  { slug: 'syahfalahproperti-tiktok', file: 'syahfalahproperti-tiktok/index.html', platform: 'tiktok' },
  { slug: 'ardiantanah-instagram', file: 'ardiantanah-instagram/index.html', platform: 'instagram' },
  { slug: 'majangmejeng-instagram', file: 'majangmejeng-instagram/index.html', platform: 'instagram' },
  { slug: 'nisyanandaa-instagram', file: 'nisyanandaa-instagram/index.html', platform: 'instagram' },
  { slug: 'syahfalahproperti-instagram', file: 'syahfalahproperti-instagram/index.html', platform: 'instagram' },
];

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function extractOne(file, platform) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

  const result = {
    profile: { platform },
    kpis: [],
    topByViews: [],
    topByLikes: [],
    topByComments: [],
    tierDist: [],
    hashtags: [],
    mentions: [],
    insight: { kekuatan: [], kelemahan: [], rekomendasi: [] },
    benchmark: { industri: '', catatan: '' },
    growth: { target: '', langkah: [] },
    dailyPerf: [],
    monthlyPerf: [],
    yearly: [],
    duration: [],
  };

  // ----- Profile / KPI grid -----
  const profileKv = {};
  const kvRe = /<tr><td class="k">([^<]+)<\/td><td>([\s\S]*?)<\/td><\/tr>/g;
  let m;
  while ((m = kvRe.exec(html)) !== null) {
    profileKv[m[1].trim()] = stripTags(m[2]);
  }
  result.profile.handle = (profileKv['Username'] || '').replace(/^@/, '');
  result.profile.displayName = profileKv['Display Name'] || '';
  result.profile.bio = profileKv['Bio'] || '';
  result.profile.lokasi = profileKv['Lokasi'] || '';
  result.profile.url = profileKv['Profile'] || '';
  result.profile.niche = (profileKv['Niche'] || '').replace(/\s+/g, ' ').trim();

  const kpiRe = /<div class="kpi"><div class="value">([^<]+)<\/div><div class="label">([^<]+)<\/div><\/div>/g;
  while ((m = kpiRe.exec(html)) !== null) {
    result.kpis.push({ value: m[1].trim(), label: m[2].trim() });
  }

  // Sections
  const tableRe = /<section class="section">([\s\S]*?)<\/section>/g;
  const sections = [];
  while ((m = tableRe.exec(html)) !== null) {
    const title = (m[1].match(/<h2 class="section-title">([\s\S]*?)<\/h2>/) || ['', ''])[1];
    sections.push({ title: stripTags(title), body: m[1] });
  }

  // Helpers
  function parseGenericTable(body) {
    const rows = [];
    const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
    let r;
    while ((r = rowRe.exec(body)) !== null) {
      const cells = [];
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
      let c;
      while ((c = cellRe.exec(r[1])) !== null) {
        cells.push(stripTags(c[1]));
      }
      if (cells.length >= 2) rows.push(cells);
    }
    return rows;
  }

  function parseTopTable(body) {
    const rows = [];
    const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
    let r;
    while ((r = rowRe.exec(body)) !== null) {
      const cells = [];
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
      let c;
      while ((c = cellRe.exec(r[1])) !== null) {
        cells.push(stripTags(c[1]));
      }
      if (cells.length >= 7 && !/^Views$/.test(cells[0]) && !/^#$/.test(cells[0])) {
        rows.push({
          rank: cells[0],
          views: cells[1],
          likes: cells[2],
          comments: cells[3],
          shares: cells[4],
          er: cells[5],
          date: cells[6],
          caption: cells[7] || '',
        });
      }
    }
    return rows;
  }

  for (const sec of sections) {
    if (/Tayangan/.test(sec.title)) result.topByViews = parseTopTable(sec.body);
    if (/Suka/.test(sec.title)) result.topByLikes = parseTopTable(sec.body);
    if (/Komentar/.test(sec.title)) result.topByComments = parseTopTable(sec.body);
  }

  // ----- Tier distribution -----
  const tierRe = /<div class="label">([^<]+)<\/div>\s*<div class="bar-track"><div class="bar-fill" style="width:\s*([\d.]+)%"><\/div><\/div>\s*<div class="count">([^<]+)<span style="color: var\(--text-muted\)">\(([^)]+)\)<\/span><\/div>/g;
  while ((m = tierRe.exec(html)) !== null) {
    result.tierDist.push({ label: m[1].trim(), width: parseFloat(m[2]), count: m[3].trim(), pct: m[4].trim() });
  }

  // ----- Hashtags -----
  const tagSection = sections.find((s) => /Hashtag/i.test(s.title));
  if (tagSection) {
    const tagRe = /<td><code>(#[\w]+)<\/code><\/td>\s*<td class="num">(\d+)<\/td>\s*<td class="num">([^<]+)<\/td>\s*<td class="num">([^<]+)<\/td>/g;
    while ((m = tagRe.exec(tagSection.body)) !== null) {
      result.hashtags.push({ tag: m[1], count: parseInt(m[2]), pct: m[3], avgViews: m[4] });
    }
  }

  // ----- Mentions (real format) -----
  const mentionSection = sections.find((s) => /Mentions?/i.test(s.title));
  if (mentionSection) {
    // <span class="mention"><code>@handle</code><span class="count">N</span></span>
    const mRe = /<span class="mention"><code>(@?[\w.]+)<\/code><span class="count">(\d+)<\/span><\/span>/g;
    while ((m = mRe.exec(mentionSection.body)) !== null) {
      result.mentions.push({ handle: m[1].startsWith('@') ? m[1] : '@' + m[1], count: parseInt(m[2]) });
    }
    // Fallback: split by mention span
    if (result.mentions.length === 0) {
      const mRe2 = /<span class="mention">([\s\S]*?)<span class="count">(\d+)/g;
      while ((m = mRe2.exec(mentionSection.body)) !== null) {
        const handle = stripTags(m[1]);
        if (handle) result.mentions.push({ handle, count: parseInt(m[2]) });
      }
    }
  }

  // ----- Insight cards (Kekuatan, Kelemahan, Rekomendasi) -----
  // Real format: <div class="callout callout-success|warn|info"><strong>✅ Kekuatan</strong><ol>...</ol></div>
  result.insight = { kekuatan: [], kelemahan: [], rekomendasi: [], analisis: '', posisi: '' };
  const insightSection = sections.find((s) => /Insight/i.test(s.title));
  if (insightSection) {
    const calloutRe = /<div class="callout callout-[a-z]+"><strong>([^<]+)<\/strong>([\s\S]*?)<\/div>/g;
    let cm;
    while ((cm = calloutRe.exec(insightSection.body)) !== null) {
      const heading = stripTags(cm[1]);
      const body = cm[2];
      const items = [];
      const liRe = /<li>([\s\S]*?)<\/li>/g;
      let li;
      while ((li = liRe.exec(body)) !== null) {
        items.push(stripTags(li[1]));
      }
      // For paragraphs (Analisis Pasar, Posisi Kompetitor)
      const pMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      const text = pMatch ? stripTags(pMatch[1]) : items.join(' ');

      if (/Kekuatan/i.test(heading)) result.insight.kekuatan = items;
      else if (/Kelemahan/i.test(heading)) result.insight.kelemahan = items;
      else if (/Rekomendasi/i.test(heading)) result.insight.rekomendasi = items;
      else if (/Analisis Pasar/i.test(heading)) result.insight.analisis = text;
      else if (/Posisi Kompetitor/i.test(heading)) result.insight.posisi = text;
    }
  }

  // ----- Benchmark -----
  const benchSection = sections.find((s) => /Benchmark/i.test(s.title));
  if (benchSection) {
    result.benchmark.industri = stripTags(benchSection.body.replace(/<[^>]+>/g, ' ')).slice(0, 600);
  }

  // ----- Growth -----
  const growthSection = sections.find((s) => /Pertumbuhan/i.test(s.title));
  if (growthSection) {
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let li;
    while ((li = liRe.exec(growthSection.body)) !== null) {
      result.growth.langkah.push(stripTags(li[1]));
    }
    // Target = paragraph if present, else last "Target" prefixed item
    const pMatch = growthSection.body.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (pMatch) {
      result.growth.target = stripTags(pMatch[1]);
    } else {
      const targetItem = result.growth.langkah.find((s) => /Target/i.test(s));
      if (targetItem) result.growth.target = targetItem;
    }
  }

  // ----- Daily perf (5 cols: Hari | Avg Views | Avg Likes | Post | Avg Comments) -----
  const dailySection = sections.find((s) => /per Hari/i.test(s.title));
  if (dailySection) {
    const rows = parseGenericTable(dailySection.body);
    for (const r of rows) {
      if (r.length >= 5 && /^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)$/.test(r[0])) {
        result.dailyPerf.push({
          day: r[0],
          views: r[1],
          likes: r[2],
          posts: r[3],
          comments: r[4],
        });
      }
    }
  }

  // ----- Monthly perf (6 cols: Bulan | Post | Total Views | Total Likes | Total Komentar | Rata-rata) -----
  const monthlySection = sections.find((s) => /Bulanan/i.test(s.title));
  if (monthlySection) {
    const rows = parseGenericTable(monthlySection.body);
    for (const r of rows) {
      // r[0] is "Jan 2025" etc.
      if (r.length >= 6 && /^[A-Za-z]{3}\s\d{4}$/.test(r[0])) {
        result.monthlyPerf.push({
          month: r[0],
          posts: r[1],
          views: r[2],
          likes: r[3],
          comments: r[4],
          avg: r[5],
        });
      }
    }
  }

  // ----- Yearly summary (8 cols) -----
  const yearlySection = sections.find((s) => /Tahunan/i.test(s.title));
  if (yearlySection) {
    const rows = parseGenericTable(yearlySection.body);
    for (const r of rows) {
      if (r.length >= 7 && /^\d{4}$/.test(r[0])) {
        result.yearly.push({
          year: r[0],
          posts: r[1],
          views: r[2],
          likes: r[3],
          comments: r[4],
          avgViews: r[5],
          bestMonth: r[6],
          topPost: r[7] || '',
        });
      }
    }
  }

  // ----- Duration (4 cols: Range | Posts | Avg Views | ER) -----
  const durSection = sections.find((s) => /Durasi/i.test(s.title));
  if (durSection) {
    const rows = parseGenericTable(durSection.body);
    for (const r of rows) {
      if (r.length >= 4 && /detik|menit/.test(r[0])) {
        result.duration.push({
          range: r[0].replace(/&gt;/g, '>'),
          posts: parseInt(r[1].replace(/\D/g, '')) || 0,
          views: r[2],
          er: r[3],
        });
      }
    }
  }

  return result;
}

const out = {};
for (const a of ACCOUNTS) {
  try {
    out[a.slug] = extractOne(a.file, a.platform);
    const x = out[a.slug];
    console.log(
      `✓ ${a.slug}: kpis=${x.kpis.length} views=${x.topByViews.length} ` +
      `tiers=${x.tierDist.length} tags=${x.hashtags.length} ` +
      `mentions=${x.mentions.length} insight=${x.insight.kekuatan.length}/${x.insight.kelemahan.length}/${x.insight.rekomendasi.length} ` +
      `growth=${x.growth.langkah.length} daily=${x.dailyPerf.length} ` +
      `monthly=${x.monthlyPerf.length} yearly=${x.yearly.length} ` +
      `duration=${x.duration.length}`
    );
  } catch (e) {
    console.error(`✗ ${a.slug}: ${e.message}`);
  }
}

writeFileSync('src/data/accounts-full.json', JSON.stringify(out, null, 2));
console.log('Wrote src/data/accounts-full.json');
