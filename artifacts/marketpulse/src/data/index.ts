export type Stock = {
  sym: string; name: string; price: number; chg: number; chgP: number;
  sig: string; conf: number; target: number; days: number; vol: string; pe: string;
};

export type NewsItem = { src: string; time: string; ticker: string; title: string; sent: string; impact: number };
export type CorrItem = { sym: string; mentions: number; score: number; dir: number };
export type IndexItem = { name: string; val: string; chg: string; chgP: string; dir: number };

export type Market = {
  id: string;
  name: string;
  flag: string;
  currency: string;
  exchange: string;
  stocks: Stock[];
  indices: IndexItem[];
  news: NewsItem[];
  corr: CorrItem[];
  aiExplains: Record<string, string>;
  benchmarkLabel: string;
  benchmarkVal: string;
  vixLabel: string;
  vixVal: string;
  timezone: string;
};

// ── INDIA ─────────────────────────────────────────────────────────────────────
const INDIA: Market = {
  id: 'IN',
  name: 'India',
  flag: '🇮🇳',
  currency: '₹',
  exchange: 'NSE / BSE',
  benchmarkLabel: 'NIFTY 50',
  benchmarkVal: '22,147.00',
  vixLabel: 'India VIX',
  vixVal: '13.42',
  timezone: 'IST',
  stocks: [
    {sym:'RELIANCE',name:'Reliance Industries',price:2847.35,chg:38.20,chgP:1.36,sig:'BULL',conf:88,target:3100,days:7,vol:'8.4M',pe:'28.1'},
    {sym:'TCS',name:'Tata Consultancy',price:3921.50,chg:52.40,chgP:1.35,sig:'BULL',conf:84,target:4200,days:7,vol:'3.2M',pe:'30.4'},
    {sym:'HDFCBANK',name:'HDFC Bank Ltd.',price:1642.80,chg:-18.30,chgP:-1.10,sig:'NEUT',conf:58,target:1700,days:5,vol:'12.1M',pe:'18.7'},
    {sym:'INFY',name:'Infosys Ltd.',price:1498.25,chg:22.15,chgP:1.50,sig:'BULL',conf:79,target:1620,days:7,vol:'6.8M',pe:'24.3'},
    {sym:'ICICIBANK',name:'ICICI Bank Ltd.',price:1127.60,chg:14.80,chgP:1.33,sig:'BULL',conf:82,target:1240,days:7,vol:'9.5M',pe:'17.2'},
    {sym:'WIPRO',name:'Wipro Ltd.',price:478.90,chg:-5.40,chgP:-1.12,sig:'BEAR',conf:64,target:445,days:5,vol:'5.3M',pe:'21.8'},
    {sym:'BAJFINANCE',name:'Bajaj Finance',price:6834.20,chg:112.50,chgP:1.67,sig:'BULL',conf:87,target:7400,days:7,vol:'1.9M',pe:'34.2'},
    {sym:'SBIN',name:'State Bank India',price:812.45,chg:-9.30,chgP:-1.13,sig:'NEUT',conf:55,target:840,days:5,vol:'18.7M',pe:'10.4'},
  ],
  indices: [
    {name:'Nifty 50',val:'22,147.00',chg:'+243.18',chgP:'+1.11%',dir:1},
    {name:'Sensex',val:'72,831.94',chg:'+812.43',chgP:'+1.13%',dir:1},
    {name:'Nifty Bank',val:'47,982.60',chg:'-128.40',chgP:'-0.27%',dir:-1},
    {name:'Nifty IT',val:'35,412.30',chg:'+481.20',chgP:'+1.38%',dir:1},
  ],
  news: [
    {src:'Economic Times',time:'3m ago',ticker:'RELIANCE',title:'Reliance Jio 5G coverage hits 98% of India\'s urban population; ARPU rises 14% YoY',sent:'BULL',impact:0.91},
    {src:'Mint',time:'11m ago',ticker:'TCS',title:'TCS wins $1.5B deal from European bank; largest single contract in company history',sent:'BULL',impact:0.88},
    {src:'Business Standard',time:'19m ago',ticker:'HDFCBANK',title:'HDFC Bank NIM compresses 18bps on post-merger integration costs; Q4 results disappoint',sent:'BEAR',impact:0.76},
    {src:'NDTV Profit',time:'28m ago',ticker:'INFY',title:'Infosys raises FY25 revenue guidance to 4-7%; AI-led deal pipeline accelerating',sent:'BULL',impact:0.82},
    {src:'LiveMint',time:'37m ago',ticker:'BAJFINANCE',title:'Bajaj Finance AUM crosses ₹3.5 lakh crore; GNPA stable at 1.1%, asset quality holds',sent:'BULL',impact:0.79},
    {src:'The Hindu BL',time:'49m ago',ticker:'WIPRO',title:'Wipro Q4 revenue guidance cut; CEO warns of client decision delays in BFSI vertical',sent:'BEAR',impact:0.68},
    {src:'ET Markets',time:'58m ago',ticker:'ICICIBANK',title:'ICICI Bank beats on all parameters; loan growth at 18%, ROE expands to 18.9%',sent:'BULL',impact:0.85},
    {src:'Reuters India',time:'1h ago',ticker:'SBIN',title:'SBI provisioning spikes on agri-segment stress; margins under pressure in Q4',sent:'BEAR',impact:0.61},
  ],
  corr: [
    {sym:'RELIANCE',mentions:6241,score:0.87,dir:1},
    {sym:'TCS',mentions:4132,score:0.84,dir:1},
    {sym:'BAJFINANCE',mentions:3891,score:0.79,dir:1},
    {sym:'HDFCBANK',mentions:3204,score:-0.61,dir:-1},
    {sym:'WIPRO',mentions:2018,score:-0.54,dir:-1},
    {sym:'INFY',mentions:1987,score:0.72,dir:1},
  ],
  aiExplains: {
    RELIANCE: 'Reliance is the dominant bullish conviction in Indian markets. Jio\'s 5G monetisation and Retail\'s rapid expansion drive a multi-year re-rating thesis. Green energy capex cycle is a long-term catalyst.',
    TCS: 'TCS displays strong bullish signals. Record deal wins, stable attrition at 12.5%, and AI service demand from global banks underpin above-consensus revenue guidance for FY25.',
    HDFCBANK: 'Post-merger integration headwinds are weighing on HDFC Bank. NIM compression and elevated opex create a neutral-to-bearish near-term outlook despite solid fundamentals.',
    INFY: 'Bullish on Infosys. Guidance upgrade and accelerating AI deal wins validate management confidence. Enterprise demand for cloud-native solutions is re-accelerating.',
    ICICIBANK: 'Strong bullish signal for ICICI Bank. ROE expansion and superior loan book quality distinguish it as the top pick in the private sector banking space.',
    WIPRO: 'Bearish. Repeated guidance cuts and BFSI sector slowdown raise concerns about growth recovery timeline. Management credibility is under pressure.',
    BAJFINANCE: 'Bullish. Bajaj Finance\'s asset quality stability and AUM growth trajectory signal a robust consumer credit cycle. Diversified product mix reduces concentration risk.',
    SBIN: 'Neutral. While SBI benefits from credit growth tailwinds, agri-sector stress and rising provisions cloud the near-term earnings picture.',
  },
};

// ── USA ───────────────────────────────────────────────────────────────────────
const USA: Market = {
  id: 'US',
  name: 'USA',
  flag: '🇺🇸',
  currency: '$',
  exchange: 'NYSE / NASDAQ',
  benchmarkLabel: 'S&P 500',
  benchmarkVal: '5,284.21',
  vixLabel: 'VIX',
  vixVal: '18.43',
  timezone: 'EDT',
  stocks: [
    {sym:'AAPL',name:'Apple Inc.',price:213.45,chg:1.24,chgP:0.58,sig:'BULL',conf:82,target:228,days:7,vol:'48.3M',pe:'28.4'},
    {sym:'TSLA',name:'Tesla Inc.',price:172.30,chg:-3.82,chgP:-2.17,sig:'BEAR',conf:71,target:158,days:5,vol:'91.7M',pe:'62.1'},
    {sym:'NVDA',name:'NVIDIA Corp.',price:887.54,chg:12.30,chgP:1.41,sig:'BULL',conf:91,target:950,days:7,vol:'39.8M',pe:'73.2'},
    {sym:'MSFT',name:'Microsoft Corp.',price:421.10,chg:2.55,chgP:0.61,sig:'BULL',conf:78,target:445,days:7,vol:'22.1M',pe:'37.9'},
    {sym:'AMZN',name:'Amazon.com Inc.',price:194.72,chg:-0.83,chgP:-0.42,sig:'NEUT',conf:55,target:200,days:5,vol:'35.4M',pe:'43.7'},
    {sym:'META',name:'Meta Platforms',price:512.88,chg:8.14,chgP:1.61,sig:'BULL',conf:85,target:555,days:7,vol:'18.2M',pe:'27.3'},
    {sym:'GOOGL',name:'Alphabet Inc.',price:175.23,chg:1.02,chgP:0.59,sig:'BULL',conf:74,target:188,days:7,vol:'25.6M',pe:'24.8'},
    {sym:'JPM',name:'JPMorgan Chase',price:221.45,chg:-1.23,chgP:-0.55,sig:'BEAR',conf:62,target:210,days:5,vol:'11.3M',pe:'12.4'},
  ],
  indices: [
    {name:'S&P 500',val:'5,284.21',chg:'+18.43',chgP:'+0.35%',dir:1},
    {name:'NASDAQ',val:'16,742.39',chg:'+93.17',chgP:'+0.56%',dir:1},
    {name:'DOW JONES',val:'39,127.14',chg:'-42.81',chgP:'-0.11%',dir:-1},
    {name:'RUSSELL 2K',val:'2,083.45',chg:'+11.22',chgP:'+0.54%',dir:1},
  ],
  news: [
    {src:'Reuters',time:'2m ago',ticker:'NVDA',title:'NVIDIA beats Q1 earnings estimates by 28%, data center revenue surges to record $22B',sent:'BULL',impact:0.92},
    {src:'Bloomberg',time:'8m ago',ticker:'TSLA',title:'Tesla cuts Model Y prices in Europe amid slowing demand; analysts revise targets lower',sent:'BEAR',impact:0.81},
    {src:'WSJ',time:'15m ago',ticker:'AAPL',title:"Apple's Vision Pro 2 development confirmed; mixed reality pipeline stronger than expected",sent:'BULL',impact:0.74},
    {src:'CNBC',time:'22m ago',ticker:'JPM',title:'Fed minutes signal rates on hold longer; financial sector faces headwinds into Q3',sent:'BEAR',impact:0.69},
    {src:'FT',time:'31m ago',ticker:'META',title:'Meta AI assistant reaches 500M users, Zuckerberg forecasts ad revenue acceleration',sent:'BULL',impact:0.88},
    {src:'MarketWatch',time:'44m ago',ticker:'AMZN',title:'Amazon AWS growth slows to 17% YoY; cloud margin expansion offsets top-line miss',sent:'NEUT',impact:0.58},
    {src:'TheStreet',time:'52m ago',ticker:'MSFT',title:'Microsoft Copilot enterprise adoption doubles; Azure AI workloads driving $12B incremental ARR',sent:'BULL',impact:0.79},
    {src:'Barrons',time:'1h ago',ticker:'GOOGL',title:'Google Search ad market share recovers to 90.2% in April; Gemini integration credited',sent:'BULL',impact:0.65},
  ],
  corr: [
    {sym:'NVDA',mentions:4821,score:0.91,dir:1},
    {sym:'TSLA',mentions:3204,score:-0.74,dir:-1},
    {sym:'META',mentions:2887,score:0.83,dir:1},
    {sym:'AAPL',mentions:2103,score:0.61,dir:1},
    {sym:'JPM',mentions:1544,score:-0.52,dir:-1},
    {sym:'MSFT',mentions:1288,score:0.69,dir:1},
  ],
  aiExplains: {
    AAPL: 'News sentiment strongly positive (+0.74). Earnings whispers above consensus. Technical breakout above 200-day MA. Reddit/social volume: +34% WoW. Vision Pro pipeline is a fresh catalyst.',
    TSLA: 'Bearish signal driven by price cut pressure in EU markets and margin concerns. Short interest elevated at 3.4% float. Sentiment score: -0.62. Delivery guidance at risk.',
    NVDA: 'Dominant bullish signal. Earnings beat of 28% far exceeds expectations. Data center at $22B is 15% above estimates. AI infrastructure mega-cycle sustains premium valuation.',
    MSFT: 'Bullish on Copilot enterprise adoption doubling. Azure AI workloads are incremental ARR of $12B. Cloud margin expansion reinforces high-confidence signal.',
    AMZN: 'Neutral. AWS growth deceleration (17% YoY vs 21% expected) tempers upside. Cloud margin expansion partially offsets. Mixed signals warrant a hold posture.',
    META: 'Strong bullish. AI assistant user base at 500M signals advertising revenue acceleration. Efficiency ratio improving. Options flow unusually bullish this week.',
    GOOGL: 'Bullish. Search market share recovery to 90.2% removes a key risk. Gemini integration driving engagement metrics. Valuation remains attractive at 24.8x earnings.',
    JPM: 'Bearish. Fed rate hold for longer compresses NIM expansion timeline. Financial sector faces headwinds into Q3. Credit card delinquency data also ticking up.',
  },
};

// ── CHINA ─────────────────────────────────────────────────────────────────────
const CHINA: Market = {
  id: 'CN',
  name: 'China',
  flag: '🇨🇳',
  currency: '¥',
  exchange: 'SSE / SZSE',
  benchmarkLabel: 'SSE Comp.',
  benchmarkVal: '3,048.74',
  vixLabel: 'iVIX',
  vixVal: '21.18',
  timezone: 'CST',
  stocks: [
    {sym:'BABA',name:'Alibaba Group',price:76.42,chg:-1.83,chgP:-2.34,sig:'BEAR',conf:68,target:70,days:5,vol:'22.4M',pe:'11.2'},
    {sym:'TCEHY',name:'Tencent Holdings',price:38.91,chg:0.54,chgP:1.41,sig:'BULL',conf:73,target:44,days:7,vol:'14.8M',pe:'18.4'},
    {sym:'BYDDF',name:'BYD Company',price:29.14,chg:0.82,chgP:2.90,sig:'BULL',conf:81,target:34,days:7,vol:'9.3M',pe:'22.7'},
    {sym:'PDD',name:'PDD Holdings',price:138.20,chg:-4.12,chgP:-2.90,sig:'BEAR',conf:72,target:124,days:5,vol:'8.1M',pe:'14.3'},
    {sym:'NIO',name:'NIO Inc.',price:5.42,chg:-0.28,chgP:-4.91,sig:'BEAR',conf:78,target:4,days:5,vol:'61.2M',pe:'N/A'},
    {sym:'XPEV',name:'XPeng Inc.',price:9.87,chg:0.31,chgP:3.24,sig:'NEUT',conf:51,target:11,days:7,vol:'18.6M',pe:'N/A'},
    {sym:'BIDU',name:'Baidu Inc.',price:97.83,chg:1.22,chgP:1.26,sig:'BULL',conf:69,target:110,days:7,vol:'5.9M',pe:'13.1'},
    {sym:'JD',name:'JD.com Inc.',price:28.45,chg:-0.73,chgP:-2.50,sig:'BEAR',conf:66,target:25,days:5,vol:'11.2M',pe:'9.8'},
  ],
  indices: [
    {name:'SSE Composite',val:'3,048.74',chg:'-22.31',chgP:'-0.73%',dir:-1},
    {name:'Shenzhen Comp.',val:'9,412.18',chg:'-81.40',chgP:'-0.86%',dir:-1},
    {name:'Hang Seng',val:'17,284.53',chg:'+84.20',chgP:'+0.49%',dir:1},
    {name:'CSI 300',val:'3,521.64',chg:'-18.42',chgP:'-0.52%',dir:-1},
  ],
  news: [
    {src:'Caixin',time:'5m ago',ticker:'BABA',title:'Alibaba cloud revenue drops 3% YoY as enterprise migration to domestic rivals accelerates',sent:'BEAR',impact:0.83},
    {src:'SCMP',time:'14m ago',ticker:'BYDDF',title:'BYD records 38% YoY EV sales growth in April; Model mix shift to premium boosts margins',sent:'BULL',impact:0.89},
    {src:'Reuters',time:'23m ago',ticker:'TCEHY',title:'Tencent WeChat Pay expands to Southeast Asia, adds 120M new users in Q1',sent:'BULL',impact:0.77},
    {src:'Bloomberg',time:'35m ago',ticker:'NIO',title:'NIO delays ET9 production due to battery supply bottleneck; cash runway concerns resurface',sent:'BEAR',impact:0.84},
    {src:'Caixin',time:'42m ago',ticker:'PDD',title:'PDD Temu faces EU Digital Markets Act scrutiny; regulatory risk weighs on international growth',sent:'BEAR',impact:0.72},
    {src:'FT China',time:'56m ago',ticker:'BIDU',title:'Baidu ERNIE Bot enterprise deployments double in Q1; AI monetisation ahead of schedule',sent:'BULL',impact:0.71},
    {src:'WSJ Asia',time:'1h ago',ticker:'JD',title:'JD.com Q1 GMV misses estimates; logistics cost optimisation partially offsets top-line weakness',sent:'BEAR',impact:0.65},
    {src:'Xinhua Fin.',time:'1h ago',ticker:'XPEV',title:'XPEV launches MONA M03 with XNGP full-stack AI driving; market reception beats expectations',sent:'NEUT',impact:0.59},
  ],
  corr: [
    {sym:'BYDDF',mentions:5102,score:0.82,dir:1},
    {sym:'NIO',mentions:4388,score:-0.79,dir:-1},
    {sym:'BABA',mentions:3971,score:-0.71,dir:-1},
    {sym:'TCEHY',mentions:2844,score:0.68,dir:1},
    {sym:'PDD',mentions:2201,score:-0.62,dir:-1},
    {sym:'BIDU',mentions:1643,score:0.58,dir:1},
  ],
  aiExplains: {
    BABA: 'Bearish. Alibaba faces structural market share losses in cloud and e-commerce. Regulatory overhang persists and international expansion is slower than expected.',
    TCEHY: 'Moderate bullish. Tencent\'s gaming revenue recovery and WeChat Pay international expansion offset domestic regulatory headwinds. Valuation remains compelling at 18x.',
    BYDDF: 'Strong bullish. BYD\'s EV volume leadership is unassailable. Margin improvement from vertical integration and premium mix shift creates a compelling re-rating path.',
    PDD: 'Bearish. Temu\'s regulatory risks in Europe and US are mounting. Domestic Pinduoduo growth is decelerating from a high base.',
    NIO: 'Bearish. Cash burn is unsustainable at current delivery rates. Battery supply issues and delayed flagship model undermine the bull case for 2024.',
    XPEV: 'Neutral. MONA M03 early data is positive but insufficient to declare a sustained turnaround. Q2 delivery guidance needs to be proven.',
    BIDU: 'Bullish. ERNIE Bot enterprise adoption is ahead of schedule. AI monetisation via cloud APIs is creating a new revenue stream with high margins.',
    JD: 'Bearish. JD\'s growth-to-profitability pivot is taking longer than expected. Competitive pressure from Alibaba and PDD shows no signs of easing.',
  },
};

// ── JAPAN ─────────────────────────────────────────────────────────────────────
const JAPAN: Market = {
  id: 'JP',
  name: 'Japan',
  flag: '🇯🇵',
  currency: '¥',
  exchange: 'TSE / OSE',
  benchmarkLabel: 'Nikkei 225',
  benchmarkVal: '38,487.24',
  vixLabel: 'Nikkei VI',
  vixVal: '20.14',
  timezone: 'JST',
  stocks: [
    {sym:'7203.T',name:'Toyota Motor',price:3418.00,chg:62.00,chgP:1.85,sig:'BULL',conf:86,target:3800,days:7,vol:'11.2M',pe:'10.4'},
    {sym:'6758.T',name:'Sony Group',price:12840.00,chg:184.00,chgP:1.45,sig:'BULL',conf:80,target:14000,days:7,vol:'4.8M',pe:'19.2'},
    {sym:'9984.T',name:'SoftBank Group',price:8142.00,chg:-98.00,chgP:-1.19,sig:'BEAR',conf:67,target:7400,days:5,vol:'9.1M',pe:'N/A'},
    {sym:'7974.T',name:'Nintendo',price:8214.00,chg:112.00,chgP:1.38,sig:'BULL',conf:76,target:9000,days:7,vol:'2.3M',pe:'17.8'},
    {sym:'7267.T',name:'Honda Motor',price:1842.50,chg:38.50,chgP:2.13,sig:'BULL',conf:78,target:2100,days:7,vol:'7.6M',pe:'8.7'},
    {sym:'8058.T',name:'Mitsubishi Corp.',price:3284.00,chg:-42.00,chgP:-1.26,sig:'NEUT',conf:54,target:3300,days:5,vol:'5.2M',pe:'9.2'},
    {sym:'6752.T',name:'Panasonic Hldgs',price:1384.50,chg:21.50,chgP:1.58,sig:'BULL',conf:71,target:1540,days:7,vol:'8.9M',pe:'13.4'},
    {sym:'9432.T',name:'NTT Corporation',price:184.20,chg:-2.30,chgP:-1.23,sig:'BEAR',conf:61,target:172,days:5,vol:'22.4M',pe:'12.1'},
  ],
  indices: [
    {name:'Nikkei 225',val:'38,487.24',chg:'+427.18',chgP:'+1.12%',dir:1},
    {name:'TOPIX',val:'2,712.49',chg:'+24.83',chgP:'+0.92%',dir:1},
    {name:'JPX-Nikkei 400',val:'24,814.82',chg:'+218.40',chgP:'+0.89%',dir:1},
    {name:'Mothers Index',val:'718.34',chg:'-8.42',chgP:'-1.16%',dir:-1},
  ],
  news: [
    {src:'Nikkei Asia',time:'4m ago',ticker:'7203.T',title:'Toyota raises FY25 profit outlook by 12%; yen weakness adds ¥280B to operating income',sent:'BULL',impact:0.90},
    {src:'Reuters',time:'13m ago',ticker:'6758.T',title:'Sony PlayStation 5 Pro pre-orders exceed 3M in 72 hours; gaming segment FY guidance raised',sent:'BULL',impact:0.84},
    {src:'Bloomberg',time:'21m ago',ticker:'9984.T',title:'SoftBank Vision Fund 2 marks down WeWork exposure; NAV shrinks ¥180B in Q4',sent:'BEAR',impact:0.79},
    {src:'FT Japan',time:'30m ago',ticker:'7974.T',title:'Nintendo Switch 2 development confirmed; launch window set for Q1 FY2026',sent:'BULL',impact:0.86},
    {src:'Nikkei',time:'41m ago',ticker:'7267.T',title:'Honda EV partnership with GM produces first joint platform; ¥2.5T capex plan announced',sent:'BULL',impact:0.77},
    {src:'WSJ Japan',time:'51m ago',ticker:'8058.T',title:'Mitsubishi Corp. commodity trading margins compress on China demand slowdown',sent:'NEUT',impact:0.58},
    {src:'JP Morgan',time:'1h ago',ticker:'6752.T',title:'Panasonic EV battery capacity expansion ahead of schedule; Tesla supply contract renewed',sent:'BULL',impact:0.73},
    {src:'Nikkei Asia',time:'1h ago',ticker:'9432.T',title:'NTT data revenue flat; domestic enterprise IT spending cuts weigh on FY25 outlook',sent:'BEAR',impact:0.62},
  ],
  corr: [
    {sym:'7203.T',mentions:7214,score:0.88,dir:1},
    {sym:'7974.T',mentions:4821,score:0.83,dir:1},
    {sym:'6758.T',mentions:3982,score:0.76,dir:1},
    {sym:'9984.T',mentions:3401,score:-0.68,dir:-1},
    {sym:'9432.T',mentions:1842,score:-0.54,dir:-1},
    {sym:'8058.T',mentions:1421,score:0.31,dir:1},
  ],
  aiExplains: {
    '7203.T': 'Toyota is the dominant bullish conviction in Japanese markets. Yen weakness is a structural tailwind adding hundreds of billions in operating income. Hybrid demand is at record highs globally.',
    '6758.T': 'Sony is bullish. PS5 Pro demand far exceeds supply estimates. The gaming segment\'s re-acceleration combined with strong entertainment and semiconductor revenue makes Sony a high-conviction pick.',
    '9984.T': 'SoftBank is bearish. Vision Fund 2 mark-downs continue and NAV remains under pressure. Arm Holdings IPO gains are partially offset by legacy portfolio write-downs.',
    '7974.T': 'Nintendo is strongly bullish. Switch 2 confirmation removes the biggest overhang. IP monetisation through mobile and entertainment is creating durable recurring revenue streams.',
    '7267.T': 'Honda is bullish. The GM EV partnership reduces R&D capital intensity. Yen weakness supercharges near-term earnings while long-term EV positioning improves.',
    '8058.T': 'Neutral. Mitsubishi Corp. is caught between strong energy earnings and weaker industrial metals. The China slowdown is compressing commodity trading margins.',
    '6752.T': 'Bullish. Panasonic\'s battery supply deal renewal with Tesla provides multi-year revenue visibility. EV capacity expansion ahead of schedule is a positive signal.',
    '9432.T': 'Bearish. NTT faces structural headwinds from flat enterprise IT spending domestically. The dividend yield provides support but growth is scarce.',
  },
};

// ── COMMODITIES ───────────────────────────────────────────────────────────────
const COMMODITIES: Market = {
  id: 'CMDTY',
  name: 'Commodities',
  flag: '🏅',
  currency: '$',
  exchange: 'NYMEX / COMEX',
  benchmarkLabel: 'Gold $/oz',
  benchmarkVal: '2,330.00',
  vixLabel: 'WTI Oil',
  vixVal: '78.40',
  timezone: 'EST',
  stocks: [
    {sym:'GOLD',name:'Gold Futures',price:2330.00,chg:12.50,chgP:0.54,sig:'BULL',conf:82,target:2450,days:7,vol:'—',pe:'—'},
    {sym:'SILVER',name:'Silver Futures',price:27.42,chg:0.38,chgP:1.41,sig:'BULL',conf:74,target:30,days:7,vol:'—',pe:'—'},
    {sym:'OIL_WTI',name:'WTI Crude Oil',price:78.40,chg:-0.82,chgP:-1.03,sig:'NEUT',conf:55,target:76,days:5,vol:'—',pe:'—'},
    {sym:'OIL_BRENT',name:'Brent Crude Oil',price:82.35,chg:-0.71,chgP:-0.85,sig:'NEUT',conf:52,target:80,days:5,vol:'—',pe:'—'},
    {sym:'NAT_GAS',name:'Natural Gas',price:2.18,chg:0.04,chgP:1.87,sig:'NEUT',conf:48,target:2.50,days:7,vol:'—',pe:'—'},
    {sym:'COPPER',name:'Copper Futures',price:4.42,chg:0.08,chgP:1.84,sig:'BULL',conf:71,target:4.80,days:7,vol:'—',pe:'—'},
  ],
  indices: [
    {name:'Gold $/oz',val:'2,330.00',chg:'+12.50',chgP:'+0.54%',dir:1},
    {name:'Silver $/oz',val:'27.42',chg:'+0.38',chgP:'+1.41%',dir:1},
    {name:'WTI $/bbl',val:'78.40',chg:'-0.82',chgP:'-1.03%',dir:-1},
    {name:'Nat Gas',val:'2.18',chg:'+0.04',chgP:'+1.87%',dir:1},
  ],
  news: [
    {src:'Reuters',time:'5m ago',ticker:'GOLD',title:"Gold edges higher as dollar weakens; central bank buying surges to 30-year highs",sent:'BULL',impact:0.82},
    {src:'Bloomberg',time:'13m ago',ticker:'OIL_WTI',title:'Oil slips on demand concerns; OPEC+ compliance under scrutiny as production rises',sent:'BEAR',impact:0.74},
    {src:'FT',time:'22m ago',ticker:'SILVER',title:'Silver rallies on industrial demand; solar panel production hits record high in Q1',sent:'BULL',impact:0.77},
    {src:'Reuters',time:'34m ago',ticker:'COPPER',title:'Copper surges on China stimulus hopes; LME inventory falls to 3-year lows',sent:'BULL',impact:0.81},
    {src:'Bloomberg',time:'47m ago',ticker:'NAT_GAS',title:'Natural gas inventories beat estimates; mild weather forecast weighs on near-term prices',sent:'BEAR',impact:0.58},
    {src:'Bloomberg',time:'1h ago',ticker:'OIL_BRENT',title:'Brent crude consolidates near $82; Middle East risk premium fading on ceasefire talks',sent:'NEUT',impact:0.55},
  ],
  corr: [
    {sym:'GOLD',mentions:8421,score:0.82,dir:1},
    {sym:'OIL_WTI',mentions:6204,score:-0.61,dir:-1},
    {sym:'COPPER',mentions:4182,score:0.79,dir:1},
    {sym:'SILVER',mentions:3841,score:0.74,dir:1},
    {sym:'NAT_GAS',mentions:2104,score:-0.48,dir:-1},
  ],
  aiExplains: {
    GOLD: 'Gold is in a sustained bullish cycle driven by record central bank purchases and rising geopolitical risk premiums. Real yields remain suppressed and dollar weakness is a structural tailwind for the precious metal.',
    SILVER: 'Silver is bullish on dual demand — safe-haven investment flows and surging industrial use in solar panels and EV batteries. The gold-silver ratio at 85x suggests silver has significant upside relative to gold.',
    OIL_WTI: 'WTI crude is neutral. OPEC+ compliance uncertainty and demand softness from China offset geopolitical supply risk. The $75–$85 range is the near-term trading band, with downside risks building.',
    OIL_BRENT: 'Brent crude is neutral. Middle East risk premium is fading as ceasefire talks progress. Global demand remains mixed — developed market softness is offsetting emerging market growth, particularly India.',
    NAT_GAS: 'Natural gas is neutral to bearish near-term. Mild weather forecasts suppress demand. However, record LNG export infrastructure additions in 2025 create a medium-term structural demand floor.',
    COPPER: 'Copper is strongly bullish. The energy transition requires 3× more copper than traditional infrastructure. China stimulus and LME inventory depletion are powerful near-term catalysts for further upside.',
  },
};

export const MARKETS: Record<string, Market> = { IN: INDIA, US: USA, CN: CHINA, JP: JAPAN, CMDTY: COMMODITIES };
export const MARKET_ORDER = ['IN', 'US', 'CN', 'JP', 'CMDTY'];

export type WarAsset = { sym: string; dir: 1 | -1; pct: string };
export type WarEvent = {
  id: string;
  event: string;
  region: string;
  flag: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  assets: WarAsset[];
  summary: string;
  updated: string;
};

export const WAR_EVENTS: WarEvent[] = [
  {
    id: 'IN_PK',
    event: 'India–Pakistan Escalation',
    region: 'South Asia · LOC',
    flag: '🇮🇳🇵🇰',
    severity: 'HIGH',
    assets: [
      { sym: 'NIFTY 50', dir: -1, pct: '-2.8%' },
      { sym: 'INR/USD', dir: -1, pct: '-1.6%' },
      { sym: 'GOLD', dir: 1, pct: '+3.9%' },
      { sym: 'DEF ETF', dir: 1, pct: '+4.2%' },
    ],
    summary: 'Border escalation triggers risk-off in Indian equities. Defence names and gold surge on safe-haven demand. INR under pressure as FIIs pare positions.',
    updated: '18m ago',
  },
  {
    id: 'RU_UA',
    event: 'Russia–Ukraine War',
    region: 'Eastern Europe',
    flag: '🇷🇺🇺🇦',
    severity: 'HIGH',
    assets: [
      { sym: 'WHEAT', dir: 1, pct: '+18.4%' },
      { sym: 'NAT GAS', dir: 1, pct: '+22.1%' },
      { sym: 'OIL BRENT', dir: 1, pct: '+11.3%' },
      { sym: 'GOLD', dir: 1, pct: '+8.7%' },
    ],
    summary: 'Black Sea grain corridor disruptions drive wheat premium. European gas supply risk keeps energy elevated. Safe-haven flows sustain gold at multi-year highs.',
    updated: '2h ago',
  },
  {
    id: 'ME_CONFLICT',
    event: 'Middle East Conflict',
    region: 'Israel · Gaza · Lebanon',
    flag: '🇮🇱🇱🇧',
    severity: 'HIGH',
    assets: [
      { sym: 'OIL WTI', dir: 1, pct: '+6.2%' },
      { sym: 'GOLD', dir: 1, pct: '+5.4%' },
      { sym: 'SILVER', dir: 1, pct: '+3.1%' },
      { sym: 'US TREAS', dir: 1, pct: '+1.8%' },
    ],
    summary: 'Strait of Hormuz risk premium keeps crude elevated. Safe-haven flows into gold, silver, and US Treasuries as conflict spreads toward Lebanon border.',
    updated: '45m ago',
  },
  {
    id: 'TW_STRAIT',
    event: 'Taiwan Strait Tension',
    region: 'Taiwan · China · USA',
    flag: '🇹🇼🇨🇳',
    severity: 'MED',
    assets: [
      { sym: 'SEMIS', dir: -1, pct: '-4.8%' },
      { sym: 'TSMC', dir: -1, pct: '-6.1%' },
      { sym: 'GOLD', dir: 1, pct: '+2.9%' },
      { sym: 'USD/TWD', dir: 1, pct: '+1.3%' },
    ],
    summary: 'TSMC supply chain risk drives semiconductor sector volatility. PLA naval exercises near strait elevate geopolitical premium across Asia-Pacific markets.',
    updated: '1h ago',
  },
];

export const COUNTRY_DATA: Record<number, {
  name: string; score: number; sig: string; sector: string; trend: string;
  headlines: string[]; ai: string;
}> = {
  840:{name:'United States',score:0.72,sig:'BULL',sector:'Technology',trend:'↑',headlines:['Fed signals pause on rate hikes','Big Tech earnings beat expectations','AI infrastructure spending boom continues'],ai:'The US shows strongly bullish sentiment driven by AI sector momentum and tech earnings beats. Federal Reserve signaling a hold on rates reduces near-term macro risk.'},
  276:{name:'Germany',score:-0.48,sig:'BEAR',sector:'Manufacturing',trend:'↓',headlines:['Manufacturing PMI falls to 42.1, 7-month low','Energy costs squeeze industrial margins','ECB holds but outlook cautious'],ai:'Germany exhibits bearish macro conditions. Declining manufacturing output, elevated energy costs and weak PMI signals point to continued contraction in the industrial sector.'},
  156:{name:'China',score:-0.31,sig:'BEAR',sector:'Real Estate',trend:'↓',headlines:['Property sector debt crisis deepens','Consumer spending below expectations','PBOC cuts reserve requirements again'],ai:'China faces persistent bearish pressure from property market deleveraging and weak domestic demand. Policy stimulus is insufficient to offset structural headwinds.'},
  392:{name:'Japan',score:0.44,sig:'BULL',sector:'Export / Tech',trend:'↑',headlines:['Yen weakness boosts exporters','Toyota, Sony raise annual guidance','BoJ maintains ultra-loose policy'],ai:'Japan shows moderate bullish momentum. A weak yen is boosting export-oriented companies. Technology and automotive sectors benefit from sustained global demand.'},
  826:{name:'United Kingdom',score:0.12,sig:'NEUT',sector:'Finance',trend:'→',headlines:['UK inflation cools to 2.3%','FTSE 100 near all-time high','BoE rate cut expected Q3'],ai:'UK sentiment is neutral-to-slightly-positive. Cooling inflation and expectations of BoE rate cuts support equities, though growth remains tepid amid fiscal constraints.'},
  356:{name:'India',score:0.81,sig:'BULL',sector:'Technology / Finance',trend:'↑',headlines:['India GDP growth accelerates to 8.4%','Nifty 50 hits record high','Foreign institutional inflows surge'],ai:'India is the strongest bullish signal globally. Robust GDP growth, record equity markets, and surging FII inflows reflect strong macro fundamentals and tech sector expansion.'},
  76:{name:'Brazil',score:-0.22,sig:'NEUT',sector:'Commodities',trend:'↓',headlines:['Real depreciates amid fiscal concerns','Commodity exports soften','Lula administration raises spending'],ai:'Brazil shows mildly bearish sentiment. Currency weakness and fiscal concerns offset commodity export strength. Political uncertainty weighs on investor confidence.'},
  124:{name:'Canada',score:0.38,sig:'BULL',sector:'Energy / Finance',trend:'↑',headlines:['Oil sands production at record','BoC rate cut cycle begins','TSX financials outperforming'],ai:'Canada shows moderate bullish signals driven by energy sector performance and the start of a BoC easing cycle, which is supportive for equities and housing.'},
  36:{name:'Australia',score:0.29,sig:'NEUT',sector:'Mining / Resources',trend:'→',headlines:['RBA holds rates steady','Iron ore prices stabilise','Consumer confidence ticks up'],ai:'Australia shows neutral sentiment. Stable commodity prices and steady monetary policy create a balanced outlook. Consumer resilience partially offsets global demand uncertainty.'},
  250:{name:'France',score:0.17,sig:'NEUT',sector:'Luxury / Industry',trend:'→',headlines:['LVMH revenue growth moderates','French industrial output flat','ECB policy uncertainty lingers'],ai:'France is neutral. Luxury goods sector shows moderation after years of strong growth. Industrial output stagnation and ECB uncertainty keep sentiment balanced.'},
  643:{name:'Russia',score:-0.88,sig:'BEAR',sector:'Energy / Sanctions',trend:'↓',headlines:['Western sanctions expand to new sectors','Ruble under pressure','Oil revenue constrained by price caps'],ai:'Russia shows deeply bearish sentiment. Expanded sanctions and oil price caps severely constrain economic activity. Geopolitical risk premium remains extremely elevated.'},
  410:{name:'South Korea',score:0.55,sig:'BULL',sector:'Semiconductors',trend:'↑',headlines:['Samsung boosts chip capex by 40%','KOSPI rallies on AI chip demand','Memory chip prices recover sharply'],ai:'South Korea displays strong bullish signals from the semiconductor cycle recovery. Samsung and SK Hynix benefit directly from the global AI infrastructure buildout.'},
};

export function getCountryColor(id: number): string {
  const d = COUNTRY_DATA[id];
  if (!d) return '#1a2535';
  if (d.sig === 'BULL') return d.score > 0.6 ? '#006644' : '#008855';
  if (d.sig === 'BEAR') return d.score < -0.6 ? '#991a1a' : '#cc2222';
  return '#665500';
}
