'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ImageOff } from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { authFetch } from '@/lib/auth-fetch';

interface FavoriteListing {
  id: string;
  slug: string | null;
  name: string | null;
  age: number | null;
  city: string | null;
  photos: string[];
}

export default function FavoritesPage() {
  const [listings, setListings] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/favorites/listings');
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить избранное');
        if (!cancelled) setListings(data ?? []);
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Не удалось загрузить избранное');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Избранное</h1>

      {loading ? (
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      ) : loadError ? (
        <p className="font-body text-sm text-red-400">{loadError}</p>
      ) : listings.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Heart className="h-8 w-8 text-white/25" strokeWidth={1.4} />
          <h2 className="font-body text-sm font-medium text-white/60">Пока пусто</h2>
          <p className="max-w-sm font-body text-sm text-white/35">
            Нажмите на сердечко на анкете в каталоге, чтобы добавить её сюда.
          </p>
          <Link href="/catalog" className="btn-primary mt-2">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/catalog/${listing.slug ?? listing.id}`}
              className="card group relative overflow-hidden"
            >
              <FavoriteButton
                listingId={listing.id}
                onToggled={(active) => {
                  if (!active) setListings((prev) => prev.filter((l) => l.id !== listing.id));
                }}
              />
              {listing.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.photos[0]}
                  alt={listing.name ?? ''}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-white/[0.03]">
                  <ImageOff className="h-10 w-10 text-white/15" strokeWidth={1.2} />
                </div>
              )}
              <div className="p-3">
                <h3 className="font-display text-sm font-bold transition-colors group-hover:text-accent">
                  {listing.name || 'Без имени'}
                </h3>
                <p className="mt-1 font-body text-xs text-white/40">
                  {[listing.age ? `${listing.age} лет` : null, listing.city].filter(Boolean).join(' · ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
