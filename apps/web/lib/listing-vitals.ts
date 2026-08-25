import type { ListingAttributes } from './listing.types';

interface VitalConfig {
  key: keyof ListingAttributes;
  label: string;
  suffix?: string;
}

export const LISTING_VITALS: VitalConfig[] = [
  { key: 'age', label: 'Возраст' },
  { key: 'height', label: 'Рост', suffix: 'см' },
  { key: 'weight', label: 'Вес', suffix: 'кг' },
  { key: 'breastSize', label: 'Грудь' },
  { key: 'penisSize', label: 'Член', suffix: 'см' },
  { key: 'city', label: 'Город' },
];

export function computeVitals<T extends ListingAttributes>(listing: T, config: VitalConfig[] = LISTING_VITALS) {
  return config
    .filter((row) => listing[row.key])
    .map((row) => ({ label: row.label, value: `${listing[row.key]}${row.suffix ? ` ${row.suffix}` : ''}` }));
}
