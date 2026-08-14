import type { CatalogListing } from './catalog.types';

function createRotationSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * One rotation seed per document lifetime, cached in a plain module-level variable.
 *
 * This is deliberately NOT React state/ref and NOT sessionStorage:
 * - A `useRef`/`useState` value doesn't survive Next.js's router-cache restoration of `/catalog` on
 *   the browser back button — that restoration re-runs component logic the same way React Strict
 *   Mode simulates mount/unmount/remount in dev, discarding hook state as if it were a fresh mount.
 * - `sessionStorage` survives that correctly, but distinguishing "genuine reload" from "SPA
 *   navigation" via the Navigation Timing API doesn't work either: `performance.getEntriesByType
 *   ('navigation')[0].type` reflects the *document's* load type and stays `'reload'` for the rest of
 *   that document's lifetime — including every later client-side navigation within the same tab — so
 *   a seed keyed on "was this a reload" would regenerate on every single read after the first reload,
 *   not just once.
 *
 * A module-level variable has exactly the right lifetime for free: it's part of this JS module's
 * closure, which is torn down and re-evaluated from scratch on a genuine reload (fresh JS context —
 * confirmed via `Math.random()` differing across `Page.reload`), but stays loaded and unchanged
 * across any client-side navigation within the app, including the router-cache restoration case
 * above (that only replays React's render/effect logic, it doesn't reload the JS module).
 */
let cachedSeed: string | null = null;

export function getOrCreateRotationSeed(): string {
  if (typeof window === 'undefined') return '';
  if (cachedSeed === null) cachedSeed = createRotationSeed();
  return cachedSeed;
}

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Deterministic hash of (seed, id) into [0, 1) — same inputs always produce the same sort key.
 * Hashes `seed` and `id` separately and combines them with XOR + a murmur-style avalanche finisher,
 * rather than hashing the concatenated string directly. All listing ids are same-length UUIDs, so a
 * plain rolling hash of `seed + id` made the seed's contribution collapse into close to a uniform
 * additive shift across every item — order-preserving, so different seeds kept producing the same
 * relative order. XOR-combining two independently-hashed values doesn't have that property.
 */
function seededRank(seed: string, id: string): number {
  let h = (stringHash(seed) ^ stringHash(id)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h / 4294967295;
}

/** Returns `listings` in a randomized-but-stable order for the given seed. */
export function getRotatedListings(listings: CatalogListing[], seed: string): CatalogListing[] {
  return [...listings].sort((a, b) => seededRank(seed, a.id) - seededRank(seed, b.id));
}
