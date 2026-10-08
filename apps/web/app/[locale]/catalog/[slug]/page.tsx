import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getListing, getReviews, getTelegramBotUsername } from '@/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingGallery } from '@/components/ListingGallery';
import { computeVitals, getListingVitalsConfig } from '@/lib/listing-vitals';

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const listing = await getListing(slug);

  if (!listing) notFound();

  const [telegramBotUsername, reviews, t, tVitals] = await Promise.all([
    getTelegramBotUsername(),
    getReviews(listing.id),
    getTranslations({ locale, namespace: 'catalog' }),
    getTranslations({ locale, namespace: 'vitals' }),
  ]);

  const vitals = computeVitals(listing, getListingVitalsConfig(tVitals));

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex-1">
        <ListingGallery
          id={listing.id}
          name={listing.name || t('unnamed')}
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
