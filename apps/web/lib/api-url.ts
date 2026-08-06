/**
 * Resolves the API base for fetches.
 * - Browser: if NEXT_PUBLIC_API_URL is set, always use it (needs CORS on the API for the web origin).
 *   Otherwise same-origin `/api/...` + rewrites in next.config.js -> Nest.
 * - Server (SSR): NEXT_PUBLIC_API_URL, then API_PROXY_UPSTREAM, then http://127.0.0.1:3010.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    if (explicit) return `${explicit}${p}`;
    return `/api${p}`;
  }

  if (explicit) return `${explicit}${p}`;
  const upstream = (process.env.API_PROXY_UPSTREAM || 'http://127.0.0.1:3010').replace(/\/$/, '');
  return `${upstream}${p}`;
}

/**
 * The API's real origin (no path), for connections that can't go through the `/api` HTTP rewrite —
 * namely WebSockets, since Next.js's `rewrites()` only proxies plain HTTP requests, not the
 * upgrade handshake. Browser-only; falls back to same-origin if nothing is configured (assumes a
 * reverse proxy forwards WS upgrades there in that deployment).
 */
export function apiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;
  if (typeof window !== 'undefined') return window.location.origin;
  return (process.env.API_PROXY_UPSTREAM || 'http://127.0.0.1:3010').replace(/\/$/, '');
}
