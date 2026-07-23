import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// In-memory cache stores for events and posts
const cache = {
  events: { hash: null, data: null },
  posts: { hash: null, data: null }
};

export default async function handler(req, res) {
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || '').trim();

  const category = req.query.type === 'posts' ? 'posts' : 'events';
  const folderId = (category === 'posts' ? process.env.DRIVE_POSTS_FOLDER_ID : process.env.DRIVE_EVENTS_FOLDER_ID || '').trim();
  
  // limit is for slicing response, FETCH_SIZE is for constant backend caching
  const requestedLimit = req.query.limit ? parseInt(req.query.limit) : 12;
  const FETCH_SIZE = 20; 

  if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !folderId) {
    return res.status(500).json({ error: "Missing configuration in environment variables" });
  }

  try {
    // 1. Fetch metadata using a FIXED pageSize (20) so the folder hash remains identical across pages
    const qParam = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType contains 'image/'`);
    const metadataUrl = `https://www.googleapis.com/drive/v3/files?q=${qParam}&orderBy=createdTime%20desc&pageSize=${FETCH_SIZE}&fields=files(id,name,mimeType,modifiedTime,createdTime)&key=${GOOGLE_API_KEY}`;

    const driveResp = await fetch(metadataUrl);
    const driveData = await driveResp.json();

    if (driveData.error) {
      console.error("[DRIVE API ERROR]:", driveData.error);
      return res.status(500).json({ error: driveData.error.message });
    }

    const files = driveData.files || [];

    if (files.length === 0) {
      return res.status(200).json({ category, items: [] });
    }

    // 2. Hash represents full folder state for top 20 files
    const currentHash = files.map(f => `${f.id}_${f.modifiedTime}`).join('|');

    // 3. CACHE HIT: Return cached data instantly sliced to requested limit
    if (cache[category].hash === currentHash && cache[category].data) {
      console.log(`[CACHE HIT] Serving ${category} instantly from memory.`);
      const slicedItems = cache[category].data.slice(0, requestedLimit);
      return res.status(200).json({ category, items: slicedItems });
    }

    console.log(`[CACHE MISS / FOLDER UPDATE] Processing ${files.length} flyers with Gemini...`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 4. Process flyers with Gemini AI
    const parsedPromises = files.map(async (file) => {
      try {
        const webDirectUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
        const imgResp = await fetch(webDirectUrl);

        if (!imgResp.ok) throw new Error(`Image fetch failed (${imgResp.status})`);

        const buffer = await imgResp.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const prompt = category === 'events' ? `
          Analyze this NUBS KNUST event flyer image. 
          Extract details in strict JSON format:
          - title: Name or headline of the event.
          - date: Event date string as seen on the flyer.
          - location: Venue or hall name mentioned on the flyer.
          - description: A brief 1-2 sentence summary from the flyer.
        ` : `
          Analyze this NUBS KNUST post image. 
          Extract details in strict JSON format:
          - headline: Main announcement headline or topic.
          - summary: Key summary details from the post.
        `;

        const aiResult = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: file.mimeType || "image/jpeg" } }
        ]);

        const parsedData = JSON.parse(aiResult.response.text());

        return {
          id: file.id,
          imageUrl: `/api/image-proxy?id=${file.id}`,
          createdTime: file.createdTime,
          ...parsedData
        };

      } catch (err) {
        console.error(`[FILE ERROR] Failed processing ${file.name}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(parsedPromises);
    const items = results.filter(item => item !== null);

    // 5. Store ALL items into memory cache
    cache[category].hash = currentHash;
    cache[category].data = items;

    console.log(`[CACHE UPDATED] Memory cache refreshed for ${category}.`);

    // Return sliced response for current client request
    const slicedItems = items.slice(0, requestedLimit);
    return res.status(200).json({ category, items: slicedItems });

  } catch (error) {
    console.error("[TOP HANDLER ERROR]:", error);
    return res.status(500).json({ error: "Failed to load content", details: error.message });
  }
}