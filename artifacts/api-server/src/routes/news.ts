import { Router } from "express";
import { getYF } from "../lib/yf";

const router = Router();

// Market → search symbols
const MARKET_SYMBOLS: Record<string, string[]> = {
  IN: ["^NSEI", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "BHARTIARTL.NS"],
  US: ["^GSPC", "AAPL", "MSFT", "NVDA", "AMZN", "TSLA"],
  CN: ["^HSI", "9988.HK", "700.HK", "3690.HK", "BABA"],
  JP: ["^N225", "7203.T", "6758.T", "9984.T", "6861.T"],
};

const ALL_SYMBOLS = [...new Set(Object.values(MARKET_SYMBOLS).flat())];

function parsePublishTime(t: unknown): string | null {
  if (!t) return null;
  if (t instanceof Date) return (t as Date).toISOString();
  if (typeof t === "number" && t > 0) {
    // Unix seconds
    const ms = t < 1e12 ? t * 1000 : t;
    const d = new Date(ms);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      return d.toISOString();
    }
  }
  return null;
}

type RawNews = {
  uuid?: string;
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: unknown;
  type?: string;
  relatedTickers?: string[];
  thumbnail?: { resolutions?: { url?: string; width?: number; height?: number; tag?: string }[] };
};

router.get("/news", async (req, res) => {
  const market = (req.query.market as string) ?? "ALL";
  const limit = Math.min(parseInt(req.query.limit as string) || 40, 60);

  const symbols = market === "ALL" ? ALL_SYMBOLS : (MARKET_SYMBOLS[market] ?? []);
  if (symbols.length === 0) {
    res.json({ articles: [], market, refreshedAt: new Date().toISOString() });
    return;
  }

  try {
    const yf = await getYF();

    // Fetch news for each symbol in parallel
    const results = await Promise.allSettled(
      symbols.map(sym =>
        yf.search(sym, { newsCount: 15, enableFuzzyQuery: false } as object)
          .then((r: Record<string, unknown>) => ({
            sym,
            news: (r.news ?? []) as RawNews[]
          }))
          .catch(() => ({ sym, news: [] as RawNews[] }))
      )
    );

    const seen = new Set<string>();
    const articles: object[] = [];

    // Merge and deduplicate
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const n of result.value.news) {
        const key = n.uuid ?? n.link ?? "";
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const publishedAt = parsePublishTime(n.providerPublishTime);

        // Extract highest-resolution thumbnail
        // Yahoo Finance returns 140x140 resized images via their CDN.
        // The original full-res source URL is embedded after the base64 params:
        // https://s.yimg.com/uu/api/res/1.2/{HASH}~B/{BASE64}/{ORIGINAL_URL}
        let thumbnailUrl: string | null = null;
        const resolutions = n.thumbnail?.resolutions ?? [];
        // Pick the largest available resolution
        const sorted = [...resolutions]
          .filter(r => r.url)
          .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
        if (sorted.length > 0) {
          const raw = sorted[0].url ?? "";
          // Try to extract original source URL from Yahoo CDN resizer
          const origMatch = raw.match(/~B\/[^/]+\/(https?:\/\/.+)/);
          thumbnailUrl = origMatch ? origMatch[1] : raw;
        }

        articles.push({
          uuid: n.uuid ?? key,
          title: n.title ?? "",
          publisher: n.publisher ?? "Unknown",
          link: n.link ?? "",
          publishedAt,
          relatedTickers: n.relatedTickers ?? [],
          thumbnail: thumbnailUrl,
        });
      }
    }

    // Sort by publishedAt desc (nulls last)
    articles.sort((a: object, b: object) => {
      const ta = (a as { publishedAt: string | null }).publishedAt;
      const tb = (b as { publishedAt: string | null }).publishedAt;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return tb.localeCompare(ta);
    });

    res.json({
      articles: articles.slice(0, limit),
      market,
      count: articles.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "news fetch failed");
    res.status(502).json({ error: "news fetch failed" });
  }
});

export default router;
