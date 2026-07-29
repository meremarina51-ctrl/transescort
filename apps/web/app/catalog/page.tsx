import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { apiUrl } from '@/lib/api-url';

interface CatalogListing {
  id: string;
  slug: string | null;
  name: string | null;
  age: number | null;
  city: string | null;
  photos: string[];
}

async function getListings(): Promise<CatalogListing[]> {
  try {
    const res = await fetch(apiUrl('/catalog'), { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CatalogPage() {
  const listings = await getListings();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          {listings.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-16 text-center">
              <ImageOff className="h-8 w-8 text-white/25" strokeWidth={1.4} />
              <p className="font-body text-sm text-white/40">Пока нет опубликованных анкет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/catalog/${listing.slug ?? listing.id}`} className="card group overflow-hidden">
                  {listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.photos[0]}
                      alt={listing.name ?? ''}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-white/[0.03]">
                      <ImageOff className="h-16 w-16 text-white/15" strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold group-hover:text-crimson transition-colors">
                      {listing.name || 'Без имени'}
                    </h3>
                    <p className="mt-1 font-body text-sm text-white/40">
                      {[listing.age ? `${listing.age} лет` : null, listing.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
