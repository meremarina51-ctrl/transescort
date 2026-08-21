'use client';

import Link from 'next/link';
import { useAuthOrGuest } from './AuthProvider';

export function HomeCtaButtons() {
  const { user } = useAuthOrGuest();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      {!user && (
        <Link href="/register" className="btn-primary">
          Создать аккаунт
        </Link>
      )}
      <Link href="/catalog" className="btn-secondary">
        Перейти в каталог
      </Link>
    </div>
  );
}
