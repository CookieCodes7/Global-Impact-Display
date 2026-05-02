import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import Clock from '../components/Clock';

interface Article {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  relatedTickers: string[];
  thumbnail: string | null;
}

interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  error?: boolean;
}

const MARKET_TABS = [
  { id: 'ALL', label: '🌐 All', color: '#3b9eff' },
  { id: 'IN',  label: '🇮🇳 India',  color: '#ff9933' },
  { id: 'US',  label: '🇺🇸 USA',    color: '#3b9eff' },
  { id: 'CN',  label: '🇨🇳 China',  color: '#ff4d4f' },
  { id: 'JP',  label: '🇯🇵 Japan',  color: '#ff6b6b' },
];

const REFRESH_INTERVAL = 90;

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff) || diff < 0) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function formatExactTime(iso: string | null): string {
  if (!iso) return 'Unknown time';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getTickerDisplay(ticker: string): string {
  return ticker.replace(/\.(NS|BO|T|HK)$/, '');
}

function getTickerColor(ticker: string): string {
  if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) return '#ff9933';
  if (ticker.endsWith('.HK')) return '#ff4d4f';
  if (ticker.endsWith('.T')) return '#ff6b6b';
  if (ticker.startsWith('^')) return '#5a7a94';
  return '#3b9eff';
}

export default function NewsPage() {
  const [market, setMarket] = useState('ALL');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [relatedQuotes, setRelatedQuotes] = useState<Record<string, Quote>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(async (mkt: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/news?market=${mkt}&limit=40`);
      const d = await r.json();
      setArticles(d.articles ?? []);
      setRefreshedAt(d.refreshedAt ?? new Date().toISOString());
      setCountdown(REFRESH_INTERVAL);
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on market change
  useEffect(() => {
    fetchNews(market);
    setSelectedArticle(null);
  }, [market, fetchNews]);

  // Countdown + auto-refresh
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchNews(market);
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [market, fetchNews]);

  // Fetch related quotes when article selected
  useEffect(() => {
    if (!selectedArticle || selectedArticle.relatedTickers.length === 0) {
      setRelatedQuotes({});
      return;
    }
    const tickers = selectedArticle.relatedTickers.filter(t => !t.startsWith('^')).slice(0, 10);
    if (tickers.length === 0) return;
    setQuotesLoading(true);
    fetch(`/api/quotes?symbols=${tickers.join(',')}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Quote> = {};
        for (const q of d.quotes ?? []) map[q.symbol] = q;
        setRelatedQuotes(map);
      })
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
  }, [selectedArticle?.uuid]);

  // Filter articles
  const filteredArticles = articles.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.relatedTickers.some(t => getTickerDisplay(t).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeTab = MARKET_TABS.find(t => t.id === market)!;

  return (
    <div className="news-page">

      {/* Header */}
      <div className="news-hdr">
        <Link href="/" className="sp-back">← Terminal</Link>
        <Link href="/portfolio" className="sp-back" style={{ borderColor: '#3b9eff44', color: '#3b9eff' }}>📊 Portfolio</Link>
        <div className="sp-hdr-divider" />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, color: 'var(--text)' }}>📰 NEWS FEED</span>

        {/* Market tabs */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 12 }}>
          {MARKET_TABS.map(t => (
            <button key={t.id} onClick={() => setMarket(t.id)} className="news-tab" style={{
              background: market === t.id ? t.color + '20' : 'none',
              borderColor: market === t.id ? t.color : 'var(--border)',
              color: market === t.id ? t.color : 'var(--muted)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 8 }}>
          <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--muted)', pointerEvents: 'none' }}>⌕</span>
          <input
            className="news-search"
            placeholder="Filter news..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { fetchNews(market); setCountdown(REFRESH_INTERVAL); }}
            disabled={loading}
            className="news-refresh-btn"
          >
            {loading
              ? <><div className="sp-spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> Refreshing...</>
              : <>↺ Refresh · {countdown}s</>
            }
          </button>
          {refreshedAt && (
            <span style={{ fontSize: 8, color: 'var(--dim)' }}>Updated {timeAgo(refreshedAt)}</span>
          )}
          <Clock />
        </div>
      </div>

      {/* Article count bar */}
      <div className="news-count-bar">
        <span>{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}</span>
        {searchQuery && <span style={{ color: 'var(--neut)' }}>· filtered by "{searchQuery}"</span>}
        {refreshedAt && <span>· {activeTab.label} market feed</span>}
      </div>

      {/* Body */}
      <div className="news-body" style={{ gridTemplateColumns: selectedArticle ? '1fr 340px' : '1fr' }}>

        {/* Articles Grid */}
        <div className="news-grid-wrap">
          {loading && articles.length === 0 ? (
            <div className="news-loading">
              <div className="sp-spinner" style={{ width: 20, height: 20 }} />
              <span>Fetching latest market news...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="news-loading">
              <div style={{ fontSize: 24, marginBottom: 8 }}>📭</div>
              <span>No articles found{searchQuery ? ` for "${searchQuery}"` : ''}</span>
            </div>
          ) : (
            <div className="news-grid">
              {filteredArticles.map((article, idx) => (
                <div
                  key={article.uuid}
                  className={`news-card${selectedArticle?.uuid === article.uuid ? ' selected' : ''}`}
                  onClick={() => setSelectedArticle(prev => prev?.uuid === article.uuid ? null : article)}
                  style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}
                >
                  {/* Thumbnail */}
                  {article.thumbnail && (
                    <div className="news-card-thumb">
                      <img
                        src={`/api/img?url=${encodeURIComponent(article.thumbnail)}`}
                        alt=""
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="news-card-body">
                    <div className="news-card-title">{article.title}</div>
                    <div className="news-card-meta">
                      <span className="news-card-pub">{article.publisher}</span>
                      <span className="news-card-time">{timeAgo(article.publishedAt)}</span>
                    </div>

                    {/* Related tickers */}
                    {article.relatedTickers.length > 0 && (
                      <div className="news-card-tickers">
                        {article.relatedTickers.filter(t => !t.startsWith('^')).slice(0, 5).map(t => (
                          <span key={t} className="news-ticker-chip" style={{
                            background: getTickerColor(t) + '18',
                            color: getTickerColor(t),
                            borderColor: getTickerColor(t) + '44',
                          }}>
                            {getTickerDisplay(t)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="news-card-arrow">›</div>
                </div>
              ))}
            </div>
          )}

          {/* Footer refresh button — visible after scrolling through all articles */}
          {filteredArticles.length > 0 && (
            <div className="news-refresh-footer">
              <button
                className="news-refresh-footer-btn"
                onClick={() => { fetchNews(market); setCountdown(REFRESH_INTERVAL); }}
                disabled={loading}
              >
                {loading ? '⟳ Fetching latest news...' : '↺ Load Fresh News'}
              </button>
              {refreshedAt && (
                <span style={{ fontSize: 9, color: 'var(--dim)' }}>Last updated {timeAgo(refreshedAt)}</span>
              )}
            </div>
          )}
        </div>

        {/* Article Detail Panel */}
        {selectedArticle && (
          <div className="news-detail">
            <div className="news-detail-inner">

              {/* Close button */}
              <button
                onClick={() => setSelectedArticle(null)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 4, fontFamily: 'var(--font)' }}
              >✕</button>

              {/* Thumbnail */}
              {selectedArticle.thumbnail && (
                <div className="news-detail-thumb">
                  <img
                    src={`/api/img?url=${encodeURIComponent(selectedArticle.thumbnail)}`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Title */}
              <div className="news-detail-title">{selectedArticle.title}</div>

              {/* Meta */}
              <div className="news-detail-meta">
                <span style={{ color: 'var(--bull)', fontWeight: 600 }}>{selectedArticle.publisher}</span>
                <span style={{ color: 'var(--muted)' }}>·</span>
                <span style={{ color: 'var(--muted)' }}>{formatExactTime(selectedArticle.publishedAt)}</span>
              </div>

              {/* Related Stocks */}
              {selectedArticle.relatedTickers.filter(t => !t.startsWith('^')).length > 0 && (
                <div className="news-detail-section">
                  <div className="news-detail-sec-title">Stocks Mentioned</div>
                  {quotesLoading ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 0', fontSize: 9, color: 'var(--muted)' }}>
                      <div className="sp-spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />
                      Fetching live prices...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedArticle.relatedTickers.filter(t => !t.startsWith('^')).slice(0, 8).map(ticker => {
                        const q = relatedQuotes[ticker];
                        const display = getTickerDisplay(ticker);
                        const col = getTickerColor(ticker);
                        const chgPct = q?.changePercent;
                        const priceColor = chgPct != null ? (chgPct >= 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text)';
                        return (
                          <Link
                            key={ticker}
                            href={`/stock/${encodeURIComponent(ticker)}`}
                            className="news-stock-row"
                          >
                            <span className="news-stock-sym" style={{ color: col }}>{display}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: 2, background: 'var(--dim)', borderRadius: 1, width: '100%' }}>
                                {chgPct != null && (
                                  <div style={{
                                    height: 2, borderRadius: 1,
                                    background: chgPct >= 0 ? 'var(--bull)' : 'var(--bear)',
                                    width: `${Math.min(100, Math.abs(chgPct) * 20)}%`,
                                    marginLeft: chgPct < 0 ? 'auto' : 0,
                                  }} />
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 70 }}>
                              <div style={{ fontSize: 10, color: priceColor, fontWeight: 500 }}>
                                {q?.price != null ? fmtPrice(q.price) : '—'}
                              </div>
                              {chgPct != null && (
                                <div style={{ fontSize: 8, color: priceColor }}>
                                  {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--dim)' }}>›</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Indices mentioned */}
              {selectedArticle.relatedTickers.filter(t => t.startsWith('^')).length > 0 && (
                <div className="news-detail-section">
                  <div className="news-detail-sec-title">Indices Referenced</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectedArticle.relatedTickers.filter(t => t.startsWith('^')).map(t => (
                      <span key={t} style={{
                        fontSize: 9, padding: '2px 8px',
                        background: '#5a7a9418', color: '#5a7a94',
                        border: '1px solid #5a7a9444',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* All related tickers raw */}
              {selectedArticle.relatedTickers.length === 0 && (
                <div className="news-detail-section" style={{ fontSize: 9, color: 'var(--muted)', fontStyle: 'italic' }}>
                  No specific stocks tagged in this article
                </div>
              )}

              {/* Open article button */}
              <a
                href={selectedArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="news-open-btn"
              >
                Read Full Article →
              </a>

              <div style={{ fontSize: 8, color: 'var(--dim)', marginTop: 6, textAlign: 'center' }}>
                Opens in new tab · Source: {selectedArticle.publisher}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
