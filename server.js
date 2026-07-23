// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file BEFORE importing or running routes
dotenv.config();

// ES Module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Route Handlers
import getEventsHandler from './api/get-events.js';
import getWingsHandler from './api/get-wings.js';
import imageProxyHandler from './api/image-proxy.js';
import contactHandler from './api/contact.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware (Required for POST requests like contact form)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from current directory
app.use(express.static(__dirname));

// Serve index.html on root route to prevent Vercel "Cannot GET /"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoints
app.get('/api/get-events', (req, res) => getEventsHandler(req, res));
app.get('/api/get-wings', (req, res) => getWingsHandler(req, res));
app.get('/api/image-proxy', (req, res) => imageProxyHandler(req, res));
app.post('/api/contact', (req, res) => contactHandler(req, res));

// Only start a local server listener when NOT on Vercel/Production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
    console.log(`Events Folder ID loaded: ${process.env.DRIVE_EVENTS_FOLDER_ID ? 'YES' : 'NO (Check .env)'}`);
  });
}

export default app;