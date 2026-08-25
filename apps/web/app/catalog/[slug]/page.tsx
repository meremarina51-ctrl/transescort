import { notFound } from 'next/navigation';
import { getListing, getReviews, getTelegramBotUsername } from '@/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingGallery } from '@/components/ListingGallery';
// import { ListingDetail } from '@/lib/listing.types';
import { computeVitals } from '@/lib/listing-vitals';

// const OTHER_PARAMS: { key: keyof ListingDetail; label: string }[] = [
//   { key: 'hairColor', label: 'Волосы' },
//   { key: 'eyeColor', label: 'Глаза' },
//   { key: 'country', label: 'Страна' },
// ];

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  
  if (!listing) notFound();

  const [telegramBotUsername, reviews] = await Promise.all([getTelegramBotUsername(), getReviews(listing.id)]);

  const vitals = computeVitals(listing);
  // const otherParams = OTHER_PARAMS.filter((row) => listing[row.key]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex-1">
        <ListingGallery
          id={listing.id}
          name={listing.name || 'Без имени'}
          photos={listing.photos}
          videoUrl={listing.videoUrl}
          vitals={vitals}
          bio={listing.bio}
          priceHour={listing.priceHour}
          priceNight={listing.priceNight}
          ownerLogin={listing.ownerLogin}
          ownerTelegramLinked={listing.ownerTelegramLinked}
          telegramBotUsername={telegramBotUsername}
          initialReviews={reviews}
          photosVerified={listing.photosVerified}
          contactPhone={listing.contactPhone}
          contactTelegram={listing.contactTelegram}
          contactWhatsapp={listing.contactWhatsapp}
        />
      </main>
      <Footer />
    </div>
  );
}
