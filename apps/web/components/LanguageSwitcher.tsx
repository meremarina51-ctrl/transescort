'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABEL: Record<string, string> = { ru: 'RU', en: 'EN' };

interface IProps {
  className?: string;
}

function SwitcherPill({ href, className = '' }: { href: string; className?: string }) {
  const locale = useLocale();
  const activeIndex = Math.max(0, routing.locales.indexOf(locale as (typeof routing.locales)[number]));

  return (
    <div
      className={`relative inline-flex flex-shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] p-1 ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-accent shadow-sm shadow-accent/40 transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${routing.locales.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={href}
          locale={l}
          aria-current={l === locale ? 'true' : undefined}
          className={`relative z-10 flex-1 rounded-full px-2.5 py-1 text-center font-body text-[11px] font-bold uppercase tracking-wide transition-colors ${
            l === locale ? 'text-white' : 'text-white/45 hover:text-white/70'
          }`}
        >
          {LOCALE_LABEL[l] ?? l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

/** useSearchParams forces a Suspense boundary during static rendering — isolated here so it doesn't bail out every page that renders the header. */
function SwitcherPillWithQuery({ className }: IProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `${pathname}?${qs}` : pathname;

  return <SwitcherPill href={href} className={className} />;
}

/** Segmented pill toggle — keeps the current page and query string, swaps only the locale. */
export function LanguageSwitcher({ className }: IProps) {
  const pathname = usePathname();

  return (
    <Suspense fallback={<SwitcherPill href={pathname} className={className} />}>
      <SwitcherPillWithQuery className={className} />
    </Suspense>
  );
}
