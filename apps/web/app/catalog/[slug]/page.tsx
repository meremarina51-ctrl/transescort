import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingGallery } from '@/components/ListingGallery';
import { apiUrl } from '@/lib/api-url';
import type { ListingAttributes, ListingReviewsSummary } from '@/lib/listing.types';

interface ListingDetail extends ListingAttributes {
  id: string;
  bio: string | null;
  photos: string[];
  videoUrl: string | null;
  ownerLogin: string | null;
  ownerTelegramLinked: boolean;
  photosVerified: boolean;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
}

const EMPTY_REVIEWS: ListingReviewsSummary = { items: [], count: 0, averageRating: 0 };

async function getListing(slug: string): Promise<ListingDetail | null> {
  try {
    const res = await fetch(apiUrl(`/catalog/${slug}`), { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getTelegramBotUsername(): Promise<string | null> {
  try {
    const res = await fetch(apiUrl('/telegram/bot-info'), { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.username ?? null;
  } catch {
    return null;
  }
}

async function getReviews(listingId: string): Promise<ListingReviewsSummary> {
  try {
    const res = await fetch(apiUrl(`/reviews/listing/${listingId}`), { cache: 'no-store' });
    if (!res.ok) return EMPTY_REVIEWS;
    return res.json();
  } catch {
    return EMPTY_REVIEWS;
  }
}

const VITALS: { key: keyof ListingDetail; label: string; suffix?: string }[] = [
  { key: 'age', label: 'Возраст' },
  { key: 'height', label: 'Рост', suffix: 'см' },
  { key: 'weight', label: 'Вес', suffix: 'кг' },
  { key: 'breastSize', label: 'Грудь' },
  { key: 'city', label: 'Город' },
];

const OTHER_PARAMS: { key: keyof ListingDetail; label: string }[] = [
  { key: 'type', label: 'Тип' },
  { key: 'figure', label: 'Фигура' },
  { key: 'temperament', label: 'Темперамент' },
  { key: 'hairColor', label: 'Волосы' },
  { key: 'eyeColor', label: 'Глаза' },
  { key: 'country', label: 'Страна' },
];

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const [telegramBotUsername, reviews] = await Promise.all([getTelegramBotUsername(), getReviews(listing.id)]);

  const vitals = VITALS.filter((row) => listing[row.key]).map((row) => ({
    label: row.label,
    value: `${listing[row.key]}${row.suffix ? ` ${row.suffix}` : ''}`,
  }));
  const otherParams = OTHER_PARAMS.filter((row) => listing[row.key]);

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
