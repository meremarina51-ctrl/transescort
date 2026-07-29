'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(apiUrl('/auth/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName }),
      });
      await refreshUser();
      setSaved(true);
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

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved ? <p className="font-body text-sm text-emerald-400">Сохранено</p> : null}
      </form>
    </>
  );
}
