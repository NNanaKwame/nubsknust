// generate-books.js
// Run this locally via `node generate-books.js` whenever you add new books to Google Drive.
// It generates a static root books.json file, bypassing runtime API calls and rate limits.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || "").trim();
const rootFolderId = (process.env.DRIVE_BOOKS_FOLDER_ID || "").trim();

const INTRO_PAGES = 5; 
const FOLDER_MIME = "application/vnd.google-apps.folder";

// Allow model updates without changing the importer.
const MODEL_CANDIDATE = process.env.GEMINI_BOOK_MODEL || "gemini-3.8-flash";

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
  return FOLDER_CATEGORY_MAP[key] || FALLBACK_CATEGORY;
}

export async function listDriveChildren(folderId, apiKey, extraFields = "") {
  const files = [];
  let pageToken;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: `nextPageToken,files(id,name,mimeType${extraFields})`,
      pageSize: '1000', key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!resp.ok) throw new Error(`Drive listing failed (${resp.status})`);
    const data = await resp.json();
    if (data.error || !Array.isArray(data.files)) throw new Error('Invalid Drive listing');
    files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

// A failed import never replaces the published catalogue or marks a PDF current.
export async function syncBooks(files, existingItems, extract) {
  const existing = new Map(existingItems.map(book => [book.id, book]));
  const results = [];
  let processed = 0;
  for (const file of files) {
    const previous = existing.get(file.id);
    if (!file.modifiedTime) throw new Error(`Missing modifiedTime for ${file.id}`);
    const metadata = previous?.modifiedTime === file.modifiedTime
      ? previous
      : await extract(file);
    if (metadata !== previous) processed++;
    results.push({
      id: file.id,
      title: metadata.title || file.name.replace(/\.pdf$/i, ''),
      author: metadata.author || 'Unknown',
      category: file.category,
      ...CATEGORY_META[file.category],
      description: metadata.description || '',
      driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
    });
  }
  results.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime) || a.id.localeCompare(b.id));
  return { items: results, processed };
}

async function run() {
  if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !rootFolderId) {
    console.error("❌ Error: Missing configuration in .env (GOOGLE_API_KEY, GEMINI_API_KEY, or DRIVE_BOOKS_FOLDER_ID)");
    process.exit(1);
  }

  console.log("📂 Fetching category subfolders from Google Drive...");
  const subfolders = (await listDriveChildren(rootFolderId, GOOGLE_API_KEY))
    .filter((f) => f.mimeType === FOLDER_MIME);

  const fileGroups = await Promise.all(
    subfolders.map(async (folder) => {
      const category = mapFolderToCategory(folder.name);
      const files = (await listDriveChildren(folder.id, GOOGLE_API_KEY, ",modifiedTime,createdTime"))
        .filter((f) => f.mimeType === "application/pdf");
      return files.map((f) => ({ ...f, category }));
    })
  );

  const allFiles = fileGroups.flat();
  console.log(`📚 Found ${allFiles.length} total books across ${subfolders.length} categories. Processing with Gemini...`);

  const outputPath = fileURLToPath(new URL('./books.json', import.meta.url));
  const previous = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : { items: [] };
  if (!Array.isArray(previous.items)) throw new Error('Invalid existing catalogue');
  if (!allFiles.length && previous.items.length) throw new Error('Drive returned no PDFs; refusing to empty the existing catalogue.');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const { items, processed } = await syncBooks(allFiles, previous.items, async (file) => {
    console.log(`Parsing: ${file.name}`);
    const pdfUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`;
    const pdfResp = await fetch(pdfUrl);
    if (!pdfResp.ok) throw new Error(`PDF fetch failed (${pdfResp.status})`);

    const fullBytes = await pdfResp.arrayBuffer();
    const fullDoc = await PDFDocument.load(fullBytes, { ignoreEncryption: true });

    const introDoc = await PDFDocument.create();
    const pageCount = Math.min(INTRO_PAGES, fullDoc.getPageCount());
    const copiedPages = await introDoc.copyPages(fullDoc, Array.from({ length: pageCount }, (_, idx) => idx));
    copiedPages.forEach((p) => introDoc.addPage(p));

    const introBytes = await introDoc.save();
    const base64Intro = Buffer.from(introBytes).toString("base64");

    const model = genAI.getGenerativeModel({
      model: MODEL_CANDIDATE,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Analyze these introductory pages of a book.
      Extract details in strict JSON format:
      - title: The exact book title.
      - author: The author's name.
      - description: A concise 1-2 sentence summary of what the book is about.
    `;

    const aiResult = await model.generateContent([
      prompt,
      { inlineData: { data: base64Intro, mimeType: "application/pdf" } },
    ]);

    const parsed = JSON.parse(aiResult.response.text());
    if (!parsed || typeof parsed.title !== 'string' || !parsed.title.trim() ||
        typeof parsed.author !== 'string' || typeof parsed.description !== 'string') {
      throw new Error(`Invalid extracted metadata for ${file.name}`);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    return parsed;
  });

  const output = JSON.stringify({ items }, null, 2) + '\n';
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) {
    const temporaryPath = `${outputPath}.tmp`;
    fs.writeFileSync(temporaryPath, output);
    fs.renameSync(temporaryPath, outputPath);
  }
  console.log(`Catalogue ready: ${items.length} books; ${processed} processed, ${items.length - processed} unchanged.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    // Redact request URLs and credentials before reporting the actionable error.
    let detail = String(error.message || error).replace(/https?:\/\/[^\s]+/g, '[request URL]');
    for (const secret of [GOOGLE_API_KEY, GEMINI_API_KEY, rootFolderId]) {
      if (secret) detail = detail.split(secret).join('[redacted]');
    }
    console.error(detail.slice(0, 1200));
    console.error('Book sync failed. Existing catalogue was not changed. Check Drive access, API configuration and Gemini quota, then retry.');
    process.exitCode = 1;
  });
}
