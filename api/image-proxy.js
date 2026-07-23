// api/image-proxy.js

export default async function imageProxyHandler(req, res) {
  const fileId = req.query.id;

  if (!fileId) return res.status(400).send("Missing file ID");

  try {
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
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