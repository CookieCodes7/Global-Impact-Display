import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import GlobeGL from '../components/GlobeGL';

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
  { value: '4',     label: 'Global Markets', sub: 'IN · US · CN · JP' },
  { value: '1000+', label: 'Instruments',    sub: 'Stocks & indices'   },
  { value: 'GPT',   label: 'AI Powered',     sub: 'Signal engine'      },
  { value: 'Live',  label: 'Real-Time',      sub: 'Sub-second data'    },
];

const PREVIEW_WL = [
  { sym: 'NVDA', price: '$485.09', chg: '+3.45%', up: true,  pts: '0,30 12,27 24,22 36,18 48,13 60,8 72,2' },
  { sym: 'AAPL', price: '$188.32', chg: '-0.41%', up: false, pts: '0,2 12,5 24,4 36,10 48,14 60,16 72,20' },
  { sym: 'TSLA', price: '$240.11', chg: '-0.84%', up: false, pts: '0,2 12,6 24,5 36,12 48,15 60,18 72,24' },
  { sym: 'META', price: '$492.17', chg: '+1.22%', up: true,  pts: '0,28 12,24 24,20 36,16 48,12 60,7 72,3' },
];

const INTEL_FEED = [
  { time: '14:23', text: 'NVDA unusual options 950C × 2,400', cls: '' },
  { time: '14:22', text: 'BUY SIGNAL: META (Conf 85%)',        cls: 'buy' },
  { time: '14:21', text: 'Macro: Fed statement imminent',      cls: '' },
  { time: '14:20', text: 'SELL SIGNAL: JPM (Conf 62%)',        cls: 'sell' },
  { time: '14:18', text: 'Dark pool block: AAPL $28.4M',       cls: '' },
  { time: '14:17', text: 'SEC Filing: TSLA Form 8-K',          cls: '' },
  { time: '14:15', text: 'BUY SIGNAL: NVDA (Conf 91%)',        cls: 'buy' },
];

const VOL_BARS = [14,18,12,22,16,28,20,32,24,28,36,30,38,34,42,38,46,40,44,48];

/* ─────────────────────────────────────────────────────── */
/*  GLOBE SHOWCASE SECTION                                 */
/* ─────────────────────────────────────────────────────── */

function GlobeShowcase({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const { t } = useLanguage();
  const [utcTime, setUtcTime] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [globeSize, setGlobeSize] = useState(480);

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

  // Measure globe area for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const h = entries[0].contentRect.height;
      setGlobeSize(Math.min(w, h, 520));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
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
          {t('btn_launch_terminal')}
        </button>
        <button className="lp-showcase-signin" onClick={onLogin}>
          {t('btn_sign_in')}
        </button>
      </div>
      <div className="lp-showcase-tagline">{t('lp_tagline')}</div>

      {/* Globe stage — borderless, flows with background */}
      <div className="lp-globe-window">
        <div className="lp-globe-body">
          {/* Globe area */}
          <div className="lp-globe-area" ref={containerRef}>
            {/* Deep space background glow */}
            <div className="lp-globe-glow" />

            <GlobeGL width={globeSize} height={globeSize} />

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
              <div className="lp-nvda-vol">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="lp-vol-bar" style={{ height: `${8 + (i * 7 + 11) % 14}px` }} />
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
/*  TERMINAL PREVIEW SECTION                               */
/* ─────────────────────────────────────────────────────── */

function TerminalPreview() {
  const [utcTime, setUtcTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const n = new Date();
      const h = String(n.getUTCHours()).padStart(2,'0');
      const m = String(n.getUTCMinutes()).padStart(2,'0');
      const s = String(n.getUTCSeconds()).padStart(2,'0');
      setUtcTime(`${h}:${m}:${s}`);
    };
    fmt(); const id = setInterval(fmt, 1000); return () => clearInterval(id);
  }, []);

  return (
    <section className="lp-preview-section">
      <span className="lp-preview-badge">LIVE PREVIEW</span>
      <h2 className="lp-preview-title">Command the markets.</h2>
      <p className="lp-preview-sub">No wasted pixels. Maximum signal density.</p>

      <div className="lp-tw-window">
        {/* Title bar */}
        <div className="lp-tw-bar">
          <div className="lp-tw-dots">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <span className="lp-tw-bar-title">marketpulse-terminal v2.4 · {utcTime}</span>
        </div>

        {/* Three-column body */}
        <div className="lp-tw-body">

          {/* LEFT — Watchlist */}
          <div className="lp-tw-wl">
            <div className="lp-tw-panel-hdr">WATCHLIST</div>
            {PREVIEW_WL.map(s => (
              <div key={s.sym} className="lp-tw-wl-row">
                <div className="lp-tw-wl-info">
                  <div className="lp-tw-wl-sym">{s.sym}</div>
                  <div className="lp-tw-wl-price">{s.price}</div>
                </div>
                <svg className="lp-tw-spark" viewBox="0 0 72 32" preserveAspectRatio="none">
                  <polyline points={s.pts} fill="none"
                    stroke={s.up ? '#00ff9c' : '#ff4d4f'} strokeWidth="1.5" />
                </svg>
                <div className={`lp-tw-wl-chg ${s.up ? 'up' : 'dn'}`}>{s.chg}</div>
              </div>
            ))}
          </div>

          {/* CENTER — Chart */}
          <div className="lp-tw-chart">
            <div className="lp-tw-chart-hdr">
              <span className="lp-tw-sym-lbl">NVDA</span>
              <span className="lp-tw-period-lbl">1D</span>
              <span className="lp-tw-signal-buy">BUY</span>
              <span className="lp-tw-chart-price">$485.09</span>
              <span className="lp-tw-chart-chg up">+3.45%</span>
            </div>
            <div className="lp-tw-tabs">
              {['1D','5D','1M','3M','1Y'].map(t => (
                <span key={t} className={`lp-tw-tab${t==='1D'?' active':''}`}>{t}</span>
              ))}
              <span className="lp-tw-tab-sep" />
              <span className="lp-tw-tab-info">MA ——</span>
              <span className="lp-tw-tab-info">VOL</span>
            </div>
            <svg className="lp-tw-chart-svg" viewBox="0 0 500 190" preserveAspectRatio="none">
              <defs>
                <linearGradient id="nvda-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00ff9c" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#00ff9c" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[50,90,130,170].map(y => (
                <line key={y} x1="30" y1={y} x2="480" y2={y}
                  stroke="#1a2a3a" strokeWidth="0.6" />
              ))}
              <text x="26" y="53"  fill="#3a5a74" fontSize="9" textAnchor="end">463</text>
              <text x="26" y="93"  fill="#3a5a74" fontSize="9" textAnchor="end">441</text>
              <text x="26" y="133" fill="#3a5a74" fontSize="9" textAnchor="end">418</text>
              {/* Filled area */}
              <path d="M30,173 L75,164 L120,151 L165,142 L210,121 L255,105 L300,89 L345,74 L390,60 L435,46 L480,21 L480,180 L30,180 Z"
                fill="url(#nvda-fill)" />
              {/* MA dashed */}
              <line x1="30" y1="168" x2="480" y2="28"
                stroke="#3b9eff" strokeWidth="1" strokeDasharray="5,3" opacity="0.55" />
              {/* Price line */}
              <polyline
                points="30,173 75,164 120,151 165,142 210,121 255,105 300,89 345,74 390,60 435,46 480,21"
                fill="none" stroke="#00ff9c" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="480" cy="21" r="3.5" fill="#00ff9c" />
              <circle cx="480" cy="21" r="6" fill="none" stroke="#00ff9c" strokeWidth="1" opacity="0.4" />
            </svg>
            <div className="lp-tw-vol">
              {VOL_BARS.map((h, i) => (
                <div key={i} className="lp-tw-vol-bar" style={{ height: h + 'px' }} />
              ))}
            </div>
            <div className="lp-tw-time-axis">
              {['9:30','10:00','10:30','11:00','11:30','12:00'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          {/* RIGHT — Intel Feed */}
          <div className="lp-tw-feed">
            <div className="lp-tw-panel-hdr">INTEL FEED</div>
            {INTEL_FEED.map((item, i) => (
              <div key={i} className="lp-tw-feed-row">
                <span className="lp-tw-feed-time">{item.time}</span>
                <span className={`lp-tw-feed-text${item.cls ? ' '+item.cls : ''}`}>{item.text}</span>
              </div>
            ))}
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
  const { t } = useLanguage();
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
          <button className={`lp-modal-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>{t('btn_login')}</button>
          <button className={`lp-modal-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>{t('sign_up')}</button>
        </div>
        <form onSubmit={handleSubmit} className="lp-form">
          {mode === 'signup' && (
            <div className="lp-field">
              <label>{t('auth_full_name')}</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          )}
          <div className="lp-field">
            <label>{t('auth_email')}</label>
            <input type="email" placeholder="trader@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode === 'login'} />
          </div>
          <div className="lp-field">
            <label>{t('auth_password')}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {mode === 'signup' && (
            <div className="lp-field">
              <label>{t('auth_password')}</label>
              <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
          )}
          {error && <div className="lp-error">{error}</div>}
          <button type="submit" className="lp-submit-btn" disabled={loading}>
            {loading ? <span className="lp-spinner" /> : (mode === 'login' ? t('auth_launch_terminal') : t('auth_create_account'))}
          </button>
        </form>
        <div className="lp-modal-switch">
          {mode === 'login'
            ? <><span>{t('auth_no_account')}</span> <button onClick={() => { setMode('signup'); setError(''); }}>{t('sign_up')}</button></>
            : <><span>{t('auth_has_account')}</span> <button onClick={() => { setMode('login'); setError(''); }}>{t('btn_login')}</button></>}
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
  const { t } = useLanguage();
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
          <LangToggle />
          <button className="lp-btn-ghost" onClick={() => setAuthModal('login')}>{t('btn_login')}</button>
          <button className="lp-btn-primary" onClick={() => setAuthModal('signup')}>{t('btn_get_started')}</button>
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
        <div className="lp-hero-badge">{t('lp_badge')}</div>
        <h1 className="lp-hero-title">
          {t('lp_hero1')}<br />
          <span className="lp-hero-accent">{t('lp_hero2')}</span><br />
          {t('lp_hero3')}
        </h1>
        <p className="lp-hero-sub">{t('lp_sub')}</p>
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

      {/* Terminal Preview */}
      <TerminalPreview />

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
          <span className="lp-team-strip-text">TEAM NEXUS · JAIPUR, INDIA · 2026</span>
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
