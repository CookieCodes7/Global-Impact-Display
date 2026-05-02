import { Router } from "express";

const router = Router();

const ALLOWED_HOSTS = [
  "s.yimg.com",
  "media.zenfs.com",
  "i.imgur.com",
  "images.wsj.net",
  "si.wsj.net",
  "static.foxbusiness.com",
  "image.cnbc.com",
  "media.cnn.com",
  "assets.bwbx.io",
  "www.reuters.com",
  "cloudfront-us-east-2.images.arcpublishing.com",
  "dims.apnews.com",
];

router.get("/img", async (req, res) => {
  const rawUrl = req.query.url as string | undefined;
  if (!rawUrl) {
    res.status(400).json({ error: "url required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "invalid url" });
    return;
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.status(403).json({ error: "host not allowed" });
    return;
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MarketPulse/1.0)",
        "Referer": "https://finance.yahoo.com/",
        "Accept": "image/webp,image/avif,image/*,*/*",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      res.status(502).json({ error: `upstream ${response.status}` });
      return;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    req.log.warn({ err, url: rawUrl }, "img proxy failed");
    res.status(502).json({ error: "fetch failed" });
  }
});

export default router;
