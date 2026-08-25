'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye, EyeOff, ImageOff, Loader2, Pencil, Search, Send, Trash2, Users } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { parseBody } from '@/lib/parse-body';

type ListingStatus = 'draft' | 'pending' | 'changes_requested' | 'published' | 'hidden' | 'blocked';

interface AdminListing {
  id: string;
  status: ListingStatus;
  slug: string | null;
  name: string | null;
  age: number | null;
  city: string | null;
  photos: string[];
  updatedAt: string;
  ownerLogin: string | null;
  ownerFullName: string | null;
  ownerTelegramUsername: string | null;
  ownerTelegramLinked: boolean;
}

const STATUS_BADGES: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'border border-white/10 bg-white/[0.06] text-white/50' },
  pending: { label: 'На проверке', className: 'border border-accent/25 bg-accent/10 text-accent' },
  changes_requested: { label: 'Требуются исправления', className: 'border border-orange-400/25 bg-orange-400/10 text-orange-300' },
  published: { label: 'Опубликована', className: 'badge-accent' },
  hidden: { label: 'Скрыта', className: 'border border-white/15 bg-white/[0.08] text-white/50' },
  blocked: { label: 'Заблокирована', className: 'border border-red-500/25 bg-red-500/10 text-red-400' },
};

function StatusBadge({ status }: { status: ListingStatus }) {
  const { label, className } = STATUS_BADGES[status];
  return <span className={`badge ${className}`}>{label}</span>;
}

export default function AdminPerformersPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminListing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/admin/listings');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить анкеты');
      setListings(data ?? []);
    } catch (err: any) {
      setLoadError(err.message || 'Не удалось загрузить анкеты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) =>
      [l.name, l.ownerLogin, l.ownerFullName, l.city, l.ownerTelegramUsername].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [listings, search]);

  const toggleStatus = async (l: AdminListing) => {
    if (l.status !== 'published' && l.status !== 'hidden') return;
    const action = l.status === 'published' ? 'hide' : 'unhide';
    setActionError('');
    setActionId(l.id);
    try {
      const res = await authFetch(`/admin/listings/${l.id}/${action}`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить видимость анкеты');
      setListings((prev) => prev.map((row) => (row.id === data.id ? data : row)));
    } catch (err: any) {
      setActionError(err.message || 'Не удалось изменить видимость анкеты');
    } finally {
      setActionId(null);
    }
  };

  const openDelete = (l: AdminListing) => {
    setDeleteTarget(l);
    setDeleteError('');
  };

  const closeDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await authFetch(`/admin/listings/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить анкету');
      setListings((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Не удалось удалить анкету');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Исполнители</h1>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, логину, городу..."
            className="input !pl-10"
          />
        </div>
      </div>

      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      ) : loadError ? (
        <p className="font-body text-sm text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Users className="h-8 w-8 text-white/25" strokeWidth={1.4} />
          <p className="font-body text-sm text-white/40">{search ? 'Ничего не найдено' : 'Анкет пока нет'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((l) => {
            const busy = actionId === l.id;
            return (
              <div key={l.id} className="card group overflow-hidden">
                <Link href={`/admin/performers/${l.id}`} className="block">
                  {l.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.photos[0]}
                      alt=""
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-white/[0.03]">
                      <ImageOff className="h-12 w-12 text-white/15" strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-display text-lg font-bold transition-colors group-hover:text-accent">
                        {l.name || 'Без имени'}
                      </h3>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="mt-1 font-body text-sm text-white/40">
                      {[l.age ? `${l.age} лет` : null, l.city].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="mt-1 font-body text-xs text-white/30">@{l.ownerLogin ?? '—'}</p>
                    <div className="mt-2">
                      {l.ownerTelegramLinked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 font-body text-[10px] font-medium text-accent">
                          <Send className="h-2.5 w-2.5" />
                          {l.ownerTelegramUsername ? `@${l.ownerTelegramUsername}` : 'Telegram подключён'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-body text-[10px] font-medium text-white/30">
                          <Send className="h-2.5 w-2.5" />
                          Telegram не подключён
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3">
                  <span className="font-body text-xs text-white/30">
                    {new Date(l.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/performers/${l.id}`}
                      title="Просмотр / редактирование"
                      className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleStatus(l)}
                      disabled={busy || (l.status !== 'published' && l.status !== 'hidden')}
                      title={
                        l.status === 'published'
                          ? 'Скрыть'
                          : l.status === 'hidden'
                            ? 'Вернуть в каталог'
                            : 'Доступно только для опубликованных или скрытых анкет'
                      }
                      className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : l.status === 'published' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(l)}
                      title="Удалить"
                      className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={deleting ? undefined : closeDelete} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Удалить анкету?</h2>
            <p className="font-body text-sm text-white/40">
              Анкета «{deleteTarget.name || 'Без имени'}» (@{deleteTarget.ownerLogin}) будет удалена без возможности
              восстановления.
            </p>

            {deleteError ? <p className="mt-4 font-body text-sm text-red-400">{deleteError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeDelete} disabled={deleting} className="btn-secondary disabled:opacity-50">
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
