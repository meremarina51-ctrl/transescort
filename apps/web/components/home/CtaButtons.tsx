'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthOrGuest } from '../AuthProvider';
import { ROUTES } from '@/lib/routes';
import { reachGoal } from '@/lib/metrika';

export function CtaButtons() {
  const { user } = useAuthOrGuest();
  const t = useTranslations('home.cta');

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {!user && (
        <Link href={ROUTES.REGISTER} className="btn-primary" onClick={() => reachGoal('cta_register_home')}>
          {t('createAccount')}
        </Link>
      )}
      <Link href={ROUTES.CATALOG} className="btn-secondary" onClick={() => reachGoal('cta_catalog_home')}>
        {t('goToCatalog')}
      </Link>
    </div>
  );
}
