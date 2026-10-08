import type { ListingAttributes } from './listing.types';

interface VitalConfig {
  key: keyof ListingAttributes;
  label: string;
  suffix?: string;
}

type Translate = (key: string) => string;

export const getListingVitalsConfig = (t: Translate): VitalConfig[] => [
  { key: 'age', label: t('ageLabel') },
  { key: 'height', label: t('heightLabel'), suffix: t('heightSuffix') },
  { key: 'weight', label: t('weightLabel'), suffix: t('weightSuffix') },
  { key: 'breastSize', label: t('breastLabel') },
  { key: 'penisSize', label: t('penisLabel'), suffix: t('penisSuffix') },
  { key: 'city', label: t('cityLabel') },
];

export function computeVitals<T extends ListingAttributes>(listing: T, config: VitalConfig[]) {
  return config
    .filter((row) => listing[row.key])
    .map((row) => ({ label: row.label, value: `${listing[row.key]}${row.suffix ? ` ${row.suffix}` : ''}` }));
}
