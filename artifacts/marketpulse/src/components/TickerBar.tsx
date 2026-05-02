import { STOCKS } from '../data';

const EXTRA = [
  { sym: 'SPX', name: 'S&P 500', price: 5284.21, chg: 18.43, chgP: 0.35 },
  { sym: 'NDX', name: 'Nasdaq', price: 16742.39, chg: 93.17, chgP: 0.56 },
  { sym: 'BTC', name: 'Bitcoin', price: 62140, chg: 840, chgP: 1.37 },
  { sym: 'GLD', name: 'Gold', price: 2312.50, chg: -8.20, chgP: -0.35 },
  { sym: 'OIL', name: 'Crude WTI', price: 78.43, chg: 0.92, chgP: 1.19 },
];

export default function TickerBar() {
  const all = [...STOCKS, ...EXTRA];
  const items = all.map((s) => (
    <span key={s.sym} className="tick-item">
      <span className="tick-sym">{s.sym}</span>
      <span className="tick-price">{s.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className={s.chg >= 0 ? 'tick-chg-up' : 'tick-chg-dn'}>
        {s.chg >= 0 ? '+' : ''}{s.chgP.toFixed(2)}%
      </span>
    </span>
  ));

  return (
    <div id="ticker-bar">
      <div id="ticker-track">
        {items}
        {items}
      </div>
    </div>
  );
}
