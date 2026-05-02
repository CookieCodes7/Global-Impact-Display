import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import Clock from '../components/Clock';
import PriceChart from '../components/PriceChart';

interface LiveQuote {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  error?: boolean;
}

interface CommodityItem {
  sym: string;
  yahoo: string;
  name: string;
  unit: string;
  category: 'Metals' | 'Energy' | 'Agriculture';
  emoji: string;
  sig: 'BULL' | 'BEAR' | 'NEUT';
  conf: number;
  aiNote: string;
}

const COMMODITIES: CommodityItem[] = [
  { sym:'GOLD',        yahoo:'GC=F',  name:'Gold',          unit:'$/oz',     category:'Metals',      emoji:'🥇', sig:'BULL', conf:82, aiNote:'Record central bank purchases and geopolitical risk premiums sustain the bullish trend. Dollar weakness amplifies upside.' },
  { sym:'SILVER',      yahoo:'SI=F',  name:'Silver',        unit:'$/oz',     category:'Metals',      emoji:'🥈', sig:'BULL', conf:74, aiNote:'Dual demand from safe-haven flows and surging solar/EV industrial use. Gold-silver ratio at 85× suggests significant upside.' },
  { sym:'PLATINUM',    yahoo:'PL=F',  name:'Platinum',      unit:'$/oz',     category:'Metals',      emoji:'⬜', sig:'NEUT', conf:50, aiNote:'Hydrogen economy demand is a long-term catalyst but near-term supply from South Africa remains elevated.' },
  { sym:'PALLADIUM',   yahoo:'PA=F',  name:'Palladium',     unit:'$/oz',     category:'Metals',      emoji:'🔘', sig:'BEAR', conf:65, aiNote:'EV adoption reducing internal combustion engine demand for catalytic converters. Structural headwind building.' },
  { sym:'COPPER',      yahoo:'HG=F',  name:'Copper',        unit:'$/lb',     category:'Metals',      emoji:'🟤', sig:'BULL', conf:71, aiNote:'Energy transition requires 3× more copper. China stimulus and LME inventory depletion are powerful near-term catalysts.' },
  { sym:'OIL_WTI',     yahoo:'CL=F',  name:'WTI Crude',     unit:'$/bbl',    category:'Energy',      emoji:'🛢️', sig:'NEUT', conf:55, aiNote:'OPEC+ compliance uncertainty and weak China demand offset geopolitical risk. $75–$85 range likely to hold.' },
  { sym:'OIL_BRENT',   yahoo:'BZ=F',  name:'Brent Crude',   unit:'$/bbl',    category:'Energy',      emoji:'🛢️', sig:'NEUT', conf:52, aiNote:'Middle East risk premium fading as ceasefire talks progress. Global demand remains mixed with diverging regional trends.' },
  { sym:'NAT_GAS',     yahoo:'NG=F',  name:'Natural Gas',   unit:'$/MMBtu',  category:'Energy',      emoji:'🔥', sig:'NEUT', conf:48, aiNote:'Mild weather suppresses near-term demand. LNG export infrastructure additions in 2025 create structural medium-term support.' },
  { sym:'GASOLINE',    yahoo:'RB=F',  name:'Gasoline',      unit:'$/gal',    category:'Energy',      emoji:'⛽', sig:'NEUT', conf:50, aiNote:'Refinery margins normalizing. Summer driving season demand boost expected but tempered by EV adoption trends.' },
  { sym:'WHEAT',       yahoo:'ZW=F',  name:'Wheat',         unit:'cts/bu',   category:'Agriculture', emoji:'🌾', sig:'BEAR', conf:62, aiNote:'Record Australian output and Black Sea corridor stability pressuring prices. Supply-side fundamentals bearish near-term.' },
  { sym:'CORN',        yahoo:'ZC=F',  name:'Corn',          unit:'cts/bu',   category:'Agriculture', emoji:'🌽', sig:'NEUT', conf:50, aiNote:'USDA raised production estimates above consensus. Ethanol demand provides price floor but upside is limited.' },
  { sym:'SOYBEANS',    yahoo:'ZS=F',  name:'Soybeans',      unit:'cts/bu',   category:'Agriculture', emoji:'🫘', sig:'NEUT', conf:52, aiNote:'South American harvest adding supply pressure. China import demand is the key swing factor this season.' },
  { sym:'COFFEE',      yahoo:'KC=F',  name:'Coffee',        unit:'cts/lb',   category:'Agriculture', emoji:'☕', sig:'BULL', conf:68, aiNote:'La Niña weather disruptions to Brazilian harvest reducing supply. Global demand resilient at record levels.' },
  { sym:'SUGAR',       yahoo:'SB=F',  name:'Sugar',         unit:'cts/lb',   category:'Agriculture', emoji:'🍬', sig:'BEAR', conf:58, aiNote:'Indian export ban lifted, adding global supply. Thai production also recovering from last year\'s drought.' },
  { sym:'COTTON',      yahoo:'CT=F',  name:'Cotton',        unit:'cts/lb',   category:'Agriculture', emoji:'🌸', sig:'NEUT', conf:50, aiNote:'Demand from Asian textile mills steady but synthetic fibre substitution limits upside.' },
];

const CATEGORIES = ['All', 'Metals', 'Energy', 'Agriculture'] as const;
type Category = typeof CATEGORIES[number];

function pctColor(v: number | null) {
  if (v == null) return 'var(--muted)';
  return v > 0 ? 'var(--bull)' : v < 0 ? 'var(--bear)' : 'var(--muted)';
}

function fmtPrice(n: number | null, decimals = 2): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function sigLabel(s: string) {
  return s === 'BULL' ? '▲ BULLISH' : s === 'BEAR' ? '▼ BEARISH' : '● NEUTRAL';
}

function sigColor(s: string) {
  return s === 'BULL' ? 'var(--bull)' : s === 'BEAR' ? 'var(--bear)' : 'var(--neut)';
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

interface NewsItem { title: string; publisher: string; link: string; publishedAt: string | null; relatedTickers: string[] }

export default function CommoditiesPage() {
  const [category, setCategory] = useState<Category>('All');
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [selected, setSelected] = useState<CommodityItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [usdInr, setUsdInr] = useState<number>(83.5);

  const isINR = currency === 'INR';

  function fmtCurrency(usdPrice: number | null): string {
    if (usdPrice == null) return '—';
    if (isINR) {
      const inr = usdPrice * usdInr;
      return '₹' + inr.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    return '$' + fmtPrice(usdPrice);
  }

  const fetchQuotes = useCallback(async () => {
    const syms = [...COMMODITIES.map(c => c.yahoo), 'INR=X'].join(',');
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`);
      const data = await res.json();
      const map: Record<string, LiveQuote> = {};
      for (const q of data.quotes ?? []) {
        if (q.symbol === 'INR=X') { if (q.price) setUsdInr(q.price); }
        else map[q.symbol] = q;
      }
      setQuotes(map);
    } catch { /* keep stale */ } finally { setQuotesLoading(false); }
  }, []);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news?market=CMDTY&limit=20');
      const data = await res.json();
      setNews(data.articles ?? []);
    } catch { /* ignore */ } finally { setNewsLoading(false); }
  }, []);

  useEffect(() => {
    fetchQuotes();
    fetchNews();
    const id = setInterval(fetchQuotes, 30000);
    return () => clearInterval(id);
  }, [fetchQuotes, fetchNews]);

  const filtered = category === 'All' ? COMMODITIES : COMMODITIES.filter(c => c.category === category);

  const catStats = {
    Metals: { count: COMMODITIES.filter(c => c.category === 'Metals').length, up: COMMODITIES.filter(c => c.category === 'Metals' && (quotes[c.yahoo]?.changePercent ?? 0) > 0).length },
    Energy: { count: COMMODITIES.filter(c => c.category === 'Energy').length, up: COMMODITIES.filter(c => c.category === 'Energy' && (quotes[c.yahoo]?.changePercent ?? 0) > 0).length },
    Agriculture: { count: COMMODITIES.filter(c => c.category === 'Agriculture').length, up: COMMODITIES.filter(c => c.category === 'Agriculture' && (quotes[c.yahoo]?.changePercent ?? 0) > 0).length },
  };

  return (
    <div className="cmdty-page">

      {/* Header */}
      <div className="cmdty-hdr">
        <Link href="/" className="sp-back">← Terminal</Link>
        <Link href="/portfolio" className="sp-back" style={{ borderColor: '#3b9eff44', color: '#3b9eff' }}>📊 Portfolio</Link>
        <Link href="/news" className="sp-back" style={{ borderColor: '#a78bfa44', color: '#a78bfa' }}>📰 News</Link>
        <div className="sp-hdr-divider" />
        <span className="cmdty-hdr-title">🏅 COMMODITIES MARKETS</span>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 12 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="cmdty-cat-btn"
              style={{
                background: category === cat ? '#f5c24220' : 'none',
                borderColor: category === cat ? '#f5c242' : 'var(--border)',
                color: category === cat ? '#f5c242' : 'var(--muted)',
              }}
            >
              {cat}
              {cat !== 'All' && (
                <span style={{ fontSize: 8, marginLeft: 4, opacity: 0.7 }}>
                  {catStats[cat as keyof typeof catStats].up}/{catStats[cat as keyof typeof catStats].count} ↑
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* USD / INR currency toggle */}
          <div style={{ display: 'flex', gap: 2, border: '1px solid #f5c24244', borderRadius: 3, overflow: 'hidden' }}>
            <button
              onClick={() => setCurrency('USD')}
              style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', border: 'none', background: currency === 'USD' ? '#f5c24230' : 'transparent', color: currency === 'USD' ? '#f5c242' : '#5a7a94', transition: 'all .15s' }}
            >$ USD</button>
            <button
              onClick={() => setCurrency('INR')}
              style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, padding: '4px 10px', cursor: 'pointer', border: 'none', borderLeft: '1px solid #f5c24244', background: currency === 'INR' ? '#ff993330' : 'transparent', color: currency === 'INR' ? '#ff9933' : '#5a7a94', transition: 'all .15s' }}
            >₹ INR</button>
          </div>
          <button onClick={() => { fetchQuotes(); fetchNews(); }} className="news-refresh-btn" disabled={quotesLoading}>
            {quotesLoading ? <>⟳ Refreshing...</> : <>↺ Refresh</>}
          </button>
          <Clock />
        </div>
      </div>

      {/* Summary band */}
      <div className="cmdty-summary-band">
        {(['Metals', 'Energy', 'Agriculture'] as const).map(cat => {
          const items = COMMODITIES.filter(c => c.category === cat);
          const upCount = items.filter(c => (quotes[c.yahoo]?.changePercent ?? 0) > 0).length;
          const dnCount = items.filter(c => (quotes[c.yahoo]?.changePercent ?? 0) < 0).length;
          const catEmoji = cat === 'Metals' ? '⚙️' : cat === 'Energy' ? '⚡' : '🌿';
          return (
            <div key={cat} className="cmdty-sum-seg" onClick={() => setCategory(cat)} style={{ cursor: 'pointer' }}>
              <span className="cmdty-sum-cat">{catEmoji} {cat}</span>
              <span className="cmdty-sum-stat"><span style={{ color: 'var(--bull)' }}>↑{upCount}</span> · <span style={{ color: 'var(--bear)' }}>↓{dnCount}</span></span>
            </div>
          );
        })}
        <div className="cmdty-sum-seg" style={{ marginLeft: 'auto' }}>
          <span className="cmdty-sum-cat">Total Tracked</span>
          <span className="cmdty-sum-stat" style={{ color: '#f5c242' }}>{COMMODITIES.length} commodities</span>
        </div>
      </div>

      {/* Body */}
      <div className="cmdty-body" style={{ gridTemplateColumns: selected ? '1fr 360px' : '1fr' }}>

        {/* Grid */}
        <div className="cmdty-grid-wrap">
          {(['Metals', 'Energy', 'Agriculture'] as const)
            .filter(cat => category === 'All' || cat === category)
            .map(cat => {
              const items = filtered.filter(c => c.category === cat);
              if (items.length === 0) return null;
              const catEmoji = cat === 'Metals' ? '⚙️' : cat === 'Energy' ? '⚡' : '🌿';
              return (
                <div key={cat} className="cmdty-section">
                  <div className="cmdty-section-hdr">{catEmoji} {cat}</div>
                  <div className="cmdty-grid">
                    {items.map(c => {
                      const q = quotes[c.yahoo];
                      const price = q?.price ?? null;
                      const chg = q?.change ?? null;
                      const chgPct = q?.changePercent ?? null;
                      const isSelected = selected?.sym === c.sym;
                      return (
                        <div
                          key={c.sym}
                          className={`cmdty-card${isSelected ? ' selected' : ''}`}
                          onClick={() => setSelected(prev => prev?.sym === c.sym ? null : c)}
                        >
                          <div className="cmdty-card-top">
                            <span className="cmdty-card-emoji">{c.emoji}</span>
                            <div className="cmdty-card-info">
                              <div className="cmdty-card-name">{c.name}</div>
                              <div className="cmdty-card-unit">{c.unit}</div>
                            </div>
                            <div className="cmdty-card-sig" style={{ color: sigColor(c.sig) }}>{sigLabel(c.sig)}</div>
                          </div>
                          <div className="cmdty-card-price" style={{ color: chgPct == null ? 'var(--text)' : pctColor(chgPct) }}>
                            {quotesLoading && price == null
                              ? <span style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</span>
                              : fmtCurrency(price)
                            }
                          </div>
                          <div className="cmdty-card-chg">
                            {chgPct != null && (
                              <>
                                <span style={{ color: pctColor(chgPct) }}>
                                  {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                                </span>
                                <span style={{ color: 'var(--muted)', fontSize: 9, marginLeft: 6 }}>
                                  {chg != null ? `${chg >= 0 ? '+' : ''}${fmtPrice(chg)}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="cmdty-card-conf">
                            <div className="cmdty-conf-bar-wrap">
                              <div className="cmdty-conf-bar" style={{ width: `${c.conf}%`, background: sigColor(c.sig) }} />
                            </div>
                            <span style={{ fontSize: 8, color: 'var(--muted)' }}>AI: {c.conf}%</span>
                          </div>
                          <Link
                            href={`/stock/${encodeURIComponent(c.yahoo)}`}
                            className="cmdty-card-link"
                            onClick={e => e.stopPropagation()}
                          >
                            Full Chart →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Detail Panel */}
        {selected && (() => {
          const q = quotes[selected.yahoo];
          const price = q?.price ?? null;
          const chg = q?.change ?? null;
          const chgPct = q?.changePercent ?? null;
          return (
            <div className="cmdty-detail">
              <div className="cmdty-detail-inner">
                <button
                  onClick={() => setSelected(null)}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font)' }}
                >✕</button>

                <div className="cmdty-detail-emoji">{selected.emoji}</div>
                <div className="cmdty-detail-name">{selected.name}</div>
                <div className="cmdty-detail-unit">{selected.unit} · {selected.category}</div>

                <div className="cmdty-detail-price" style={{ color: pctColor(chgPct) }}>
                  {fmtCurrency(price)}
                </div>
                <div className="cmdty-detail-chg">
                  {chgPct != null && (
                    <span style={{ color: pctColor(chgPct), fontSize: 13 }}>
                      {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}% &nbsp;
                      ({chg != null ? `${chg >= 0 ? '+' : ''}${fmtPrice(chg)}` : '—'})
                    </span>
                  )}
                </div>

                {/* AI Signal */}
                <div className="cmdty-detail-section">
                  <div className="cmdty-detail-sec-title">AI Signal</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sigColor(selected.sig) }}>{sigLabel(selected.sig)}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>Confidence: {selected.conf}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--dim)', borderRadius: 2, marginBottom: 10 }}>
                    <div style={{ height: 3, borderRadius: 2, width: `${selected.conf}%`, background: sigColor(selected.sig) }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--sans)' }}>
                    {selected.aiNote}
                  </p>
                </div>

                {/* Price chart with candle toggle */}
                <div style={{ margin: '12px -4px 0', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <PriceChart
                    yahooSym={selected.yahoo}
                    currentPrice={price ?? 0}
                    currency={isINR ? '₹' : '$'}
                    accentColor="#f5c242"
                    height={180}
                    showPeriodSelector={true}
                    defaultPeriod="1mo"
                  />
                </div>

                {/* Full chart link */}
                <Link
                  href={`/stock/${encodeURIComponent(selected.yahoo)}`}
                  className="cmdty-chart-btn"
                >
                  📈 Open Full Chart
                </Link>

                {/* Recent commodity news */}
                <div className="cmdty-detail-section" style={{ marginTop: 12 }}>
                  <div className="cmdty-detail-sec-title">Recent News</div>
                  {newsLoading ? (
                    <div style={{ fontSize: 9, color: 'var(--muted)', padding: '8px 0' }}>Loading commodity news...</div>
                  ) : news.length === 0 ? (
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontStyle: 'italic' }}>No recent commodity news</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {news.slice(0, 6).map((n, i) => (
                        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="cmdty-news-row">
                          <div className="cmdty-news-title">{n.title}</div>
                          <div className="cmdty-news-meta">
                            <span>{n.publisher}</span>
                            <span>{timeAgo(n.publishedAt)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
