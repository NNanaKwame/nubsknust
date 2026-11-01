# NUBS KNUST Website

Official website for the National Union of Baptist Students (NUBS) at Kwame Nkrumah University of Science and Technology (KNUST), Kumasi, Ghana.

**Live site:** [nubsknust.org](https://nubsknust.org)
**Digital Library:** [library.nubsknust.org](https://library.nubsknust.org)

---

## Tech Stack

- **Frontend:** Static HTML5, Bootstrap 5.2.3 (custom-purged build), vanilla JavaScript — no frontend framework
- **Backend:** Node.js + Express (local dev server) / Vercel Serverless Functions (production)
- **Hosting:** Vercel
- **Content storage:** Google Drive (public folders, no CMS/database for content)
- **AI processing:** Google Gemini API (`@google/generative-ai`), used to parse event flyers and book PDFs into structured JSON
- **Caching:** Hybrid in-memory + Vercel KV (Upstash Redis)
- **Forms:** Formspree
- **Email:** Zoho Mail (`info@nubsknust.org`)
- **PDF handling:** `pdf-lib` (pure JS, no native dependencies — safe on serverless)

---

## Project Structure

```
/
├── index.html              Home page
├── about.html              About Us (Aim, Weekly Gatherings, Doctrine, Governance)
├── wings.html               Ministry Wings & Auxiliaries
├── events.html              Events & Programs (filter chips, infinite scroll)
├── event-details.html       Individual event detail view
├── contact.html              Contact & member registration form
├── gallery.html              Photo/video gallery (Drive-backed)
├── library.html               Digital Library (served on library.nubsknust.org)
├── middleware.js              Vercel Routing Middleware (subdomain → page mapping)
├── vercel.json                 Redirects (vanity URLs) and routing config
├── server.js                    Local Express dev server
│
├── api/                          Vercel Serverless Functions
│   ├── get-events.js              Events/posts from Drive flyers, Gemini-parsed, hybrid-cached
│   ├── get-wings.js                Wing card thumbnail images
│   ├── get-books.js                 Library book metadata
│   ├── get-gallery-media.js          Gallery photos/videos (recursive Drive folder walk)
│   └── image-proxy.js                 Proxies & resizes Drive images on the fly
│
├── js/
│   ├── scripts.js                    Events fetching, caching, filtering, infinite scroll
│   ├── date-utils.js                  Date badge parsing, recurring-event detection
│   └── library.js                      Library fetch/render/filter logic
│
└── css/
    ├── styles.css                       Production stylesheet (purged, ~96KB)
    └── styles.full.css                  Full source stylesheet — always edit THIS one
```

---

## Environment Variables

Create a `.env` file locally (never commit this):

```dotenv
# Google Cloud & Gemini
GOOGLE_API_KEY=              # Drive API access (folder listing, file metadata)
GEMINI_API_KEY=               # Gemini content generation (flyer/book parsing)

# Google Drive folder IDs (all folders must be shared "Anyone with the link")
DRIVE_EVENTS_FOLDER_ID=
DRIVE_POSTS_FOLDER_ID=
DRIVE_BOOKS_FOLDER_ID=          # Root folder containing category subfolders
GALLERY_PHOTOS_FOLDER_ID=
GALLERY_VIDEOS_FOLDER_ID=

# Individual wing card thumbnails (one Drive file ID per wing)
WING_PRAYER_FORCE=
WING_OUTREACH=
WING_GODS_INSTRUMENTS=
WING_MINISTERING_MARSHALLS=
WING_BIBLE_STUDY=
WING_ORGANIZING=

```

---

## Local Development

```bash
npm install
npm run build:css      # regenerates css/styles.css from css/styles.full.css
npm run dev             # or: node server.js
```

Visit `http://localhost:3000`.

**Important:** Never hand-edit `css/styles.css` directly. It's a *generated* file — always edit `css/styles.full.css`, then run `npm run build:css` to regenerate. Editing the generated file directly means your changes get silently wiped the next time anyone runs the build.

---

## Deployment (Vercel)

1. Connect the GitHub repo to a Vercel project
2. Set the **Build Command** to `npm run build` (Vercel does not auto-detect this for this project type — must be set manually in Project Settings → Build & Development Settings)
3. Add all environment variables from the list above in Project Settings → Environment Variables, for both **Production** and **Preview** environments
4. Domains are configured in Project Settings → Domains:
   - `nubsknust.org` / `www.nubsknust.org` → Production
   - `library.nubsknust.org` → Production, routed to `library.html` via `middleware.js` (not a vercel.json rewrite — filesystem resolution takes precedence over rewrites for `/`, so Routing Middleware is required for this specific case)

---

## Content Management Workflow

This site deliberately has **no CMS or admin panel**. Content is managed entirely through Google Drive:

| Content type | Where to upload | What happens |
|---|---|---|
| Event flyers | `DRIVE_EVENTS_FOLDER_ID` folder | Gemini extracts title/date/location/description automatically |
| Gallery photos/videos | `GALLERY_PHOTOS_FOLDER_ID` / `GALLERY_VIDEOS_FOLDER_ID` (subfolders OK) | Appears in gallery automatically, no categorization needed |
| Library books (PDFs) | `DRIVE_BOOKS_FOLDER_ID` → correct category subfolder | Gemini extracts title/author/description; category comes from folder name |
| Wing photos | Individual `WING_*` env vars point to specific Drive file IDs | Static per-wing, update the env var to change |

---


## Library importer and scheduled updates

The library now uses root `books.json`, generated with `npm run sync:books`.
Unchanged PDFs are skipped using Drive modification timestamps. See
[LIBRARY-UPDATES.md](LIBRARY-UPDATES.md) for the current importer behavior and
GitHub Actions/Vercel activation instructions; this supersedes the live-library
API workflow described above.
