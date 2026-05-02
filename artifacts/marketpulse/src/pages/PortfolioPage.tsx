import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';
import { usePortfolio } from '../hooks/usePortfolio';
import AllocationChart from '../components/AllocationChart';
import { searchStocks, StockEntry } from '../data/stockUniverse';
import Clock from '../components/Clock';

const MARKET_META: Record<string, { flag: string; label: string; currency: string; exchange: string }> = {
  IN: { flag: '🇮🇳', label: 'India', currency: '₹', exchange: 'NSE/BSE' },
  US: { flag: '🇺🇸', label: 'USA', currency: '$', exchange: 'NYSE/NASDAQ' },
  CN: { flag: '🇨🇳', label: 'China', currency: '¥', exchange: 'HK/ADR' },
  JP: { flag: '🇯🇵', label: 'Japan', currency: '¥', exchange: 'TSE' },
};

function fmt(n: number | null | undefined, currency = '', decimals = 2): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const prefix = currency;
  if (abs >= 1e7) return (n < 0 ? '-' : '') + prefix + (abs / 1e7).toFixed(2) + 'Cr';
  if (abs >= 1e5) return (n < 0 ? '-' : '') + prefix + (abs / 1e5).toFixed(2) + 'L';
  if (abs >= 1e9) return (n < 0 ? '-' : '') + prefix + (abs / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n < 0 ? '-' : '') + prefix + (abs / 1e6).toFixed(2) + 'M';
  return (n < 0 ? '-' + prefix : prefix) + abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtSimple(n: number | null | undefined, decimals = 2): string {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pnlColor(v: number | null) {
  if (v == null) return 'var(--muted)';
  return v > 0 ? 'var(--bull)' : v < 0 ? 'var(--bear)' : 'var(--muted)';
}

interface NewsItem { title: string; publisher: string; link: string; publishedAt: string | null }

export default function PortfolioPage() {
  const { holdings, enriched, quoteStatus, fetchQuotes, addHolding, removeHolding, summary } = usePortfolio();

  // ── Add form state ────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addMarket, setAddMarket] = useState('IN');
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<StockEntry[]>([]);
  const [addEntry, setAddEntry] = useState<StockEntry | null>(null);
  const [addShares, setAddShares] = useState('');
  const [addAvgCost, setAddAvgCost] = useState('');
  const [addHighlight, setAddHighlight] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Portfolio news ─────────────────────────────────────────────
  const [news, setNews] = useState<Record<string, NewsItem[]>>({});
  const [newsLoading, setNewsLoading] = useState(false);

  // ── Editing state ──────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editShares, setEditShares] = useState('');
  const [editCost, setEditCost] = useState('');

  const { updateShares, updateAvgCost } = usePortfolio();

  // Fetch news for top 4 portfolio stocks by value
  const fetchPortfolioNews = useCallback(async () => {
    const top = [...enriched]
      .sort((a, b) => (b.currentValue ?? b.costBasis) - (a.currentValue ?? a.costBasis))
      .slice(0, 4);
    if (top.length === 0) return;
    setNewsLoading(true);
    const results: Record<string, NewsItem[]> = {};
    await Promise.allSettled(top.map(async h => {
      try {
        const r = await fetch(`/api/stock/${encodeURIComponent(h.yahoo)}/detail`);
        const d = await r.json();
        results[h.yahoo] = (d.news ?? []).slice(0, 3);
      } catch { /* ignore */ }
    }));
    setNews(results);
    setNewsLoading(false);
  }, [enriched.length]);

  useEffect(() => { if (holdings.length > 0) fetchPortfolioNews(); }, [holdings.length]);

  // Search logic
  useEffect(() => {
    if (addQuery.length > 0 && !addEntry) {
      setAddResults(searchStocks(addMarket, addQuery, 8));
      setAddHighlight(0);
    } else {
      setAddResults([]);
    }
  }, [addQuery, addMarket, addEntry]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchInputRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
        setAddResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickEntry = (e: StockEntry) => {
    setAddEntry(e);
    setAddQuery(e.sym + ' — ' + e.name);
    setAddResults([]);
    setAddAvgCost('');
    setAddShares('');
  };

  const handleAddSubmit = () => {
    if (!addEntry || !addShares || !addAvgCost) return;
    const shares = parseFloat(addShares);
    const avgCost = parseFloat(addAvgCost);
    if (!shares || !avgCost || shares <= 0 || avgCost <= 0) return;
    const meta = MARKET_META[addMarket];
    addHolding({
      sym: addEntry.sym,
      yahoo: addEntry.yahoo,
      name: addEntry.name,
      marketId: addMarket,
      currency: meta.currency,
      sector: addEntry.sector,
      shares,
      avgCost,
    });
    // Reset form
    setAddEntry(null);
    setAddQuery('');
    setAddShares('');
    setAddAvgCost('');
    setAddOpen(false);
    setTimeout(fetchQuotes, 200);
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (addEntry) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setAddHighlight(h => Math.min(h + 1, addResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAddHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && addResults[addHighlight]) pickEntry(addResults[addHighlight]);
    else if (e.key === 'Escape') { setAddResults([]); setAddEntry(null); setAddQuery(''); }
  };

  // Top movers today
  const topMovers = [...enriched]
    .filter(h => h.changePercent != null)
    .sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0))
    .slice(0, 5);

  const bestPerformer = [...enriched].filter(h => h.pnlPct != null).sort((a, b) => (b.pnlPct ?? 0) - (a.pnlPct ?? 0))[0];
  const worstPerformer = [...enriched].filter(h => h.pnlPct != null).sort((a, b) => (a.pnlPct ?? 0) - (b.pnlPct ?? 0))[0];

  const allNews = Object.entries(news).flatMap(([yahoo, items]) => {
    const holding = holdings.find(h => h.yahoo === yahoo);
    return items.map(n => ({ ...n, sym: holding?.sym ?? yahoo }));
  }).sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

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

  return (
    <div className="port-page">

      {/* Header */}
      <div className="port-header">
        <Link href="/" className="sp-back">← Terminal</Link>
        <Link href="/news" className="sp-back" style={{ borderColor: '#a78bfa44', color: '#a78bfa' }}>📰 News</Link>
        <div className="port-hdr-divider" />
        <span className="port-title">📊 PORTFOLIO</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {quoteStatus === 'loading' && <span style={{ fontSize: 9, color: 'var(--neut)' }}>◌ REFRESHING</span>}
            {quoteStatus === 'live' && <span style={{ fontSize: 9, color: 'var(--bull)' }}><span className="session-dot" style={{ background: 'var(--bull)' }} />LIVE</span>}
            {quoteStatus === 'error' && <button onClick={fetchQuotes} style={{ background: 'none', border: 'none', color: 'var(--bear)', cursor: 'pointer', fontSize: 9, fontFamily: 'var(--font)' }}>⚠ RETRY</button>}
            {quoteStatus === 'idle' && holdings.length === 0 && <span style={{ fontSize: 9, color: 'var(--muted)' }}>No holdings yet</span>}
          </div>
          <Clock />
        </div>
      </div>

      {/* Summary Bar */}
      {holdings.length > 0 && (
        <div className="port-summary">
          <div className="port-sum-item">
            <span className="port-sum-lbl">Total Value</span>
            <span className="port-sum-val" style={{ color: 'var(--text)', fontSize: 15 }}>{fmt(summary.totalValue)}</span>
          </div>
          <div className="port-sum-divider" />
          <div className="port-sum-item">
            <span className="port-sum-lbl">Invested</span>
            <span className="port-sum-val">{fmt(summary.totalCost)}</span>
          </div>
          <div className="port-sum-divider" />
          <div className="port-sum-item">
            <span className="port-sum-lbl">Total P&L</span>
            <span className="port-sum-val" style={{ color: pnlColor(summary.totalPnl), fontSize: 14 }}>
              {summary.totalPnl >= 0 ? '+' : ''}{fmt(summary.totalPnl)}{' '}
              <span style={{ fontSize: 10 }}>({summary.totalReturn >= 0 ? '+' : ''}{summary.totalReturn.toFixed(2)}%)</span>
            </span>
          </div>
          <div className="port-sum-divider" />
          <div className="port-sum-item">
            <span className="port-sum-lbl">Today's P&L</span>
            <span className="port-sum-val" style={{ color: pnlColor(summary.totalDayPnl) }}>
              {summary.totalDayPnl >= 0 ? '+' : ''}{fmt(summary.totalDayPnl)}
            </span>
          </div>
          <div className="port-sum-divider" />
          <div className="port-sum-item">
            <span className="port-sum-lbl">Holdings</span>
            <span className="port-sum-val">{holdings.length} positions</span>
          </div>
          {bestPerformer && (
            <>
              <div className="port-sum-divider" />
              <div className="port-sum-item">
                <span className="port-sum-lbl">Best Performer</span>
                <span className="port-sum-val" style={{ color: 'var(--bull)' }}>
                  {bestPerformer.sym} +{bestPerformer.pnlPct?.toFixed(1)}%
                </span>
              </div>
            </>
          )}
          {worstPerformer && worstPerformer.id !== bestPerformer?.id && (
            <>
              <div className="port-sum-divider" />
              <div className="port-sum-item">
                <span className="port-sum-lbl">Worst Performer</span>
                <span className="port-sum-val" style={{ color: 'var(--bear)' }}>
                  {worstPerformer.sym} {worstPerformer.pnlPct?.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Body */}
      <div className="port-body">

        {/* LEFT: Add Form + Holdings Table */}
        <div className="port-main">

          {/* Add Position Bar */}
          <div className="port-add-bar">
            {!addOpen ? (
              <button onClick={() => { setAddOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="port-add-btn">
                ＋ Add Position
              </button>
            ) : (
              <div className="port-add-form">
                {/* Market selector */}
                <select
                  value={addMarket}
                  onChange={e => { setAddMarket(e.target.value); setAddEntry(null); setAddQuery(''); }}
                  className="port-select"
                >
                  {Object.entries(MARKET_META).map(([id, m]) => (
                    <option key={id} value={id}>{m.flag} {m.label}</option>
                  ))}
                </select>

                {/* Stock search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <input
                    ref={searchInputRef}
                    className="port-input"
                    placeholder={`Search ${MARKET_META[addMarket].label} stocks...`}
                    value={addQuery}
                    onChange={e => { setAddQuery(e.target.value); if (addEntry) setAddEntry(null); }}
                    onKeyDown={handleSearchKey}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ width: '100%' }}
                  />
                  {addResults.length > 0 && (
                    <div ref={dropdownRef} className="port-search-dropdown">
                      {addResults.map((r, i) => (
                        <div
                          key={r.yahoo}
                          className={`port-search-item${i === addHighlight ? ' highlighted' : ''}`}
                          onMouseEnter={() => setAddHighlight(i)}
                          onMouseDown={e => { e.preventDefault(); pickEntry(r); }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 11, color: '#7fb3d3', minWidth: 80 }}>{r.sym}</span>
                          <span style={{ fontSize: 10, color: 'var(--text)', flex: 1 }}>{r.name}</span>
                          <span style={{ fontSize: 8, color: 'var(--muted)' }}>{r.sector}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shares */}
                <input
                  type="number"
                  className="port-input port-input-sm"
                  placeholder="Qty"
                  value={addShares}
                  onChange={e => setAddShares(e.target.value)}
                  min="0"
                  step="1"
                />

                {/* Avg Cost */}
                <input
                  type="number"
                  className="port-input port-input-sm"
                  placeholder={`Avg Cost (${MARKET_META[addMarket].currency})`}
                  value={addAvgCost}
                  onChange={e => setAddAvgCost(e.target.value)}
                  min="0"
                  step="0.01"
                />

                <button
                  onClick={handleAddSubmit}
                  disabled={!addEntry || !addShares || !addAvgCost}
                  className="port-submit-btn"
                >
                  ＋ Add
                </button>
                <button onClick={() => { setAddOpen(false); setAddEntry(null); setAddQuery(''); setAddShares(''); setAddAvgCost(''); }} className="port-cancel-btn">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Holdings Table */}
          {holdings.length === 0 ? (
            <div className="port-empty">
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>Your portfolio is empty</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', maxWidth: 300, lineHeight: 1.6 }}>
                Add your first position above — select a market, search for any stock, enter your shares and average buy price.
              </div>
            </div>
          ) : (
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table className="port-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Stock</th>
                    <th>Shares</th>
                    <th>Avg Cost</th>
                    <th>Current Price</th>
                    <th>Market Value</th>
                    <th>P&amp;L (Overall)</th>
                    <th>Day P&amp;L</th>
                    <th>Allocation</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(h => {
                    const isEditing = editId === h.id;
                    const allocation = summary.totalValue > 0 ? ((h.currentValue ?? h.costBasis) / summary.totalValue * 100) : 0;
                    return (
                      <tr key={h.id} className="port-row">
                        <td>
                          <span style={{ fontSize: 12 }}>{MARKET_META[h.marketId]?.flag}</span>
                        </td>
                        <td>
                          <div>
                            <Link
                              href={`/stock/${encodeURIComponent(h.yahoo)}`}
                              style={{ fontWeight: 700, fontSize: 11, color: '#7fb3d3', textDecoration: 'none' }}
                            >
                              {h.sym}
                            </Link>
                            <div style={{ fontSize: 9, color: 'var(--muted)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                            <div style={{ fontSize: 8, color: '#3b7a9a', marginTop: 1 }}>{h.sector}</div>
                          </div>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="port-edit-input"
                              defaultValue={h.shares}
                              onBlur={e => { updateShares(h.id, parseFloat(e.target.value) || h.shares); }}
                            />
                          ) : (
                            <span
                              style={{ cursor: 'pointer', borderBottom: '1px dashed var(--dim)', paddingBottom: 1 }}
                              onClick={() => { setEditId(h.id); setEditShares(String(h.shares)); setEditCost(String(h.avgCost)); }}
                            >
                              {h.shares.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="port-edit-input"
                              defaultValue={h.avgCost}
                              onBlur={e => { updateAvgCost(h.id, parseFloat(e.target.value) || h.avgCost); setEditId(null); }}
                            />
                          ) : (
                            <span
                              style={{ cursor: 'pointer', borderBottom: '1px dashed var(--dim)', paddingBottom: 1 }}
                              onClick={() => { setEditId(h.id); }}
                            >
                              {h.currency}{fmtSimple(h.avgCost)}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ color: (h.changePercent ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                            {h.currentPrice != null ? `${h.currency}${fmtSimple(h.currentPrice)}` : '—'}
                          </div>
                          {h.changePercent != null && (
                            <div style={{ fontSize: 9, color: (h.changePercent ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                              {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {h.currentValue != null ? fmt(h.currentValue, h.currency) : fmt(h.costBasis, h.currency)}
                        </td>
                        <td>
                          <div style={{ color: pnlColor(h.pnl), fontWeight: 500 }}>
                            {h.pnl != null ? `${h.pnl >= 0 ? '+' : ''}${fmt(h.pnl, h.currency)}` : '—'}
                          </div>
                          {h.pnlPct != null && (
                            <div style={{ fontSize: 9, color: pnlColor(h.pnlPct) }}>
                              {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                            </div>
                          )}
                        </td>
                        <td style={{ color: pnlColor(h.dayPnl) }}>
                          {h.dayPnl != null ? `${h.dayPnl >= 0 ? '+' : ''}${fmt(h.dayPnl, h.currency)}` : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ flex: 1, background: 'var(--dim)', height: 4, borderRadius: 2, minWidth: 40 }}>
                              <div style={{ width: `${Math.min(100, allocation).toFixed(0)}%`, height: 4, background: '#3b9eff', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 9, color: 'var(--muted)', minWidth: 28, textAlign: 'right' }}>{allocation.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => removeHolding(h.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', fontFamily: 'var(--font)' }}
                            title="Remove holding"
                          >✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {holdings.length > 1 && (
                  <tfoot>
                    <tr className="port-total-row">
                      <td colSpan={2} style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Total</td>
                      <td />
                      <td />
                      <td />
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt(summary.totalValue)}</td>
                      <td>
                        <div style={{ color: pnlColor(summary.totalPnl), fontWeight: 600 }}>
                          {summary.totalPnl >= 0 ? '+' : ''}{fmt(summary.totalPnl)}
                        </div>
                        <div style={{ fontSize: 9, color: pnlColor(summary.totalReturn) }}>
                          {summary.totalReturn >= 0 ? '+' : ''}{summary.totalReturn.toFixed(2)}%
                        </div>
                      </td>
                      <td style={{ color: pnlColor(summary.totalDayPnl), fontWeight: 600 }}>
                        {summary.totalDayPnl >= 0 ? '+' : ''}{fmt(summary.totalDayPnl)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="port-sidebar">

          {/* Allocation Chart */}
          <div className="panel-hdr">Allocation
            <span style={{ fontSize: 8, color: 'var(--muted)' }}>by value</span>
          </div>
          <AllocationChart holdings={enriched} />

          {/* Today's Movers */}
          {topMovers.length > 0 && (
            <>
              <div className="panel-hdr" style={{ marginTop: 1 }}>Today's Movers</div>
              <div style={{ padding: '4px 0' }}>
                {topMovers.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                    <span style={{ fontSize: 10 }}>{MARKET_META[h.marketId]?.flag}</span>
                    <Link href={`/stock/${encodeURIComponent(h.yahoo)}`} style={{ fontWeight: 600, fontSize: 10, color: '#7fb3d3', flex: 1, textDecoration: 'none' }}>
                      {h.sym}
                    </Link>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: (h.changePercent ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 500 }}>
                        {(h.changePercent ?? 0) >= 0 ? '+' : ''}{h.changePercent?.toFixed(2) ?? '—'}%
                      </div>
                      {h.dayPnl != null && (
                        <div style={{ fontSize: 9, color: pnlColor(h.dayPnl) }}>
                          {h.dayPnl >= 0 ? '+' : ''}{fmt(h.dayPnl, h.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Portfolio News */}
          <div className="panel-hdr" style={{ marginTop: 1 }}>
            Portfolio News
            <span style={{ fontSize: 8, color: 'var(--muted)' }}>top holdings</span>
          </div>
          {holdings.length === 0 ? (
            <div style={{ padding: 12, fontSize: 9, color: 'var(--muted)' }}>Add holdings to see relevant news</div>
          ) : newsLoading ? (
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="sp-spinner" />
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>Loading news...</span>
            </div>
          ) : allNews.length === 0 ? (
            <div style={{ padding: 12, fontSize: 9, color: 'var(--muted)' }}>No news available right now</div>
          ) : (
            allNews.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="port-news-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, color: 'var(--bull)', fontWeight: 600 }}>{n.sym}</span>
                  <span style={{ fontSize: 8, color: 'var(--muted)' }}>{timeAgo(n.publishedAt)}</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--text)', lineHeight: 1.4, fontFamily: 'var(--sans)' }}>{n.title}</div>
                <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 2 }}>{n.publisher}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
