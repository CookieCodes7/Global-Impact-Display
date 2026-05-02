import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────── */
/*  CONSTANTS                                              */
/* ─────────────────────────────────────────────────────── */

const TICKER_ITEMS = [
  { sym: 'RELIANCE', price: '₹2,847.35', chg: '+1.36%', up: true },
  { sym: 'TCS',      price: '₹3,921.50', chg: '+1.35%', up: true },
  { sym: 'AAPL',     price: '$213.18',   chg: '+0.82%', up: true },
  { sym: 'TSLA',     price: '$248.50',   chg: '-1.24%', up: false },
  { sym: 'MSFT',     price: '$425.20',   chg: '+0.63%', up: true },
  { sym: 'INFY',     price: '₹1,498.25', chg: '+1.50%', up: true },
  { sym: 'NVDA',     price: '$875.40',   chg: '+2.14%', up: true },
  { sym: 'HDFCBANK', price: '₹1,642.80', chg: '-1.10%', up: false },
  { sym: 'GOOGL',    price: '$178.90',   chg: '+0.44%', up: true },
  { sym: 'WIPRO',    price: '₹478.90',   chg: '-1.12%', up: false },
];

const FEATURES = [
  { icon: '⚡', title: 'Real-Time Market Data',   desc: 'Live prices from NSE/BSE, NYSE, SSE and TSE. Sub-second quote refresh across 1000+ instruments.', color: '#00ff9c' },
  { icon: '🤖', title: 'AI Signal Engine',         desc: 'GPT-powered analysis generates BULL/BEAR/NEUTRAL signals with confidence scores and price targets.', color: '#a78bfa' },
  { icon: '🌍', title: 'Global Coverage',          desc: 'India, USA, China and Japan markets in a single view. Switch markets instantly with live indices.', color: '#3b9eff' },
  { icon: '📊', title: 'Portfolio Tracker',        desc: 'Track your holdings across markets. AI-powered portfolio health assessment with actionable insights.', color: '#f5c842' },
  { icon: '📰', title: 'Live News Intelligence',   desc: 'Curated news feed with AI-tagged sentiment and market impact scores from Bloomberg, Reuters & more.', color: '#ff9933' },
  { icon: '🗺️', title: 'Market Impact Map',        desc: 'Interactive world map showing real-time economic signals and market performance by country.', color: '#ff4d4f' },
];

const STATS = [
  { value: '4',    label: 'Global Markets', sub: 'IN · US · CN · JP' },
  { value: '1000+', label: 'Instruments',   sub: 'Stocks & indices'   },
  { value: 'GPT',  label: 'AI Powered',     sub: 'Signal engine'      },
  { value: 'Live', label: 'Real-Time',      sub: 'Sub-second data'    },
];

/* ─────────────────────────────────────────────────────── */
/*  GLOBE CANVAS                                           */
/* ─────────────────────────────────────────────────────── */

function isApproxLand(lat: number, lng: number): boolean {
  // North America
  if (lat > 15 && lat < 75 && lng > -165 && lng < -52) {
    if (lat < 25 && lng < -90) return false;
    if (lat > 50 && lat < 63 && lng > -90 && lng < -65) return false;
    return true;
  }
  // South America
  if (lat > -55 && lat < 13 && lng > -82 && lng < -34) {
    if (lat < -15 && lng > -48) return false;
    return true;
  }
  // Europe
  if (lat > 35 && lat < 72 && lng > -12 && lng < 42) return true;
  // Africa
  if (lat > -35 && lat < 38 && lng > -18 && lng < 52) {
    if (lat > 30 && lng > 36) return false;
    return true;
  }
  // Middle East
  if (lat > 12 && lat < 42 && lng > 35 && lng < 62) return true;
  // India / South Asia
  if (lat > 5 && lat < 38 && lng > 60 && lng < 98) return true;
  // Asia mainland
  if (lat > 18 && lat < 78 && lng > 65 && lng < 150) return true;
  // SE Asia islands (Sumatra/Java/Borneo)
  if (lat > -8 && lat < 7 && lng > 95 && lng < 118) return true;
  // Japan
  if (lat > 30 && lat < 46 && lng > 129 && lng < 146) return true;
  // Australia
  if (lat > -43 && lat < -10 && lng > 113 && lng < 155) return true;
  // Greenland
  if (lat > 60 && lat < 84 && lng > -74 && lng < -10) return true;
  // Iceland
  if (lat > 63 && lat < 67 && lng > -25 && lng < -13) return true;
  // Antarctica
  if (lat < -65) return true;
  return false;
}

// Pre-compute dots at module level (runs once)
const GLOBE_DOTS: [number, number][] = (() => {
  const dots: [number, number][] = [];
  const step = 4;
  for (let lat = -80; lat <= 80; lat += step) {
    for (let lng = -180; lng < 180; lng += step) {
      if (isApproxLand(lat, lng)) {
        dots.push([lat * Math.PI / 180, lng * Math.PI / 180]);
      }
    }
  }
  return dots;
})();

// Label positions (lat, lng in degrees, label)
const GLOBE_LABELS: [number, number, string][] = [
  [22, 79, 'INDIA'],
  [40, -100, 'USA'],
  [35, 105, 'CHINA'],
  [52, 10, 'EU'],
];

function GlobeCanvas({ size = 420 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const R = Math.min(W, H) * 0.43;
    const cx = W / 2;
    const cy = H / 2;
    const rot = rotRef.current;

    ctx.clearRect(0, 0, W, H);

    // Sphere fill
    const sph = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.05, cx, cy, R);
    sph.addColorStop(0, 'rgba(0,80,120,0.55)');
    sph.addColorStop(0.5, 'rgba(0,30,60,0.4)');
    sph.addColorStop(1, 'rgba(0,10,25,0.15)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = sph;
    ctx.fill();

    // Subtle sphere outline
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,220,200,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grid lines (lat)
    for (let lat = -60; lat <= 60; lat += 30) {
      const latR = lat * Math.PI / 180;
      const ry = Math.sin(latR) * R;
      const rx = Math.cos(latR) * R;
      ctx.beginPath();
      ctx.ellipse(cx, cy + ry, rx, rx * 0.08, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,200,180,0.07)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Grid lines (lng)
    for (let lngDeg = 0; lngDeg < 360; lngDeg += 30) {
      const lngR = (lngDeg + rot * 180 / Math.PI) * Math.PI / 180;
      const x3 = Math.sin(lngR);
      const z3 = Math.cos(lngR);
      if (z3 < 0) continue;
      const startAngle = -Math.PI / 2;
      const endAngle = Math.PI / 2;
      ctx.beginPath();
      for (let a = startAngle; a <= endAngle; a += 0.05) {
        const px = cx + Math.cos(a) * x3 * R;
        const py = cy - Math.sin(a) * R;
        if (a === startAngle) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0,200,180,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // World dots
    for (const [latR, lngR] of GLOBE_DOTS) {
      const adjLng = lngR + rot;
      const x3 = Math.cos(latR) * Math.sin(adjLng);
      const y3 = Math.sin(latR);
      const z3 = Math.cos(latR) * Math.cos(adjLng);
      if (z3 < 0) continue;

      const px = cx + x3 * R;
      const py = cy - y3 * R;
      const bright = 0.25 + z3 * 0.75;
      const dotR = 1.0 + z3 * 1.1;

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,220,180,${bright})`;
      ctx.fill();
    }

    // Country labels
    for (const [latDeg, lngDeg, label] of GLOBE_LABELS) {
      const latR = latDeg * Math.PI / 180;
      const lngR = lngDeg * Math.PI / 180;
      const adjLng = lngR + rot;
      const x3 = Math.cos(latR) * Math.sin(adjLng);
      const y3 = Math.sin(latR);
      const z3 = Math.cos(latR) * Math.cos(adjLng);
      if (z3 < 0.2) continue;
      const px = cx + x3 * R;
      const py = cy - y3 * R;
      ctx.font = `bold ${9 + z3 * 3}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = `rgba(180,240,230,${0.5 + z3 * 0.4})`;
      ctx.textAlign = 'center';
      ctx.fillText(label, px, py);
    }

    // Highlight dot (India)
    {
      const latR = 22 * Math.PI / 180;
      const lngR = 79 * Math.PI / 180;
      const adjLng = lngR + rot;
      const z3 = Math.cos(latR) * Math.cos(adjLng);
      if (z3 > 0.15) {
        const x3 = Math.cos(latR) * Math.sin(adjLng);
        const y3 = Math.sin(latR);
        const px = cx + x3 * R;
        const py = cy - y3 * R;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff9c';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,255,156,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    rotRef.current += 0.003;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: '50%' }}
    />
  );
}

/* ─────────────────────────────────────────────────────── */
/*  GLOBE SHOWCASE SECTION                                 */
/* ─────────────────────────────────────────────────────── */

function GlobeShowcase({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s}`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  const AI_SIGNALS = [
    { sym: 'NVDA', signal: 'BUY',  conf: 91, col: '#00ff9c' },
    { sym: 'META', signal: 'BUY',  conf: 85, col: '#00ff9c' },
    { sym: 'AAPL', signal: 'HOLD', conf: 74, col: '#f5c842' },
    { sym: 'JPM',  signal: 'SELL', conf: 62, col: '#ff4d4f' },
  ];

  const DARK_POOL = [
    { sym: 'AAPL', dir: true,  val: '$28.4M' },
    { sym: 'NVDA', dir: true,  val: '$19.1M' },
    { sym: 'TSLA', dir: false, val: '$12.3M' },
  ];

  return (
    <section className="lp-showcase-section">
      {/* Sub-CTAs */}
      <div className="lp-showcase-ctas">
        <button className="lp-showcase-launch" onClick={onSignup}>
          LAUNCH FREE TERMINAL →
        </button>
        <button className="lp-showcase-signin" onClick={onLogin}>
          SIGN IN
        </button>
      </div>
      <div className="lp-showcase-tagline">
        No credit card required · Always free · Built by Team Nexus, Jaipur
      </div>

      {/* Terminal window */}
      <div className="lp-globe-window">
        {/* Window bar */}
        <div className="lp-globe-bar">
          <div className="lp-globe-bar-dots">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <span className="lp-globe-bar-title">
            marketpulse.terminal — LIVE · {utcTime} UTC
          </span>
          <span className="lp-globe-bar-status">
            <span className="lp-globe-status-dot" />
            SYSTEM ONLINE
          </span>
        </div>

        {/* Window body */}
        <div className="lp-globe-body">
          {/* Globe area */}
          <div className="lp-globe-area">
            {/* Glow ring */}
            <div className="lp-globe-glow" />
            <GlobeCanvas size={420} />

            {/* AI Signals overlay */}
            <div className="lp-ai-panel">
              <div className="lp-ai-panel-hdr">AI SIGNALS · LIVE</div>
              {AI_SIGNALS.map(s => (
                <div key={s.sym} className="lp-ai-row">
                  <span className="lp-ai-sym">{s.sym}</span>
                  <span className="lp-ai-signal" style={{ color: s.col, borderColor: s.col + '44', background: s.col + '15' }}>
                    {s.signal}
                  </span>
                  <span className="lp-ai-conf">{s.conf}%</span>
                </div>
              ))}
            </div>

            {/* Dark Pool overlay */}
            <div className="lp-dark-pool">
              <div className="lp-dark-pool-hdr">DARK POOL</div>
              {DARK_POOL.map(d => (
                <div key={d.sym} className="lp-dp-row">
                  <span className="lp-dp-sym">{d.sym}</span>
                  <span className={`lp-dp-dir ${d.dir ? 'up' : 'dn'}`}>{d.dir ? '↗' : '↘'}</span>
                  <span className={`lp-dp-val ${d.dir ? 'up' : 'dn'}`}>{d.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panels */}
          <div className="lp-globe-right">
            <div className="lp-mkt-card">
              <div className="lp-mkt-card-hdr">
                <span className="lp-mkt-id">CN</span>
                <span className="lp-mkt-name" style={{ color: '#ff4d4f' }}>CHINA</span>
                <span className="lp-mkt-dot" style={{ background: '#ff4d4f' }} />
              </div>
              <div className="lp-mkt-exch">SSE · COMPOSITE</div>
              <div className="lp-mkt-price">3,142</div>
              <div className="lp-mkt-chg dn">↘ -0.66%</div>
              <div className="lp-mkt-pts dn">-21 pts</div>
              <svg className="lp-mkt-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,10 C15,8 30,12 45,18 C60,24 75,22 100,28" fill="none" stroke="#ff4d4f" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="lp-mkt-card">
              <div className="lp-mkt-card-hdr">
                <span className="lp-mkt-id">JP</span>
                <span className="lp-mkt-name" style={{ color: '#a78bfa' }}>JAPAN</span>
                <span className="lp-mkt-dot" style={{ background: '#a78bfa' }} />
              </div>
              <div className="lp-mkt-exch">TSE · NIKKEI</div>
              <div className="lp-mkt-price">38,945</div>
              <div className="lp-mkt-chg up">↗ +0.29%</div>
              <div className="lp-mkt-pts up">+112 pts</div>
              <svg className="lp-mkt-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,22 C15,20 30,18 50,14 C65,11 80,10 100,6" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="lp-nvda-card">
              <div className="lp-nvda-hdr">
                <span style={{ color: '#00ff9c', fontWeight: 700 }}>NVDA</span>
                <span style={{ color: '#5a7a94', fontSize: 11 }}>· 1D</span>
                <span style={{ color: '#00ff9c', marginLeft: 'auto' }}>+3.45%</span>
              </div>
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
                <defs>
                  <linearGradient id="nvdaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff9c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00ff9c" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d="M0,50 C20,46 35,42 50,36 C65,30 75,32 90,24 C105,16 120,18 140,10 C155,4 170,8 200,3 L200,60 L0,60 Z" fill="url(#nvdaGrad)" />
                <path d="M0,50 C20,46 35,42 50,36 C65,30 75,32 90,24 C105,16 120,18 140,10 C155,4 170,8 200,3" fill="none" stroke="#00ff9c" strokeWidth="1.5" />
              </svg>
              {/* Volume bars */}
              <div className="lp-nvda-vol">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="lp-vol-bar" style={{ height: `${8 + Math.random() * 14}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  AUTH MODAL                                             */
/* ─────────────────────────────────────────────────────── */

type AuthMode = 'login' | 'signup';

function AuthModal({ onClose, initialMode }: { onClose: () => void; initialMode: AuthMode }) {
  const { login, signup } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (mode === 'signup') {
      if (!name.trim()) { setError('Name is required.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(name, email, password);
      navigate('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={e => e.stopPropagation()}>
        <button className="lp-modal-close" onClick={onClose}>✕</button>
        <div className="lp-modal-logo">MARKET<span style={{ color: '#3b9eff' }}>PULSE</span></div>
        <div className="lp-modal-tabs">
          <button className={`lp-modal-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Login</button>
          <button className={`lp-modal-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button>
        </div>
        <form onSubmit={handleSubmit} className="lp-form">
          {mode === 'signup' && (
            <div className="lp-field">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          )}
          <div className="lp-field">
            <label>Email Address</label>
            <input type="email" placeholder="trader@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode === 'login'} />
          </div>
          <div className="lp-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div className="lp-field">
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
          )}
          {error && <div className="lp-error">{error}</div>}
          <button type="submit" className="lp-submit-btn" disabled={loading}>
            {loading ? <span className="lp-spinner" /> : (mode === 'login' ? 'Enter Terminal →' : 'Create Account →')}
          </button>
        </form>
        <div className="lp-modal-switch">
          {mode === 'login'
            ? <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></>
            : <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Login</button></>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  LANDING PAGE                                           */
/* ─────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);

  // Ticker animation
  useEffect(() => {
    let pos = 0;
    const animate = () => {
      pos -= 0.4;
      const el = document.getElementById('lp-ticker-inner');
      if (el) {
        const half = el.scrollWidth / 2;
        if (Math.abs(pos) >= half) pos = 0;
        el.style.transform = `translateX(${pos}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="lp-root">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">MARKET<span style={{ color: '#3b9eff' }}>PULSE</span></div>
        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#markets" className="lp-nav-link">Markets</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => setAuthModal('login')}>Login</button>
          <button className="lp-btn-primary" onClick={() => setAuthModal('signup')}>Get Started</button>
        </div>
      </nav>

      {/* Ticker */}
      <div className="lp-ticker-strip">
        <div id="lp-ticker-inner" className="lp-ticker-inner">
          {doubled.map((t, i) => (
            <span key={i} className="lp-tick">
              <span className="lp-tick-sym">{t.sym}</span>
              <span className="lp-tick-price">{t.price}</span>
              <span className={`lp-tick-chg ${t.up ? 'up' : 'dn'}`}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-badge">◉ LIVE MARKET DATA · AI-POWERED SIGNALS</div>
        <h1 className="lp-hero-title">
          Professional-Grade<br />
          <span className="lp-hero-accent">Financial Terminal</span><br />
          for Every Trader
        </h1>
        <p className="lp-hero-sub">
          Real-time data from India, USA, China &amp; Japan. AI-generated signals, live news intelligence,
          portfolio tracking and a global market impact map — all in one terminal.
        </p>
        <div className="lp-hero-markets">
          {['🇮🇳 NSE/BSE', '🇺🇸 NYSE/NASDAQ', '🇨🇳 SSE/SZSE', '🇯🇵 TSE'].map(m => (
            <span key={m} className="lp-hero-market-chip">{m}</span>
          ))}
        </div>
      </section>

      {/* Globe Showcase */}
      <GlobeShowcase onSignup={() => setAuthModal('signup')} onLogin={() => setAuthModal('login')} />

      {/* Stats */}
      <section className="lp-stats" id="markets">
        {STATS.map(s => (
          <div key={s.label} className="lp-stat">
            <div className="lp-stat-val">{s.value}</div>
            <div className="lp-stat-label">{s.label}</div>
            <div className="lp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="lp-features" id="features">
        <div className="lp-section-hdr">
          <span className="lp-section-badge">CAPABILITIES</span>
          <h2 className="lp-section-title">Everything you need to trade smarter</h2>
          <p className="lp-section-sub">A Bloomberg-grade terminal built for independent traders and institutional investors alike.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-feature-card" style={{ borderTopColor: f.color }}>
              <div className="lp-feature-icon" style={{ color: f.color }}>{f.icon}</div>
              <h3 className="lp-feature-title" style={{ color: f.color }}>{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to trade with an edge?</h2>
          <p className="lp-cta-sub">Join thousands of traders using MarketPulse for real-time intelligence.</p>
          <button className="lp-cta-primary large" onClick={() => setAuthModal('signup')}>
            Start for Free — No Credit Card Required →
          </button>
        </div>
      </section>

      {/* Team Section */}
      <section className="lp-team-section">
        <div className="lp-team-badge">BUILT BY</div>
        <h2 className="lp-team-title">TEAM <span className="lp-team-accent">NEXUS</span></h2>
        <p className="lp-team-sub">
          A passionate team of engineers, designers, and market analysts on a mission to<br />
          democratize professional-grade financial intelligence.
        </p>
        <div className="lp-team-cards">
          <div className="lp-team-card">
            <div className="lp-team-card-icon">📍</div>
            <div className="lp-team-card-label">LOCATION</div>
            <div className="lp-team-card-value">Jaipur, Rajasthan, India</div>
          </div>
          <div className="lp-team-card">
            <div className="lp-team-card-icon">✉️</div>
            <div className="lp-team-card-label">CONTACT</div>
            <div className="lp-team-card-value"><a href="mailto:hiteshh7877@gmail.com" className="lp-team-email">hiteshh7877@gmail.com</a></div>
          </div>
          <div className="lp-team-card">
            <div className="lp-team-card-icon">✉️</div>
            <div className="lp-team-card-label">CONTACT</div>
            <div className="lp-team-card-value"><a href="mailto:architgarg2021@gmail.com" className="lp-team-email">architgarg2021@gmail.com</a></div>
          </div>
        </div>
        <div className="lp-team-strip">
          <span className="lp-team-dot" style={{ background: '#00ff9c' }} />
          <span className="lp-team-dot" style={{ background: '#f5c842' }} />
          <span className="lp-team-dot" style={{ background: '#a78bfa' }} />
          <span className="lp-team-dot" style={{ background: '#ff4d4f' }} />
          <span className="lp-team-strip-text">TEAM NEXUS · JAIPUR, INDIA · 2025</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer-bar">
        <div className="lp-footer-left">
          <span className="lp-footer-bar-logo">MARKET<span style={{ color: '#3b9eff' }}>PULSE</span></span>
          <span className="lp-footer-sep">·</span>
          <span className="lp-footer-bar-sub">Built by Team Nexus, Jaipur</span>
        </div>
        <div className="lp-footer-links">
          <a href="#" className="lp-footer-link">TERMS</a>
          <a href="#" className="lp-footer-link">PRIVACY</a>
          <a href="#" className="lp-footer-link">STATUS</a>
          <a href="#" className="lp-footer-link">API</a>
        </div>
        <div className="lp-footer-status">
          <span className="lp-status-dot" />
          ALL SYSTEMS OPERATIONAL
        </div>
      </footer>

      {authModal && <AuthModal onClose={() => setAuthModal(null)} initialMode={authModal} />}
    </div>
  );
}
