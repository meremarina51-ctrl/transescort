'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, BadgeCheck, Eye, EyeOff, Lock, Send, Trash2, Unlock } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { NumberStepper } from '@/components/NumberStepper';
import { Select } from '@/components/Select';
import { PhotoReviewPanel, type PhotoReview } from '@/components/PhotoReviewPanel';
import {
  TYPE_OPTIONS,
  FIGURE_OPTIONS,
  TEMPERAMENT_OPTIONS,
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
  COUNTRY_OPTIONS,
  CITY_OPTIONS,
  toSelectOptions,
} from '@/lib/listing-options';

type ListingStatus = 'draft' | 'pending' | 'changes_requested' | 'published' | 'hidden' | 'blocked';

interface AdminListingDetail {
  id: string;
  status: ListingStatus;
  verificationNote: string | null;
  photos: string[];
  videoUrl: string | null;
  name: string | null;
  bio: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  breastSize: number | null;
  type: string | null;
  figure: string | null;
  temperament: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  country: string | null;
  city: string | null;
  ownerLogin: string | null;
  ownerFullName: string | null;
  ownerTelegramUsername: string | null;
  ownerTelegramLinked: boolean;
  photosVerified: boolean;
}

const STATUS_BADGES: Record<ListingStatus, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'border border-white/10 bg-white/[0.06] text-white/50' },
  pending: { label: 'На проверке', className: 'border border-accent/25 bg-accent/10 text-accent' },
  changes_requested: {
    label: 'Требуются исправления',
    className: 'border border-orange-400/25 bg-orange-400/10 text-orange-300',
  },
  published: { label: 'Опубликована', className: 'badge-accent' },
  hidden: { label: 'Скрыта', className: 'border border-white/15 bg-white/[0.08] text-white/50' },
  blocked: { label: 'Заблокирована', className: 'border border-red-500/25 bg-red-500/10 text-red-400' },
};

interface EditableFields {
  name: string | null;
  bio: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  breastSize: number | null;
  type: string | null;
  figure: string | null;
  temperament: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  country: string | null;
  city: string | null;
}

function toEditable(l: AdminListingDetail): EditableFields {
  return {
    name: l.name,
    bio: l.bio,
    age: l.age,
    height: l.height,
    weight: l.weight,
    breastSize: l.breastSize,
    type: l.type,
    figure: l.figure,
    temperament: l.temperament,
    hairColor: l.hairColor,
    eyeColor: l.eyeColor,
    country: l.country,
    city: l.city,
  };
}

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">{label}</label>
      {children}
    </div>
  );
}

export default function AdminPerformerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState<EditableFields | null>(null);
  const [initial, setInitial] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [photoReviews, setPhotoReviews] = useState<PhotoReview[]>([]);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockNote, setBlockNote] = useState('');
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockError, setBlockError] = useState('');

  const [telegramUnlinkBusy, setTelegramUnlinkBusy] = useState(false);
  const [telegramUnlinkError, setTelegramUnlinkError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [res, reviewsRes] = await Promise.all([
          authFetch(`/admin/listings/${id}`),
          authFetch(`/admin/listings/${id}/photo-reviews`),
        ]);
        const data = await parseBody(res);
        if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить анкету');
        if (cancelled) return;
        setListing(data);
        const editable = toEditable(data);
        setForm(editable);
        setInitial(editable);
        if (reviewsRes.ok) setPhotoReviews((await parseBody(reviewsRes)) ?? []);
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Не удалось загрузить анкету');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isDirty = form && initial ? JSON.stringify(form) !== JSON.stringify(initial) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      const res = await authFetch(`/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить изменения');
      }
      setListing(data);
      setInitial(form);
      setSaved(true);
    } catch (err: any) {
      setSaveError(err.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!listing || (listing.status !== 'published' && listing.status !== 'hidden')) return;
    const action = listing.status === 'published' ? 'hide' : 'unhide';
    setStatusBusy(true);
    setStatusError('');
    try {
      const res = await authFetch(`/admin/listings/${id}/${action}`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить видимость анкеты');
      setListing(data);
    } catch (err: any) {
      setStatusError(err.message || 'Не удалось изменить видимость анкеты');
    } finally {
      setStatusBusy(false);
    }
  };

  const closeBlock = () => {
    if (blockBusy) return;
    setBlockOpen(false);
    setBlockNote('');
    setBlockError('');
  };

  const confirmBlock = async () => {
    if (!blockNote.trim()) {
      setBlockError('Укажите причину блокировки');
      return;
    }
    setBlockBusy(true);
    setBlockError('');
    try {
      const res = await authFetch(`/admin/listings/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: blockNote.trim() }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось заблокировать анкету');
      setListing(data);
      setBlockOpen(false);
      setBlockNote('');
    } catch (err: any) {
      setBlockError(err.message || 'Не удалось заблокировать анкету');
    } finally {
      setBlockBusy(false);
    }
  };

  const unblock = async () => {
    setBlockBusy(true);
    setBlockError('');
    try {
      const res = await authFetch(`/admin/listings/${id}/unblock`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось снять блокировку');
      setListing(data);
    } catch (err: any) {
      setBlockError(err.message || 'Не удалось снять блокировку');
    } finally {
      setBlockBusy(false);
    }
  };

  const unlinkTelegram = async () => {
    setTelegramUnlinkBusy(true);
    setTelegramUnlinkError('');
    try {
      const res = await authFetch(`/admin/listings/${id}/telegram/unlink`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отвязать Telegram');
      setListing(data);
    } catch (err: any) {
      setTelegramUnlinkError(err.message || 'Не удалось отвязать Telegram');
    } finally {
      setTelegramUnlinkBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await authFetch(`/admin/listings/${id}`, { method: 'DELETE' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить анкету');
      router.push('/admin/performers');
    } catch (err: any) {
      setDeleteError(err.message || 'Не удалось удалить анкету');
      setDeleting(false);
    }
  };

  const backLink = (
    <Link
      href="/admin/performers"
      className="mb-4 inline-flex items-center gap-2 font-body text-sm text-white/50 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" /> К списку
    </Link>
  );

  if (loading) {
    return (
      <>
        {backLink}
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      </>
    );
  }

  if (loadError || !listing || !form) {
    return (
      <>
        {backLink}
        <p className="font-body text-sm text-red-400">{loadError || 'Анкета не найдена'}</p>
      </>
    );
  }

  return (
    <>
      {backLink}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">{listing.name || 'Без имени'}</h1>
        <span className={`badge ${STATUS_BADGES[listing.status].className}`}>{STATUS_BADGES[listing.status].label}</span>
        <span className="font-body text-xs text-white/35">@{listing.ownerLogin}</span>
      </div>
      {(listing.status === 'changes_requested' || listing.status === 'blocked') && listing.verificationNote ? (
        <p className={`mb-6 font-body text-sm ${listing.status === 'blocked' ? 'text-red-400' : 'text-orange-300'}`}>
          {listing.status === 'blocked' ? 'Причина блокировки: ' : 'Комментарий админа: '}
          {listing.verificationNote}
        </p>
      ) : null}

      <div className="space-y-6">
        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Медиа</h2>
            {listing.photosVerified ? (
              <span className="badge inline-flex items-center gap-1 border border-accent/25 bg-accent/10 text-accent">
                <BadgeCheck className="h-3.5 w-3.5" /> Фото подтверждены
              </span>
            ) : null}
          </div>
          {listing.photos.length === 0 ? (
            <p className="font-body text-sm text-white/30">Фото не загружены</p>
          ) : (
            <PhotoReviewPanel
              listingId={id}
              photos={listing.photos}
              initialReviews={photoReviews}
              onChanged={(reviews, data) => {
                setPhotoReviews(reviews);
                setListing(data);
              }}
            />
          )}
          {listing.videoUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={listing.videoUrl} controls className="mt-4 w-full max-w-md rounded-lg border border-white/[0.08]" />
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Анкета</h2>
          <Field label="Имя">
            <input
              value={form.name ?? ''}
              onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
              maxLength={100}
              className="input"
            />
          </Field>
          <Field label="Био">
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => setForm((f) => (f ? { ...f, bio: e.target.value } : f))}
              maxLength={3000}
              rows={5}
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Возраст">
              <NumberStepper value={form.age} onChange={(v) => setForm((f) => (f ? { ...f, age: v } : f))} min={18} max={80} />
            </Field>
            <Field label="Рост">
              <NumberStepper
                value={form.height}
                onChange={(v) => setForm((f) => (f ? { ...f, height: v } : f))}
                min={130}
                max={220}
              />
            </Field>
            <Field label="Вес">
              <NumberStepper
                value={form.weight}
                onChange={(v) => setForm((f) => (f ? { ...f, weight: v } : f))}
                min={30}
                max={200}
              />
            </Field>
            <Field label="Грудь">
              <NumberStepper
                value={form.breastSize}
                onChange={(v) => setForm((f) => (f ? { ...f, breastSize: v } : f))}
                min={0}
                max={10}
              />
            </Field>
            <Field label="Волосы">
              <Select
                value={form.hairColor}
                onChange={(v) => setForm((f) => (f ? { ...f, hairColor: v } : f))}
                options={toSelectOptions(HAIR_COLOR_OPTIONS)}
              />
            </Field>
            <Field label="Глаза">
              <Select
                value={form.eyeColor}
                onChange={(v) => setForm((f) => (f ? { ...f, eyeColor: v } : f))}
                options={toSelectOptions(EYE_COLOR_OPTIONS)}
              />
            </Field>
            <Field label="Страна">
              <Select
                value={form.country}
                onChange={(v) => setForm((f) => (f ? { ...f, country: v } : f))}
                options={toSelectOptions(COUNTRY_OPTIONS)}
              />
            </Field>
            <Field label="Город">
              <Select
                value={form.city}
                onChange={(v) => setForm((f) => (f ? { ...f, city: v } : f))}
                options={toSelectOptions(CITY_OPTIONS)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving || !isDirty} className="btn-primary disabled:opacity-50">
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
            {saved && !isDirty ? <span className="font-body text-sm text-emerald-400">Сохранено</span> : null}
            {saveError ? <span className="font-body text-sm text-red-400">{saveError}</span> : null}
          </div>
        </form>

        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Публикация</h2>
            <p className="mt-1 font-body text-xs text-white/35">
              {listing.status === 'published'
                ? 'Анкета видна в публичном каталоге.'
                : listing.status === 'hidden'
                  ? 'Анкета скрыта из каталога.'
                  : 'Доступно только для опубликованных или скрытых анкет — остальные статусы меняются через модерацию.'}
            </p>
            {statusError ? <p className="mt-2 font-body text-xs text-red-400">{statusError}</p> : null}
          </div>
          {listing.status === 'published' || listing.status === 'hidden' ? (
            <button type="button" onClick={toggleStatus} disabled={statusBusy} className="btn-secondary disabled:opacity-50">
              {statusBusy ? (
                'Сохраняем…'
              ) : listing.status === 'published' ? (
                <>
                  <EyeOff className="h-4 w-4" /> Скрыть
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Вернуть в каталог
                </>
              )}
            </button>
          ) : null}
        </div>

        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Telegram</h2>
            <p className="mt-1 font-body text-xs text-white/35">
              {listing.ownerTelegramLinked
                ? `Подключён: @${listing.ownerTelegramUsername ?? '—'}. Используется для связи с клиентами через бота.`
                : 'Исполнитель ещё не подключил Telegram — кнопка «Написать в Telegram» скрыта в анкете.'}
            </p>
            {telegramUnlinkError ? <p className="mt-2 font-body text-xs text-red-400">{telegramUnlinkError}</p> : null}
          </div>
          {listing.ownerTelegramLinked ? (
            <button
              type="button"
              onClick={unlinkTelegram}
              disabled={telegramUnlinkBusy}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 font-body text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {telegramUnlinkBusy ? 'Отвязываем…' : 'Отвязать Telegram'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 font-body text-sm font-medium text-white/30">
              <Send className="h-4 w-4" /> Не подключён
            </span>
          )}
        </div>

        <div className="card flex flex-wrap items-center justify-between gap-4 !border-red-500/20 p-6">
          <div>
            <h2 className="font-body text-sm uppercase tracking-wide text-red-400/70">Блокировка</h2>
            <p className="mt-1 font-body text-xs text-white/35">
              {listing.status === 'blocked'
                ? 'Анкета заблокирована — исполнитель не может её редактировать или отправить на проверку.'
                : 'Заблокировать анкету за нарушение правил — потребует указать причину.'}
            </p>
            {blockError ? <p className="mt-2 font-body text-xs text-red-400">{blockError}</p> : null}
          </div>
          {listing.status === 'blocked' ? (
            <button
              type="button"
              onClick={unblock}
              disabled={blockBusy}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-body text-sm font-medium text-white/80 transition-colors hover:border-accent hover:text-white disabled:opacity-50"
            >
              <Unlock className="h-4 w-4" /> {blockBusy ? 'Снимаем…' : 'Снять блокировку'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBlockOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 font-body text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Lock className="h-4 w-4" /> Заблокировать
            </button>
          )}
        </div>

        <div className="card flex flex-wrap items-center justify-between gap-4 !border-red-500/20 p-6">
          <div>
            <h2 className="font-body text-sm uppercase tracking-wide text-red-400/70">Опасная зона</h2>
            <p className="mt-1 font-body text-xs text-white/35">Анкета будет удалена без возможности восстановления.</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 font-body text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" /> Удалить анкету
          </button>
        </div>
      </div>

      {blockOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeBlock} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Lock className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Заблокировать анкету?</h2>
            <p className="font-body text-sm text-white/40">
              Анкета пропадёт из каталога. Исполнитель увидит причину и не сможет редактировать анкету, пока
              блокировка не снята.
            </p>

            <textarea
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              placeholder="Причина блокировки — обязательна, покажем исполнителю"
              rows={3}
              maxLength={1000}
              autoFocus
              className="input mt-4 resize-none text-left"
            />

            {blockError ? <p className="mt-4 font-body text-sm text-red-400">{blockError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeBlock} disabled={blockBusy} className="btn-secondary disabled:opacity-50">
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmBlock}
                disabled={blockBusy || !blockNote.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {blockBusy ? 'Блокируем…' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={deleting ? undefined : () => setDeleteOpen(false)}
          />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Удалить анкету?</h2>
            <p className="font-body text-sm text-white/40">
              Анкета «{listing.name || 'Без имени'}» (@{listing.ownerLogin}) будет удалена без возможности
              восстановления.
            </p>

            {deleteError ? <p className="mt-4 font-body text-sm text-red-400">{deleteError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="btn-secondary disabled:opacity-50"
              >
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
