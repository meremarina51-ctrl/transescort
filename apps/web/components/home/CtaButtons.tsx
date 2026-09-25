'use client';

import Link from 'next/link';
import { useAuthOrGuest } from '../AuthProvider';
import { ROUTES } from '@/lib/routes';
import { reachGoal } from '@/lib/metrika';

export function CtaButtons() {
  const { user } = useAuthOrGuest();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {!user && (
        <Link href={ROUTES.REGISTER} className="btn-primary" onClick={() => reachGoal('cta_register_home')}>
          Создать аккаунт
        </Link>
      )}
      <Link href={ROUTES.CATALOG} className="btn-secondary" onClick={() => reachGoal('cta_catalog_home')}>
        Перейти в каталог
      </Link>
    </div>
  );
}
