// middleware.js
//
// Vercel serves a literal static file (index.html) for "/" before it ever
// consults vercel.json's "rewrites" array — filesystem resolution takes
// precedence over rewrites. That's why the host-conditioned rewrite for
// library.nubsknust.org never fired.
//
// Routing Middleware runs earlier in the request pipeline than static file
// resolution, so it can correctly intercept "/" and serve library.html
// before Vercel gets a chance to serve index.html instead.

import { rewrite } from '@vercel/functions';

export default function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);

  // Block repository-only files before static file routing on Vercel.
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return new Response('Bad request', { status: 400 }); }
  if (/(^|\/)(?:\.[^/]+|node_modules|library-acquisitions|tests)(?:\/|$)/.test(pathname) ||
      /^\/(?:generate-books\.js|server\.js|middleware\.js|package(?:-lock)?\.json|vercel\.json|.*\.md|books\.json\.tmp)$/i.test(pathname)) {
    return new Response('Not found', { status: 404 });
  }

  if (host === 'library.nubsknust.org' && url.pathname === '/') {
    return rewrite(new URL('/library.html', request.url));
  }

  // All other hosts/paths fall through to normal Vercel routing.
}

export const config = {
  matcher: '/:path*',
};
