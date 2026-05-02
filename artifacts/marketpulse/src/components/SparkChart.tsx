import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import { Stock } from '../data';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

interface SparkChartProps {
  stock: Stock;
}

export default function SparkChart({ stock }: SparkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

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

    const col = stock.chg >= 0 ? '#00ff9c' : '#ff4d4f';

    chartRef.current = new Chart(canvasRef.current, {
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
            callbacks: { label: (c) => `$${(c.raw as number).toFixed(2)}` },
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: '#1e2d3d' },
            ticks: { color: '#5a7a94', font: { size: 9 }, callback: (v) => '$' + Number(v).toFixed(0) },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [stock]);

  return (
    <div className="chart-wrap" style={{ height: 120 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
