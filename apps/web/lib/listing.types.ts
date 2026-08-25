/** Shape shared by every read of a listing's physical/categorical attributes — cabinet form, catalog list, catalog detail. */
export interface ListingAttributes {
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  breastSize: number | null;
  penisSize: number | null;
  type: string | null;
  figure: string | null;
  temperament: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  country: string | null;
  city: string | null;
  /** Rubles. */
  priceHour: number | null;
  priceNight: number | null;
}

export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface ListingReviewsSummary {
  items: PublicReview[];
  count: number;
  averageRating: number;
}

export interface ListingDetail extends ListingAttributes {
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

/** Own-listing preview — same shape as ListingDetail, minus the owner fields the performer already knows they own. */
export type PreviewListing = Omit<ListingDetail, 'ownerLogin' | 'ownerTelegramLinked'>;

