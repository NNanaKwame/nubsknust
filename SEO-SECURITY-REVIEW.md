# SEO and security review — 12 November 2026

## Implemented locally

- Replaced the declared 32px PNG favicon with the existing 75px ICO on every page. Google recommends icons larger than 48px; the old size alone does not establish why Google omitted the icon.
- Aligned canonical URLs, social metadata and sitemap with the observed production redirect to https://www.nubsknust.org. Added missing canonical links and the library sitemap entry. Preserved the move away from the old Vercel domain.
- Removed stale uniform sitemap modification dates and improved main-page descriptions.
- Marked the incomplete, query-driven event detail template noindex until reliable individual event metadata is available.
- Escaped dynamic book, event and gallery text; rejected unsafe book-link schemes.
- Restricted the Express static server to public assets/pages and added Vercel middleware blocks and deployment exclusions for private project/download files.
- Added anti-framing, MIME sniffing, referrer and permissions headers. CSP is deliberately limited to object, base and framing restrictions; it is not a complete script policy because existing pages use inline scripts and handlers.
- Validated image IDs, limited proxy responses to raster image MIME types and 10 MiB, and added a fetch timeout.
- Capped event pagination at 12, validated/encoded tokens, and removed internal error details from API responses.
- Applied compatible dependency patches; production npm audit reported zero known vulnerabilities.

## Validation

Security regression tests and existing book-sync tests pass. HTTP checks confirmed public assets remain available, headers are sent, and environment/source/download files are blocked by Express. Deployment-specific middleware and headers still need verification on Vercel after deployment.

## After deployment

1. Check https://www.nubsknust.org/assets/favicon.ico and the homepage.
2. Use Google Search Console URL Inspection to request indexing of https://www.nubsknust.org/.
3. Submit https://www.nubsknust.org/sitemap.xml.
4. Allow days to weeks for Google's favicon refresh. Appearance is not guaranteed.

Reference: https://developers.google.com/search/docs/appearance/favicon-in-search

## Remaining improvements

Public event requests still invoke Gemini, and gallery requests can walk many Drive folders. Move event/gallery processing to scheduled generation, or configure deployment-level rate limits and budget alerts, to better control API costs. In-memory caching alone is not a global rate limit. Individual events currently need stable data and page-specific metadata before indexing. This review is not a penetration test or a guarantee that every vulnerability has been found.
