// server.js
import express from 'express';
import dotenv from 'dotenv';

// Load .env file BEFORE importing or running routes
dotenv.config();

// API Route Handlers
import getEventsHandler from './api/get-events.js';
import getWingsHandler from './api/get-wings.js';
import imageProxyHandler from './api/image-proxy.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend assets
app.use(express.static('.'));

// API Endpoints
app.get('/api/get-events', (req, res) => getEventsHandler(req, res));
app.get('/api/get-wings', (req, res) => getWingsHandler(req, res));
app.get('/api/image-proxy', (req, res) => imageProxyHandler(req, res));

app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
    console.log(`Events Folder ID loaded: ${process.env.DRIVE_EVENTS_FOLDER_ID ? 'YES' : 'NO (Check .env)'}`);
});