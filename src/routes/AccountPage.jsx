// TITAN PRO · V8 — Account sub-page: 14 sections per account with CountUp + charts.

import { useParams, Link } from 'react-router-dom';
import { accountBySlug } from '../data/accounts.js';
import TitanLogo from '../components/TitanLogo.jsx';
import ShinyText from '../components/ShinyText.jsx';
import CountUp from '../components/CountUp.jsx';
import Icon from '../components/Icon.jsx';

const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Try to extract a clean numeric value from a string like "892.000" or "1.99%" or "22.345"
function parseNum(s) {
  if (typeof s !== 'string') return NaN;
  // Strip %, commas, and detect K/M suffixes
  const kMatch = /([\d.,]+)\s*K/i.exec(s);
  const mMatch = /([\d.,]+)\s*M/i.exec(s);
  if (mMatch) return Math.round(parseFloat(mMatch[1].replace(/\./g, '').replace(',', '.')) * 1_000_000);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(/\./g, '').replace(',', '.')) * 1_000);
  // Plain number: handle "892.000" (dot thousands separator) vs "22.345" (no thousands)
  // Heuristic: if 3 digits follow a dot, treat as thousands
  const cleaned = s.replace(/[^\d.,-]/g, '');
  if (!cleaned) return NaN;
  const num = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  if (Number.isNaN(num)) return NaN;
  return Math.round(num);
}

function PlatformBadge({ platform }) {
  return (
    <span className={`acct-badge acct-badge--${platform}`}>
      <Icon name={platform === 'tiktok' ? 'bolt' : 'camera'} size={11} /> {platform === 'tiktok' ? 'TikTok' : 'Instagram'}
    </span>
  );
}

function KpiCard({ kpi }) {
  const isPercent = /%$/.test(kpi.value);
  const isRatio = /\(.*%/.test(kpi.value);
  // Decide whether to CountUp — only if purely numeric
  const num = parseNum(kpi.value);
  const animated = !isNaN(num) && !isRatio;

  return (
    <div className={`kpi ${kpi.gold ? 'kpi--gold' : ''} ${kpi.pos ? 'kpi--pos' : ''}`}>
      <div className="kpi__value">
        {animated ? (
          <CountUp to={num} duration={1.4} separator="." />
        ) : (
          kpi.value
        )}
        {isPercent && !animated ? '%' : ''}
      </div>
      <div className="kpi__label">{kpi.label}</div>
    </div>
  );
}

// Section heading uses ShinyText — white base text with purple #a24bf5 shine sweep.
function Section({ title, icon, children, platform }) {
  return (
    <section className="ap-section">
      <h2 className="account-page__section-title">
        <span className="ap-section__icon">{icon}</span>{' '}
        <ShinyText
          text={title}
          speed={2.6}
          color="#ffffff"
          shineColor="#a24bf5"
          spread={120}
          direction="left"
        />
      </h2>
      {children}
    </section>
  );
}

function TopPostsTable({ rows, color, metric = 'views' }) {
  if (!rows || rows.length === 0) return <p className="muted">Tidak ada data.</p>;
  const metricLabel = { views: 'Tayangan', likes: 'Suka', comments: 'Komentar' }[metric] || 'Tayangan';
  return (
    <div className="ap-table-wrap">
      <table className="ap-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="num">{metricLabel}</th>
            <th className="num">Suka</th>
            <th className="num">Komentar</th>
            <th className="num">ER</th>
            <th>Tanggal</th>
            <th>Caption</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="ap-rank">{r.rank}</td>
              <td className="num"><CountUp to={parseNum(r.views)} duration={1.2} separator="." /></td>
              <td className="num"><CountUp to={parseNum(r.likes)} duration={1.2} separator="." /></td>
              <td className="num"><CountUp to={parseNum(r.comments)} duration={1.2} separator="." /></td>
              <td className="num er">{r.er}</td>
              <td className="muted">{r.date}</td>
              <td className="caption">{r.caption}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TierDist({ tiers }) {
  if (!tiers || tiers.length === 0) return <p className="muted">Tidak ada data.</p>;
  return (
    <div className="ap-tier">
      {tiers.map((t, i) => (
        <div key={i} className="ap-tier__row">
          <div className="ap-tier__label">{t.label}</div>
          <div className="ap-tier__bar-wrap">
            <div className="ap-tier__bar" style={{ width: `${Math.max(t.width, 2)}%` }} />
          </div>
          <div className="ap-tier__count">
            <b>{t.count}</b> <span className="muted">({t.pct})</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HashtagList({ tags }) {
  if (!tags || tags.length === 0) return <p className="muted">Tidak ada data.</p>;
  return (
    <div className="ap-table-wrap">
      <table className="ap-table ap-table--tags">
        <thead>
          <tr>
            <th>Hashtag</th>
            <th className="num">Penggunaan</th>
            <th className="num">% dari Total</th>
            <th className="num">Rata-rata Views</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((t, i) => (
            <tr key={i}>
              <td><code className="ap-tag">{t.tag}</code></td>
              <td className="num"><CountUp to={t.count} duration={1.2} /></td>
              <td className="num">{t.pct}</td>
              <td className="num"><CountUp to={parseNum(t.avgViews)} duration={1.2} separator="." /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MentionList({ mentions }) {
  if (!mentions || mentions.length === 0) return <p className="muted">Tidak ada data.</p>;
  return (
    <div className="ap-mentions">
      {mentions.map((m, i) => (
        <div key={i} className="ap-mention">
          <span className="ap-mention__handle">{m.handle}</span>
          <span className="ap-mention__count">
            <CountUp to={m.count} duration={1.2} />
          </span>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ daily }) {
  if (!daily || daily.length === 0) return <p className="muted">Tidak ada data.</p>;
  const max = Math.max(...daily.map((d) => parseNum(d.views) || 0));
  return (
    <div className="ap-daily">
      {daily.map((d, i) => {
        const v = parseNum(d.views) || 0;
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={i} className="ap-daily__row">
            <div className="ap-daily__day">{d.day}</div>
            <div className="ap-daily__bar-wrap">
              <div className="ap-daily__bar" style={{ width: `${pct}%` }} />
              <span className="ap-daily__value">
                <CountUp to={v} duration={1.2} separator="." />
              </span>
            </div>
            <div className="ap-daily__posts muted">{d.posts} post</div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyChart({ monthly }) {
  if (!monthly || monthly.length === 0) return <p className="muted">Tidak ada data.</p>;
  const max = Math.max(...monthly.map((m) => parseNum(m.views) || 0));
  return (
    <div className="ap-monthly">
      {monthly.map((m, i) => {
        const v = parseNum(m.views) || 0;
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div key={i} className="ap-monthly__col">
            <div className="ap-monthly__bar-wrap" title={`${m.month}: ${m.views} views`}>
              <div className="ap-monthly__bar" style={{ height: `${pct}%` }} />
            </div>
            <div className="ap-monthly__label">{m.month.split(' ')[0]}</div>
            <div className="ap-monthly__year">{m.month.split(' ')[1]}</div>
            <div className="ap-monthly__value">
              <CountUp to={v} duration={1.2} separator="." />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function YearlyTable({ yearly }) {
  if (!yearly || yearly.length === 0) return <p className="muted">Tidak ada data.</p>;
  return (
    <div className="ap-table-wrap">
      <table className="ap-table">
        <thead>
          <tr>
            <th>Tahun</th>
            <th className="num">Posts</th>
            <th className="num">Views</th>
            <th className="num">Likes</th>
            <th className="num">Komentar</th>
            <th className="num">Avg Views</th>
            <th>Bulan Terbaik</th>
            <th>Top Post</th>
          </tr>
        </thead>
        <tbody>
          {yearly.map((y, i) => (
            <tr key={i}>
              <td><b>{y.year}</b></td>
              <td className="num"><CountUp to={y.posts} duration={1.2} /></td>
              <td className="num"><CountUp to={parseNum(y.views)} duration={1.2} separator="." /></td>
              <td className="num"><CountUp to={parseNum(y.likes)} duration={1.2} separator="." /></td>
              <td className="num"><CountUp to={parseNum(y.comments)} duration={1.2} separator="." /></td>
              <td className="num"><CountUp to={parseNum(y.avgViews)} duration={1.2} separator="." /></td>
              <td>{y.bestMonth}</td>
              <td className="caption">{y.topPost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DurationList({ duration }) {
  if (!duration || duration.length === 0) return <p className="muted">Tidak ada data.</p>;
  const max = Math.max(...duration.map((d) => d.posts || 0));
  return (
    <div className="ap-duration">
      {duration.map((d, i) => {
        const pct = max > 0 ? (d.posts / max) * 100 : 0;
        return (
          <div key={i} className="ap-duration__row">
            <div className="ap-duration__range">{d.range}</div>
            <div className="ap-duration__bar-wrap">
              <div className="ap-duration__bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="ap-duration__meta">
              <b><CountUp to={d.posts} duration={1.0} /></b> video · {d.views} views{d.share ? ` · ${d.share}` : ''}{d.er ? ` · ER ${d.er}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightList({ items, kind }) {
  if (!items || items.length === 0) return <p className="muted">Tidak ada data.</p>;
  return (
    <ol className={`ap-insight ap-insight--${kind}`}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  );
}

function BenchmarkPanel({ benchmark }) {
  if (!benchmark?.industri) return <p className="muted">Tidak ada data.</p>;
  return <p className="ap-benchmark">{benchmark.industri}</p>;
}

function GrowthPanel({ growth }) {
  if (!growth) return <p className="muted">Tidak ada data.</p>;
  return (
    <div className="ap-growth">
      {growth.target && (
        <div className="ap-growth__target">
          <span className="ap-growth__target-label"><Icon name="bullseye" size={12} /> Target</span>
          <p>{growth.target}</p>
        </div>
      )}
      {growth.langkah && growth.langkah.length > 0 && (
        <>
          <h3 className="ap-growth__sub"><Icon name="listCheck" size={13} /> Langkah Strategis</h3>
          <ol className="ap-insight">
            {growth.langkah.map((l, i) => <li key={i}>{l}</li>)}
          </ol>
        </>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { slug = '' } = useParams();
  const account = accountBySlug(slug);

  if (!account) {
    return (
      <div className="page page--notfound">
        <h1>Akun tidak ditemukan</h1>
        <p>Slug "{slug}" tidak ada dalam data.</p>
        <Link to="/" className="tm-btn tm-btn--primary"><Icon name="arrowLeft" size={12} /> Kembali ke Beranda</Link>
      </div>
    );
  }

  const { profile, kpis, topByViews, topByLikes, topByComments, tierDist, hashtags, mentions,
          insight, benchmark, growth, dailyPerf, monthlyPerf, yearly, duration } = account;
  const isTT = profile.platform === 'tiktok';

  return (
    <div className={`account-page account-page--${profile.platform}`}>
      <header className="account-page__head">
        <Link to="/" className="account-page__back"><Icon name="arrowLeft" size={12} /> Beranda</Link>
        <div className="account-page__hero">
          <div className="account-page__avatar">
            <TitanLogo size={88} />
          </div>
          <div className="account-page__id">
            <div className="account-page__handle-row">
              <h1 className="account-page__handle">@{profile.handle}</h1>
              {profile.verified && <span className="account-page__verified" title="Verified"><Icon name="check" size={14} /></span>}
              <PlatformBadge platform={profile.platform} />
            </div>
            {profile.displayName && <p className="account-page__displayname">{profile.displayName}</p>}
            <p className="account-page__niche">{profile.niche}</p>
            {profile.bio && <p className="account-page__bio">{profile.bio}</p>}
            {profile.lokasi && <p className="account-page__lokasi"><Icon name="locationDot" size={11} /> {profile.lokasi}</p>}
            <div className="account-page__meta">
              <span><b>{profile.followers}</b> followers</span>
              <span className="dot">·</span>
              <span><b>{profile.posts}</b> {isTT ? 'video' : 'post'}</span>
              {profile.url && (
                <>
                  <span className="dot">·</span>
                  <a className="ap-url" href={`https://${profile.url}`} target="_blank" rel="noopener noreferrer">{profile.url}</a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 1. Profil (KPIs) */}
      <Section title="Profil & Metrik Utama" icon={<Icon name="chartLine" size={14} />} platform={profile.platform}>
        <div className="kpi-grid">
          {kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
        </div>
      </Section>

      {/* 2-4. Top Posts */}
      {profile.platform === 'instagram' ? (
        <Section title="5 Post Teratas · Suka (Tayangan tidak tersedia di IG)" icon={<Icon name="crown" size={14} />} platform={profile.platform}>
          <TopPostsTable rows={topByLikes} metric="likes" />
        </Section>
      ) : (
        <Section title="5 Post Teratas · Tayangan" icon={<Icon name="crown" size={14} />} platform={profile.platform}>
          <TopPostsTable rows={topByViews} metric="views" />
        </Section>
      )}

      <Section title="5 Post Teratas · Suka" icon={<Icon name="heart" size={14} />} platform={profile.platform}>
        <TopPostsTable rows={topByLikes} metric="likes" />
      </Section>

      <Section title="5 Post Teratas · Komentar" icon={<Icon name="comments" size={14} />} platform={profile.platform}>
        <TopPostsTable rows={topByComments} metric="comments" />
      </Section>

      {/* 5. Tier Distribution */}
      <Section title="Distribusi Tingkatan Performa" icon={<Icon name="bullseye" size={14} />} platform={profile.platform}>
        <TierDist tiers={tierDist} />
      </Section>

      {/* 6. Hashtags */}
      <Section title="10 Hashtag Terbanyak" icon={<Icon name="hashtag" size={14} />} platform={profile.platform}>
        <HashtagList tags={hashtags} />
      </Section>

      {/* 7. Mentions */}
      <Section title="10 Mention Terbanyak (Kolaborasi)" icon={<Icon name="handshake" size={14} />} platform={profile.platform}>
        <MentionList mentions={mentions} />
      </Section>

      {/* 8. Daily Performance */}
      <Section title="Performa per Hari" icon={<Icon name="calendar" size={14} />} platform={profile.platform}>
        <DailyChart daily={dailyPerf} />
      </Section>

      {/* 9. Monthly Performance + chart */}
      <Section title="Performa Bulanan" icon={<Icon name="chartColumn" size={14} />} platform={profile.platform}>
        <MonthlyChart monthly={monthlyPerf} />
      </Section>

      {/* 10. Video Duration */}
      <Section title="Analisis Durasi Video" icon={<Icon name="clock" size={14} />} platform={profile.platform}>
        <DurationList duration={duration} />
      </Section>

      {/* 11. Yearly Summary */}
      <Section title="Ringkasan Tahunan" icon={<Icon name="calendarDays" size={14} />} platform={profile.platform}>
        <YearlyTable yearly={yearly} />
      </Section>

      {/* 12. Insight & Rekomendasi */}
      <Section title="Insight & Rekomendasi" icon={<Icon name="lightbulb" size={14} />} platform={profile.platform}>
        <div className="ap-insights">
          <div className="ap-callout ap-callout--success">
            <h3><Icon name="circleCheck" size={13} /> Kekuatan</h3>
            <InsightList items={insight.kekuatan} kind="kekuatan" />
          </div>
          <div className="ap-callout ap-callout--warn">
            <h3><Icon name="triangleExclamation" size={13} /> Kelemahan</h3>
            <InsightList items={insight.kelemahan} kind="kelemahan" />
          </div>
          <div className="ap-callout ap-callout--info">
            <h3><Icon name="bullseye" size={13} /> Rekomendasi</h3>
            <InsightList items={insight.rekomendasi} kind="rekomendasi" />
          </div>
          {insight.analisis && (
            <div className="ap-callout ap-callout--info">
              <h3><Icon name="chartLine" size={13} /> Analisis Pasar</h3>
              <p>{insight.analisis}</p>
            </div>
          )}
          {insight.posisi && (
            <div className="ap-callout ap-callout--info">
              <h3><Icon name="flagCheckered" size={13} /> Posisi Kompetitor</h3>
              <p>{insight.posisi}</p>
            </div>
          )}
        </div>
      </Section>

      {/* 13. Benchmark Industri */}
      <Section title="Benchmark Industri" icon={<Icon name="chartLine" size={14} />} platform={profile.platform}>
        <BenchmarkPanel benchmark={benchmark} />
      </Section>

      {/* 14. Growth Potential */}
      <Section title="Potensi Pertumbuhan" icon={<Icon name="wand" size={14} />} platform={profile.platform}>
        <GrowthPanel growth={growth} />
      </Section>

      <section className="account-page__quick">
        <h2 className="account-page__section-title">
          <span className="ap-section__icon"><Icon name="bolt" size={14} /></span>{' '}
          <ShinyText
            text="Akses Cepat"
            speed={2.6}
            color="#ffffff"
            shineColor="#a24bf5"
            spread={120}
            direction="left"
          />
        </h2>
        <div className="account-page__quick-row">
          <a
            className="tm-btn tm-btn--primary"
            href={`https://${isTT ? 'tiktok.com' : 'instagram.com'}/@${profile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka di {isTT ? 'TikTok' : 'Instagram'} <Icon name="arrowUpRight" size={12} />
          </a>
          <Link to="/" className="tm-btn tm-btn--ghost">Lihat Akun Lain</Link>
        </div>
      </section>
    </div>
  );
}
