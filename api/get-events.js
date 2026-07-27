import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const cache = {};

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
    const cacheKey = `${category}_${pageToken || 'first_page'}_${limit}`;

    if (!cache[cacheKey]) {
      cache[cacheKey] = { hash: null, data: null, nextPageToken: null };
    }

    if (cache[cacheKey].hash === currentHash && cache[cacheKey].data) {
      console.log(`[CACHE HIT] Serving ${cacheKey} instantly from memory.`);
      return res.status(200).json({
        category,
        items: cache[cacheKey].data,
        nextPageToken: cache[cacheKey].nextPageToken
      });
    }

    console.log(`[CACHE MISS] Processing ${files.length} flyers for ${cacheKey} with model rotation...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // List of models to cycle through if one is busy or fails
    const modelCandidates = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite"
    ];

    const parsedPromises = files.map(async (file) => {
      let aiResult = null;
      let success = false;

      const webDirectUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
      const imgResp = await fetch(webDirectUrl);

      if (!imgResp.ok) throw new Error(`Image fetch failed (${imgResp.status})`);

      const buffer = await imgResp.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString("base64");

      const prompt = category === 'events' ? `
        Analyze this NUBS KNUST event flyer image. 
        Extract details in strict JSON format:
        - title: Name or headline of the event.
        - date: Event date in strictly YYYY-MM-DD format, inferred from the flyer.
        - location: Venue or hall name mentioned on the flyer.
        - description: A brief 1-2 sentence summary from the flyer.
      ` : `
        Analyze this NUBS KNUST post image. 
        Extract details in strict JSON format:
        - headline: Main announcement headline or topic.
        - summary: Key summary details from the post.
      `;

      // Cycle through models until one succeeds
      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
          });

          aiResult = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: file.mimeType || "image/jpeg" } }
          ]);

          success = true;
          break; // Exit loop if successful
        } catch (modelErr) {
          console.warn(`[MODEL WARN] Model ${modelName} failed for file ${file.name}: ${modelErr.message}. Trying next model...`);
        }
      }

      if (!success || !aiResult) {
        console.error(`[FILE ERROR] All fallback models failed for ${file.name}`);
        return null;
      }

      try {
        const parsedData = JSON.parse(aiResult.response.text());
        return {
          id: file.id,
          imageUrl: `/api/image-proxy?id=${file.id}`,
          createdTime: file.createdTime,
          ...parsedData
        };
      } catch (parseErr) {
        console.error(`[PARSE ERROR] Failed to parse JSON response for ${file.name}:`, parseErr.message);
        return null;
      }
    });

    const results = await Promise.all(parsedPromises);
    const items = results.filter(item => item !== null);

    cache[cacheKey].hash = currentHash;
    cache[cacheKey].data = items;
    cache[cacheKey].nextPageToken = nextPageToken;

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