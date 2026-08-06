import Image from 'next/image';
import Link from 'next/link';
import { Star, ImageOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomeCtaButtons } from '@/components/HomeCtaButtons';
import { MOCK_REVIEWS, MOCK_TARIFFS } from '@/lib/mock-data';
import { apiUrl } from '@/lib/api-url';
import { formatPrice } from '@/lib/format';
import type { CatalogListing } from './catalog/catalog.types';
import { FEATURES } from './home.constants';

async function getLatestListings(): Promise<CatalogListing[]> {
  try {
    const res = await fetch(apiUrl('/catalog'), { cache: 'no-store' });
    if (!res.ok) return [];
    const listings: CatalogListing[] = await res.json();
    return listings.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const latestListings = await getLatestListings();

  return (
    <div className="bg-[#0a0a0a] text-white">
      <Header />

      {/* HERO / ABOUT */}
      <section id="about" className="relative overflow-hidden py-14 sm:py-20 md:py-28 lg:py-32">
        <Image
          src="/hero-bg-v2.png"
          alt=""
          fill
          priority
          className="object-cover object-[75%_20%] sm:object-[70%_22%] md:object-[65%_25%] lg:object-[60%_28%] xl:object-[55%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 30% 0%, rgba(108,92,231,0.22), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="max-w-xl text-left">
            <h1 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
              Платформа <span className="text-accent">проверенных</span> анкет
            </h1>
            <p className="mt-5 font-body text-base text-[#C9CDD3] md:text-lg">
              Сервис по подбору моделей для досуга в Москве и Московской области
            </p>
            <div className="mt-10">
              <button type="button" className="btn-primary">
                Перейти в каталог
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map(({ Icon, title, text }) => (
              <div key={title} className="card group p-6">
                <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
                <h3 className="font-display text-base font-bold group-hover:text-accent transition-colors">
                  {title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ИСПОЛНИТЕЛИ */}
      <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="mb-12 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-extrabold md:text-4xl">Исполнители</h2>
            <Link href="/catalog" className="font-body text-sm font-medium text-accent hover:underline">
              Показать все &rarr;
            </Link>
          </div>

          {latestListings.length === 0 ? (
            <p className="font-body text-sm text-white/40">Пока нет опубликованных анкет</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {latestListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/catalog/${listing.slug ?? listing.id}`}
                  className="card group overflow-hidden"
                >
                  {listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.photos[0]}
                      alt={listing.name ?? ''}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-white/[0.03]">
                      <ImageOff className="h-8 w-8 text-white/15" strokeWidth={1.4} />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-display text-sm font-bold group-hover:text-accent transition-colors">
                      {listing.name || 'Без имени'}
                    </h3>
                    <p className="mt-1 font-body text-xs text-white/40">
                      {[listing.age ? `${listing.age} лет` : null, listing.city].filter(Boolean).join(' · ')}
                    </p>
                    {listing.priceHour ? (
                      <p className="mt-1 font-body text-xs font-semibold text-accent">
                        {formatPrice(listing.priceHour)} / час
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ОТЗЫВЫ */}
      <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <h2 className="mb-12 text-center font-display text-2xl font-extrabold md:text-4xl">Отзывы</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="card p-6">
                <div className="mb-2 flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? 'fill-accent text-accent' : 'text-white/15'}`}
                    />
                  ))}
                </div>
                <p className="font-body text-sm leading-relaxed text-white/60">{r.text}</p>
                <p className="mt-4 font-body text-xs text-white/30">
                  {r.name} &middot; {new Date(r.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ТАРИФЫ */}
      {/* <section id="pricing" className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 text-center md:px-10">
          <h2 className="font-display text-2xl font-extrabold md:text-4xl">Тарифы</h2>
          <p className="mt-3 font-body text-white/40">Выберите тариф, который подходит именно вам</p>

          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {MOCK_TARIFFS.map((tariff) => (
              <div key={tariff.id} className="card p-8">
                <h3 className="font-display text-lg font-bold">{tariff.name}</h3>
                <p className="mt-2 font-display text-3xl font-extrabold text-accent">{tariff.price}</p>
                <ul className="mt-6 space-y-2 font-body text-sm text-white/45">
                  {tariff.features.map((f) => (
                    <li key={f}>&bull; {f}</li>
                  ))}
                </ul>
                <button type="button" disabled className="btn-secondary mt-8 w-full cursor-not-allowed opacity-40">
                  Выбрать
                </button>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA */}
      <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[700px] px-6 text-center md:px-10">
          <h2 className="font-display text-2xl font-extrabold md:text-4xl">Готовы начать?</h2>
          <p className="mx-auto mt-4 max-w-md font-body text-white/40">
            Создайте аккаунт за 30 секунд и получите доступ к платформе
          </p>
          <HomeCtaButtons />
        </div>
      </section>

      <Footer />
    </div>
  );
}
