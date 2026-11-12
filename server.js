// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import getEventsHandler from './api/get-events.js';
import getWingsHandler from './api/get-wings.js';
import imageProxyHandler from './api/image-proxy.js';
import getGalleryMediaHandler from './api/get-gallery-media.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  for (const [key, value] of Object.entries({"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Content-Security-Policy": "object-src 'none'; base-uri 'self'; frame-ancestors 'none'"})) res.setHeader(key, value);
  next();
});
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));


// Fallback static middleware for root-level files (HTML, CSS, JS)
const publicFiles = new Set(['index.html', 'about.html', 'contact.html', 'cookies.html', 'event-details.html', 'events.html', 'gallery.html', 'library.html', 'privacy.html', 'terms.html', 'wings.html', 'robots.txt', 'sitemap.xml', 'books.json', 'google99a9a8b91fff1b72.html']);
app.use((req, res, next) => {
  const name = req.path.replace(/^\//, '');
  if (req.path === '/' || publicFiles.has(name) || /^(assets|css|js)\//.test(name)) return express.static(process.cwd(), { dotfiles: 'deny' })(req, res, next);
  next();
});

// API Endpoints
app.get('/api/get-events', (req, res) => getEventsHandler(req, res));
app.get('/api/get-wings', (req, res) => getWingsHandler(req, res));
app.get('/api/image-proxy', (req, res) => imageProxyHandler(req, res));
app.get('/api/get-gallery-media', (req, res) => getGalleryMediaHandler(req, res));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

export default app;