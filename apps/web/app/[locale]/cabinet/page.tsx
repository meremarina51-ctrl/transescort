'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getPerformerOverviewTiles, getClientOverviewTiles, getDefaultOverviewTiles } from './cabinet.constants';
import { Role } from '@/lib/enums';

export default function CabinetOverviewPage() {
  const { user } = useAuth();
  const t = useTranslations('cabinet.overview');
  const tNav = useTranslations('cabinet.nav');
  const tDesc = useTranslations('cabinet.overview.descriptions');
  const tiles =
    user?.role === Role.Performer
      ? getPerformerOverviewTiles(tNav, tDesc)
      : user?.role === Role.Client
        ? getClientOverviewTiles(tNav, tDesc)
        : getDefaultOverviewTiles(tNav, tDesc);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">{t('greeting', { name: user?.fullName || user?.login || '' })}</h1>
      <p className="mb-6 font-body text-white/40">{t('subtitle')}</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="card group p-6">
            <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
            <h3 className="font-display text-base font-bold transition-colors group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
