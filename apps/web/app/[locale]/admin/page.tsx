'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ShieldCheck, Users, UserCog, type LucideIcon, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { ROUTES } from '@/lib/routes';

function getOverviewTiles(tNav: (key: string) => string, t: (key: string) => string): { href: string; icon: LucideIcon; title: string; description: string }[] {
  return [
    {
      href: ROUTES.ADMIN_MODERATION,
      icon: ShieldCheck,
      title: tNav('moderation'),
      description: t('moderationDescription'),
    },
    {
      href: ROUTES.ADMIN_PERFORMERS,
      icon: Users,
      title: tNav('performers'),
      description: t('performersDescription'),
    },
    {
      href: ROUTES.ADMIN_USERS,
      icon: UserCog,
      title: tNav('users'),
      description: t('usersDescription'),
    },
    {
      href: ROUTES.ADMIN_SETTINGS,
      icon: Settings,
      title: tNav('settings'),
      description: t('settingsDescription'),
    },
  ];
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const t = useTranslations('admin.overview');
  const tNav = useTranslations('admin.nav');
  const OVERVIEW_TILES = getOverviewTiles(tNav, t);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">{t('greeting', { name: user?.fullName || user?.login || '' })}</h1>
      <p className="mb-6 font-body text-white/40">{t('subtitle')}</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {OVERVIEW_TILES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="card group p-6">
            <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
            <h3 className="font-display text-base font-bold transition-colors group-hover:text-accent">{title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
