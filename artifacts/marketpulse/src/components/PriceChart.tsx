import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, ColorType, UTCTimestamp, IChartApi,
  CandlestickSeries, AreaSeries, HistogramSeries,
} from 'lightweight-charts';

type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };
type ChartType = 'line' | 'candle';

const PERIODS = [
  { key: '1d',  label: '1D' },
  { key: '7d',  label: '7D' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y',  label: '1Y' },
  { key: '5y',  label: '5Y' },
];

interface PriceChartProps {
  yahooSym: string;
  currentPrice: number;
  currency: string;
  accentColor?: string;
  height?: number;
  showPeriodSelector?: boolean;
  defaultPeriod?: string;
  onPeriodChange?: (period: string) => void;
}

export default function PriceChart({
  yahooSym, currentPrice, currency, accentColor = '#3b9eff',
  height = 200, showPeriodSelector = true, defaultPeriod = '1mo',
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [period, setPeriod] = useState(defaultPeriod);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState(false);

  const fetchHistory = useCallback(async (p: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(yahooSym)}/history?period=${p}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setCandles(data.candles ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [yahooSym]);

  useEffect(() => { fetchHistory(period); }, [period, fetchHistory]);

  useEffect(() => {
    if (!containerRef.current || loading || candles.length === 0) return;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const container = containerRef.current;
    const closes = candles.map(c => c.close);
    const first = closes[0] ?? currentPrice;
    const last = closes[closes.length - 1] ?? currentPrice;
    const isUp = last >= first;
    const lineCol = isUp ? '#00ff9c' : '#ff4d4f';
    const effectiveAccent = accentColor === '#3b9eff' ? lineCol : accentColor;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#5a7a94',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 9,
      },
      grid: {
        vertLines: { color: '#0f1922' },
        horzLines: { color: '#1a2533' },
      },
      crosshair: {
        vertLine: { color: '#3a5a74', labelBackgroundColor: '#0d1b2a' },
        horzLine: { color: '#3a5a74', labelBackgroundColor: '#0d1b2a' },
      },
      rightPriceScale: { borderColor: '#1a2533' },
      timeScale: {
        borderColor: '#1a2533',
        timeVisible: period === '1d' || period === '7d',
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width: container.offsetWidth,
      height,
    });

    chartRef.current = chart;
    const toTime = (d: string) => (new Date(d).getTime() / 1000) as UTCTimestamp;

    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff9c',
        downColor: '#ff4d4f',
        borderUpColor: '#00ff9c',
        borderDownColor: '#ff4d4f',
        wickUpColor: '#00ff9c',
        wickDownColor: '#ff4d4f',
        priceScaleId: 'right',
      });
      candleSeries.setData(candles.map(c => ({
        time: toTime(c.date),
        open: c.open, high: c.high, low: c.low, close: c.close,
      })));

      const volSeries = chart.addSeries(HistogramSeries, {
        color: '#2a3a4a',
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.02, bottom: 0.2 } });
      volSeries.setData(candles.map(c => ({
        time: toTime(c.date),
        value: c.volume,
        color: c.close >= c.open ? '#00ff9c22' : '#ff4d4f22',
      })));
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: effectiveAccent,
        topColor: effectiveAccent + '25',
        bottomColor: 'transparent',
        lineWidth: 1.5,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        crosshairMarkerBackgroundColor: effectiveAccent,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      areaSeries.setData(candles.map(c => ({ time: toTime(c.date), value: c.close })));
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.offsetWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [candles, loading, chartType, period, currentPrice, accentColor, height]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {showPeriodSelector && (
        <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                background: period === p.key ? accentColor + '20' : 'none',
                border: `1px solid ${period === p.key ? accentColor : 'transparent'}`,
                color: period === p.key ? accentColor : 'var(--muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10, padding: '2px 10px', cursor: 'pointer', borderRadius: 2,
                fontWeight: period === p.key ? 600 : 400, transition: 'all .1s',
              }}
            >{p.label}</button>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', gap: 0, border: '1px solid #1a2533', borderRadius: 2, overflow: 'hidden' }}>
            <button
              onClick={() => setChartType('line')}
              title="Line chart"
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
                padding: '2px 10px', cursor: 'pointer', border: 'none',
                background: chartType === 'line' ? '#3b9eff20' : 'transparent',
                color: chartType === 'line' ? '#3b9eff' : '#3a5a74',
                transition: 'all .1s',
              }}
            >╱ LINE</button>
            <button
              onClick={() => setChartType('candle')}
              title="Candlestick chart"
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700,
                padding: '2px 10px', cursor: 'pointer', border: 'none',
                borderLeft: '1px solid #1a2533',
                background: chartType === 'candle' ? '#f5c24220' : 'transparent',
                color: chartType === 'candle' ? '#f5c242' : '#3a5a74',
                transition: 'all .1s',
              }}
            >🕯 CANDLE</button>
          </div>
        </div>
      )}

      <div style={{ height, position: 'relative', background: 'var(--bg)' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 10, fontFamily: 'IBM Plex Mono', zIndex: 2 }}>
            Loading chart data...
          </div>
        )}
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bear)', fontSize: 10, fontFamily: 'IBM Plex Mono', zIndex: 2 }}>
            Chart data unavailable
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%', display: loading ? 'none' : 'block' }} />
      </div>
    </div>
  );
}
