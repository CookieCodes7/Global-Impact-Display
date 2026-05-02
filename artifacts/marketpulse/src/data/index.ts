export const STOCKS = [
  {sym:'AAPL',name:'Apple Inc.',price:213.45,chg:1.24,chgP:0.58,sig:'BULL',conf:82,target:228,days:7,vol:'48.3M',pe:'28.4'},
  {sym:'TSLA',name:'Tesla Inc.',price:172.30,chg:-3.82,chgP:-2.17,sig:'BEAR',conf:71,target:158,days:5,vol:'91.7M',pe:'62.1'},
  {sym:'NVDA',name:'NVIDIA Corp.',price:887.54,chg:12.30,chgP:1.41,sig:'BULL',conf:91,target:950,days:7,vol:'39.8M',pe:'73.2'},
  {sym:'MSFT',name:'Microsoft Corp.',price:421.10,chg:2.55,chgP:0.61,sig:'BULL',conf:78,target:445,days:7,vol:'22.1M',pe:'37.9'},
  {sym:'AMZN',name:'Amazon.com Inc.',price:194.72,chg:-0.83,chgP:-0.42,sig:'NEUT',conf:55,target:200,days:5,vol:'35.4M',pe:'43.7'},
  {sym:'META',name:'Meta Platforms',price:512.88,chg:8.14,chgP:1.61,sig:'BULL',conf:85,target:555,days:7,vol:'18.2M',pe:'27.3'},
  {sym:'GOOGL',name:'Alphabet Inc.',price:175.23,chg:1.02,chgP:0.59,sig:'BULL',conf:74,target:188,days:7,vol:'25.6M',pe:'24.8'},
  {sym:'JPM',name:'JPMorgan Chase',price:221.45,chg:-1.23,chgP:-0.55,sig:'BEAR',conf:62,target:210,days:5,vol:'11.3M',pe:'12.4'},
];

export const INDICES = [
  {name:'S&P 500',val:'5,284.21',chg:'+18.43',chgP:'+0.35%',dir:1},
  {name:'NASDAQ',val:'16,742.39',chg:'+93.17',chgP:'+0.56%',dir:1},
  {name:'DOW JONES',val:'39,127.14',chg:'-42.81',chgP:'-0.11%',dir:-1},
  {name:'RUSSELL 2K',val:'2,083.45',chg:'+11.22',chgP:'+0.54%',dir:1},
];

export const NEWS = [
  {src:'Reuters',time:'2m ago',ticker:'NVDA',title:'NVIDIA beats Q1 earnings estimates by 28%, data center revenue surges to record $22B',sent:'BULL',impact:0.92},
  {src:'Bloomberg',time:'8m ago',ticker:'TSLA',title:'Tesla cuts Model Y prices in Europe amid slowing demand; analysts revise targets lower',sent:'BEAR',impact:0.81},
  {src:'WSJ',time:'15m ago',ticker:'AAPL',title:"Apple's Vision Pro 2 development confirmed; mixed reality pipeline stronger than expected",sent:'BULL',impact:0.74},
  {src:'CNBC',time:'22m ago',ticker:'JPM',title:'Fed minutes signal rates on hold longer; financial sector faces headwinds into Q3',sent:'BEAR',impact:0.69},
  {src:'FT',time:'31m ago',ticker:'META',title:'Meta AI assistant reaches 500M users, Zuckerberg forecasts ad revenue acceleration',sent:'BULL',impact:0.88},
  {src:'MarketWatch',time:'44m ago',ticker:'AMZN',title:'Amazon AWS growth slows to 17% YoY; cloud margin expansion offsets top-line miss',sent:'NEUT',impact:0.58},
  {src:'TheStreet',time:'52m ago',ticker:'MSFT',title:'Microsoft Copilot enterprise adoption doubles; Azure AI workloads driving $12B incremental ARR',sent:'BULL',impact:0.79},
  {src:'Barrons',time:'1h ago',ticker:'GOOGL',title:'Google Search ad market share recovers to 90.2% in April; Gemini integration credited',sent:'BULL',impact:0.65},
];

export const CORR = [
  {sym:'NVDA',mentions:4821,score:0.91,dir:1},
  {sym:'TSLA',mentions:3204,score:-0.74,dir:-1},
  {sym:'META',mentions:2887,score:0.83,dir:1},
  {sym:'AAPL',mentions:2103,score:0.61,dir:1},
  {sym:'JPM',mentions:1544,score:-0.52,dir:-1},
  {sym:'MSFT',mentions:1288,score:0.69,dir:1},
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

export const AI_EXPLAINS: Record<string, string> = {
  AAPL: 'News sentiment strongly positive (+0.74). Earnings whispers above consensus. Technical breakout above 200-day MA. Reddit/social volume: +34% WoW. Vision Pro pipeline is a fresh catalyst.',
  TSLA: 'Bearish signal driven by price cut pressure in EU markets and margin concerns. Short interest elevated at 3.4% float. Sentiment score: -0.62. Delivery guidance at risk.',
  NVDA: 'Dominant bullish signal. Earnings beat of 28% far exceeds expectations. Data center at $22B is 15% above estimates. AI infrastructure mega-cycle sustains premium valuation.',
  MSFT: 'Bullish on Copilot enterprise adoption doubling. Azure AI workloads are incremental ARR of $12B. Cloud margin expansion reinforces high-confidence signal.',
  AMZN: 'Neutral. AWS growth deceleration (17% YoY vs 21% expected) tempers upside. Cloud margin expansion partially offsets. Mixed signals warrant a hold posture.',
  META: 'Strong bullish. AI assistant user base at 500M signals advertising revenue acceleration. Efficiency ratio improving. Options flow unusually bullish this week.',
  GOOGL: 'Bullish. Search market share recovery to 90.2% removes a key risk. Gemini integration driving engagement metrics. Valuation remains attractive at 24.8x earnings.',
  JPM: 'Bearish. Fed rate hold for longer compresses NIM expansion timeline. Financial sector faces headwinds into Q3. Credit card delinquency data also ticking up.',
};

export type Stock = typeof STOCKS[number];
