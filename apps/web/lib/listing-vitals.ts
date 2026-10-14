import type { ListingAttributes } from './listing.types';
import { geoLabel } from './listing-options';

interface VitalConfig {
  key: keyof ListingAttributes;
  label: string;
  suffix?: string;
  format?: (value: string) => string;
}

type Translate = (key: string) => string;

export const getListingVitalsConfig = (t: Translate, locale: string): VitalConfig[] => [
  { key: 'age', label: t('ageLabel') },
  { key: 'height', label: t('heightLabel'), suffix: t('heightSuffix') },
  { key: 'weight', label: t('weightLabel'), suffix: t('weightSuffix') },
  { key: 'breastSize', label: t('breastLabel') },
  { key: 'penisSize', label: t('penisLabel'), suffix: t('penisSuffix') },
  { key: 'city', label: t('cityLabel'), format: (v) => geoLabel(v, locale) },
];

export function computeVitals<T extends ListingAttributes>(listing: T, config: VitalConfig[]) {
  return config
    .filter((row) => listing[row.key])
    .map((row) => {
      const raw = String(listing[row.key]);
      const value = row.format ? row.format(raw) : raw;

      return { label: row.label, value: `${value}${row.suffix ? ` ${row.suffix}` : ''}` };
    });
}
