// api/image-proxy.js

export default async function imageProxyHandler(req, res) {
  const fileId = req.query.id;
  const width = parseInt(req.query.w, 10);

  if (typeof fileId !== "string" || !/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return res.status(400).send("Invalid file ID");

  try {
    let directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    // Optional ?w= param lets callers request a resized version instead of
    // always downloading the full-resolution original. Google's CDN does the
    // resizing/compression on its end, so we never touch the original bytes.
    if (Number.isFinite(width) && width > 0) {
      const clampedWidth = Math.min(Math.max(width, 50), 2000); // sane bounds
      directUrl += `=w${clampedWidth}`;
    }

    const response = await fetch(directUrl, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) return res.status(response.status).send("Failed to fetch image");

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif|avif)(?:;|$)/i.test(contentType)) {
      await response.body?.cancel();
      return res.status(502).send("Unsupported image format");
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) return res.status(502).send("Image too large");
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache locally for 24h
    return res.send(buffer);
  } catch (err) {
    console.error("Image proxy error:", err);
    return res.status(500).send("Server error fetching image");
  }
}