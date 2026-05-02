import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import TickerBar from '../components/TickerBar';
import SparkChart from '../components/SparkChart';
import WorldMap from '../components/WorldMap';
import Clock from '../components/Clock';
import { STOCKS, INDICES, NEWS, CORR, COUNTRY_DATA, AI_EXPLAINS, Stock } from '../data';

function getSignalColor(sig: string) {
  return sig === 'BULL' ? 'var(--bull)' : sig === 'BEAR' ? 'var(--bear)' : 'var(--neut)';
}
function getSignalLabel(sig: string) {
  return sig === 'BULL' ? '▲ BULLISH' : sig === 'BEAR' ? '▼ BEARISH' : '● NEUTRAL';
}
function getSentClass(sent: string) {
  return sent === 'BULL' ? 'tag-bull' : sent === 'BEAR' ? 'tag-bear' : 'tag-neut';
}
function getSentColor(sent: string) {
  return sent === 'BULL' ? 'var(--bull)' : sent === 'BEAR' ? 'var(--bear)' : 'var(--neut)';
}

export default function Terminal() {
  const [stocks, setStocks] = useState(() => STOCKS.map(s => ({ ...s })));
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const activeStock = stocks[activeIdx];

  // Live price jitter
  useEffect(() => {
    const id = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const delta = s.price * (Math.random() - 0.499) * 0.002;
        return {
          ...s,
          price: +(s.price + delta).toFixed(2),
          chg: +(s.chg + delta * 0.1).toFixed(2),
          chgP: +(s.chgP + delta * 0.01).toFixed(2),
        };
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const addTicker = () => {
    const sym = prompt('Enter ticker symbol:');
    if (!sym) return;
    const newStock: Stock = {
      sym: sym.toUpperCase(), name: 'Custom',
      price: +(100 + Math.random() * 400).toFixed(2),
      chg: +(Math.random() * 10 - 5).toFixed(2),
      chgP: +(Math.random() * 5 - 2.5).toFixed(2),
      sig: ['BULL', 'BEAR', 'NEUT'][Math.floor(Math.random() * 3)],
      conf: 40 + Math.floor(Math.random() * 50),
      target: 100 + Math.floor(Math.random() * 400),
      days: 5, vol: '5.2M', pe: '22.1',
    };
    setStocks(prev => [...prev, newStock]);
  };

  const handleCountryClick = useCallback((id: number) => {
    setSelectedCountry(id);
  }, []);

  const country = selectedCountry ? COUNTRY_DATA[selectedCountry] : null;
  const countryCol = country ? getSignalColor(country.sig) : 'var(--bull)';
  const upside = ((activeStock.target - activeStock.price) / activeStock.price * 100).toFixed(1);
  const col = getSignalColor(activeStock.sig);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TickerBar />

      {/* Header */}
      <div className="mp-header">
        <Link href="/" className="mp-logo">MARKET<span>PULSE</span></Link>
        <input className="mp-search" type="text" placeholder="Search ticker / company..." />
        <div className="hdr-stat">
          <span className="lbl">S&amp;P 500</span>
          <span className="val bull">5,284.21</span>
        </div>
        <div className="hdr-stat">
          <span className="lbl">VIX</span>
          <span className="val" style={{ color: 'var(--neut)' }}>18.43</span>
        </div>
        <div className="hdr-stat">
          <span className="lbl">Session</span>
          <span className="val"><span className="session-dot" />LIVE</span>
        </div>
        <Clock />
      </div>

      {/* Main */}
      <div className="mp-main">
        {/* LEFT: Watchlist */}
        <div className="mp-left">
          <div className="panel-hdr">
            Watchlist
            <button onClick={addTicker}>+ ADD</button>
          </div>
          {stocks.map((s, i) => (
            <div
              key={s.sym}
              className={`watch-item${i === activeIdx ? ' active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="w-sym">{s.sym}</span>
                <span className={s.chg >= 0 ? 'bull' : 'bear'} style={{ fontSize: 12, fontWeight: 500 }}>${s.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span className="w-name">{s.name.substring(0, 14)}</span>
                <span className={s.chg >= 0 ? 'bull' : 'bear'} style={{ fontSize: 10 }}>{s.chg >= 0 ? '+' : ''}{s.chgP.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div className="mp-center">
          {/* Indices */}
          <div className="indices-row">
            {INDICES.map(idx => (
              <div key={idx.name} className="idx-card">
                <div className="idx-name">{idx.name}</div>
                <div className={`idx-val ${idx.dir >= 0 ? 'bull' : 'bear'}`}>{idx.val}</div>
                <div className={`idx-chg ${idx.dir >= 0 ? 'bull' : 'bear'}`}>{idx.chg} ({idx.chgP})</div>
              </div>
            ))}
          </div>

          {/* Stock Detail */}
          <div className="stock-detail-row">
            <div className="stock-info">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="stock-sym">{activeStock.sym}</span>
                <span className="stock-name">{activeStock.name}</span>
              </div>
              <div className={`stock-price ${activeStock.chg >= 0 ? 'bull' : 'bear'}`}>${activeStock.price.toFixed(2)}</div>
              <div className="stock-meta">
                <span>CHG: <b className={activeStock.chg >= 0 ? 'bull' : 'bear'}>{activeStock.chg >= 0 ? '+' : ''}{activeStock.chg.toFixed(2)} ({activeStock.chg >= 0 ? '+' : ''}{activeStock.chgP.toFixed(2)}%)</b></span>
                <span>VOL: {activeStock.vol}</span>
                <span>P/E: {activeStock.pe}</span>
              </div>
            </div>
          </div>

          {/* Spark Chart */}
          <SparkChart stock={activeStock} />

          {/* AI Panel */}
          <div className="ai-panel-row">
            <div className="signal-card">
              <div className="signal-label">AI Signal</div>
              <div className="signal-val" style={{ color: col }}>{getSignalLabel(activeStock.sig)}</div>
              <div className="conf-bar-wrap">
                <div className="conf-bar" style={{ width: `${activeStock.conf}%`, background: col }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>Confidence: {activeStock.conf}%</div>
            </div>
            <div className="signal-card">
              <div className="signal-label">Target Price</div>
              <div className="signal-val" style={{ color: col }}>${activeStock.target}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>{Number(upside) > 0 ? '+' : ''}{upside}% · {activeStock.days}-day horizon</div>
            </div>
          </div>

          <div className="ai-explain">
            <strong>AI Reasoning Engine — {activeStock.sym}</strong>
            {AI_EXPLAINS[activeStock.sym] || 'Analyzing sentiment signals across news and social media...'}
          </div>

          {/* Map Section (mini) */}
          <div className="map-section">
            <div className="map-hdr">
              <span>Global Market Impact Map</span>
              {(['all', 'high', 'tech', 'energy', '24h', '7d'] as const).map(f => (
                <button
                  key={f}
                  className={`filter-btn${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'high' ? 'High Signal' : f === 'tech' ? 'Tech' : f === 'energy' ? 'Energy' : f}
                </button>
              ))}
              <Link href="/map" className="map-link-btn">⊞ Full Screen</Link>
            </div>
            <WorldMap height={220} onCountryClick={handleCountryClick} />
          </div>

          {/* Country Panel (mini) */}
          {country && (
            <div className="country-panel visible" style={{ margin: '0 8px 8px' }}>
              <div className="cp-header">
                <span className="cp-name" style={{ color: countryCol }}>{country.name}</span>
                <button className="cp-close" onClick={() => setSelectedCountry(null)}>✕</button>
              </div>
              <div className="cp-grid">
                <div className="cp-metric"><div className="lbl">Sentiment Score</div><div className="val" style={{ color: countryCol }}>{country.score.toFixed(2)}</div></div>
                <div className="cp-metric"><div className="lbl">Signal</div><div className="val" style={{ color: countryCol }}>{country.sig}</div></div>
                <div className="cp-metric"><div className="lbl">Top Sector</div><div className="val">{country.sector}</div></div>
                <div className="cp-metric"><div className="lbl">Trend</div><div className="val" style={{ color: countryCol }}>{country.trend}</div></div>
              </div>
              <div className="cp-headlines">
                <b style={{ color: '#5a7a94', fontSize: 9 }}>KEY HEADLINES</b><br />
                {country.headlines.map((h, i) => <span key={i}>· {h}<br /></span>)}
              </div>
              <div className="cp-ai">
                <span style={{ color: '#5a7a94', fontSize: 9 }}>AI SUMMARY</span><br />
                {country.ai}
              </div>
            </div>
          )}

          {/* Correlation */}
          <div style={{ padding: 8, flexShrink: 0 }}>
            <div className="panel-hdr" style={{ marginBottom: 4 }}>News → Stock Correlation</div>
            {CORR.map(c => {
              const abs = Math.abs(c.score);
              const ccol = c.dir >= 0 ? 'var(--bull)' : 'var(--bear)';
              return (
                <div key={c.sym} className="corr-item">
                  <span className="corr-sym">{c.sym}</span>
                  <div className="corr-bar-wrap">
                    <div className="corr-bar" style={{ width: `${(abs * 100).toFixed(0)}%`, background: ccol }} />
                  </div>
                  <span className="corr-val" style={{ color: ccol }}>{c.score > 0 ? '+' : ''}{c.score.toFixed(2)}</span>
                  <span className="corr-mentions">{(c.mentions / 1000).toFixed(1)}K ments</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: News */}
        <div className="mp-right">
          <div className="panel-hdr">Market News Feed</div>
          {NEWS.map((n, i) => (
            <div key={i} className="news-item">
              <div className="news-src"><span>{n.src}</span><span>{n.time}</span></div>
              <div className="news-title">{n.title}</div>
              <div className="news-tags">
                <span className={`tag tag-ticker`}>{n.ticker}</span>
                <span className={`tag ${getSentClass(n.sent)}`}>{n.sent}</span>
                <span style={{ fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>Impact: {(n.impact * 10).toFixed(1)}</span>
              </div>
              <div className="impact-bar" style={{ width: `${(n.impact * 100).toFixed(0)}%`, background: getSentColor(n.sent) }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
