import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import WorldMap from '../components/WorldMap';
import Clock from '../components/Clock';
import { COUNTRY_DATA } from '../data';

interface LiveIndex {
  sym: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

interface LiveNews {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  relatedTickers: string[];
  thumbnail: string | null;
}

interface LiveData {
  indices: LiveIndex[];
  news: LiveNews[];
  fetchedAt: string;
}

function relTime(iso: string | null): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function getSignalColor(sig: string) {
  return sig === 'BULL' ? 'var(--bull)' : sig === 'BEAR' ? 'var(--bear)' : 'var(--neut)';
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bull', label: 'Bullish' },
  { key: 'bear', label: 'Bearish' },
  { key: 'neut', label: 'Neutral' },
];

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const handleCountryClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setLiveData(null);
      setLiveError(null);
      return;
    }
    setLiveLoading(true);
    setLiveError(null);
    setLiveData(null);
    fetch(`/api/map/country?id=${selectedId}`)
      .then(r => r.json())
      .then((d: LiveData) => { setLiveData(d); setLiveLoading(false); })
      .catch(() => { setLiveError('Failed to load live data'); setLiveLoading(false); });
  }, [selectedId]);

  const country = selectedId ? COUNTRY_DATA[selectedId] : null;
  const countryCol = country ? getSignalColor(country.sig) : 'var(--bull)';
  const scoreAbs = country ? Math.abs(country.score) : 0;

  const filteredEntries = Object.entries(COUNTRY_DATA).filter(([, cd]) => {
    if (activeFilter === 'bull') return cd.sig === 'BULL';
    if (activeFilter === 'bear') return cd.sig === 'BEAR';
    if (activeFilter === 'neut') return cd.sig === 'NEUT';
    return true;
  });

  const stats = {
    bull: Object.values(COUNTRY_DATA).filter(c => c.sig === 'BULL').length,
    bear: Object.values(COUNTRY_DATA).filter(c => c.sig === 'BEAR').length,
    neut: Object.values(COUNTRY_DATA).filter(c => c.sig === 'NEUT').length,
    total: Object.values(COUNTRY_DATA).length,
  };

  const primaryIndex = liveData?.indices?.[0] ?? null;

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-page-header">
        <Link href="/" className="map-page-back">← Terminal</Link>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        <span className="map-page-title">Global Market Impact Map</span>

        <div style={{ display: 'flex', gap: 16, marginLeft: 24 }}>
          <div className="hdr-stat">
            <span className="lbl">Bullish</span>
            <span className="val bull">{stats.bull} / {stats.total}</span>
          </div>
          <div className="hdr-stat">
            <span className="lbl">Bearish</span>
            <span className="val bear">{stats.bear} / {stats.total}</span>
          </div>
          <div className="hdr-stat">
            <span className="lbl">Neutral</span>
            <span className="val neut">{stats.neut} / {stats.total}</span>
          </div>
          <div className="hdr-stat">
            <span className="lbl">Session</span>
            <span className="val"><span className="session-dot" />LIVE</span>
          </div>
        </div>
        <Clock />
      </div>

      {/* Filters */}
      <div className="map-filters">
        <span className="map-filters-label">Filter:</span>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn${activeFilter === f.key ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        {selectedId && (
          <button
            className="filter-btn"
            style={{ marginLeft: 'auto', borderColor: 'var(--muted)', color: 'var(--muted)' }}
            onClick={() => setSelectedId(null)}
          >
            Clear Selection ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div className="map-body">
        {/* Map */}
        <div className="map-svg-area">
          <WorldMap fullScreen onCountryClick={handleCountryClick} />
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 20, background: 'rgba(11,15,20,0.85)', padding: '8px 14px', border: '1px solid var(--border)' }}>
            {[
              { c: '#006644', l: 'Strong Bull' },
              { c: '#008855', l: 'Bullish' },
              { c: '#cc2222', l: 'Bearish' },
              { c: '#991a1a', l: 'Strong Bear' },
              { c: '#665500', l: 'Neutral' },
              { c: '#1a2535', l: 'No Data' },
            ].map(item => (
              <div key={item.l} className="legend-item">
                <div className="legend-dot" style={{ background: item.c }} />
                {item.l}
              </div>
            ))}
          </div>
          {/* Hover hint */}
          {!selectedId && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(11,15,20,0.7)', border: '1px solid var(--border)', padding: '4px 12px', fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Click a country to view live market data &amp; news
            </div>
          )}
          {/* Live index ticker strip on map when country selected */}
          {selectedId && liveData && liveData.indices.length > 0 && (
            <div className="map-index-strip">
              {liveData.indices.map(idx => (
                <div key={idx.sym} className="map-index-strip-item">
                  <span className="map-index-strip-label">{idx.label}</span>
                  <span className="map-index-strip-price">{fmtPrice(idx.price)}</span>
                  <span className={`map-index-strip-chg ${idx.changePercent >= 0 ? 'bull' : 'bear'}`}>
                    {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="map-side-panel">
          {!country ? (
            <>
              <div className="panel-hdr" style={{ padding: '10px 14px' }}>Country Intelligence</div>
              <div className="map-country-placeholder">
                Click any highlighted country to view live indices, real-time news, and AI market analysis.
              </div>

              <div style={{ borderTop: '1px solid var(--border)' }}>
                <div className="panel-hdr">Coverage ({filteredEntries.length})</div>
                {filteredEntries.map(([id, cd]) => {
                  const c = getSignalColor(cd.sig);
                  return (
                    <div
                      key={id}
                      style={{ padding: '7px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .15s' }}
                      onClick={() => setSelectedId(+id)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>{cd.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{cd.sector}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: c, fontWeight: 600 }}>
                          {cd.sig === 'BULL' ? '▲' : cd.sig === 'BEAR' ? '▼' : '●'} {cd.sig}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>{cd.trend} Score: <span style={{ color: c }}>{cd.score.toFixed(2)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="map-country-detail">
              {/* Header */}
              <div className="mcp-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="mcp-name">{country.name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      <span className="mcp-sig-badge" style={{ background: country.sig === 'BULL' ? 'rgba(0,255,156,0.12)' : country.sig === 'BEAR' ? 'rgba(255,77,79,0.12)' : 'rgba(245,200,66,0.12)', color: countryCol, border: `1px solid ${countryCol}` }}>
                        {country.sig === 'BULL' ? '▲ BULLISH' : country.sig === 'BEAR' ? '▼ BEARISH' : '● NEUTRAL'}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--muted)' }}>{country.sector}</span>
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font)', paddingLeft: 8 }} onClick={() => setSelectedId(null)}>✕</button>
                </div>

                {/* Primary index big display */}
                {liveLoading && (
                  <div className="mcp-live-loading">
                    <div className="mcp-spinner" />
                    <span>Fetching live data…</span>
                  </div>
                )}
                {liveError && !liveLoading && (
                  <div style={{ marginTop: 8, fontSize: 9, color: 'var(--bear)' }}>{liveError}</div>
                )}
                {primaryIndex && !liveLoading && (
                  <div className="mcp-primary-index">
                    <div className="mcp-primary-label">{primaryIndex.label}</div>
                    <div className="mcp-primary-price">{fmtPrice(primaryIndex.price)}</div>
                    <div className={`mcp-primary-chg ${primaryIndex.changePercent >= 0 ? 'bull' : 'bear'}`}>
                      {primaryIndex.change >= 0 ? '+' : ''}{primaryIndex.change.toFixed(2)}
                      {' '}
                      ({primaryIndex.changePercent >= 0 ? '+' : ''}{primaryIndex.changePercent.toFixed(2)}%)
                    </div>
                    {/* Performance bar */}
                    <div className="mcp-perf-bar-wrap">
                      <div className="mcp-perf-bar-track">
                        <div className="mcp-perf-bar-fill" style={{
                          width: `${Math.min(Math.abs(primaryIndex.changePercent) * 20, 100)}%`,
                          background: primaryIndex.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)',
                        }} />
                      </div>
                      <span className="mcp-perf-bar-label">Today's move</span>
                    </div>
                  </div>
                )}
              </div>

              {/* All Indices */}
              {liveData && liveData.indices.length > 0 && (
                <div className="mcp-section">
                  <div className="mcp-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Live Indices</span>
                    <span className="mcp-live-dot">● LIVE</span>
                  </div>
                  <div className="mcp-indices-grid">
                    {liveData.indices.map(idx => (
                      <div key={idx.sym} className="mcp-index-card">
                        <div className="mcp-index-label">{idx.label}</div>
                        <div className="mcp-index-price">{fmtPrice(idx.price)}</div>
                        <div className={`mcp-index-chg ${idx.changePercent >= 0 ? 'bull' : 'bear'}`}>
                          {idx.changePercent >= 0 ? '▲' : '▼'} {Math.abs(idx.changePercent).toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment metrics */}
              <div className="mcp-metrics">
                <div className="mcp-metric">
                  <div className="lbl">Sentiment Score</div>
                  <div className="val" style={{ color: countryCol }}>{country.score.toFixed(2)}</div>
                  <div className="mcp-score-bar-wrap">
                    <div className="mcp-score-bar" style={{ width: `${scoreAbs * 100}%`, background: countryCol }} />
                  </div>
                </div>
                <div className="mcp-metric">
                  <div className="lbl">Market Trend</div>
                  <div className="val" style={{ color: countryCol }}>{country.trend} {country.trend === '↑' ? 'Rising' : country.trend === '↓' ? 'Falling' : 'Stable'}</div>
                </div>
              </div>

              {/* Live News */}
              {liveLoading && (
                <div className="mcp-section">
                  <div className="mcp-section-title">Latest News</div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="mcp-news-skeleton" />
                  ))}
                </div>
              )}
              {liveData && liveData.news.length > 0 && (
                <div className="mcp-section">
                  <div className="mcp-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Latest News</span>
                    <span style={{ fontSize: 8, color: 'var(--muted)' }}>{liveData.news.length} articles</span>
                  </div>
                  {liveData.news.map(article => (
                    <a
                      key={article.uuid}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mcp-news-item"
                    >
                      <div className="mcp-news-meta">
                        <span className="mcp-news-pub">{article.publisher}</span>
                        <span className="mcp-news-time">{relTime(article.publishedAt)}</span>
                      </div>
                      <div className="mcp-news-title">{article.title}</div>
                      {article.relatedTickers.length > 0 && (
                        <div className="mcp-news-tickers">
                          {article.relatedTickers.slice(0, 3).map(t => (
                            <span key={t} className="mcp-news-ticker">{t}</span>
                          ))}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
              {liveData && liveData.news.length === 0 && !liveLoading && (
                <div className="mcp-section">
                  <div className="mcp-section-title">Latest News</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', padding: '8px 0' }}>No recent news available for this market.</div>
                </div>
              )}

              {/* AI Insight */}
              <div className="mcp-section">
                <div className="mcp-section-title">AI Market Insight</div>
                <div className="mcp-ai-text">{country.ai}</div>
              </div>

              {/* Signal Confidence */}
              <div className="mcp-section">
                <div className="mcp-section-title">Signal Analysis</div>
                {[
                  { label: 'Sentiment Intensity', val: scoreAbs },
                  { label: 'Signal Confidence', val: country.sig === 'NEUT' ? 0.45 : scoreAbs > 0.6 ? 0.9 : 0.65 },
                  { label: 'Data Coverage', val: 0.78 },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)', marginBottom: 3 }}>
                      <span>{row.label}</span>
                      <span style={{ color: 'var(--text)' }}>{(row.val * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--dim)', borderRadius: 2 }}>
                      <div style={{ height: 3, borderRadius: 2, width: `${(row.val * 100).toFixed(0)}%`, background: countryCol, transition: 'width .5s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {liveData && (
                <div style={{ padding: '8px 14px', fontSize: 8, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                  Data fetched {relTime(liveData.fetchedAt)}
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--bull)', fontSize: 8, cursor: 'pointer', fontFamily: 'var(--font)', marginLeft: 8 }}
                    onClick={() => {
                      if (!selectedId) return;
                      setLiveLoading(true);
                      setLiveData(null);
                      fetch(`/api/map/country?id=${selectedId}`)
                        .then(r => r.json())
                        .then((d: LiveData) => { setLiveData(d); setLiveLoading(false); })
                        .catch(() => { setLiveError('Failed to reload'); setLiveLoading(false); });
                    }}
                  >↺ Refresh</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
