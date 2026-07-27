// api/get-gallery-media.js
//
// Lists everything inside two public Google Drive folders — one for photos,
// one for videos — including anything nested in subfolders underneath them
// (organize by event/date, doesn't matter, it's walked recursively).
//
// Uses the existing GOOGLE_API_KEY from your .env (make sure the "Google
// Drive API" is enabled for whichever Google Cloud project that key belongs
// to, and that the key isn't restricted to exclude it).

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const MAX_DEPTH = 5;      // how many subfolder levels deep to search
const MAX_FOLDERS = 200;  // safety cap on total folders visited, protects your Drive API quota

const FOLDER_MIME = "application/vnd.google-apps.folder";
const FIELDS = "files(id,name,mimeType,createdTime,videoMediaMetadata(width,height))";

async function listFolder(folderId, apiKey) {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(FIELDS);
  const url = `${DRIVE_FILES_ENDPOINT}?q=${query}&fields=${fields}&pageSize=1000&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Drive API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

function toPhotoItem(file) {
  return {
    id: file.id,
    mediaType: "photo",
    name: file.name,
    src: `/api/image-proxy?id=${file.id}`,
    alt: file.name,
    createdTime: file.createdTime,
  };
}

function toVideoItem(file) {
  return {
    id: file.id,
    mediaType: "video",
    name: file.name,
    type: "drive",
    embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
    thumbnail: `/api/image-proxy?id=${file.id}`,
    title: file.name,
    vertical: !!(file.videoMediaMetadata && file.videoMediaMetadata.height > file.videoMediaMetadata.width),
    createdTime: file.createdTime,
  };
}

// Recursively walks a folder (and its subfolders), collecting only files
// whose mimeType matches the expected type ("image/" or "video/").
async function walkFolder(folderId, apiKey, mimePrefix, mapFn, depth, state) {
  if (depth > MAX_DEPTH || state.foldersVisited >= MAX_FOLDERS) return [];
  state.foldersVisited++;

  let files;
  try {
    files = await listFolder(folderId, apiKey);
  } catch (err) {
    console.error(`[gallery] Failed to list folder ${folderId}:`, err.message);
    return [];
  }

  const results = [];
  for (const file of files) {
    if (file.mimeType === FOLDER_MIME) {
      const nested = await walkFolder(file.id, apiKey, mimePrefix, mapFn, depth + 1, state);
      results.push(...nested);
    } else if (file.mimeType && file.mimeType.startsWith(mimePrefix)) {
      results.push(mapFn(file));
    }
  }
  return results;
}

export default async function getGalleryMediaHandler(req, res) {
  const photosFolderId = process.env.GALLERY_PHOTOS_FOLDER_ID;
  const videosFolderId = process.env.GALLERY_VIDEOS_FOLDER_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!photosFolderId || !videosFolderId || !apiKey) {
    console.error("[gallery] Missing required env vars (folders or API key)");
    return res.status(500).json({ error: "Missing required environment variables" });
  }

  try {
    const [photos, videos] = await Promise.all([
      walkFolder(photosFolderId, apiKey, "image/", toPhotoItem, 0, { foldersVisited: 0 }),
      walkFolder(videosFolderId, apiKey, "video/", toVideoItem, 0, { foldersVisited: 0 }),
    ]);

    photos.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    videos.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    res.setHeader("Cache-Control", "public, max-age=300"); // cache 5 min — short enough to reflect new uploads quickly
    return res.json({ photos, videos });
  } catch (err) {
    console.error("[gallery] get-gallery-media error:", err.message);
    return res.status(500).json({ error: "Server error fetching gallery media" });
  }
}