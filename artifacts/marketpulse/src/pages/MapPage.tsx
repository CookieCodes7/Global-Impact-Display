import { useState, useCallback } from 'react';
import { Link } from 'wouter';
import WorldMap from '../components/WorldMap';
import Clock from '../components/Clock';
import { COUNTRY_DATA } from '../data';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bull', label: 'Bullish' },
  { key: 'bear', label: 'Bearish' },
  { key: 'neut', label: 'Neutral' },
  { key: 'high', label: 'High Signal' },
  { key: 'tech', label: 'Tech' },
  { key: 'energy', label: 'Energy' },
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
];

function getSignalColor(sig: string) {
  return sig === 'BULL' ? 'var(--bull)' : sig === 'BEAR' ? 'var(--bear)' : 'var(--neut)';
}

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleCountryClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const country = selectedId ? COUNTRY_DATA[selectedId] : null;
  const countryCol = country ? getSignalColor(country.sig) : 'var(--bull)';
  const scoreAbs = country ? Math.abs(country.score) : 0;

  const stats = {
    bull: Object.values(COUNTRY_DATA).filter(c => c.sig === 'BULL').length,
    bear: Object.values(COUNTRY_DATA).filter(c => c.sig === 'BEAR').length,
    neut: Object.values(COUNTRY_DATA).filter(c => c.sig === 'NEUT').length,
    total: Object.values(COUNTRY_DATA).length,
  };

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
          {/* Full-screen legend overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 20, background: 'rgba(11,15,20,0.8)', padding: '8px 14px', border: '1px solid var(--border)' }}>
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
              Click a country to view details
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="map-side-panel">
          {!country ? (
            <>
              <div className="panel-hdr" style={{ padding: '10px 14px' }}>Country Intelligence</div>
              <div className="map-country-placeholder">
                Click any highlighted country on the map to view detailed market intelligence, sentiment scores, key headlines, and AI analysis.
              </div>

              {/* Quick country list */}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <div className="panel-hdr">All Coverage</div>
                {Object.entries(COUNTRY_DATA).map(([id, cd]) => {
                  const c = getSignalColor(cd.sig);
                  return (
                    <div
                      key={id}
                      style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .15s' }}
                      onClick={() => setSelectedId(+id)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>{cd.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>{cd.sector}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: c, fontWeight: 600 }}>{cd.sig} {cd.trend}</div>
                        <div style={{ fontSize: 9, color: c }}>{cd.score.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="map-country-detail">
              <div className="mcp-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="mcp-name">{country.name}</div>
                    <div className="mcp-signal" style={{ color: countryCol }}>{country.sig} {country.trend} · {country.sector}</div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font)' }}
                    onClick={() => setSelectedId(null)}
                  >✕</button>
                </div>
              </div>

              <div className="mcp-metrics">
                <div className="mcp-metric">
                  <div className="lbl">Sentiment Score</div>
                  <div className="val" style={{ color: countryCol }}>{country.score.toFixed(2)}</div>
                  <div className="mcp-score-bar-wrap">
                    <div className="mcp-score-bar" style={{ width: `${scoreAbs * 100}%`, background: countryCol }} />
                  </div>
                </div>
                <div className="mcp-metric">
                  <div className="lbl">Signal</div>
                  <div className="val" style={{ color: countryCol }}>
                    {country.sig === 'BULL' ? '▲' : country.sig === 'BEAR' ? '▼' : '●'} {country.sig}
                  </div>
                </div>
                <div className="mcp-metric">
                  <div className="lbl">Top Sector</div>
                  <div className="val" style={{ fontSize: 11 }}>{country.sector}</div>
                </div>
                <div className="mcp-metric">
                  <div className="lbl">Market Trend</div>
                  <div className="val" style={{ color: countryCol }}>{country.trend} {country.trend === '↑' ? 'Rising' : country.trend === '↓' ? 'Falling' : 'Stable'}</div>
                </div>
              </div>

              <div className="mcp-section">
                <div className="mcp-section-title">Key Headlines</div>
                {country.headlines.map((h, i) => (
                  <div key={i} className="mcp-headline">· {h}</div>
                ))}
              </div>

              <div className="mcp-section">
                <div className="mcp-section-title">AI Market Summary</div>
                <div className="mcp-ai-text">{country.ai}</div>
              </div>

              <div className="mcp-section">
                <div className="mcp-section-title">Signal Breakdown</div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
