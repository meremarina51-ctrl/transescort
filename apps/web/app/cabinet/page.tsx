'use client';

import { useAuth } from '@/components/AuthProvider';

const ROLE_LABEL: Record<string, string> = {
  client: 'Клиент',
  performer: 'Исполнитель',
  admin: 'Администратор',
};

export default function CabinetOverviewPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold">Привет, {user?.fullName || user?.email}!</h1>
      <p className="mb-6 font-body text-white/40">Это личный кабинет — добавляйте сюда свои разделы.</p>

      <div className="card p-6">
        <h2 className="mb-3 font-body text-sm uppercase tracking-wide text-white/35">Аккаунт</h2>
        <dl className="space-y-2 font-body text-sm">
          <div className="flex justify-between">
            <dt className="text-white/40">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/40">Роль</dt>
            <dd>{user ? ROLE_LABEL[user.role] ?? user.role : '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
