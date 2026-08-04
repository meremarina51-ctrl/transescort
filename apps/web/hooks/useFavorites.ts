'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthOrGuest } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';

/** Client-only favorites state, shared by the catalog cards and the "Избранное" cabinet page. */
export function useFavorites() {
  const { user } = useAuthOrGuest();
  const isClient = user?.role === 'client';
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isClient) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/favorites');
        if (!res.ok || cancelled) return;
        const data: string[] = await res.json();
        if (!cancelled) setIds(new Set(data));
      } catch {
        // stale/empty favorites are fine if this fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClient]);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (id: string) => {
      const wasFavorite = ids.has(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        const res = await authFetch(`/favorites/${id}`, { method: wasFavorite ? 'DELETE' : 'POST' });
        if (!res.ok) throw new Error();
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    },
    [ids],
  );

  return { isClient, isFavorite, toggle };
}
