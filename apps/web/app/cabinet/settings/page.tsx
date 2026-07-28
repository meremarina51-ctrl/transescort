'use client';

import { Send } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Настройки</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-crimson/10 text-crimson">
                <Send className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Telegram</h2>
                <p className="mt-0.5 font-body text-xs text-white/30">Уведомления и быстрые действия в мессенджере</p>
              </div>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Не привязан
            </span>
          </div>

          <button type="button" className="btn-secondary mt-5">
            Привязать Telegram
          </button>
        </div>

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
      </div>
    </>
  );
}
