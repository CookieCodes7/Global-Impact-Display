import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

const TICKER_ITEMS = [
  { sym: 'RELIANCE', price: '₹2,847.35', chg: '+1.36%', up: true },
  { sym: 'TCS', price: '₹3,921.50', chg: '+1.35%', up: true },
  { sym: 'AAPL', price: '$213.18', chg: '+0.82%', up: true },
  { sym: 'TSLA', price: '$248.50', chg: '-1.24%', up: false },
  { sym: 'MSFT', price: '$425.20', chg: '+0.63%', up: true },
  { sym: 'INFY', price: '₹1,498.25', chg: '+1.50%', up: true },
  { sym: 'NVDA', price: '$875.40', chg: '+2.14%', up: true },
  { sym: 'HDFCBANK', price: '₹1,642.80', chg: '-1.10%', up: false },
  { sym: 'GOOGL', price: '$178.90', chg: '+0.44%', up: true },
  { sym: 'WIPRO', price: '₹478.90', chg: '-1.12%', up: false },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-Time Market Data',
    desc: 'Live prices from NSE/BSE, NYSE, SSE and TSE. Sub-second quote refresh across 1000+ instruments.',
    color: '#00ff9c',
  },
  {
    icon: '🤖',
    title: 'AI Signal Engine',
    desc: 'GPT-powered analysis generates BULL/BEAR/NEUTRAL signals with confidence scores and price targets.',
    color: '#a78bfa',
  },
  {
    icon: '🌍',
    title: 'Global Coverage',
    desc: 'India, USA, China and Japan markets in a single view. Switch markets instantly with live indices.',
    color: '#3b9eff',
  },
  {
    icon: '📊',
    title: 'Portfolio Tracker',
    desc: 'Track your holdings across markets. AI-powered portfolio health assessment with actionable insights.',
    color: '#f5c842',
  },
  {
    icon: '📰',
    title: 'Live News Intelligence',
    desc: 'Curated news feed with AI-tagged sentiment and market impact scores from Bloomberg, Reuters & more.',
    color: '#ff9933',
  },
  {
    icon: '🗺️',
    title: 'Market Impact Map',
    desc: 'Interactive world map showing real-time economic signals and market performance by country.',
    color: '#ff4d4f',
  },
];

const STATS = [
  { value: '4', label: 'Global Markets', sub: 'IN · US · CN · JP' },
  { value: '1000+', label: 'Instruments', sub: 'Stocks & indices' },
  { value: 'GPT', label: 'AI Powered', sub: 'Signal engine' },
  { value: 'Live', label: 'Real-Time', sub: 'Sub-second data' },
];

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

        <div className="lp-modal-logo">
          MARKET<span style={{ color: '#3b9eff' }}>PULSE</span>
        </div>

        <div className="lp-modal-tabs">
          <button className={`lp-modal-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            Login
          </button>
          <button className={`lp-modal-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>
            Sign Up
          </button>
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
            {loading ? (
              <span className="lp-spinner" />
            ) : (
              mode === 'login' ? 'Enter Terminal →' : 'Create Account →'
            )}
          </button>
        </form>

        <div className="lp-modal-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Login</button></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const [tickerOffset, setTickerOffset] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    let pos = 0;
    const speed = 0.4;
    const animate = () => {
      pos -= speed;
      const el = document.getElementById('lp-ticker-inner');
      if (el) {
        const half = el.scrollWidth / 2;
        if (Math.abs(pos) >= half) pos = 0;
        el.style.transform = `translateX(${pos}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="lp-root">
      {/* Top nav */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          MARKET<span style={{ color: '#3b9eff' }}>PULSE</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#markets" className="lp-nav-link">Markets</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => setAuthModal('login')}>Login</button>
          <button className="lp-btn-primary" onClick={() => setAuthModal('signup')}>Get Started</button>
        </div>
      </nav>

      {/* Live ticker strip */}
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
        <div className="lp-hero-ctas">
          <button className="lp-cta-primary" onClick={() => setAuthModal('signup')}>
            Launch Terminal Free →
          </button>
          <button className="lp-cta-ghost" onClick={() => setAuthModal('login')}>
            Sign In
          </button>
        </div>
        <div className="lp-hero-markets">
          {['🇮🇳 NSE/BSE', '🇺🇸 NYSE/NASDAQ', '🇨🇳 SSE/SZSE', '🇯🇵 TSE'].map(m => (
            <span key={m} className="lp-hero-market-chip">{m}</span>
          ))}
        </div>

        {/* Terminal preview mockup */}
        <div className="lp-terminal-preview">
          <div className="lp-preview-bar">
            <span className="lp-preview-dot red" />
            <span className="lp-preview-dot yellow" />
            <span className="lp-preview-dot green" />
            <span className="lp-preview-title">MARKETPULSE TERMINAL</span>
            <span className="lp-preview-live">◉ LIVE</span>
          </div>
          <div className="lp-preview-body">
            <div className="lp-preview-left">
              <div className="lp-preview-section-hdr">🇮🇳 WATCHLIST</div>
              {[
                { sym: 'RELIANCE', price: '₹2,847', chg: '+1.36%', up: true },
                { sym: 'TCS', price: '₹3,921', chg: '+1.35%', up: true },
                { sym: 'HDFCBANK', price: '₹1,642', chg: '-1.10%', up: false },
                { sym: 'INFY', price: '₹1,498', chg: '+1.50%', up: true },
              ].map(s => (
                <div key={s.sym} className="lp-preview-row">
                  <span className="lp-preview-sym">{s.sym}</span>
                  <span className={`lp-preview-val ${s.up ? 'up' : 'dn'}`}>{s.price}</span>
                  <span className={`lp-preview-chg ${s.up ? 'up' : 'dn'}`}>{s.chg}</span>
                </div>
              ))}
            </div>
            <div className="lp-preview-center">
              <div className="lp-preview-price-row">
                <span className="lp-preview-big-sym">RELIANCE</span>
                <span className="lp-preview-big-price up">₹2,847.35</span>
              </div>
              <div className="lp-preview-chart">
                <svg viewBox="0 0 300 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff9c" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00ff9c" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d="M0,60 C20,55 40,58 60,45 C80,32 100,35 120,28 C140,21 160,30 180,22 C200,14 220,20 240,12 C260,4 280,10 300,5 L300,80 L0,80 Z" fill="url(#chartGrad)" />
                  <path d="M0,60 C20,55 40,58 60,45 C80,32 100,35 120,28 C140,21 160,30 180,22 C200,14 220,20 240,12 C260,4 280,10 300,5" fill="none" stroke="#00ff9c" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="lp-preview-signal">
                <span className="lp-preview-signal-lbl">AI SIGNAL</span>
                <span className="lp-preview-signal-val bull">▲ BULLISH</span>
                <span className="lp-preview-conf">Confidence: 88%</span>
              </div>
            </div>
            <div className="lp-preview-right">
              <div className="lp-preview-section-hdr">🇮🇳 NEWS FEED</div>
              {[
                { src: 'Economic Times', title: 'Reliance Jio 5G coverage hits 98%', sent: 'BULL' },
                { src: 'Mint', title: 'TCS wins $1.5B deal from European bank', sent: 'BULL' },
                { src: 'Business Standard', title: 'HDFC Bank compresses 18bps NIM', sent: 'BEAR' },
              ].map((n, i) => (
                <div key={i} className="lp-preview-news">
                  <div className="lp-preview-news-src">{n.src}</div>
                  <div className="lp-preview-news-title">{n.title}</div>
                  <span className={`lp-preview-tag ${n.sent === 'BULL' ? 'bull' : 'bear'}`}>{n.sent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">MARKET<span style={{ color: '#3b9eff' }}>PULSE</span></div>
        <div className="lp-footer-text">Professional Financial Terminal · Real-Time Data · AI Signals</div>
        <div className="lp-footer-markets">
          <span>🇮🇳 India (NSE/BSE)</span>
          <span>🇺🇸 USA (NYSE/NASDAQ)</span>
          <span>🇨🇳 China (SSE/SZSE)</span>
          <span>🇯🇵 Japan (TSE)</span>
        </div>
      </footer>

      {authModal && <AuthModal onClose={() => setAuthModal(null)} initialMode={authModal} />}
    </div>
  );
}
