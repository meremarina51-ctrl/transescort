import type { ListingAttributes } from '@/lib/listing.types';

export interface CatalogListing extends ListingAttributes {
  id: string;
  slug: string | null;
  photos: string[];
}

export type NumericField = 'age' | 'height' | 'weight' | 'breastSize';
export type CategoricalField = 'type' | 'figure' | 'temperament' | 'hairColor' | 'eyeColor' | 'country' | 'city';
export type SortOption = 'newest' | 'name';

export interface Filters {
  search: string;
  sortBy: SortOption;
  numeric: Record<NumericField, { min: number; max: number }>;
  categorical: Record<CategoricalField, string>;
}
