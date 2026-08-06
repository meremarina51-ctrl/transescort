import {
  TYPE_OPTIONS,
  FIGURE_OPTIONS,
  TEMPERAMENT_OPTIONS,
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
} from '@/lib/listing-options';
import type { CategoricalField, Filters, NumericField } from './catalog.types';

export const RANGE_FILTERS: { label: string; field: NumericField; minPh: string; maxPh: string }[] = [
  { label: 'Возраст', field: 'age', minPh: '18', maxPh: '50' },
  { label: 'Рост, см', field: 'height', minPh: '155', maxPh: '185' },
  { label: 'Вес, кг', field: 'weight', minPh: '45', maxPh: '70' },
  { label: 'Грудь', field: 'breastSize', minPh: '1', maxPh: '6' },
  { label: 'Цена/час, ₽', field: 'priceHour', minPh: '1000', maxPh: '10000' },
];

export const SELECT_FILTERS: { label: string; field: CategoricalField; options: string[] }[] = [
  { label: 'Тип', field: 'type', options: TYPE_OPTIONS },
  { label: 'Фигура', field: 'figure', options: FIGURE_OPTIONS },
  { label: 'Темперамент', field: 'temperament', options: TEMPERAMENT_OPTIONS },
  { label: 'Волосы', field: 'hairColor', options: HAIR_COLOR_OPTIONS },
  { label: 'Глаза', field: 'eyeColor', options: EYE_COLOR_OPTIONS },
];

/** Location (country/city) is filtered via the sidebar, not a Select — still applies during search. */
export const ALL_CATEGORICAL_FIELDS: CategoricalField[] = [...SELECT_FILTERS.map((f) => f.field), 'country', 'city'];

export const EMPTY_NUMERIC: Filters['numeric'] = {
  age: { min: 0, max: 0 },
  height: { min: 0, max: 0 },
  weight: { min: 0, max: 0 },
  breastSize: { min: 0, max: 0 },
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
