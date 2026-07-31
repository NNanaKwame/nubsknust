// api/get-books.js
//
// Walks a root Google Drive library folder whose immediate subfolders are
// topic categories (e.g. "Devotional", "Doctrine"), and lists PDFs inside
// each. The category comes from the folder name (mapped to one of 4 umbrella
// chips below) rather than asking Gemini to guess it — more reliable, since
// you've already organized the books yourself.
//
// Gemini is only used to extract title/author/description from each PDF's
// intro pages (via pdf-lib, pure JS, no native deps — safe on Vercel).
//
// Setup required:
//   - DRIVE_BOOKS_FOLDER_ID env var: the ROOT library folder ID (the one
//     containing your category subfolders, not a category folder itself)
//   - GOOGLE_API_KEY and GEMINI_API_KEY (already used by get-events.js)

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import dotenv from "dotenv";

dotenv.config();

const cache = {};
const INTRO_PAGES = 5; // only send the first N pages to Gemini, keeps requests small & cheap
const FOLDER_MIME = "application/vnd.google-apps.folder";

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// Maps your actual Drive subfolder names (lowercase) to one of 4 umbrella
// chip categories. Add new folder names here as your library grows —
// anything not listed falls back to "discipleship" (see FALLBACK_CATEGORY).
const FOLDER_CATEGORY_MAP = {
  "devotional": "devotional",
  "prayer": "devotional",
  "the holy spirit": "devotional",
  "purpose": "devotional",

  "doctrine": "doctrine",
  "faith": "doctrine",

  "leadership": "leadership",
  "finance": "leadership",

  "discipleship": "discipleship",
  "relationship": "discipleship",
  "lifestyle": "discipleship",
  "honour and loyalty": "discipleship",
  "honour loyalty": "discipleship",
};

const FALLBACK_CATEGORY = "discipleship";

const CATEGORY_META = {
  devotional: { categoryName: "Devotional", badgeClass: "badge-indigo" },
  doctrine: { categoryName: "Doctrine", badgeClass: "badge-gold" },
  leadership: { categoryName: "Leadership", badgeClass: "badge-sky" },
  discipleship: { categoryName: "Discipleship", badgeClass: "badge-sage" },
};

function mapFolderToCategory(folderName) {
  const key = folderName.trim().toLowerCase();
  if (FOLDER_CATEGORY_MAP[key]) return FOLDER_CATEGORY_MAP[key];
  console.warn(`[get-books] Unrecognized folder "${folderName}" — falling back to "${FALLBACK_CATEGORY}"`);
  return FALLBACK_CATEGORY;
}

async function listDriveChildren(folderId, apiKey, extraFields = "") {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(`files(id,name,mimeType${extraFields})`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${apiKey}`;

  const resp = await fetch(url);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.files || [];
}

export default async function handler(req, res) {
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
  const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || "").trim();
  const rootFolderId = (process.env.DRIVE_BOOKS_FOLDER_ID || "").trim();

  if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !rootFolderId) {
    return res.status(500).json({ error: "Missing configuration in environment variables" });
  }

  try {
    // 1. List category subfolders under the root
    const subfolders = (await listDriveChildren(rootFolderId, GOOGLE_API_KEY))
      .filter((f) => f.mimeType === FOLDER_MIME);

    // 2. List PDFs inside each category subfolder, tagged with its mapped category
    const fileGroups = await Promise.all(
      subfolders.map(async (folder) => {
        const category = mapFolderToCategory(folder.name);
        const files = (await listDriveChildren(folder.id, GOOGLE_API_KEY, ",modifiedTime,createdTime"))
          .filter((f) => f.mimeType === "application/pdf");
        return files.map((f) => ({ ...f, category }));
      })
    );
    const allFiles = fileGroups.flat();

    if (allFiles.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const currentHash = allFiles.map((f) => `${f.id}_${f.modifiedTime}`).join("|");
    const cacheKey = "books_all";

    if (!cache[cacheKey]) cache[cacheKey] = { hash: null, data: null };

    if (cache[cacheKey].hash === currentHash && cache[cacheKey].data) {
      console.log("[CACHE HIT] Serving library instantly from memory.");
      return res.status(200).json({ items: cache[cacheKey].data });
    }

    console.log(`[CACHE MISS] Processing ${allFiles.length} books across ${subfolders.length} categories...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const results = [];

    for (const file of allFiles) {
      try {
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
          continue;
        }

        const parsed = JSON.parse(aiResult.response.text());
        const meta = CATEGORY_META[file.category];

        results.push({
          id: file.id,
          title: parsed.title || file.name.replace(/\.pdf$/i, ""),
          author: parsed.author || "Unknown",
          category: file.category,
          categoryName: meta.categoryName,
          badgeClass: meta.badgeClass,
          description: parsed.description || "",
          driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
          createdTime: file.createdTime,
        });

      } catch (err) {
        console.error(`[FILE ERROR] Failed processing ${file.name}:`, err.message);
      }

      // 3-second delay between requests to strictly respect the ~20 RPM limit
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const items = results.filter((item) => item !== null);
    items.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    cache[cacheKey] = { hash: currentHash, data: items };

    return res.status(200).json({ items });
  } catch (error) {
    console.error("[TOP HANDLER ERROR]:", error);
    return res.status(500).json({ error: "Failed to load library", details: error.message });
  }
}