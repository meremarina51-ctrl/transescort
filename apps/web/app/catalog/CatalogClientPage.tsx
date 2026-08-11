'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ImageOff, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Select } from '@/components/Select';
import { FavoriteButton } from '@/components/FavoriteButton';
import { LocationSidebar, type GeoCountry } from '@/components/LocationSidebar';
import { useOutsideClose } from '@/hooks/useOutsideClose';
import { toSelectOptions } from '@/lib/listing-options';
import { formatPrice } from '@/lib/format';
import { getRotatedListings } from './catalog-rotation';
import type { CategoricalField, CatalogListing, NumericField, SortOption } from './catalog.types';
import {
  ALL_CATEGORICAL_FIELDS,
  EMPTY_CATEGORICAL,
  EMPTY_NUMERIC,
  RANGE_FILTERS,
  SELECT_FILTERS,
  numberInputClass,
} from './catalog.constants';

function anketaWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'анкета';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'анкеты';
  return 'анкет';
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 font-body text-xs font-medium transition-colors ${
        active ? 'bg-accent text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  );
}

export function CatalogClientPage({ initialListings }: { initialListings: CatalogListing[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [numeric, setNumeric] = useState(EMPTY_NUMERIC);
  const [categorical, setCategorical] = useState(EMPTY_CATEGORICAL);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useOutsideClose(panelOpen, filterRef, useCallback(() => setPanelOpen(false), []));

  const setRange = (field: NumericField, bound: 'min' | 'max', value: number) =>
    setNumeric((prev) => ({ ...prev, [field]: { ...prev[field], [bound]: value } }));

  const setCategory = (field: CategoricalField, value: string) =>
    setCategorical((prev) => ({ ...prev, [field]: value }));

  const handleLocationSelect = (country: string, city: string) => {
    setCategorical((prev) => ({ ...prev, country, city }));
  };

  const hasAdvancedFilters =
    Object.values(numeric).some((r) => r.min > 0 || r.max > 0) ||
    SELECT_FILTERS.some(({ field }) => categorical[field] !== '');

  const hasActiveFilters = hasAdvancedFilters || search.trim() !== '' || categorical.country !== '' || categorical.city !== '';

  const resetAllFilters = () => {
    setSearch('');
    setNumeric(EMPTY_NUMERIC);
    setCategorical(EMPTY_CATEGORICAL);
  };

  /**
   * Randomized once per browser session (see catalog-rotation.ts) — every filter/sort below
   * operates on this fixed base order. Starts as the server-rendered order and only shuffles
   * client-side after mount: Math.random() would differ between the SSR pass and the client's
   * first render otherwise, causing a hydration mismatch.
   */
  const [rotatedListings, setRotatedListings] = useState(initialListings);
  useEffect(() => {
    setRotatedListings(getRotatedListings(initialListings));
  }, [initialListings]);

  const geoData = useMemo<GeoCountry[]>(() => {
    const byCountry = new Map<string, Set<string>>();
    for (const l of initialListings) {
      const country = l.country?.trim();
      if (!country) continue;
      if (!byCountry.has(country)) byCountry.set(country, new Set());
      const city = l.city?.trim();
      if (city) byCountry.get(country)!.add(city);
    }
    return Array.from(byCountry.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'ru'))
      .map(([country, cities]) => ({ country, cities: Array.from(cities).sort((a, b) => a.localeCompare(b, 'ru')) }));
  }, [initialListings]);

  const listings = useMemo(() => {
    let result = rotatedListings;

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((l) => (l.name ?? '').toLowerCase().includes(query));
    }

    for (const { field } of RANGE_FILTERS) {
      const { min, max } = numeric[field];
      if (min > 0) result = result.filter((l) => (l[field] ?? 0) >= min);
      if (max > 0) result = result.filter((l) => (l[field] ?? Infinity) <= max);
    }

    for (const field of ALL_CATEGORICAL_FIELDS) {
      const value = categorical[field];
      if (value) result = result.filter((l) => l[field] === value);
    }

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ru'));
    }

    return result;
  }, [rotatedListings, search, sortBy, numeric, categorical]);

  const locationLabel = categorical.city || categorical.country;

  return (
    <div className="flex gap-8">
      <LocationSidebar
        selectedCountry={categorical.country}
        selectedCity={categorical.city}
        onSelect={handleLocationSelect}
        mobileOpen={mobileLocationOpen}
        onMobileClose={() => setMobileLocationOpen(false)}
        geoData={geoData}
      />

      <div className="min-w-0 flex-1">
        <div className="mb-8 space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени"
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 font-body text-sm text-white outline-none placeholder:text-white/30 focus:border-accent/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill active={sortBy === 'newest'} onClick={() => setSortBy('newest')}>
              Новые
            </Pill>
            <Pill active={sortBy === 'name'} onClick={() => setSortBy('name')}>
              А–Я
            </Pill>

            <button
              type="button"
              onClick={() => setMobileLocationOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-body text-xs font-medium transition-colors md:hidden ${
                locationLabel
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {locationLabel || 'Локация'}
            </button>

            <div className="ml-auto flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="font-body text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  Сбросить всё
                </button>
              )}
              <div ref={filterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPanelOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-body text-xs font-medium transition-colors ${
                    panelOpen || hasAdvancedFilters
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Фильтры
                </button>

                {panelOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-[min(90vw,560px)] space-y-5 rounded-2xl border border-white/[0.08] bg-[#141414] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-wrap gap-4">
                      {RANGE_FILTERS.map(({ label, field, minPh, maxPh }) => (
                        <div key={field} className="flex items-center gap-2">
                          <span className="font-body text-xs text-white/40">{label}</span>
                          <input
                            type="number"
                            placeholder={minPh}
                            value={numeric[field].min || ''}
                            onChange={(e) => setRange(field, 'min', Number(e.target.value) || 0)}
                            className={numberInputClass}
                          />
                          <span className="text-xs text-white/20">—</span>
                          <input
                            type="number"
                            placeholder={maxPh}
                            value={numeric[field].max || ''}
                            onChange={(e) => setRange(field, 'max', Number(e.target.value) || 0)}
                            className={numberInputClass}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {SELECT_FILTERS.map(({ label, field, options }) => (
                        <div key={field}>
                          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                            {label}
                          </label>
                          <Select
                            value={categorical[field] || null}
                            onChange={(v) => setCategory(field, v)}
                            options={toSelectOptions(options)}
                            placeholder="Любой"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mb-4 font-body text-sm text-white/40">
          Найдено: {listings.length} {anketaWord(listings.length)}
        </p>

        {listings.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-16 text-center">
            <ImageOff className="h-8 w-8 text-white/25" strokeWidth={1.4} />
            <p className="font-body text-sm text-white/40">
              {initialListings.length === 0
                ? 'Пока нет опубликованных анкет'
                : 'Ничего не найдено — попробуйте изменить фильтры'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/catalog/${listing.slug ?? listing.id}`}
                className="card group relative overflow-hidden"
              >
                <FavoriteButton listingId={listing.id} />
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photos[0]}
                    alt={listing.name ?? ''}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-white/[0.03]">
                    <ImageOff className="h-16 w-16 text-white/15" strokeWidth={1.2} />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold transition-colors group-hover:text-accent">
                    {listing.name || 'Без имени'}
                  </h3>
                  <p className="mt-1 font-body text-sm text-white/40">
                    {[listing.age ? `${listing.age} лет` : null, listing.city].filter(Boolean).join(' · ')}
                  </p>
                  {listing.priceHour ? (
                    <p className="mt-2 font-body text-sm font-semibold text-accent">
                      {formatPrice(listing.priceHour)} / час
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
