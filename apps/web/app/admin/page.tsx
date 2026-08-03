'use client';

import { useAuth } from '@/components/AuthProvider';

export default function AdminOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">Админ-панель, {user?.fullName || user?.login}!</h1>
      <p className="font-body text-white/40">Модерация анкет, управление исполнителями и пользователями платформы.</p>
    </div>
  );
}
