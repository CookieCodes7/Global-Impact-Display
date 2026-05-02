import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import SparkChart from '../components/SparkChart';
import WorldMap from '../components/WorldMap';
import Clock from '../components/Clock';
import MarketSwitcher from '../components/MarketSwitcher';
import StockSearch from '../components/StockSearch';
import { useIsMobile } from '../hooks/use-mobile';
import { MARKETS, COUNTRY_DATA, Stock } from '../data';
import { useRealTimeQuotes, QuoteResult, DEFAULT_YAHOO_SYMBOLS } from '../hooks/useRealTimeQuotes';
import { StockEntry } from '../data/stockUniverse';

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

const MARKET_ACCENT: Record<string, string> = {
  IN: '#ff9933', US: '#3b9eff', CN: '#ff4d4f', JP: '#ff6b6b',
};

function fmtVol(v: number | null): string {
  if (!v) return '—';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}

function makeDefaultStocks(mId: string): Stock[] {
  return MARKETS[mId].stocks.map(s => ({ ...s }));
}

function makeDefaultWatchlist(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [mId, syms] of Object.entries(DEFAULT_YAHOO_SYMBOLS)) {
    result[mId] = { ...syms };
  }
  return result;
}

function UserBadge() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const handleLogout = () => { logout(); navigate('/landing'); };
  return (
    <div style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, background: '#1c2530',
          border: '1px solid #1e2d3d', borderRadius: 6, padding: '5px 10px',
          cursor: 'pointer', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12,
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: '50%', background: '#3b9eff22',
          border: '1.5px solid #3b9eff66', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#3b9eff', fontWeight: 600, fontSize: 11, flexShrink: 0,
        }}>{user.initials}</span>
        <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
            background: '#111820', border: '1px solid #1e2d3d', borderRadius: 8,
            minWidth: 170, boxShadow: '0 8px 32px #0008', padding: '6px 0',
          }}>
            <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #1e2d3d' }}>
              <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none',
                border: 'none', color: 'var(--bear)', fontFamily: 'var(--font)', fontSize: 12,
                cursor: 'pointer', letterSpacing: 0.5,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ff4d4f12')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              ⏻ Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Terminal() {
  // ── State ──────────────────────────────────────────────────────────────────
  const isMobile = useIsMobile();
  const [activeMarket, setActiveMarket] = useState('IN');
  const [mobilePanel, setMobilePanel] = useState<'watch' | 'chart' | 'info'>('chart');

  // stocksByMarket: marketId → Stock[]
  const [stocksByMarket, setStocksByMarket] = useState<Record<string, Stock[]>>(() =>
    ({ IN: makeDefaultStocks('IN'), US: makeDefaultStocks('US'), CN: makeDefaultStocks('CN'), JP: makeDefaultStocks('JP') })
  );

  // watchlistSymbols: marketId → { ourSym: yahooSym }
  const [watchlistSymbols, setWatchlistSymbols] = useState<Record<string, Record<string, string>>>(
    makeDefaultWatchlist
  );

  const [activeIdxByMarket, setActiveIdxByMarket] = useState<Record<string, number>>({ IN: 0, US: 0, CN: 0, JP: 0 });
  const [liveQuotes, setLiveQuotes] = useState<Record<string, QuoteResult>>({});
  const [liveIndices, setLiveIndices] = useState<Record<string, QuoteResult>>({});
  const [quoteStatus, setQuoteStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);

  // ── Resizable panels ───────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(180);
  const [rightWidth, setRightWidth] = useState(220);
  const dragging = useRef<null | { side: 'left' | 'right'; startX: number; startW: number }>(null);

  const onResizeMouseDown = useCallback((side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { side, startX: e.clientX, startW: side === 'left' ? leftWidth : rightWidth };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - dragging.current.startX;
      if (dragging.current.side === 'left') {
        setLeftWidth(Math.min(360, Math.max(140, dragging.current.startW + delta)));
      } else {
        setRightWidth(Math.min(400, Math.max(160, dragging.current.startW - delta)));
      }
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [leftWidth, rightWidth]);

  // ── Live AI analysis cache ─────────────────────────────────────────────────
  const [analysisCache, setAnalysisCache] = useState<Record<string, {
    sig: string; conf: number; target: number; reasoning: string; loaded: boolean;
  }>>({});
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const market = MARKETS[activeMarket];
  const stocks = stocksByMarket[activeMarket];
  const activeIdx = Math.min(activeIdxByMarket[activeMarket], stocks.length - 1);
  const activeStock = stocks[activeIdx] ?? stocks[0];
  const accentCol = MARKET_ACCENT[activeMarket];

  // Flat watchlist symbol map for the hook: "marketId:ourSym" → yahooSym
  const flatWatchlist = useMemo(() => {
    const flat: Record<string, string> = {};
    for (const [mId, syms] of Object.entries(watchlistSymbols)) {
      for (const [ourSym, yahooSym] of Object.entries(syms)) {
        flat[`${mId}:${ourSym}`] = yahooSym;
      }
    }
    return flat;
  }, [watchlistSymbols]);

  // ── Real-time quote update handler ─────────────────────────────────────────
  const handleQuoteUpdate = useCallback(
    (stockMap: Record<string, QuoteResult>, indexMap: Record<string, QuoteResult>) => {
      setLiveQuotes(stockMap);
      setLiveIndices(indexMap);
      setQuoteStatus('live');

      setStocksByMarket(prev => {
        const next: Record<string, Stock[]> = {};
        for (const [mId, mStocks] of Object.entries(prev)) {
          next[mId] = mStocks.map(s => {
            const q = stockMap[`${mId}:${s.sym}`];
            if (!q || q.error || q.price === null) return s;
            return {
              ...s,
              price: q.price,
              chg: q.change ?? s.chg,
              chgP: q.changePercent ?? s.chgP,
              vol: fmtVol(q.volume),
              pe: q.trailingPE ? q.trailingPE.toFixed(1) : s.pe,
            };
          });
        }
        return next;
      });
    },
    []
  );

  const refetch = useRealTimeQuotes(flatWatchlist, handleQuoteUpdate, 45000);

  // Error timer — if no data after 12s, show retry
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    errorTimerRef.current = setTimeout(() => {
      setQuoteStatus(s => s === 'loading' ? 'error' : s);
    }, 12000);
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, []);

  const handleCountryClick = useCallback((id: number) => setSelectedCountry(id), []);

  // ── Add stock from search ──────────────────────────────────────────────────
  const handleAddStock = useCallback((entry: StockEntry) => {
    const mId = activeMarket;

    // Don't add duplicate
    if (watchlistSymbols[mId]?.[entry.sym]) {
      // If already in list, just select it
      setStocksByMarket(prev => {
        const idx = prev[mId].findIndex(s => s.sym === entry.sym);
        if (idx >= 0) setActiveIdxByMarket(p => ({ ...p, [mId]: idx }));
        return prev;
      });
      return;
    }

    // Build new Stock entry with placeholder price (will be updated on next fetch)
    const newStock: Stock = {
      sym: entry.sym,
      name: entry.name,
      price: 0,
      chg: 0,
      chgP: 0,
      sig: 'NEUT',
      conf: 50,
      target: 0,
      days: 7,
      vol: '—',
      pe: '—',
    };

    // Add to stocks list
    setStocksByMarket(prev => {
      const updated = [...prev[mId], newStock];
      return { ...prev, [mId]: updated };
    });

    // Register yahoo symbol for live fetching
    setWatchlistSymbols(prev => ({
      ...prev,
      [mId]: { ...prev[mId], [entry.sym]: entry.yahoo },
    }));

    // Select the newly added stock
    setStocksByMarket(prev => {
      const newIdx = prev[mId].length; // will be appended at this index
      setActiveIdxByMarket(p => ({ ...p, [mId]: newIdx }));
      return prev;
    });

    // Immediately fetch the price for this symbol
    setTimeout(() => refetch(), 100);
  }, [activeMarket, watchlistSymbols, refetch]);

  // ── Remove stock from watchlist ───────────────────────────────────────────
  const handleRemoveStock = useCallback((sym: string, idx: number) => {
    const mId = activeMarket;
    setStocksByMarket(prev => {
      const updated = prev[mId].filter((_, i) => i !== idx);
      return { ...prev, [mId]: updated };
    });
    setWatchlistSymbols(prev => {
      const { [sym]: _removed, ...rest } = prev[mId];
      return { ...prev, [mId]: rest };
    });
    setActiveIdxByMarket(prev => ({
      ...prev,
      [mId]: Math.max(0, Math.min(prev[mId], idx - 1)),
    }));
  }, [activeMarket]);

  // ── Fetch live AI analysis whenever active stock changes ───────────────────
  const activeYahoo = watchlistSymbols[activeMarket]?.[activeStock?.sym ?? ''];
  useEffect(() => {
    if (!activeYahoo) return;
    if (analysisCache[activeYahoo]?.loaded) return;
    let cancelled = false;
    setAnalysisLoading(true);
    fetch(`/api/stock/${encodeURIComponent(activeYahoo)}/analysis`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const sigMap: Record<string, string> = { BULLISH: 'BULL', BEARISH: 'BEAR', NEUTRAL: 'NEUT' };
        setAnalysisCache(prev => ({
          ...prev,
          [activeYahoo]: {
            sig: sigMap[data.signal] ?? 'NEUT',
            conf: typeof data.confidence === 'number' ? data.confidence : 50,
            target: typeof data.targetPrice === 'number' ? data.targetPrice : 0,
            reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
            loaded: true,
          },
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setAnalysisCache(prev => ({
            ...prev,
            [activeYahoo]: { sig: 'NEUT', conf: 50, target: 0, reasoning: '', loaded: true },
          }));
        }
      })
      .finally(() => { if (!cancelled) setAnalysisLoading(false); });
    return () => { cancelled = true; };
  }, [activeYahoo]);

  // ── Derived display values ─────────────────────────────────────────────────
  const liveAnalysis = activeYahoo ? analysisCache[activeYahoo] : null;
  const displaySig    = liveAnalysis?.sig ?? activeStock.sig;
  const displayConf   = liveAnalysis?.conf ?? activeStock.conf;
  const displayTarget = liveAnalysis?.target && liveAnalysis.target > 0 ? liveAnalysis.target : activeStock.target;
  const displayReasoning = liveAnalysis?.reasoning || market.aiExplains[activeStock.sym] || '';

  const country = selectedCountry ? COUNTRY_DATA[selectedCountry] : null;
  const countryCol = country ? getSignalColor(country.sig) : 'var(--bull)';
  const col = getSignalColor(displaySig);
  const upside = displayTarget > 0 && activeStock.price > 0
    ? ((displayTarget - activeStock.price) / activeStock.price * 100).toFixed(1)
    : '—';

  // Live index rows
  const liveIdxRows = market.indices.map((idx, i) => {
    const q = liveIndices[`${activeMarket}:${i}`];
    if (!q || q.price === null) return idx;
    const dir = (q.change ?? 0) >= 0 ? 1 : -1;
    const s = dir >= 0 ? '+' : '';
    return { ...idx, val: q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), chg: `${s}${(q.change ?? 0).toFixed(2)}`, chgP: `${s}${(q.changePercent ?? 0).toFixed(2)}%`, dir };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>

      {/* Ticker Bar */}
      <div id="ticker-bar">
        <div id="ticker-track">
          {[...stocks, ...stocks].map((s, i) => (
            <span key={i} className="tick-item">
              <span className="tick-sym">{s.sym.split('.')[0]}</span>
              <span className="tick-price">{s.price > 0 ? s.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</span>
              <span className={s.chg >= 0 ? 'tick-chg-up' : 'tick-chg-dn'}>
                {s.chg >= 0 ? '+' : ''}{Math.abs(s.chgP).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Market Switcher */}
      <MarketSwitcher
        activeMarket={activeMarket}
        onChange={id => { setActiveMarket(id); setSelectedCountry(null); }}
        liveIndices={liveIndices}
      />

      {/* Header */}
      <div className="mp-header">
        <Link href="/" className="mp-logo" style={{ color: accentCol }}>
          MARKET<span style={{ color: '#3b9eff' }}>PULSE</span>
        </Link>
        <Link href="/portfolio" className="mp-nav-btn" style={{ color: '#3b9eff', background: '#3b9eff18', border: '2px solid #3b9eff55' }}>
          📊 Portfolio
        </Link>
        <Link href="/news" className="mp-nav-btn" style={{ color: '#a78bfa', background: '#a78bfa18', border: '2px solid #a78bfa55' }}>
          📰 News
        </Link>
        <div className="mp-market-badge" style={{ fontSize: 12, color: accentCol, background: accentCol + '18', border: `1px solid ${accentCol}44`, padding: '6px 12px', letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {market.flag} {market.name} · {market.exchange}
        </div>

        {/* Smart stock search */}
        <StockSearch
          marketId={activeMarket}
          onSelect={handleAddStock}
          placeholder={`Search ${market.name} stocks...`}
        />

        <div className="hdr-stat">
          <span className="lbl">{market.benchmarkLabel}</span>
          <span className="val" style={{ color: accentCol }}>{liveIdxRows[0]?.val || market.benchmarkVal}</span>
        </div>
        <div className="hdr-stat">
          <span className="lbl">{market.vixLabel}</span>
          <span className="val" style={{ color: 'var(--neut)' }}>{market.vixVal}</span>
        </div>
        <div className="hdr-stat">
          <span className="lbl">Data</span>
          <span className="val">
            {quoteStatus === 'loading' && <span style={{ color: 'var(--neut)' }}>◌ LOADING</span>}
            {quoteStatus === 'live' && <span style={{ color: 'var(--bull)' }}><span className="session-dot" style={{ background: 'var(--bull)' }} />LIVE</span>}
            {quoteStatus === 'error' && <span style={{ color: 'var(--bear)', cursor: 'pointer' }} onClick={() => { setQuoteStatus('loading'); refetch(); }}>⚠ RETRY</span>}
          </span>
        </div>
        <Clock />
        <UserBadge />
      </div>

      {/* Main */}
      <div
        className={`mp-main mp-mobile-${mobilePanel}`}
        style={isMobile ? undefined : { gridTemplateColumns: `${leftWidth}px 4px 1fr 4px ${rightWidth}px` }}
      >

        {/* LEFT: Watchlist */}
        <div className="mp-left" style={{ zoom: Math.max(1, Math.min(1.6, leftWidth / 180)) }}>
          <div className="panel-hdr">
            {market.flag} Watchlist
            <span style={{ color: 'var(--muted)' }}>{stocks.length} stocks</span>
          </div>
          {stocks.map((s, i) => {
            const q = liveQuotes[`${activeMarket}:${s.sym}`];
            const price = (q?.price ?? s.price);
            const chgP = q?.changePercent ?? s.chgP;
            const chg = q?.change ?? s.chg;
            return (
              <div
                key={s.sym}
                className={`watch-item${i === activeIdx ? ' active' : ''}`}
                style={i === activeIdx ? { borderLeftColor: accentCol } : undefined}
                onClick={() => setActiveIdxByMarket(prev => ({ ...prev, [activeMarket]: i }))}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="w-sym" style={{ color: i === activeIdx ? accentCol : '#7fb3d3' }}>
                    {s.sym.split('.')[0]}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className={chg >= 0 ? 'bull' : 'bear'} style={{ fontSize: 11, fontWeight: 500 }}>
                      {price > 0 ? `${market.currency}${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveStock(s.sym, i); }}
                      title="Remove from watchlist"
                      style={{ background: 'none', border: 'none', color: '#2a3a4a', cursor: 'pointer', fontSize: 10, padding: '0 2px', lineHeight: 1, display: i === activeIdx ? 'block' : 'none' }}
                    >✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span className="w-name">{s.name.substring(0, 14)}</span>
                  <span className={chg >= 0 ? 'bull' : 'bear'} style={{ fontSize: 10 }}>
                    {price > 0 ? `${chg >= 0 ? '+' : ''}${chgP.toFixed(2)}%` : ''}
                  </span>
                </div>
              </div>
            );
          })}
          <div style={{ padding: '6px 10px', fontSize: 9, color: 'var(--muted)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            Search above to add more stocks
          </div>
        </div>

        {/* RESIZE HANDLE: left */}
        <div className="mp-resize-handle" onMouseDown={onResizeMouseDown('left')} title="Drag to resize watchlist" />

        {/* CENTER */}
        <div className="mp-center">
          {/* Indices */}
          <div className="indices-row">
            {liveIdxRows.map(idx => (
              <div key={idx.name} className="idx-card" style={{ borderTop: `2px solid ${idx.dir >= 0 ? 'var(--bull)' : 'var(--bear)'}` }}>
                <div className="idx-name">{idx.name}</div>
                <div className={`idx-val ${idx.dir >= 0 ? 'bull' : 'bear'}`}>{idx.val}</div>
                <div className={`idx-chg ${idx.dir >= 0 ? 'bull' : 'bear'}`}>{idx.chg} ({idx.chgP})</div>
              </div>
            ))}
          </div>

          {/* Stock Detail */}
          <div className="stock-detail-row">
            <div className="stock-info" style={{ borderLeft: `2px solid ${accentCol}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="stock-sym" style={{ color: accentCol }}>{activeStock.sym.split('.')[0]}</span>
                <span className="stock-name">{activeStock.name}</span>
                <span style={{ fontSize: 8, color: '#5a7a94', background: accentCol + '18', padding: '1px 6px', border: `1px solid ${accentCol}33` }}>{market.exchange}</span>
                {quoteStatus === 'live' && activeStock.price > 0 && (
                  <span style={{ fontSize: 8, color: 'var(--bull)', background: '#00ff9c11', padding: '1px 6px', border: '1px solid #00ff9c33' }}>● LIVE</span>
                )}
                {watchlistSymbols[activeMarket]?.[activeStock.sym] && (
                  <Link
                    href={`/stock/${encodeURIComponent(watchlistSymbols[activeMarket][activeStock.sym])}`}
                    style={{ marginLeft: 'auto', fontSize: 8, color: accentCol, background: accentCol + '18', border: `1px solid ${accentCol}44`, padding: '2px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
                  >
                    ⊞ Full Screen
                  </Link>
                )}
              </div>
              <div className={`stock-price ${activeStock.chg >= 0 ? 'bull' : 'bear'}`}>
                {activeStock.price > 0
                  ? `${market.currency}${activeStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : <span style={{ color: 'var(--muted)', fontSize: 16 }}>Loading...</span>}
              </div>
              <div className="stock-meta">
                <span>CHG: <b className={activeStock.chg >= 0 ? 'bull' : 'bear'}>{activeStock.chg >= 0 ? '+' : ''}{activeStock.chg.toFixed(2)} ({activeStock.chg >= 0 ? '+' : ''}{activeStock.chgP.toFixed(2)}%)</b></span>
                <span>VOL: {activeStock.vol}</span>
                <span>P/E: {activeStock.pe}</span>
              </div>
            </div>
          </div>

          <SparkChart stock={activeStock} currency={market.currency} />

          {/* AI Panel */}
          <div className="ai-panel-row">
            <div className="signal-card">
              <div className="signal-label">AI Signal</div>
              {analysisLoading && !liveAnalysis ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                  <div className="sp-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>Analyzing...</span>
                </div>
              ) : (
                <div className="signal-val" style={{ color: col }}>{getSignalLabel(displaySig)}</div>
              )}
              <div className="conf-bar-wrap">
                <div className="conf-bar" style={{ width: `${displayConf}%`, background: col }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>Confidence: {displayConf}%</div>
            </div>
            <div className="signal-card">
              <div className="signal-label">Target Price</div>
              {analysisLoading && !liveAnalysis ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
                  <div className="sp-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>Fetching...</span>
                </div>
              ) : (
                <div className="signal-val" style={{ color: col }}>
                  {displayTarget > 0 ? `${market.currency}${displayTarget.toLocaleString('en-IN')}` : '—'}
                </div>
              )}
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>
                {upside !== '—' ? `${Number(upside) > 0 ? '+' : ''}${upside}% · 7-day horizon` : 'Awaiting data'}
              </div>
            </div>
          </div>

          <div className="ai-explain">
            <strong>AI Reasoning Engine — {activeStock.sym.split('.')[0]} · {market.flag} {market.name}</strong>
            {analysisLoading && !liveAnalysis
              ? 'Analyzing real-time news, analyst consensus and technical indicators...'
              : displayReasoning || 'Analyzing market signals, news sentiment, and technical indicators for this stock...'}
          </div>

          {/* Map Section */}
          <div className="map-section">
            <div className="map-hdr">
              <span>Global Market Impact Map</span>
              <Link href="/map" className="map-link-btn">⊞ Full Screen</Link>
            </div>
            <WorldMap height={220} onCountryClick={handleCountryClick} />
          </div>

          {/* Country Panel */}
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
              <div className="cp-ai"><span style={{ color: '#5a7a94', fontSize: 9 }}>AI SUMMARY</span><br />{country.ai}</div>
            </div>
          )}

          {/* Correlation */}
          <div style={{ padding: 8, flexShrink: 0 }}>
            <div className="panel-hdr" style={{ marginBottom: 4 }}>News → Stock Correlation · {market.flag} {market.name}</div>
            {market.corr.map(c => {
              const abs = Math.abs(c.score);
              const ccol = c.dir >= 0 ? 'var(--bull)' : 'var(--bear)';
              return (
                <div key={c.sym} className="corr-item">
                  <span className="corr-sym">{c.sym.split('.')[0]}</span>
                  <div className="corr-bar-wrap"><div className="corr-bar" style={{ width: `${(abs * 100).toFixed(0)}%`, background: ccol }} /></div>
                  <span className="corr-val" style={{ color: ccol }}>{c.score > 0 ? '+' : ''}{c.score.toFixed(2)}</span>
                  <span className="corr-mentions">{(c.mentions / 1000).toFixed(1)}K ments</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESIZE HANDLE: right */}
        <div className="mp-resize-handle" onMouseDown={onResizeMouseDown('right')} title="Drag to resize news feed" />

        {/* RIGHT: News */}
        <div className="mp-right" style={{ zoom: Math.max(1, Math.min(1.6, rightWidth / 220)) }}>
          <div className="panel-hdr">{market.flag} {market.name} News Feed</div>
          {market.news.map((n, i) => (
            <div key={i} className="news-item">
              <div className="news-src"><span>{n.src}</span><span>{n.time}</span></div>
              <div className="news-title">{n.title}</div>
              <div className="news-tags">
                <span className="tag tag-ticker">{n.ticker.split('.')[0]}</span>
                <span className={`tag ${getSentClass(n.sent)}`}>{n.sent}</span>
                <span style={{ fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>Impact: {(n.impact * 10).toFixed(1)}</span>
              </div>
              <div className="impact-bar" style={{ width: `${(n.impact * 100).toFixed(0)}%`, background: getSentColor(n.sent) }} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mp-mobile-nav">
        <button className={`mob-nav-btn${mobilePanel === 'watch' ? ' active' : ''}`} onClick={() => setMobilePanel('watch')}>
          <span className="mob-nav-icon">📋</span>
          <span className="mob-nav-label">Watch</span>
        </button>
        <button className={`mob-nav-btn${mobilePanel === 'chart' ? ' active' : ''}`} onClick={() => setMobilePanel('chart')}>
          <span className="mob-nav-icon">📈</span>
          <span className="mob-nav-label">Chart</span>
        </button>
        <button className={`mob-nav-btn${mobilePanel === 'info' ? ' active' : ''}`} onClick={() => setMobilePanel('info')}>
          <span className="mob-nav-icon">📡</span>
          <span className="mob-nav-label">Feed</span>
        </button>
        <Link href="/portfolio" className="mob-nav-btn mob-nav-link">
          <span className="mob-nav-icon">📊</span>
          <span className="mob-nav-label">Portfolio</span>
        </Link>
        <Link href="/news" className="mob-nav-btn mob-nav-link">
          <span className="mob-nav-icon">🗞️</span>
          <span className="mob-nav-label">News</span>
        </Link>
      </nav>
    </div>
  );
}
