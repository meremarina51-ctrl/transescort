import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { apiUrl } from '@/lib/api-url';
import type { CatalogListing } from './catalog/catalog.types';
import { Hero } from '@/components/home/Hero';
import { Benefits } from '@/components/home/Benefits';
import { Listings } from '@/components/home/Listings';
import { Reviews } from '@/components/home/Reviews';
import { Cta } from '@/components/home/Cta';

async function getLatestListings(): Promise<CatalogListing[]> {
  try {
    const res = await fetch(apiUrl('/catalog'), { cache: 'no-store' });
    if (!res.ok) return [];
    const listings: CatalogListing[] = await res.json();
    return listings.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const latestListings = await getLatestListings();

  return (
    <div className="bg-[#0a0a0a] text-white">
      <Header />
      <Hero />
      <Benefits />
      <Listings listings={latestListings} />
      <Reviews />
      {/* <Tariff /> */}
      <Cta />
      <Footer />
    </div>
  );
};
