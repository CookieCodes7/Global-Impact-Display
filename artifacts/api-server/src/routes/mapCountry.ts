import { Router } from "express";
import { getYF } from "../lib/yf";

interface RawNews {
  uuid?: string;
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: unknown;
  relatedTickers?: string[];
  thumbnail?: { resolutions?: { url?: string; width?: number }[] };
}

const COUNTRY_CONFIG: Record<number, {
  indices: string[];
  indexLabels: Record<string, string>;
  newsSymbols: string[];
}> = {
  840: {
    indices: ["^GSPC", "^IXIC", "^DJI"],
    indexLabels: { "^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^DJI": "Dow Jones" },
    newsSymbols: ["^GSPC", "AAPL", "MSFT", "NVDA"],
  },
  356: {
    indices: ["^NSEI", "^BSESN"],
    indexLabels: { "^NSEI": "Nifty 50", "^BSESN": "Sensex" },
    newsSymbols: ["^NSEI", "RELIANCE.NS", "TCS.NS", "INFY.NS"],
  },
  156: {
    indices: ["^HSI", "000001.SS"],
    indexLabels: { "^HSI": "Hang Seng", "000001.SS": "SSE Composite" },
    newsSymbols: ["^HSI", "9988.HK", "700.HK", "BABA"],
  },
  392: {
    indices: ["^N225", "^TOPX"],
    indexLabels: { "^N225": "Nikkei 225", "^TOPX": "TOPIX" },
    newsSymbols: ["^N225", "7203.T", "6758.T", "9984.T"],
  },
  276: {
    indices: ["^GDAXI", "^STOXX50E"],
    indexLabels: { "^GDAXI": "DAX 40", "^STOXX50E": "EURO STOXX 50" },
    newsSymbols: ["^GDAXI", "SAP", "SIEGY"],
  },
  826: {
    indices: ["^FTSE"],
    indexLabels: { "^FTSE": "FTSE 100" },
    newsSymbols: ["^FTSE", "SHEL", "AZN"],
  },
  76: {
    indices: ["^BVSP"],
    indexLabels: { "^BVSP": "Bovespa" },
    newsSymbols: ["^BVSP", "VALE", "PBR"],
  },
  124: {
    indices: ["^GSPTSE"],
    indexLabels: { "^GSPTSE": "TSX Composite" },
    newsSymbols: ["^GSPTSE", "ENB", "RY"],
  },
  36: {
    indices: ["^AXJO"],
    indexLabels: { "^AXJO": "ASX 200" },
    newsSymbols: ["^AXJO", "BHP", "CBA.AX"],
  },
  250: {
    indices: ["^FCHI"],
    indexLabels: { "^FCHI": "CAC 40" },
    newsSymbols: ["^FCHI", "MC.PA", "OR.PA"],
  },
  643: {
    indices: [],
    indexLabels: {},
    newsSymbols: [],
  },
  410: {
    indices: ["^KS11"],
    indexLabels: { "^KS11": "KOSPI" },
    newsSymbols: ["^KS11", "005930.KS", "000660.KS"],
  },
};

const router = Router();

router.get("/map/country", async (req, res) => {
  const id = parseInt(req.query.id as string);
  const config = COUNTRY_CONFIG[id];
  if (!config) {
    res.status(404).json({ error: "Country not found" });
    return;
  }

  if (config.indices.length === 0 && config.newsSymbols.length === 0) {
    res.json({ indices: [], news: [], fetchedAt: new Date().toISOString() });
    return;
  }

  try {
    const yf = await getYF();

    const [indicesSettled, newsSettled] = await Promise.all([
      Promise.allSettled(
        config.indices.map(sym =>
          (yf.quote(sym, {} as object) as Promise<Record<string, unknown>>).then(q => ({
            sym,
            label: config.indexLabels[sym] ?? sym,
            price: (q.regularMarketPrice as number) ?? 0,
            change: (q.regularMarketChange as number) ?? 0,
            changePercent: (q.regularMarketChangePercent as number) ?? 0,
          }))
        )
      ),
      Promise.allSettled(
        config.newsSymbols.slice(0, 4).map(sym =>
          (yf.search(sym, { newsCount: 10, enableFuzzyQuery: false } as object) as Promise<Record<string, unknown>>)
            .then(r => (r.news ?? []) as RawNews[])
            .catch(() => [] as RawNews[])
        )
      ),
    ]);

    const indices = indicesSettled
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<{ sym: string; label: string; price: number; change: number; changePercent: number }>).value);

    const seen = new Set<string>();
    const articles: object[] = [];
    for (const r of newsSettled) {
      if (r.status !== "fulfilled") continue;
      for (const n of r.value) {
        const key = n.uuid ?? n.link ?? "";
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const t = n.providerPublishTime;
        let publishedAt: string | null = null;
        if (typeof t === "number" && t > 0) {
          const ms = t < 1e12 ? t * 1000 : t;
          const d = new Date(ms);
          if (!isNaN(d.getTime()) && d.getFullYear() > 2000) publishedAt = d.toISOString();
        } else if (t instanceof Date) {
          publishedAt = (t as Date).toISOString();
        }

        let thumbnail: string | null = null;
        const resolutions = n.thumbnail?.resolutions ?? [];
        const sorted = [...resolutions].filter(r2 => r2.url).sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
        if (sorted.length > 0) {
          const raw = sorted[0].url ?? "";
          const m = raw.match(/~B\/[^/]+\/(https?:\/\/.+)/);
          thumbnail = m ? m[1] : raw;
        }

        articles.push({
          uuid: n.uuid ?? key,
          title: n.title ?? "",
          publisher: n.publisher ?? "",
          link: n.link ?? "",
          publishedAt,
          relatedTickers: n.relatedTickers ?? [],
          thumbnail,
        });
      }
    }

    articles.sort((a, b) => {
      const ta = (a as { publishedAt: string | null }).publishedAt;
      const tb = (b as { publishedAt: string | null }).publishedAt;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return tb.localeCompare(ta);
    });

    res.json({
      indices,
      news: articles.slice(0, 8),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "map country fetch failed");
    res.status(502).json({ error: "fetch failed" });
  }
});

export default router;
