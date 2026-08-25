import { getLatestListings } from '@/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/home/Hero';
import { Benefits } from '@/components/home/Benefits';
import { Listings } from '@/components/home/Listings';
import { Reviews } from '@/components/home/Reviews';
import { Cta } from '@/components/home/Cta';

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
