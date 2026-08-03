import { apiUrl } from './api-url';

/** Dedupes concurrent 401s into a single refresh call instead of racing multiple requests to /auth/refresh. */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

function withAuth(init: RequestInit, token: string | null): RequestInit {
  return {
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
}

/**
 * Authenticated fetch: attaches the access token, and on a 401 (expired token)
 * silently refreshes it once and retries before giving up. If the refresh
 * token is also invalid, clears the session and sends the user to /login.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(apiUrl(path), withAuth(init, token));
  if (res.status !== 401) return res;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  const newToken = await refreshPromise;
  if (!newToken) {
    clearSessionAndRedirect();
    return res;
  }

  const retried = await fetch(apiUrl(path), withAuth(init, newToken));
  if (retried.status === 401) {
    clearSessionAndRedirect();
  }
  return retried;
}
