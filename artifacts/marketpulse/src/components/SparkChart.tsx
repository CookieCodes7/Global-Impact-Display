import { useEffect, useRef, useState, useCallback } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import {
  createChart, ColorType, UTCTimestamp, IChartApi,
  CandlestickSeries, HistogramSeries,
} from 'lightweight-charts';
import { Stock } from '../data';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

type ChartMode = 'line' | 'candle';
type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };

interface SparkChartProps {
  stock: Stock;
  currency?: string;
  yahooSym?: string;
}

export default function SparkChart({ stock, currency = '₹', yahooSym }: SparkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const candleContainerRef = useRef<HTMLDivElement>(null);
  const chartJsRef = useRef<Chart | null>(null);
  const lwChartRef = useRef<IChartApi | null>(null);
  const [mode, setMode] = useState<ChartMode>('line');
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

  // Chart.js intraday line (line mode)
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

  // lightweight-charts candlestick (candle mode)
  useEffect(() => {
    if (mode !== 'candle' || !candleContainerRef.current || candleLoading || candles.length === 0) return;

    if (lwChartRef.current) { lwChartRef.current.remove(); lwChartRef.current = null; }

    const container = candleContainerRef.current;

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
      width: container.offsetWidth,
      height: container.offsetHeight,
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
      if (container && lwChartRef.current) {
        lwChartRef.current.applyOptions({ width: container.offsetWidth, height: container.offsetHeight });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      lwChartRef.current?.remove();
      lwChartRef.current = null;
    };
  }, [candles, mode, candleLoading]);

  return (
    <div className="chart-wrap" style={{ height: 140, position: 'relative' }}>
      {/* Chart type toggle — top-right corner */}
      <div style={{
        position: 'absolute', top: 4, right: 4, zIndex: 10,
        display: 'flex', border: '1px solid #1a2533', borderRadius: 2, overflow: 'hidden',
      }}>
        <button
          onClick={() => setMode('line')}
          style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fontWeight: 700,
            padding: '2px 8px', cursor: 'pointer', border: 'none',
            background: mode === 'line' ? col + '25' : 'transparent',
            color: mode === 'line' ? col : '#3a5a74',
          }}
        >LINE</button>
        <button
          onClick={() => setMode('candle')}
          style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fontWeight: 700,
            padding: '2px 8px', cursor: 'pointer', border: 'none',
            borderLeft: '1px solid #1a2533',
            background: mode === 'candle' ? '#f5c24220' : 'transparent',
            color: mode === 'candle' ? '#f5c242' : '#3a5a74',
          }}
        >CANDLE</button>
      </div>

      {/* Line mode — Chart.js canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: mode === 'line' ? 'block' : 'none' }}
      />

      {/* Candle mode — lightweight-charts container */}
      {mode === 'candle' && (
        <>
          <div
            ref={candleContainerRef}
            style={{ width: '100%', height: '100%', display: (candleLoading || candles.length === 0) ? 'none' : 'block' }}
          />
          {(candleLoading || (!candleLoading && candles.length === 0 && yahooSym)) && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: 9, fontFamily: 'IBM Plex Mono',
            }}>
              {candleLoading ? 'Loading candles...' : 'No data available'}
            </div>
          )}
          {!yahooSym && !candleLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: 9, fontFamily: 'IBM Plex Mono',
            }}>
              Select a stock to view candles
            </div>
          )}
        </>
      )}
    </div>
  );
}
