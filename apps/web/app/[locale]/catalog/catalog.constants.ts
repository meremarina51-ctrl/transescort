import {
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
} from '@/lib/listing-options';
import type { CategoricalField, Filters, NumericField } from './catalog.types';

type Translate = (key: string) => string;

export const getRangeFilters = (t: Translate): { label: string; field: NumericField; minPh: string; maxPh: string }[] => [
  { label: t('ageFilterLabel'), field: 'age', minPh: '18', maxPh: '50' },
  { label: t('heightFilterLabel'), field: 'height', minPh: '155', maxPh: '185' },
  { label: t('weightFilterLabel'), field: 'weight', minPh: '45', maxPh: '70' },
  { label: t('breastFilterLabel'), field: 'breastSize', minPh: '1', maxPh: '6' },
  { label: t('penisFilterLabel'), field: 'penisSize', minPh: '10', maxPh: '25' },
  { label: t('priceHourFilterLabel'), field: 'priceHour', minPh: '1000', maxPh: '10000' },
];

export const getSelectFilters = (t: Translate): { label: string; field: CategoricalField; options: string[] }[] => [
  { label: t('hairFilterLabel'), field: 'hairColor', options: HAIR_COLOR_OPTIONS },
  { label: t('eyeFilterLabel'), field: 'eyeColor', options: EYE_COLOR_OPTIONS },
];

/** Location (country/city) is filtered via the sidebar, not a Select — still applies during search. */
export const getAllCategoricalFields = (t: Translate): CategoricalField[] => [...getSelectFilters(t).map((f) => f.field), 'country', 'city'];

export const EMPTY_NUMERIC: Filters['numeric'] = {
  age: { min: 0, max: 0 },
  height: { min: 0, max: 0 },
  weight: { min: 0, max: 0 },
  breastSize: { min: 0, max: 0 },
  penisSize: { min: 0, max: 0 },
  priceHour: { min: 0, max: 0 },
};

export const EMPTY_CATEGORICAL: Filters['categorical'] = {
  type: '',
  figure: '',
  temperament: '',
  hairColor: '',
  eyeColor: '',
  country: '',
  city: '',
};

export const numberInputClass =
  'w-20 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-center font-body text-xs text-white outline-none placeholder:text-white/20 focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
