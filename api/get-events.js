import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// In-memory persistent cache for individual file items to skip redundant processing
const fileItemCache = {};
const pageCache = {};

/**
 * Worker pool helper to process items with a specified concurrency limit
 */
async function promisePool(items, concurrency, fn) {
  let index = 0;
  const results = [];
  const workers = Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Helper to determine if an error is retryable (rate limits, server errors, timeouts)
 */
function isRetryableError(err) {
  const msg = err.message || '';
  // Check for HTTP status codes or typical network/overload errors
  if (msg.includes('429') || msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return true;
  }
  // Generic fetch or network timeouts
  if (msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
    return true;
  }
  // If it's a structural API error (invalid key, bad request, auth failure), do not retry across models
  if (msg.includes('API_KEY') || msg.includes('INVALID_ARGUMENT') || msg.includes('PERMISSION_DENIED') || msg.includes('400')) {
    return false;
  }
  // Default to retryable for unknown runtime errors to maintain robustness
  return true;
}

/**
 * Promise wrapper with timeout support
 */
function withTimeout(promise, ms) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timeout exceeded (30s)')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export default async function handler(req, res) {
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || '').trim();

  const category = req.query.type === 'posts' ? 'posts' : 'events';
  const folderId = (category === 'posts' ? process.env.DRIVE_POSTS_FOLDER_ID : process.env.DRIVE_EVENTS_FOLDER_ID || '').trim();

  const limit = req.query.limit ? parseInt(req.query.limit) : 6;
  const pageToken = req.query.pageToken || '';

  if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !folderId) {
    return res.status(500).json({ error: "Missing configuration in environment variables" });
  }

  try {
    const qParam = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType contains 'image/'`);
    let metadataUrl = `https://www.googleapis.com/drive/v3/files?q=${qParam}&orderBy=createdTime%20desc&pageSize=${limit}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,createdTime)&key=${GOOGLE_API_KEY}`;

    if (pageToken) {
      metadataUrl += `&pageToken=${pageToken}`;
    }

    const driveResp = await fetch(metadataUrl);
    const driveData = await driveResp.json();

    if (driveData.error) {
      console.error("[DRIVE API ERROR]:", driveData.error);
      return res.status(500).json({ error: driveData.error.message });
    }

    const files = driveData.files || [];
    const nextPageToken = driveData.nextPageToken || null;

    if (files.length === 0) {
      return res.status(200).json({ category, items: [], nextPageToken: null });
    }

    const currentHash = files.map(f => `${f.id}_${f.modifiedTime}`).join('|');
    const pageCacheKey = `${category}_${pageToken || 'first_page'}_${limit}`;

    if (!pageCache[pageCacheKey]) {
      pageCache[pageCacheKey] = { hash: null, data: null, nextPageToken: null };
    }

    if (pageCache[pageCacheKey].hash === currentHash && pageCache[pageCacheKey].data) {
      console.log(`[CACHE HIT] Serving ${pageCacheKey} instantly from memory.`);
      return res.status(200).json({
        category,
        items: pageCache[pageCacheKey].data,
        nextPageToken: pageCache[pageCacheKey].nextPageToken
      });
    }

    console.log(`[CACHE MISS] Processing ${files.length} flyers for ${pageCacheKey} using Worker Pool & Model Rotation...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Ordered model candidate fallback list
    const modelCandidates = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite"
    ];

    // Worker function for individual file processing
    const processFileTask = async (file) => {
      const itemCacheKey = `${file.id}_${file.modifiedTime}`;

      // Check item-level cache (Skip already processed files)
      if (fileItemCache[itemCacheKey]) {
        console.log(`[ITEM CACHE HIT] Skipping Gemini analysis for ${file.name}`);
        return fileItemCache[itemCacheKey];
      }

      let aiResult = null;
      let success = false;
      let usedModel = null;

      try {
        const webDirectUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
        const imgResp = await fetch(webDirectUrl);

        if (!imgResp.ok) throw new Error(`Image fetch failed (${imgResp.status})`);

        const buffer = await imgResp.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const prompt = category === 'events' ? `
          Analyze this NUBS KNUST event flyer image. 
          Return ONLY strict JSON format matching this exact schema:
          {
            "title": "Name or headline of the event",
            "date": "Event date strictly in YYYY-MM-DD format (Infer the year if the day and month are visible, Return null only of no event date is visble anywhere)",
            "location": "Venue or hall name mentioned",
            "description": "Brief 1-2 sentence summary from the flyer"
          }
        ` : `
          Analyze this NUBS KNUST post image. 
          Return ONLY strict JSON format matching this exact schema:
          {
            "headline": "Main announcement headline or topic",
            "summary": "Key summary details from the post"
          }
        `;

        // Cycle through models with timeout and error classification
        for (const modelName of modelCandidates) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
            });

            // Wrap generation call with a 30-second timeout
            aiResult = await withTimeout(
              model.generateContent([
                prompt,
                { inlineData: { data: base64Image, mimeType: file.mimeType || "image/jpeg" } }
              ]),
              30000
            );

            success = true;
            usedModel = modelName;
            console.log(`[SUCCESS] File: ${file.name} analyzed using model: ${usedModel}`);
            break;
          } catch (modelErr) {
            console.warn(`[MODEL WARN] Model ${modelName} failed for file ${file.name}: ${modelErr.message}`);
            
            // Stop cycling if error is strictly non-retryable
            if (!isRetryableError(modelErr)) {
              console.error(`[FATAL ERROR] Non-retryable error encountered for ${file.name}. Halting fallback chain.`);
              break;
            }
          }
        }

        if (!success || !aiResult) {
          console.error(`[FILE ERROR] All fallback models failed for file: ${file.name}`);
          return null;
        }

        const parsedData = JSON.parse(aiResult.response.text());
        const processedItem = {
          id: file.id,
          imageUrl: `/api/image-proxy?id=${file.id}`,
          createdTime: file.createdTime,
          ...parsedData
        };

        // Save to item-level cache
        fileItemCache[itemCacheKey] = processedItem;
        return processedItem;

      } catch (fileErr) {
        console.error(`[TASK ERROR] Failed processing file ${file.name}:`, fileErr.message);
        return null;
      }
    };

    // Execute using a worker pool with a concurrency limit of 5
    const results = await promisePool(files, 5, processFileTask);
    const items = results.filter(item => item !== null);

    pageCache[pageCacheKey].hash = currentHash;
    pageCache[pageCacheKey].data = items;
    pageCache[pageCacheKey].nextPageToken = nextPageToken;

    return res.status(200).json({
      category,
      items: items,
      nextPageToken: nextPageToken
    });

  } catch (error) {
    console.error("[TOP HANDLER ERROR]:", error);
    return res.status(500).json({ error: "Failed to load content", details: error.message });
  }
}
