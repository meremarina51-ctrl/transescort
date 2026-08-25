import { getListings } from '@/api';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CatalogClientPage } from './CatalogClientPage';

export default async function CatalogPage() {
  const listings = await getListings();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <Suspense fallback={null}>
            <CatalogClientPage initialListings={listings} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
