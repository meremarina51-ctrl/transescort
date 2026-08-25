import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { computeVitals } from "@/lib/listing-vitals";
import { usePreviewListing } from "@/hooks/usePreviewListing";
import { FullScreenState } from "@/components/ui/FullScreenState";
import { ListingGallery } from "@/components/ListingGallery";

export const PreviewContent = () => {
  const router = useRouter();
  const { listing, reviews, isLoading, errorMessage } = usePreviewListing();

  if (isLoading) {
    return (
      <FullScreenState>
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      </FullScreenState>
    );
  }

  if (errorMessage === 'no-listing') {
    return (
      <FullScreenState className="flex-col gap-3 p-6 text-center text-white">
        <h1 className="font-display text-xl font-bold">Анкета ещё не создана</h1>
        <p className="max-w-sm font-body text-sm text-white/40">
          Сначала создайте анкету — после этого здесь появится предпросмотр.
        </p>
        <Link href={ROUTES.CABINET_LISTING} className="btn-primary mt-2">
          Создать анкету
        </Link>
      </FullScreenState>
    );
  }

  if (errorMessage || !listing) {
    return (
      <FullScreenState className="p-6 text-center">
        <p className="font-body text-sm text-red-400">{errorMessage || 'Не удалось загрузить анкету'}</p>
      </FullScreenState>
    );
  }

  const vitals = computeVitals(listing);

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
};
