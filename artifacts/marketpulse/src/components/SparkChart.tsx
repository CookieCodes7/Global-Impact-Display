import { useEffect, useRef, useState, useCallback } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import {
  createChart, ColorType, UTCTimestamp, IChartApi,
  CandlestickSeries, HistogramSeries,
} from 'lightweight-charts';
import { Stock } from '../data';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const CHART_HEIGHT = 140;

type ChartMode = 'line' | 'candle';
type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };

interface SparkChartProps {
  stock: Stock;
  currency?: string;
  yahooSym?: string;
  /** Controlled mode — passed from parent. If omitted the component manages its own state. */
  mode?: ChartMode;
}

export default function SparkChart({ stock, currency = '₹', yahooSym, mode: modeProp }: SparkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candleContainerRef = useRef<HTMLDivElement>(null);
  const chartJsRef = useRef<Chart | null>(null);
  const lwChartRef = useRef<IChartApi | null>(null);
  const rafRef = useRef<number | null>(null);
  // If parent controls mode, use that; otherwise fall back to internal state
  const [modeInternal, setModeInternal] = useState<ChartMode>('line');
  const mode = modeProp ?? modeInternal;

  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleLoading, setCandleLoading] = useState(false);

  const col = stock.chg >= 0 ? '#00ff9c' : '#ff4d4f';

  const fetchCandles = useCallback(async () => {
    if (!yahooSym) return;
    setCandleLoading(true);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(yahooSym)}/history?period=1mo`);
      const data = await res.json();
      setCandles(data.candles ?? []);
    } catch { /* keep stale */ } finally {
      setCandleLoading(false);
    }
  }, [yahooSym]);

  useEffect(() => {
    if (mode === 'candle') fetchCandles();
  }, [mode, fetchCandles]);

  // ── Chart.js intraday line (line mode) ─────────────────────────────────────
  useEffect(() => {
    if (mode !== 'line') return;
    if (!canvasRef.current) return;

    if (chartJsRef.current) { chartJsRef.current.destroy(); chartJsRef.current = null; }

    const base = stock.price;
    const pts: number[] = [];
    let v = base * (1 - (Math.random() * 0.03 + 0.01));
    for (let i = 0; i < 78; i++) {
      v += v * (Math.random() - 0.48) * 0.008;
      pts.push(+v.toFixed(2));
    }
    pts.push(base);

    const labels = pts.map((_, i) => {
      const h = Math.floor(9 + (i * 7) / 78);
      const m = Math.floor(((i * 7 * 60) / 78) % 60);
      return `${h}:${m.toString().padStart(2, '0')}`;
    });

    chartJsRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: pts,
          borderColor: col,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: col + '18',
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: { label: (c) => `${currency}${(c.raw as number).toFixed(2)}` },
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: '#1e2d3d' },
            ticks: { color: '#5a7a94', font: { size: 9 }, callback: (v) => currency + Number(v).toFixed(0) },
          },
        },
      },
    });

    return () => { chartJsRef.current?.destroy(); chartJsRef.current = null; };
  }, [stock, currency, mode, col]);

  // ── lightweight-charts candlestick (candle mode) ───────────────────────────
  useEffect(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (mode !== 'candle' || !candleContainerRef.current || candleLoading || candles.length === 0) return;
    if (lwChartRef.current) { lwChartRef.current.remove(); lwChartRef.current = null; }

    const container = candleContainerRef.current;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!container) return;

      const width = Math.max(container.getBoundingClientRect().width || container.offsetWidth, 100);

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#5a7a94',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
        },
        grid: { vertLines: { color: '#0f1922' }, horzLines: { color: '#1a2533' } },
        crosshair: {
          vertLine: { color: '#3a5a7488', labelBackgroundColor: '#0a1520' },
          horzLine: { color: '#3a5a7488', labelBackgroundColor: '#0a1520' },
        },
        rightPriceScale: { borderColor: '#1a2533' },
        timeScale: { borderColor: '#1a2533', visible: false, fixLeftEdge: true, fixRightEdge: true },
        width,
        height: CHART_HEIGHT,
      });

      lwChartRef.current = chart;
      const toTime = (d: string) => (new Date(d).getTime() / 1000) as UTCTimestamp;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff9c', downColor: '#ff4d4f',
        borderUpColor: '#00ff9c', borderDownColor: '#ff4d4f',
        wickUpColor: '#00ff9c', wickDownColor: '#ff4d4f',
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

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (!lwChartRef.current) return;
        const w = Math.max(container.getBoundingClientRect().width || container.offsetWidth, 100);
        lwChartRef.current.applyOptions({ width: w, height: CHART_HEIGHT });
      });
      ro.observe(container);
      (chart as unknown as { _ro: ResizeObserver })._ro = ro;
    });

    return () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (lwChartRef.current) {
        try { (lwChartRef.current as unknown as { _ro?: ResizeObserver })._ro?.disconnect(); } catch { /* */ }
        lwChartRef.current.remove();
        lwChartRef.current = null;
      }
    };
  }, [candles, mode, candleLoading]);

  return (
    <div className="chart-wrap" style={{ height: CHART_HEIGHT, position: 'relative', overflow: 'hidden' }}>

      {/* Line mode — Chart.js canvas, absolutely fills the wrap */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          display: mode === 'line' ? 'block' : 'none',
        }}
      />

      {/* Candle container — ALWAYS in the DOM so layout dimensions are stable */}
      <div
        ref={candleContainerRef}
        style={{
          position: 'absolute', inset: 0,
          display: mode === 'candle' && !candleLoading && candles.length > 0 ? 'block' : 'none',
        }}
      />

      {mode === 'candle' && candleLoading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 9, fontFamily: 'IBM Plex Mono', background: 'var(--bg)',
        }}>
          Loading candles...
        </div>
      )}

      {mode === 'candle' && !yahooSym && !candleLoading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--muted)', fontSize: 9, fontFamily: 'IBM Plex Mono',
        }}>
          Select a stock to view candles
        </div>
      )}
    </div>
  );
}
