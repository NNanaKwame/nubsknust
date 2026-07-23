// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import getEventsHandler from './api/get-events.js';
import getWingsHandler from './api/get-wings.js';
import imageProxyHandler from './api/image-proxy.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files locally
app.use(express.static(process.cwd()));

// API Endpoints
app.get('/api/get-events', (req, res) => getEventsHandler(req, res));
app.get('/api/get-wings', (req, res) => getWingsHandler(req, res));
app.get('/api/image-proxy', (req, res) => imageProxyHandler(req, res));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

export default app;