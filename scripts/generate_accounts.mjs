// TITAN PRO V8 — Generate accounts-full.json from scrape output + LLM insights.
//
// Inputs (all in scripts/scrape/output/):
//   - audit.json           (cross-validation report)
//   - llm-insights.json    (OpenRouter-generated insights per account)
//
// Reads existing src/data/accounts-full.json, then for each account:
//   - If new aggregations exist in audit.json: replace kpis/topBy*/tierDist/etc.
//   - Else: keep existing data as-is (TikTok post list blocked by anti-bot)
//   - If LLM insight exists: replace insight/benchmark/growth sections
//   - Always update profile.{handle, displayName, bio} from raw scrape
// Backs up the original to accounts-full.json.bak-YYYY-MM-DD before writing.
//
// Run: node scripts/generate_accounts.mjs

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const AUDIT_PATH = join(ROOT, 'scripts', 'scrape', 'output', 'audit.json');
const LLM_PATH = join(ROOT, 'scripts', 'scrape', 'output', 'llm-insights.json');
const DATA_PATH = join(ROOT, 'src', 'data', 'accounts-full.json');

// config.py slug → accounts-full.json key
const SLUG_TO_KEY = {
  'ardian-tanah-tt':       'ardiantanah-tiktok',
  'majangmejeng-tt':       'majangmejeng-tiktok',
  'itsnisyananda-tt':      'itsnisyananda-tiktok',
  'syahfalahproperti-tt':  'syahfalahproperti-tiktok',
  'ardiantanah-ig':        'ardiantanah-instagram',
  'majangmejeng-ig':       'majangmejeng-instagram',
  'nisyanandaa-ig':        'nisyanandaa-instagram',
  'syahfalahproperti-ig':  'syahfalahproperti-instagram',
};

// raw/{slug}.json → display name, niche (matches config.py)
const ACCOUNT_META = {
  'ardian-tanah-tt':       { display: 'Ardian Tanah',       niche: 'properti' },
  'majangmejeng-tt':       { display: 'MajanMejeng',        niche: 'info-kota-lumajang' },
  'itsnisyananda-tt':      { display: 'Nisya Nanda',        niche: 'lifestyle' },
  'syahfalahproperti-tt':  { display: 'Syahfalah Properti', niche: 'properti-lumajang' },
  'ardiantanah-ig':        { display: 'Ardian Tanah',       niche: 'properti' },
  'majangmejeng-ig':       { display: 'MajanMejeng',        niche: 'info-kota-lumajang' },
  'nisyanandaa-ig':        { display: 'Nisya Nanda',        niche: 'lifestyle' },
  'syahfalahproperti-ig':  { display: 'Syahfalah Properti', niche: 'properti-lumajang' },
};

// All 8 slugs (raw files we expect)
const ALL_SLUGS = Object.keys(SLUG_TO_KEY);

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  console.log('[generate_accounts] reading inputs…');
  const audit = readJson(AUDIT_PATH);
  const llm = readJson(LLM_PATH);
  if (!existsSync(DATA_PATH)) {
    console.error(`  ✗ ${DATA_PATH} not found`);
    process.exit(1);
  }
  const full = readJson(DATA_PATH);
  console.log(`  audit: ${audit ? Object.keys(audit.accounts || {}).length : 0} accounts`);
  console.log(`  llm:   ${llm ? Object.keys(llm).length : 0} accounts`);
  console.log(`  existing: ${Object.keys(full).length} accounts`);

  // Backup
  const date = new Date().toISOString().slice(0, 10);
  const bak = DATA_PATH.replace('.json', `.bak-${date}.json`);
  copyFileSync(DATA_PATH, bak);
  console.log(`  backup: ${bak}`);

  let updated = 0;
  let kept = 0;
  let insightsUpdated = 0;

  for (const slug of ALL_SLUGS) {
    const key = SLUG_TO_KEY[slug];
    const existing = full[key];
    if (!existing) {
      console.log(`  ⚠ ${key} not in accounts-full.json, skip`);
      continue;
    }
    const acc = (audit && audit.accounts && audit.accounts[slug]) || null;
    const aggs = acc && acc.newAggregations;
    const llmInsight = (llm && llm[slug]) || null;

    // Update profile from raw scrape (handle/displayName/bio)
    const rawPath = join(ROOT, 'scripts', 'scrape', 'raw', `${slug}.json`);
    if (existsSync(rawPath)) {
      const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
      const u = raw.user || {};
      if (u.uniqueId || u.username) existing.profile.handle = u.uniqueId || u.username;
      if (u.nickname || u.full_name) existing.profile.displayName = u.nickname || u.full_name;
      if (u.signature || u.biography) existing.profile.bio = u.signature || u.biography;
      // Update platform URL
      if (raw._meta) {
        const platform = raw._meta.platform;
        const handle = existing.profile.handle;
        existing.profile.url = platform === 'tiktok'
          ? `https://www.tiktok.com/@${handle}`
          : `https://www.instagram.com/${handle}/`;
      }
    }
    // Set niche from config (don't trust AI)
    const meta = ACCOUNT_META[slug];
    if (meta) {
      existing.profile.niche = meta.niche;
      // displayName fallback
      if (!existing.profile.displayName || existing.profile.displayName === 'Unknown') {
        existing.profile.displayName = meta.display;
      }
    }

    // Replace aggregations if we have new data
    if (aggs) {
      existing.kpis          = aggs.kpis;
      existing.topByViews    = aggs.topByViews;
      existing.topByLikes    = aggs.topByLikes;
      existing.topByComments = aggs.topByComments;
      existing.tierDist      = aggs.tierDist;
      existing.hashtags      = aggs.hashtags;
      existing.mentions      = aggs.mentions;
      existing.dailyPerf     = aggs.dailyPerf;
      existing.monthlyPerf   = aggs.monthlyPerf;
      existing.yearly        = aggs.yearly;
      if (aggs.duration) existing.duration = aggs.duration;
      updated++;
      console.log(`  ✓ ${key}: refreshed with ${acc.scrapedPosts} new posts`);
    } else {
      kept++;
      console.log(`  ⤵ ${key}: kept existing (no new posts)`);
    }

    // Replace insight if LLM data exists
    if (llmInsight && Object.keys(llmInsight).length) {
      existing.insight = {
        kekuatan: llmInsight.kekuatan || [],
        kelemahan: llmInsight.kelemahan || [],
        rekomendasi: llmInsight.rekomendasi || [],
        analisis: llmInsight.analisis || '',
        posisi: llmInsight.posisi || '',
      };
      existing.benchmark = llmInsight.benchmark || { industri: '', catatan: '' };
      existing.growth = llmInsight.growth || { target: '', langkah: [] };
      insightsUpdated++;
    }
  }

  // Write
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(full, null, 2), 'utf8');
  console.log(`\n[generate_accounts] done.`);
  console.log(`  updated:    ${updated}`);
  console.log(`  kept:       ${kept}`);
  console.log(`  insights:   ${insightsUpdated}`);
  console.log(`  → ${DATA_PATH}`);
}

main();
