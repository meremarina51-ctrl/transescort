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
