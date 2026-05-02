import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import PriceChart from '../components/PriceChart';

interface StockDetail {
  quote: { symbol: string; price: number; change: number; changePercent: number; previousClose: number; open: number; dayHigh: number; dayLow: number; volume: number; currency: string; shortName: string; exchange: string; marketState: string };
  keyStats: { marketCap: number; pe: number; forwardPE: number; eps: number; beta: number; week52High: number; week52Low: number; avgVolume: number; dividendYield: number; bookValue: number; priceToBook: number };
  financials: { profitMargin: number; operatingMargin: number; returnOnEquity: number; returnOnAssets: number; debtToEquity: number; revenueGrowth: number; earningsGrowth: number; targetMeanPrice: number; targetHighPrice: number; targetLowPrice: number; numberOfAnalysts: number; recommendation: string };
  analysts: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; meanTarget: number; highTarget: number; lowTarget: number };
  news: { title: string; publisher: string; link: string; publishedAt: string | null }[];
}

interface Analysis {
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  targetPrice: number;
  targetCurrency: string;
  reasoning: string;
  catalysts: string[];
  risks: string[];
  sources: string[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  technicalNote: string;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function pct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(2) + '%';
}
function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

const SOURCE_COLORS: Record<string, string> = {
  'Reuters': '#ff9933', 'Bloomberg': '#4da6ff', 'NDTV Profit': '#ff6b6b',
  'Mint': '#00ff9c', 'Business Standard': '#f5c842', 'Economic Times': '#ff9933',
  'Livemint': '#00ff9c', 'The Hindu Business Line': '#7fb3d3', 'Moneycontrol': '#3b9eff',
  'CNBC': '#f5c842', 'MarketWatch': '#4da6ff', 'Yahoo Finance': '#7b61ff',
  'Barrons': '#ff9933', 'Wall Street Journal': '#e8d5b0', 'Financial Times': '#ff4d4f',
};
function srcColor(name: string): string {
  return SOURCE_COLORS[name] ?? '#7fb3d3';
}

export default function StockPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol ?? '');

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setDetailLoading(true);
    fetch(`/api/stock/${encodeURIComponent(symbol)}/detail`)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;
    setAnalysisLoading(true);
    setAnalysisError(false);
    fetch(`/api/stock/${encodeURIComponent(symbol)}/analysis`)
      .then(r => r.json())
      .then(d => { setAnalysis(d); setAnalysisLoading(false); })
      .catch(() => { setAnalysisError(true); setAnalysisLoading(false); });
  }, [symbol]);

  const q = detail?.quote;
  const ks = detail?.keyStats;
  const fin = detail?.financials;
  const an = detail?.analysts;
  const sig = analysis?.signal ?? 'NEUTRAL';
  const sigCol = sig === 'BULLISH' ? 'var(--bull)' : sig === 'BEARISH' ? 'var(--bear)' : 'var(--neut)';
  const currency = q?.currency ?? '$';
  const isUp = (q?.change ?? 0) >= 0;
  const totalAnalysts = (an?.strongBuy ?? 0) + (an?.buy ?? 0) + (an?.hold ?? 0) + (an?.sell ?? 0) + (an?.strongSell ?? 0);
  const buyCount = (an?.strongBuy ?? 0) + (an?.buy ?? 0);
  const sellCount = (an?.strongSell ?? 0) + (an?.sell ?? 0);

  const upside = q?.price && an?.meanTarget ? ((an.meanTarget - q.price) / q.price * 100) : null;

  return (
    <div className="sp-page">

      {/* Header */}
      <div className="sp-header">
        <Link href="/" className="sp-back">← Terminal</Link>
        <Link href="/portfolio" className="sp-back" style={{ borderColor: '#3b9eff44', color: '#3b9eff' }}>📊 Portfolio</Link>
        <Link href="/news" className="sp-back" style={{ borderColor: '#a78bfa44', color: '#a78bfa' }}>📰 News</Link>
        <div className="sp-hdr-divider" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sp-sym">{symbol.replace(/\.(NS|BO|T|HK)$/, '')}</span>
            {!detailLoading && q?.shortName && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--sans)' }}>{q.shortName}</span>
            )}
            {q?.exchange && (
              <span style={{ fontSize: 8, color: '#5a7a94', background: '#3b9eff18', border: '1px solid #3b9eff33', padding: '1px 6px' }}>{q.exchange}</span>
            )}
            {q?.marketState && (
              <span style={{ fontSize: 8, color: q.marketState === 'REGULAR' ? 'var(--bull)' : 'var(--neut)', background: q.marketState === 'REGULAR' ? '#00ff9c11' : '#f5c84211', border: `1px solid ${q.marketState === 'REGULAR' ? '#00ff9c33' : '#f5c84233'}`, padding: '1px 6px' }}>
                {q.marketState === 'REGULAR' ? '● LIVE' : '◎ ' + q.marketState}
              </span>
            )}
          </div>
          {q?.exchange && (
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>{q.exchange}</span>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {detailLoading ? (
            <span style={{ fontSize: 20, color: 'var(--muted)' }}>Loading...</span>
          ) : (
            <>
              <span style={{ fontSize: 22, fontWeight: 600, color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                {currency}{(q?.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 12, color: isUp ? 'var(--bull)' : 'var(--bear)', fontWeight: 500 }}>
                  {isUp ? '+' : ''}{(q?.change ?? 0).toFixed(2)} ({isUp ? '+' : ''}{(q?.changePercent ?? 0).toFixed(2)}%)
                </span>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                  O: {currency}{(q?.open ?? 0).toFixed(2)} · H: {currency}{(q?.dayHigh ?? 0).toFixed(2)} · L: {currency}{(q?.dayLow ?? 0).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="sp-body">

        {/* LEFT: Key Metrics */}
        <div className="sp-left">
          <div className="panel-hdr">Key Metrics</div>
          <div className="sp-metrics">
            {[
              ['Market Cap', ks?.marketCap != null ? currency + fmt(ks.marketCap) : '—'],
              ['P/E (TTM)', ks?.pe != null ? fmt(ks.pe, 2) : '—'],
              ['Forward P/E', ks?.forwardPE != null ? fmt(ks.forwardPE, 2) : '—'],
              ['P/B Ratio', ks?.priceToBook != null ? fmt(ks.priceToBook, 2) : '—'],
              ['EPS (TTM)', ks?.eps != null ? currency + fmt(ks.eps, 2) : '—'],
              ['Beta', ks?.beta != null ? fmt(ks.beta, 2) : '—'],
              ['52W High', ks?.week52High != null ? currency + fmt(ks.week52High, 2) : '—'],
              ['52W Low', ks?.week52Low != null ? currency + fmt(ks.week52Low, 2) : '—'],
              ['Avg Volume', ks?.avgVolume != null ? fmt(ks.avgVolume, 0) : '—'],
              ['Volume', q?.volume != null ? fmt(q.volume, 0) : '—'],
              ['Div Yield', ks?.dividendYield != null ? pct(ks.dividendYield) : '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} className="sp-metric-row">
                <span className="sp-metric-lbl">{lbl}</span>
                <span className="sp-metric-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="panel-hdr" style={{ marginTop: 1 }}>Financials</div>
          <div className="sp-metrics">
            {[
              ['Profit Margin', pct(fin?.profitMargin)],
              ['Operating Margin', pct(fin?.operatingMargin)],
              ['Return on Equity', pct(fin?.returnOnEquity)],
              ['Return on Assets', pct(fin?.returnOnAssets)],
              ['Debt/Equity', fin?.debtToEquity != null ? fmt(fin.debtToEquity, 2) : '—'],
              ['Rev Growth (YoY)', pct(fin?.revenueGrowth)],
              ['Earn Growth (YoY)', pct(fin?.earningsGrowth)],
            ].map(([lbl, val]) => (
              <div key={lbl} className="sp-metric-row">
                <span className="sp-metric-lbl">{lbl}</span>
                <span className="sp-metric-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Analyst Ratings */}
          <div className="panel-hdr" style={{ marginTop: 1 }}>Analyst Ratings
            {fin?.numberOfAnalysts != null && (
              <span style={{ fontSize: 8, color: 'var(--muted)' }}>{fin.numberOfAnalysts} analysts</span>
            )}
          </div>
          {totalAnalysts > 0 ? (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Strong Buy', count: an?.strongBuy ?? 0, col: 'var(--bull)' },
                { label: 'Buy', count: an?.buy ?? 0, col: '#5dde9f' },
                { label: 'Hold', count: an?.hold ?? 0, col: 'var(--neut)' },
                { label: 'Sell', count: an?.sell ?? 0, col: '#ff7b7b' },
                { label: 'Strong Sell', count: an?.strongSell ?? 0, col: 'var(--bear)' },
              ].map(({ label, count, col }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 68, fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, background: 'var(--dim)', height: 5, borderRadius: 2 }}>
                    <div style={{ width: `${(count / totalAnalysts * 100).toFixed(0)}%`, height: 5, background: col, borderRadius: 2 }} />
                  </div>
                  <span style={{ width: 18, fontSize: 9, color: col, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
              <div style={{ marginTop: 4, padding: '6px 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="sp-metric-row"><span className="sp-metric-lbl">Mean Target</span><span className="sp-metric-val" style={{ color: 'var(--bull)' }}>{an?.meanTarget ? currency + fmt(an.meanTarget, 2) : '—'}</span></div>
                <div className="sp-metric-row"><span className="sp-metric-lbl">High Target</span><span className="sp-metric-val">{an?.highTarget ? currency + fmt(an.highTarget, 2) : '—'}</span></div>
                <div className="sp-metric-row"><span className="sp-metric-lbl">Low Target</span><span className="sp-metric-val">{an?.lowTarget ? currency + fmt(an.lowTarget, 2) : '—'}</span></div>
                {upside != null && (
                  <div className="sp-metric-row">
                    <span className="sp-metric-lbl">Upside</span>
                    <span className="sp-metric-val" style={{ color: upside >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                      {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 10, fontSize: 9, color: 'var(--muted)' }}>
              {detailLoading ? 'Loading analyst data...' : 'No analyst data available'}
            </div>
          )}
        </div>

        {/* CENTER */}
        <div className="sp-center">
          {/* Price Chart */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', margin: '8px 8px 0' }}>
            <div className="panel-hdr">Price History</div>
            <PriceChart
              yahooSym={symbol}
              currentPrice={q?.price ?? 0}
              currency={currency}
              accentColor={isUp ? '#00ff9c' : '#ff4d4f'}
              height={220}
              showPeriodSelector={true}
              defaultPeriod="1mo"
            />
          </div>

          {/* AI Analysis */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', margin: 8 }}>
            <div className="panel-hdr">
              AI Analysis & Market Signal
              {analysis?.signal && (
                <span style={{ color: sigCol, fontWeight: 600 }}>
                  {sig === 'BULLISH' ? '▲' : sig === 'BEARISH' ? '▼' : '●'} {sig}
                </span>
              )}
            </div>

            {analysisLoading ? (
              <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="sp-spinner" />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Analyzing real-time news from Bloomberg, Reuters, Yahoo Finance...</span>
              </div>
            ) : analysisError ? (
              <div style={{ padding: 16, fontSize: 10, color: 'var(--bear)' }}>
                Analysis unavailable. Check your connection.
              </div>
            ) : analysis ? (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Signal + confidence */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: sigCol }}>
                      {sig === 'BULLISH' ? '▲' : sig === 'BEARISH' ? '▼' : '●'} {sig}
                    </span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, background: 'var(--dim)', height: 5, borderRadius: 2, width: 100 }}>
                        <div style={{ width: `${analysis.confidence}%`, height: 5, background: sigCol, borderRadius: 2, transition: 'width .5s' }} />
                      </div>
                      <span style={{ fontSize: 10, color: sigCol }}>{analysis.confidence}%</span>
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>AI Confidence</span>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Price Target (12M)</span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: sigCol }}>
                      {analysis.targetCurrency}{analysis.targetPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                    </span>
                    {q?.price && analysis.targetPrice && (
                      <span style={{ fontSize: 10, color: analysis.targetPrice >= q.price ? 'var(--bull)' : 'var(--bear)' }}>
                        {analysis.targetPrice >= q.price ? '+' : ''}{((analysis.targetPrice - q.price) / q.price * 100).toFixed(1)}% from current
                      </span>
                    )}
                  </div>
                  {analysis.technicalNote && (
                    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12, fontSize: 9, color: '#7fb3d3', lineHeight: 1.6, maxWidth: 200 }}>
                      <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }}>Technical</span>
                      {analysis.technicalNote}
                    </div>
                  )}
                </div>

                {/* Sentiment bar */}
                {analysis.sentimentBreakdown && (
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>News Sentiment Breakdown</span>
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${(analysis.sentimentBreakdown.positive * 100).toFixed(0)}%`, background: 'var(--bull)' }} />
                      <div style={{ width: `${(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}%`, background: 'var(--neut)' }} />
                      <div style={{ width: `${(analysis.sentimentBreakdown.negative * 100).toFixed(0)}%`, background: 'var(--bear)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 9, color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--bull)' }}>● Positive {(analysis.sentimentBreakdown.positive * 100).toFixed(0)}%</span>
                      <span style={{ color: 'var(--neut)' }}>● Neutral {(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}%</span>
                      <span style={{ color: 'var(--bear)' }}>● Negative {(analysis.sentimentBreakdown.negative * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                <div>
                  <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>AI Reasoning</span>
                  <p style={{ fontSize: 10, color: '#9ab5c8', lineHeight: 1.7, fontFamily: 'var(--sans)' }}>{analysis.reasoning}</p>
                </div>

                {/* Catalysts + Risks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>▲ Key Catalysts</span>
                    {(analysis.catalysts ?? []).map((c, i) => (
                      <div key={i} style={{ fontSize: 9, color: '#7fb3d3', padding: '2px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>· {c}</div>
                    ))}
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>▼ Key Risks</span>
                    {(analysis.risks ?? []).map((r, i) => (
                      <div key={i} style={{ fontSize: 9, color: '#7fb3d3', padding: '2px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>· {r}</div>
                    ))}
                  </div>
                </div>

                {/* Sources */}
                {analysis.sources && analysis.sources.length > 0 && (
                  <div>
                    <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Data Sources</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {analysis.sources.map((src, i) => (
                        <span key={i} style={{ fontSize: 8, padding: '2px 7px', border: `1px solid ${srcColor(src)}44`, color: srcColor(src), background: srcColor(src) + '11', borderRadius: 2 }}>
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* News Feed */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', margin: '0 8px 8px' }}>
            <div className="panel-hdr">
              Live News Feed
              <span style={{ fontSize: 8, color: 'var(--muted)' }}>via Yahoo Finance · Bloomberg · Reuters</span>
            </div>
            {detailLoading ? (
              <div style={{ padding: 16, fontSize: 10, color: 'var(--muted)' }}>Loading news...</div>
            ) : (detail?.news ?? []).length === 0 ? (
              <div style={{ padding: 16, fontSize: 10, color: 'var(--muted)' }}>No recent news available</div>
            ) : (
              detail?.news.map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="sp-news-item">
                  <div className="sp-news-src">
                    <span style={{ color: srcColor(n.publisher), fontWeight: 600 }}>{n.publisher}</span>
                    <span style={{ color: 'var(--muted)' }}>{timeAgo(n.publishedAt)}</span>
                  </div>
                  <div className="sp-news-title">{n.title}</div>
                  <div style={{ height: 2, background: srcColor(n.publisher) + '44', marginTop: 5, borderRadius: 1 }} />
                </a>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: AI Summary + Analyst */}
        <div className="sp-right">
          <div className="panel-hdr">AI Signal Summary</div>
          {analysisLoading ? (
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="sp-spinner" />
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>Analyzing...</span>
            </div>
          ) : analysis ? (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: sigCol }}>
                  {sig === 'BULLISH' ? '▲' : sig === 'BEARISH' ? '▼' : '●'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: sigCol, marginTop: 2 }}>{sig}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                  <div style={{ width: 80, background: 'var(--dim)', height: 4, borderRadius: 2 }}>
                    <div style={{ width: `${analysis.confidence}%`, height: 4, background: sigCol, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, color: sigCol }}>{analysis.confidence}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Price Target</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: sigCol }}>
                  {analysis.targetCurrency}{analysis.targetPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '—'}
                </span>
                {q?.price && analysis.targetPrice && (
                  <span style={{ fontSize: 9, color: analysis.targetPrice >= q.price ? 'var(--bull)' : 'var(--bear)' }}>
                    {analysis.targetPrice >= q.price ? '+' : ''}{((analysis.targetPrice - q.price) / q.price * 100).toFixed(1)}% upside
                  </span>
                )}
              </div>

              {(analysis.catalysts?.length ?? 0) > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span style={{ fontSize: 9, color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>▲ Catalysts</span>
                  {analysis.catalysts.map((c, i) => (
                    <div key={i} style={{ fontSize: 9, color: '#9ab5c8', padding: '3px 0', lineHeight: 1.4, borderBottom: '1px solid var(--border)' }}>· {c}</div>
                  ))}
                </div>
              )}
              {(analysis.risks?.length ?? 0) > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <span style={{ fontSize: 9, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>▼ Risks</span>
                  {analysis.risks.map((r, i) => (
                    <div key={i} style={{ fontSize: 9, color: '#9ab5c8', padding: '3px 0', lineHeight: 1.4, borderBottom: '1px solid var(--border)' }}>· {r}</div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Wall Street Consensus */}
          {!detailLoading && fin?.recommendation && (
            <>
              <div className="panel-hdr" style={{ marginTop: 1 }}>Wall St. Consensus</div>
              <div style={{ padding: 10 }}>
                <div style={{ textAlign: 'center', padding: '8px 0', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: fin.recommendation.includes('buy') || fin.recommendation.includes('Buy') ? 'var(--bull)' : fin.recommendation.includes('sell') || fin.recommendation.includes('Sell') ? 'var(--bear)' : 'var(--neut)' }}>
                    {fin.recommendation}
                  </span>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{fin.numberOfAnalysts ?? '—'} analyst opinions</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    ['Buy', currency + fmt(an?.meanTarget, 2), 'var(--bull)'],
                    ['High', currency + fmt(an?.highTarget, 2), '#5dde9f'],
                    ['Hold', buyCount + '/' + (an?.hold ?? 0) + '/' + sellCount, 'var(--neut)'],
                    ['Low', currency + fmt(an?.lowTarget, 2), 'var(--bear)'],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ background: 'var(--bg3)', padding: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 8, color: 'var(--muted)' }}>{lbl}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: col }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
