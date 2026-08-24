'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { ROUTES } from '@/lib/routes';

interface TelegramStatus {
  linked: boolean;
  username: string | null;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [initial, setInitial] = useState({ fullName: user?.fullName ?? '', email: '', phone: '' });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);

  const isDirty = fullName !== initial.fullName || email !== initial.email || phone !== initial.phone;

  useEffect(() => {
    let cancelled = false;

    async function loadTelegramStatus() {
      try {
        const res = await authFetch('/telegram/status');
        if (!res.ok || cancelled) return;
        setTelegramStatus(await res.json());
      } catch {
        // stale/local values are fine if this fails
      }
    }

    loadTelegramStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await authFetch('/auth/me');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setFullName(data.fullName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setCreatedAt(data.createdAt ?? null);
        setInitial({ fullName: data.fullName ?? '', email: data.email ?? '', phone: data.phone ?? '' });
      } catch {
        // stale/local values are fine if this fails
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await authFetch('/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as { message?: string | string[] }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить изменения';
        throw new Error(msg);
      }

      await refreshUser();
      setInitial({ fullName, email, phone });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Профиль</h1>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Логин</label>
          <input value={user?.login ?? ''} disabled className="input opacity-50" />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Имя</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>

        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 123-45-67"
            className="input"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 flex-shrink-0 text-white/40" strokeWidth={1.6} />
            <div>
              <p className="font-body text-sm text-white/70">Telegram</p>
              <p className="font-body text-xs text-white/35">
                {telegramStatus?.linked ? `Привязан${telegramStatus.username ? ` (@${telegramStatus.username})` : ''}` : 'Не привязан'}
              </p>
            </div>
          </div>
          <Link href={ROUTES.CABINET_SETTINGS} className="font-body text-xs font-medium text-accent hover:underline">
            Перейти в настройки
          </Link>
        </div>

        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Дата регистрации</label>
          <input
            value={createdAt ? new Date(createdAt).toLocaleDateString('ru-RU') : '—'}
            disabled
            className="input opacity-50"
          />
        </div>

        <button type="submit" disabled={saving || !isDirty} className="btn-primary disabled:opacity-50">
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved && !isDirty ? <p className="font-body text-sm text-emerald-400">Сохранено</p> : null}
        {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}
      </form>
    </>
  );
}
