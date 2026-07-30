import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CatalogClientPage } from './CatalogClientPage';
import type { CatalogListing } from './catalog.types';
import { apiUrl } from '@/lib/api-url';

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
          <CatalogClientPage initialListings={listings} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
