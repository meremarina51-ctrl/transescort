import type { ListingAttributes } from '@/lib/listing.types';

export interface CatalogListing extends ListingAttributes {
  id: string;
  slug: string | null;
  photos: string[];
  /** Admin manually confirmed the photos are genuine — shown as a trust badge. */
  photosVerified: boolean;
  averageRating: number;
  reviewCount: number;
}

export type NumericField = 'age' | 'height' | 'weight' | 'breastSize' | 'priceHour';
export type CategoricalField = 'type' | 'figure' | 'temperament' | 'hairColor' | 'eyeColor' | 'country' | 'city';
export type SortOption = 'newest' | 'name' | 'rating';

export interface Filters {
  search: string;
  sortBy: SortOption;
  numeric: Record<NumericField, { min: number; max: number }>;
  categorical: Record<CategoricalField, string>;
}
