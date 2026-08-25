'use client';

import Link from 'next/link';
import { useAuthOrGuest } from '../AuthProvider';
import { ROUTES } from '@/lib/routes';

export function CtaButtons() {
  const { user } = useAuthOrGuest();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {!user && (
        <Link href={ROUTES.REGISTER} className="btn-primary">
          Создать аккаунт
        </Link>
      )}
      <Link href={ROUTES.CATALOG} className="btn-secondary">
        Перейти в каталог
      </Link>
    </div>
  );
}
