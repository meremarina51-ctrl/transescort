import type { CatalogListing } from './catalog.types';

/**
 * Module-level (not React state, not sessionStorage) cache of the shuffled display order.
 * This gives exactly the lifetime we want for free: it resets whenever the JS module is
 * re-evaluated from scratch — i.e. a fresh tab or an explicit reload — but survives client-side
 * route changes within the same session (catalog -> anketa -> back), since Next.js keeps the JS
 * runtime alive across those. That's what makes "rotate on open/refresh" and "keep the same
 * order when returning from an anketa" both fall out of the same simple mechanism.
 */
let cachedOrder: string[] | null = null;
let cachedFingerprint: string | null = null;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function fingerprint(listings: CatalogListing[]): string {
  return listings
    .map((l) => l.id)
    .sort()
    .join(',');
}

/**
 * Returns `listings` in a randomized-but-stable order: shuffled once per session (or whenever
 * the underlying set of anketas actually changes), then reused as-is on every subsequent call —
 * so filtering/sorting/navigating away and back never reshuffles or drops/duplicates a card.
 */
export function getRotatedListings(listings: CatalogListing[]): CatalogListing[] {
  const currentFingerprint = fingerprint(listings);

  if (!cachedOrder || cachedFingerprint !== currentFingerprint) {
    const shuffled = shuffle(listings);
    cachedOrder = shuffled.map((l) => l.id);
    cachedFingerprint = currentFingerprint;
    return shuffled;
  }

  const byId = new Map(listings.map((l) => [l.id, l]));
  return cachedOrder.map((id) => byId.get(id)).filter((l): l is CatalogListing => Boolean(l));
}
