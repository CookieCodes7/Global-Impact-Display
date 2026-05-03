MarketPulse — Professional Financial Terminal
A professional-grade financial terminal built for traders tracking India, USA, China, and Japan markets. Features real-time stock data, AI-powered signals, portfolio tracking, live news, commodities, and a global market impact map — all in one dark terminal UI.

Features
Live Terminal
Real-time stock quotes — price, change %, volume, market cap
Multi-market watchlists: NSE/BSE · NYSE/NASDAQ · SSE/SZSE · TSE
Live AI signals (BULLISH / BEARISH / NEUTRAL) with target prices
Market session indicator (Pre-Open / Regular / After-Hours / Closed)
Scrolling indices ticker bar
Stock Detail
Interactive price chart — 1D / 1W / 1M / 3M / 1Y (Chart.js)
Full AI analysis: confidence score, target price, catalysts, risks, sentiment
Per-stock news feed
Portfolio Tracker
Add / remove / edit holdings across any market
Live P&L table with day change, overall return, allocation bars
Allocation donut chart — by stock, market, and sector
Today's movers widget + portfolio-specific news
AI Portfolio Report (GPT-powered):
Health score (0–100) with color-coded indicator
Verdict: Well Diversified / Concentrated Risk / etc.
Risk level: LOW / MEDIUM / HIGH / VERY HIGH
Per-holding action: BUY MORE / HOLD / REDUCE / SELL / WATCH
Key suggestions with priority levels + risk alerts
Sector & market exposure bars
News Feed
4-column article grid with real thumbnails
Market filters: All / India / USA / China / Japan
Auto-refresh every 90s with countdown timer
Article detail panel with related ticker live prices
Commodities
Metals: Gold, Silver, Platinum, Palladium, Copper
Energy: Crude Oil, Natural Gas, Brent, Heating Oil, Gasoline
Agriculture: Corn, Wheat, Soybeans, Sugar, Coffee, Cotton
World Map
Geopolitical risk overlay — color-coded by market sentiment
Live market impact visualization
Accessibility
Full Hindi (हिंदी) translation for the entire UI
EN | हिं language toggle in every page header
Language preference persists across sessions
Tech Stack
Layer	Technology
Frontend	React 19 + Vite 7 + TypeScript
Routing	Wouter
Backend	Express 5 + Node.js 24
Market Data	yahoo-finance2 v3
AI	OpenAI GPT-5.1
Charts	Chart.js
Map	D3 + TopoJSON
Monorepo	pnpm workspaces
Font	IBM Plex Mono + Noto Sans Devanagari
Auth	localStorage with SHA-256 password hashing
Project Structure
marketpulse/
├── artifacts/
│   ├── marketpulse/          # React + Vite frontend (path: /)
│   │   └── src/
│   │       ├── pages/        # Terminal, LandingPage, NewsPage, PortfolioPage, CommoditiesPage
│   │       ├── components/   # Clock, WorldMap, ProfilePanel, LangToggle, ...
│   │       ├── context/      # AuthContext, LanguageContext
│   │       └── i18n/         # translations.ts (EN + HI)
│   └── api-server/           # Express 5 backend (path: /api)
│       └── src/
│           └── routes/       # quotes, stock, news, portfolio, img proxy
└── pnpm-workspace.yaml

API Routes
Method	Route	Description
GET	/api/quotes?symbols=	Live quotes for multiple symbols
GET	/api/stock/:symbol/detail	Full stock detail + news
GET	/api/stock/:symbol/history?range=	OHLCV price history
GET	/api/stock/:symbol/analysis	AI analysis for a stock
GET	/api/news?market=&limit=	Market news feed
GET	/api/img?url=	Image proxy for news thumbnails
POST	/api/portfolio/analysis	Full AI portfolio report
Getting Started
Prerequisites
Node.js 20+
pnpm 9+
Install
pnpm install

Run (Development)
Start the API server:

pnpm --filter @workspace/api-server run dev

Start the frontend:

pnpm --filter @workspace/marketpulse run dev

Build API
pnpm --filter @workspace/api-server run build

Typecheck
pnpm run typecheck

Environment Variables
Variable	Description
PORT	Port for the API server (default: 8080)
OPENAI_API_KEY	OpenAI API key for AI signals and portfolio analysis
Route Structure
/                  Landing page
/terminal          Main watchlist terminal
/stock/:symbol     Stock detail + chart + AI analysis
/portfolio         Portfolio tracker + AI report
/news              Live news feed
/commodities       Commodities market
/map               Global market impact map

Authentication
User accounts are stored in localStorage with SHA-256 hashed passwords. This is a client-side only auth system — no backend database is required.

Signup creates a new account with email + hashed password
Login validates credentials and rejects unknown emails or wrong passwords
Profile updates (name, bio) persist immediately
Internationalization
All UI text supports English and Hindi. The language toggle (EN | हिं) appears in every page header and remembers your choice.

Translation keys live in artifacts/marketpulse/src/i18n/translations.ts.

Built By
Team Nexus — Jaipur, India · 2026
