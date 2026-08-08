# NUBS KNUST — Technical & Design Documentation

This document explains *what* the site does, *how* it's built, and — more importantly — *why* it's built this way. It's meant to onboard a future developer (or future you) quickly, without needing to re-derive decisions that were already made deliberately.

---

## 1. Guiding Ideologies

These are the recurring principles that shaped nearly every decision in this build. When in doubt about how to extend the site, these are the defaults to reach for.

### "Drop it in Drive and it just works"
There is no CMS, no database, and no admin dashboard. Every dynamic content type — events, gallery photos/videos, library books, wing images — is sourced live from public Google Drive folders. A non-technical content manager uploads a file to the right folder, and it appears on the site automatically, with no deploy, no code change, and no manual data entry. This was chosen deliberately over building a custom admin panel: it trades a small amount of upload discipline (files need to go in the right folder) for zero ongoing maintenance burden and zero training required for whoever runs the fellowship's content week to week.

### AI does the tedious extraction, humans do the organizing
Rather than asking content managers to fill out a form with title/date/location/description for every event flyer, Gemini reads the flyer image itself and extracts that metadata. The same applies to book PDFs (title/author/description from the first few pages). This keeps the human workflow to "just upload the file" — but **categorization is deliberately NOT left to AI guessing where a more reliable signal exists**. The library's book categories, for example, come from which Drive subfolder a PDF was placed in, not from Gemini's interpretation of the content — because a human who already organized their books into folders is a more reliable source of truth than an AI guessing from a few pages of text.

### Resilience over cleverness in the AI layer
Every Gemini call cycles through a **model fallback array** (currently `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-2.5-flash` → lite variants), trying each in order until one succeeds. This exists because AI model availability and rate limits are unpredictable in ways application code shouldn't have to guess about — if the newest/best model is rate-limited or temporarily down, the system degrades gracefully to an older model rather than failing the request outright.

### Caching that survives the platform's own quirks
Vercel serverless functions are stateless between invocations — an in-memory cache can be silently wiped by a cold start, causing expensive AI calls to re-run more often than expected. Rather than accepting this or over-engineering a fully external cache, the system uses a **hybrid caching pattern**: in-memory as the fast path (zero network cost on a warm instance), Vercel KV (Upstash Redis) as the durable fallback that survives cold starts. Neither layer is a single point of failure — if KV is briefly unavailable, the endpoint degrades to live processing rather than erroring out.

### Visual consistency via a real design system, not copy-pasted styles
The glassmorphism aesthetic (frosted translucent cards over a continuous gradient backdrop) isn't implemented ad hoc per page — it's a small set of reusable classes (`.glass-section`, `.info-card`, `.wing-card`, `.aim-card`, `.gathering-badge`, the `badge-*` color family) applied consistently across every page. New sections should reuse these rather than inventing new one-off styles, both for visual consistency and to keep the CSS purge step accurate (see §4).

### Performance is a feature, not an afterthought
Multiple rounds of this build were driven directly by Lighthouse audit findings — oversized images, render-blocking CSS, unused JavaScript, missing LCP prioritization. The fixes (image resizing via Drive's own CDN, async icon-font loading, trimmed Bootstrap JS, `fetchpriority` on the first card) are documented in §5 and should be treated as defaults for any new feature, not one-time patches.

---

## 2. Feature Overview

### Home (`index.html`)
Hero section, a glass-card preview grid linking into the 6 Ministry Wings (color-coded to match the Wings page), a rotating quote callout, a live "Upcoming Events" preview (today/tomorrow-prioritized, capped at 3 cards, backfilled with soonest-upcoming), and a click-to-load Spotify podcast embed (deferred until clicked, so it doesn't cost load time for visitors who never play it).

### About (`about.html`)
Four sections: Aim & Objectives (numbered glass cards), Weekly Gatherings (service schedule), Doctrinal Basis (accordion, glass-styled), and Governance & Affiliations (leadership structure, national/campus body affiliations).

### Wings (`wings.html`)
Six Ministry Wings and four Auxiliary groups, each a glass card with a color-coded badge. Clicking "View Details" opens a glass-styled Bootstrap modal with the wing's leadership structure and responsibilities. (An earlier iteration explored dedicated per-wing detail *pages* with photo/video galleries — that direction was shelved in favor of keeping the modal pattern; the shelved code lives on a separate branch, not in production.)

### Events (`events.html` + `index.html`'s preview)
- Flyers uploaded to a Drive folder are parsed by Gemini into structured event data
- **Filter chips**: All / Today / Tomorrow / Upcoming / Past — computed client-side via `date-utils.js`
- **Recurring event detection**: scans title/description text for phrasing like "every Thursday" or "Thursdays" and calculates the actual next occurrence, overriding stale hardcoded dates
- **Infinite scroll** on the full events page via `IntersectionObserver`, tied to Drive's `pageToken` pagination — only active while the "All" filter is selected
- **Client-side caching** via versioned `localStorage` keys (`nubs_events_v3_...`), separate from the server-side hybrid cache — first page cached 1 hour, subsequent pages cached 30 days (older pages change far less often)

### Gallery (`gallery.html`)
A single unified masonry grid mixing photos and videos (not split by category), sorted by upload date. Recursively walks nested Drive subfolders — organize photos/videos however you like (by event, by date), the gallery aggregates everything automatically. Videos support four embed types: YouTube, TikTok, Instagram, and Drive-hosted uploads, with automatic vertical/horizontal orientation detection for the lightbox player. All-in-one lightbox with keyboard navigation (arrows, Esc), click-outside-to-close, and touch-friendly controls.

### Digital Library (`library.html`, served on `library.nubsknust.org`)
PDFs organized into category subfolders in Drive (Devotional, Doctrine, Leadership, Discipleship — themselves umbrella categories mapped from more granular folder names like Prayer, Faith, Finance, Relationship, etc.). Gemini extracts title/author/description from just the first 5 pages of each PDF (trimmed via `pdf-lib` before sending, to keep requests small and cheap) — category is *not* AI-guessed, it comes from the folder mapping. Cover art is a generated CSS placeholder (gradient + icon + title, colored by category) rather than rendered from the PDF, deliberately avoiding native-dependency packages like `canvas` that are unreliable on Vercel's serverless runtime.

Served on its own subdomain via Vercel Routing Middleware (`middleware.js`) rather than a `vercel.json` rewrite — Vercel gives filesystem resolution precedence over rewrites for the root path, so a plain rewrite silently loses to `index.html` every time. Middleware runs earlier in the request pipeline and correctly intercepts before that happens.

### Contact (`contact.html`)
Member registration + general contact form (Formspree-backed), quick-contact cards (email, WhatsApp channel — not a direct-message number, since the fellowship doesn't have a dedicated phone line yet), and social links.

---

## 3. Architecture

### Request flow for Drive-backed content (events, gallery, library, wings)
```
Browser → Vercel Serverless Function (api/*.js)
              ↓
         Check in-memory cache (fast path)
              ↓ (miss)
         Check Vercel KV (durable, cold-start-safe) — events.js only, currently
              ↓ (miss)
         Google Drive API (list folder contents, fetch file bytes)
              ↓
         Google Gemini API (extract structured metadata) — events & books only
              ↓
         Write-through to both cache layers
              ↓
         Return JSON to browser
```

### Image delivery
`image-proxy.js` fetches from Google's `lh3.googleusercontent.com` CDN rather than the raw Drive API, and supports an optional `?w=` query parameter that requests a pre-resized version directly from Google's own infrastructure — no image processing happens on our server. Every image reference across the site (event cards, wing thumbnails, gallery thumbnails, gallery lightbox) passes an appropriately-sized `w` value rather than requesting full-resolution originals.

### Routing quirks worth remembering
- Vercel gives **filesystem resolution precedence over `vercel.json` rewrites** for any path that maps to a literal existing file (e.g. `/` → `index.html`). Host-based routing to a *different* file for the same path (as with the library subdomain) requires **Routing Middleware**, not a rewrite.
- `vercel.json`'s `redirects` array (vanity URLs like `/whatsapp`, `/live`, `/prayer`, `/community`) work fine as plain redirects since they don't collide with an existing filesystem path.

---

## 4. The CSS Build System

The production stylesheet (`css/styles.css`) is a **generated artifact**, not hand-authored. It starts life as `css/styles.full.css` — the complete Bootstrap 5.2.3 core plus every custom class ever written for this site — and gets run through PurgeCSS (`scripts/build-css.js`), which strips any CSS rule whose selector doesn't appear anywhere in the actual HTML/JS content.

**This exists because of a real incident**, not speculative engineering: an earlier manual purge pass shrank the stylesheet from ~256KB to ~96KB (a genuine Lighthouse win), but subsequent edits to HTML kept introducing classes that were never in the CSS to begin with, because nobody was re-running the purge. The failure mode is silent — a missing class produces no error, no console warning, just unstyled content that's easy to misdiagnose as a caching problem (which it was, repeatedly, before the actual cause was found).

**The rule going forward:** never hand-edit `css/styles.css`. Always edit `css/styles.full.css`, then run `npm run build:css`. The safelist in `build-css.js` explicitly protects classes that Bootstrap's JS adds dynamically (`.show`, `.collapsing`, `.modal-backdrop`, etc.) and classes generated inside JS template strings (`.event-card`, `.event-status-badge`, etc.) that a plain content scan can't see on its own.

---

## 5. Performance Work Log

Driven by a Lighthouse mobile audit that found LCP at 16.3s and ~3.2MB page weight. Fixes applied:

| Issue | Fix |
|---|---|
| Oversized images (735KB+ waste) | On-the-fly resizing via `image-proxy.js`'s `?w=` param, sourced from Google's own CDN — no server-side image processing |
| LCP image loading late | First card on each page gets `loading="eager" fetchpriority="high"`; everything else stays `lazy` |
| Missing image dimensions (CLS risk) | Explicit `width`/`height` attributes on all dynamically-generated `<img>` tags |
| Render-blocking Bootstrap Icons CSS | Async `preload` + swap-on-load pattern, with a `<noscript>` fallback |
| Unused JavaScript (~311KB) | Swapped `bootstrap.bundle.min.js` → `bootstrap.min.js` (drops Popper.js — nothing on the site uses Tooltip/Popover/Dropdown, only Collapse and Modal) |
| Render-blocking/oversized CSS | PurgeCSS build step (§4), ~63% size reduction |
| Third-party embed cost (Spotify) | Converted to a click-to-load facade — the real iframe never loads until a visitor actually clicks play |
| CSS Grid `auto-fill` centering bug | Switched event-card grids from CSS Grid to Flexbox — `auto-fill` creates phantom empty column tracks when there are fewer items than a full row, which broke centering for the home page's 3-card layout in a way that looked like a caching bug but wasn't |

---

## 6. Known Gaps / Security Backlog

Documented so they don't get silently forgotten:

- **No rate limiting** on public API endpoints. A `get-events`/`get-books` cache-miss triggers real Gemini API cost; nothing currently stops repeated requests from an abusive client.
- **`image-proxy.js` will proxy any public Drive file ID passed to it**, not just this site's own content. Low severity (can't access anything not already public), but worth tightening.
- **No CAPTCHA/honeypot on the Formspree contact form** — Formspree supports this natively, currently unused.
- **No security headers configured** (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) — Vercel doesn't set these by default.
- **`get-gallery-media.js` and `get-wings.js` don't have the hybrid KV caching** that `get-events.js` now has — only in-memory, still cold-start-fragile.
- **Privacy Policy / Terms links are placeholders** (`href="#!"`) despite the site collecting real personal data (name, phone, hall/hostel) through the registration form.
- **`get-books.js` is under active revision** at time of writing — confirm current caching behavior before assuming it matches the pattern described in §3.

---

## 7. Conventions for Future Work

- New Drive-backed content types should follow the existing pattern: a Vercel function in `api/`, an env var for the folder ID, results proxied through `image-proxy.js` if they include images.
- New pages should reuse the existing glass design system classes rather than introducing new ad hoc styles — check `css/styles.full.css`'s "CUSTOM STYLES" section (below the Bootstrap core) for what already exists before adding something new.
- Any new HTML page must be added to the `content` glob in `scripts/build-css.js` (it already covers `*.html` + `js/*.js` at the project root, so this is usually automatic — just remember to run `npm run build:css` after adding classes).
- Gemini-backed features should follow the established resilience pattern: model fallback array, hash-based cache invalidation, graceful degradation if AI parsing fails for a single item (skip that item, don't fail the whole batch).
