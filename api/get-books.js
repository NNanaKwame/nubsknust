// api/get-books.js
//
// Lists PDF books from a public Google Drive folder, extracts metadata
// (title, author, category, description) via Gemini, and returns them for
// the library page. Mirrors the pattern already used in get-events.js:
// same SDK (@google/generative-ai), same model fallback rotation, same
// in-memory response caching keyed by a content hash.
//
// To keep Gemini requests small and cheap, only the first few pages of
// each PDF are sent for analysis (via pdf-lib, a pure-JS library with no
// native dependencies — safe on Vercel's serverless runtime, unlike
// packages like `canvas` which require native compilation).
//
// Setup required:
//   - DRIVE_BOOKS_FOLDER_ID env var (a public Drive folder containing PDFs)
//   - GOOGLE_API_KEY and GEMINI_API_KEY (already used by get-events.js)
//
// Cover images: this deliberately does NOT attempt to render a PDF page as
// an image server-side. The frontend renders a clean CSS placeholder cover
// instead (gradient + icon + title, colored by category). Simpler, zero
// extra dependencies, and consistent with the site's existing badge-color
// system. Real cover art can be added later as a v2 (e.g. a matching image
// file per PDF) without changing this contract.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import dotenv from "dotenv";

dotenv.config();

const cache = {};
const INTRO_PAGES = 5; // only send the first N pages to Gemini, keeps requests small & cheap

const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
];

const VALID_BADGES = ["badge-indigo", "badge-sage", "badge-gold", "badge-clay", "badge-slate", "badge-sky"];

export default async function handler(req, res) {
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
  const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || "").trim();
  const folderId = (process.env.DRIVE_BOOKS_FOLDER_ID || "").trim();

  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 12;
  const pageToken = req.query.pageToken || "";

  if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !folderId) {
    return res.status(500).json({ error: "Missing configuration in environment variables" });
  }

  try {
    const qParam = encodeURIComponent(
      `'${folderId}' in parents and trashed = false and mimeType = 'application/pdf'`
    );
    let metadataUrl =
      `https://www.googleapis.com/drive/v3/files?q=${qParam}&orderBy=createdTime%20desc` +
      `&pageSize=${limit}&fields=nextPageToken,files(id,name,modifiedTime,createdTime)&key=${GOOGLE_API_KEY}`;

    if (pageToken) metadataUrl += `&pageToken=${pageToken}`;

    const driveResp = await fetch(metadataUrl);
    const driveData = await driveResp.json();

    if (driveData.error) {
      console.error("[DRIVE API ERROR]:", driveData.error);
      return res.status(500).json({ error: driveData.error.message });
    }

    const files = driveData.files || [];
    const nextPageToken = driveData.nextPageToken || null;

    if (files.length === 0) {
      return res.status(200).json({ items: [], nextPageToken: null });
    }

    const currentHash = files.map((f) => `${f.id}_${f.modifiedTime}`).join("|");
    const cacheKey = `books_${pageToken || "first_page"}_${limit}`;

    if (!cache[cacheKey]) cache[cacheKey] = { hash: null, data: null, nextPageToken: null };

    if (cache[cacheKey].hash === currentHash && cache[cacheKey].data) {
      console.log(`[CACHE HIT] Serving ${cacheKey} instantly from memory.`);
      return res.status(200).json({
        items: cache[cacheKey].data,
        nextPageToken: cache[cacheKey].nextPageToken,
      });
    }

    console.log(`[CACHE MISS] Processing ${files.length} books for ${cacheKey}...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const parsedPromises = files.map(async (file) => {
      try {
        // Download the full PDF, then trim to just the intro pages before
        // sending to Gemini — keeps the request small regardless of the
        // book's actual length.
        const pdfUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`;
        const pdfResp = await fetch(pdfUrl);
        if (!pdfResp.ok) throw new Error(`PDF fetch failed (${pdfResp.status})`);

        const fullBytes = await pdfResp.arrayBuffer();
        const fullDoc = await PDFDocument.load(fullBytes, { ignoreEncryption: true });

        const introDoc = await PDFDocument.create();
        const pageCount = Math.min(INTRO_PAGES, fullDoc.getPageCount());
        const copiedPages = await introDoc.copyPages(fullDoc, Array.from({ length: pageCount }, (_, i) => i));
        copiedPages.forEach((p) => introDoc.addPage(p));

        const introBytes = await introDoc.save();
        const base64Intro = Buffer.from(introBytes).toString("base64");

        const prompt = `
          Analyze these introductory pages of a book.
          Extract details in strict JSON format:
          - title: The exact book title.
          - author: The author's name.
          - category: choose exactly one of: devotional, doctrine, leadership, outreach.
          - categoryName: A human-readable label for that category (e.g. "Devotional").
          - badgeClass: choose exactly one of: badge-indigo, badge-sage, badge-gold, badge-clay, badge-slate, badge-sky.
          - description: A concise 1-2 sentence summary of what the book is about.
        `;

        let aiResult = null;
        let success = false;

        for (const modelName of MODEL_CANDIDATES) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { responseMimeType: "application/json" },
            });

            aiResult = await model.generateContent([
              prompt,
              { inlineData: { data: base64Intro, mimeType: "application/pdf" } },
            ]);

            success = true;
            break;
          } catch (modelErr) {
            console.warn(`[MODEL WARN] ${modelName} failed for ${file.name}: ${modelErr.message}. Trying next...`);
          }
        }

        if (!success || !aiResult) {
          console.error(`[FILE ERROR] All fallback models failed for ${file.name}`);
          return null;
        }

        const parsed = JSON.parse(aiResult.response.text());

        return {
          id: file.id,
          title: parsed.title || file.name.replace(/\.pdf$/i, ""),
          author: parsed.author || "Unknown",
          category: parsed.category || "devotional",
          categoryName: parsed.categoryName || "Devotional",
          badgeClass: VALID_BADGES.includes(parsed.badgeClass) ? parsed.badgeClass : "badge-indigo",
          description: parsed.description || "",
          driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
          createdTime: file.createdTime,
        };
      } catch (err) {
        console.error(`[FILE ERROR] Failed processing ${file.name}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(parsedPromises);
    const items = results.filter((item) => item !== null);

    cache[cacheKey] = { hash: currentHash, data: items, nextPageToken };

    return res.status(200).json({ items, nextPageToken });
  } catch (error) {
    console.error("[TOP HANDLER ERROR]:", error);
    return res.status(500).json({ error: "Failed to load library", details: error.message });
  }
}