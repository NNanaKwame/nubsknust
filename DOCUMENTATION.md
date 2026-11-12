# NUBS KNUST — Technical & Design Documentation

This document explains *what* the site does, *how* it's built, and — more importantly — *why* it's built this way. It's meant to onboard a future developer (or future you) quickly, without needing to re-derive decisions that were already made deliberately.

---

## 1. Guiding Ideologies

These are the recurring principles that shaped nearly every decision in this build. When in doubt about how to extend the site, these are the defaults to reach for.

### "Drop it in Drive and it just works"
There is no CMS, no database, and no admin dashboard. Events and gallery media are loaded from public Google Drive folders; wing images use configured Drive IDs. Library books are imported into the static `books.json` catalogue by `generate-books.js` and the scheduled GitHub Actions workflow. A non-technical content manager uploads a file to the right folder, and the live endpoints pick it up on refresh after caches expire. Library additions appear after a successful catalogue sync and deployment. This was chosen deliberately over building a custom admin panel: it trades a small amount of upload discipline (files need to go in the right folder) for zero ongoing maintenance burden and zero training required for whoever runs the fellowship's content week to week.

### AI does the tedious extraction, humans do the organizing
Rather than asking content managers to fill out a form with title/date/location/description for every event flyer, Gemini reads the flyer image itself and extracts that metadata. The same applies to book PDFs (title/author/description from the first few pages). This keeps the human workflow to "just upload the file" — but **categorization is deliberately NOT left to AI guessing where a more reliable signal exists**. The library's book categories, for example, come from which Drive subfolder a PDF was placed in, not from Gemini's interpretation of the content — because a human who already organized their books into folders is a more reliable source of truth than an AI guessing from a few pages of text.

### Resilience over cleverness in the AI layer
The event endpoint has an ordered model fallback list in `api/get-events.js`. The book importer uses one configurable model (`GEMINI_BOOK_MODEL`) and preserves the existing catalogue if extraction fails. Model availability must be checked rather than inferred from this document; fallback is not a guarantee of success.

### Caching that survives the platform's own quirks
In-memory caches are local to a warm server instance and disappear on cold starts. Events currently cache parsed items/pages in memory; there is **no Redis/KV implementation in this checkout**. Gallery results are cached for five minutes and concurrent requests share one traversal on the same instance. Failed/partial traversals are not cached. Gallery and wings responses also advertise five-minute HTTP/shared-cache lifetimes. These measures reduce repeated work but are not durable storage or global rate limiting.

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
- **Client-side caching** via versioned `localStorage` keys (`nubs_events_v3_...`), separate from the server-side in-memory cache — first page cached 1 hour, subsequent pages cached 30 days (older pages change far less often)

### Gallery (`gallery.html`)
A single unified masonry grid mixing photos and videos (not split by category), sorted by upload date. Recursively walks nested Drive subfolders — organize photos/videos however you like (by event, by date), the gallery aggregates everything automatically. The current API supplies Drive-hosted videos, with vertical/horizontal orientation detection for the lightbox player. All-in-one lightbox with keyboard navigation (arrows, Esc), click-outside-to-close, and touch-friendly controls.

### Digital Library (`library.html`, served on `library.nubsknust.org`)
PDFs organized into category subfolders in Drive (Devotional, Doctrine, Leadership, Discipleship — themselves umbrella categories mapped from more granular folder names like Prayer, Faith, Finance, Relationship, etc.). Gemini extracts title/author/description from just the first 5 pages of each PDF (trimmed via `pdf-lib` before sending, to keep requests small and cheap) — category is *not* AI-guessed, it comes from the folder mapping. The browser loads static `books.json`, supports title/author search, and hides duplicate title/author pairs. Covers use selected external image links or Drive thumbnails via the image proxy, with a CSS title-card fallback. No native PDF-rendering dependency is required.

Served on its own subdomain via Vercel Routing Middleware (`middleware.js`) rather than a `vercel.json` rewrite — Vercel gives filesystem resolution precedence over rewrites for the root path, so a plain rewrite silently loses to `index.html` every time. Middleware runs earlier in the request pipeline and correctly intercepts before that happens.

### Contact (`contact.html`)
Member registration + general contact form (Formspree-backed), quick-contact cards (email, WhatsApp channel — not a direct-message number, since the fellowship doesn't have a dedicated phone line yet), and social links.

---

## 3. Architecture

### Content request flows

- Events: browser → event API → Drive listing → cached parsed item or Gemini extraction → JSON.
- Gallery: browser → gallery API/cache → recursive Drive listing → JSON.
- Wings: browser → wings API → configured Drive IDs → JSON (no Drive listing or AI call).
- Library: scheduled/manual importer → Drive listing → extraction for changed PDFs → atomic `books.json` update → deployment → browser reads JSON. See `LIBRARY-UPDATES.md`.


### Image delivery
`image-proxy.js` fetches from Google's `lh3.googleusercontent.com` CDN rather than the raw Drive API, and supports an optional `?w=` query parameter that requests a pre-resized version directly from Google's own infrastructure — no image processing happens on our server. Every image reference across the site (event cards, wing thumbnails, gallery thumbnails, gallery lightbox) passes an appropriately-sized `w` value rather than requesting full-resolution originals.

### Routing quirks worth remembering
- Vercel gives **filesystem resolution precedence over `vercel.json` rewrites** for any path that maps to a literal existing file (e.g. `/` → `index.html`). Host-based routing to a *different* file for the same path (as with the library subdomain) requires **Routing Middleware**, not a rewrite.
- `vercel.json`'s `redirects` array (vanity URLs like `/whatsapp`, `/live`, `/prayer`, `/community`) work fine as plain redirects since they don't collide with an existing filesystem path.

---

## 4. Stylesheet maintenance

`css/styles.css` is the inherited production stylesheet. Older documentation described `css/styles.full.css`, `scripts/build-css.js`, and `npm run build:css`, but **none exists in this checkout**. Do not run a nonexistent build or recreate/purge the stylesheet during unrelated work. Use the existing classes and narrowly scoped stylesheets such as `css/library.css` and `css/book-covers.css`. Restore a source/build pipeline only as a separate task with visual regression checks.

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
| Render-blocking/oversized CSS | Historical purge, ~63% size reduction; source/build scripts are absent from this checkout (§4) |
| Third-party embed cost (Spotify) | Converted to a click-to-load facade — the real iframe never loads until a visitor actually clicks play |
| CSS Grid `auto-fill` centering bug | Switched event-card grids from CSS Grid to Flexbox — `auto-fill` creates phantom empty column tracks when there are fewer items than a full row, which broke centering for the home page's 3-card layout in a way that looked like a caching bug but wasn't |

---

## 6. Security status and remaining backlog

Reviewed against this checkout on 12 November 2026:

- **Implemented:** security headers in Vercel and Express, escaping for book/event/gallery HTML, safer image-proxy validation and response limits, bounded event page sizes, and private project-file restrictions. See `SEO-SECURITY-REVIEW.md` for scope and limitations.
- **Implemented:** Formspree `_gotcha` honeypot, plus working Privacy Policy and Terms links beside the contact form. No real form submission is needed to test the markup. CAPTCHA requires checking the Formspree account configuration; it has not been enabled here.
- **Implemented:** five-minute gallery cache with concurrent-request sharing; failed/partial results are not cached. Wings responses have five-minute cache headers and use only environment configuration, so a database cache adds little value there.
- **Still open:** global rate limiting and durable event caching. Public event cache misses can incur Gemini costs. Add deployment-level rate limits or shared storage as a separately configured change; an in-memory limiter would not protect across cold starts and instances.
- **Still open:** the image proxy accepts any public Drive ID. Restricting it needs a complete allowlist covering books, events, recursive gallery files and wing IDs; a books-only allowlist would break the other pages.
- **Library:** the UI uses `books.json`; the legacy ignored `api/get-books.js` is not used by it. Do not use the old endpoint as the source of truth for the current importer.
- **Branding:** `assets/nubsknustlogo.png` is the correct logo/favicon. `assets/favicon.ico` is unrelated and must not replace it. The PNG is 32×32; use a higher-resolution original of the same brand if one becomes available.

---

## 7. Conventions for Future Work

- New Drive-backed content types should follow the existing pattern: a Vercel function in `api/`, an env var for the folder ID, results proxied through `image-proxy.js` if they include images.
- New pages should reuse the existing glass design system classes rather than introducing new ad hoc styles — check existing HTML and stylesheets for available classes before adding something new.
- New public pages need a canonical URL, correct favicon, and sitemap entry. Add them to the explicit public-file list in `server.js`. There is currently no CSS build command.
- Gemini-backed features should follow the established resilience pattern: model fallback array, hash-based cache invalidation, graceful degradation if AI parsing fails for a single item (skip that item, don't fail the whole batch).
