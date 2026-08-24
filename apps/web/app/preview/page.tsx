'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ListingGallery } from '@/components/ListingGallery';
import { authFetch } from '@/lib/auth-fetch';
import { parseBody } from '@/lib/parse-body';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';
import type { ListingAttributes, ListingReviewsSummary } from '@/lib/listing.types';

interface PreviewListing extends ListingAttributes {
  id: string;
  bio: string | null;
  photos: string[];
  videoUrl: string | null;
  photosVerified: boolean;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
}

const VITALS: { key: keyof PreviewListing; label: string; suffix?: string }[] = [
  { key: 'age', label: 'Возраст' },
  { key: 'height', label: 'Рост', suffix: 'см' },
  { key: 'weight', label: 'Вес', suffix: 'кг' },
  { key: 'breastSize', label: 'Грудь' },
  { key: 'city', label: 'Город' },
];

const EMPTY_REVIEWS: ListingReviewsSummary = { items: [], count: 0, averageRating: 0 };

function PreviewContent() {
  const router = useRouter();
  const [listing, setListing] = useState<PreviewListing | null>(null);
  const [reviews, setReviews] = useState<ListingReviewsSummary>(EMPTY_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/listings/me');
        const data = res.ok ? await parseBody(res) : null;
        if (!data) {
          setError('no-listing');
          return;
        }
        setListing(data);

        const reviewsRes = await authFetch(`/reviews/listing/${data.id}`);
        if (reviewsRes.ok) {
          setReviews((await parseBody(reviewsRes)) ?? EMPTY_REVIEWS);
        }
      } catch {
        setError('Не удалось загрузить анкету');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      </div>
    );
  }

  if (error === 'no-listing') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0a0a0a] p-6 text-center text-white">
        <h1 className="font-display text-xl font-bold">Анкета ещё не создана</h1>
        <p className="max-w-sm font-body text-sm text-white/40">
          Сначала создайте анкету — после этого здесь появится предпросмотр.
        </p>
        <Link href={ROUTES.CABINET_LISTING} className="btn-primary mt-2">
          Создать анкету
        </Link>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-center">
        <p className="font-body text-sm text-red-400">{error || 'Не удалось загрузить анкету'}</p>
      </div>
    );
  }

  const vitals = VITALS.filter((row) => listing[row.key]).map((row) => ({
    label: row.label,
    value: `${listing[row.key]}${row.suffix ? ` ${row.suffix}` : ''}`,
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ListingGallery
        id={listing.id}
        name={listing.name || 'Без имени'}
        photos={listing.photos}
        videoUrl={listing.videoUrl}
        vitals={vitals}
        bio={listing.bio}
        priceHour={listing.priceHour}
        priceNight={listing.priceNight}
        contactPhone={listing.contactPhone}
        contactTelegram={listing.contactTelegram}
        contactWhatsapp={listing.contactWhatsapp}
        ownerLogin={null}
        ownerTelegramLinked={false}
        telegramBotUsername={null}
        initialReviews={reviews}
        photosVerified={listing.photosVerified}
        preview
        onClose={() => router.push(ROUTES.CABINET_LISTING)}
      />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <ProtectedRoute requiredRoles={[Role.Performer]}>
      <PreviewContent />
    </ProtectedRoute>
  );
}
