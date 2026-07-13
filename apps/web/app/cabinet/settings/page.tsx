'use client';

import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Настройки</h1>

      <div className="card p-6">
        <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">Сессия</h2>
        <p className="mb-4 font-body text-sm text-white/40">Завершить текущую сессию на этом устройстве.</p>
        <button
          onClick={logout}
          className="rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 hover:bg-red-500/10"
        >
          Выйти из аккаунта
        </button>
      </div>
    </>
  );
}
