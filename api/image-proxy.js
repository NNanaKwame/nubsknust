// api/image-proxy.js

export default async function imageProxyHandler(req, res) {
  const fileId = req.query.id;
  const width = parseInt(req.query.w, 10);

  if (!fileId) return res.status(400).send("Missing file ID");

  try {
    let directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    // Optional ?w= param lets callers request a resized version instead of
    // always downloading the full-resolution original. Google's CDN does the
    // resizing/compression on its end, so we never touch the original bytes.
    if (Number.isFinite(width) && width > 0) {
      const clampedWidth = Math.min(Math.max(width, 50), 2000); // sane bounds
      directUrl += `=w${clampedWidth}`;
    }

    const response = await fetch(directUrl);

    if (!response.ok) return res.status(response.status).send("Failed to fetch image");

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache locally for 24h
    return res.send(buffer);
  } catch (err) {
    console.error("Image proxy error:", err);
    return res.status(500).send("Server error fetching image");
  }
}