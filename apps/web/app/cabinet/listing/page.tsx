'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Contact,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  SlidersHorizontal,
  Video as VideoIcon,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { NumberStepper } from '@/components/NumberStepper';
import { Select } from '@/components/Select';
import { SortablePhotoTile } from '@/components/SortablePhotoTile';
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
import type { ListingAttributes } from '@/lib/listing.types';

/** Form state — unlike the read-only ListingAttributes shape, name/bio are always controlled strings, never null. */
interface ListingParams extends Omit<ListingAttributes, 'name'> {
  bio: string;
  name: string;
  contactPhone: string;
  contactTelegram: string;
  contactWhatsapp: string;
}

const EMPTY_PARAMS: ListingParams = {
  bio: '',
  name: 'Новая анкета',
  age: 25,
  height: 165,
  weight: 55,
  breastSize: 2,
  type: TYPE_OPTIONS[0],
  figure: FIGURE_OPTIONS[0],
  temperament: TEMPERAMENT_OPTIONS[0],
  hairColor: HAIR_COLOR_OPTIONS[0],
  eyeColor: EYE_COLOR_OPTIONS[0],
  country: COUNTRY_OPTIONS[0],
  city: CITY_OPTIONS[0],
  priceHour: null,
  priceNight: null,
  contactPhone: '',
  contactTelegram: '',
  contactWhatsapp: '',
};

function TileHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <div>
        <h2 className="font-body text-sm uppercase tracking-wide text-white/35">{title}</h2>
        <p className="mt-0.5 font-body text-xs text-white/30">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

type ListingStatus = 'draft' | 'pending' | 'changes_requested' | 'published' | 'hidden' | 'blocked';

const MIN_PHOTOS_FOR_REVIEW = 3;

export default function ListingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<ListingParams>(EMPTY_PARAMS);
  const [initialParams, setInitialParams] = useState<ListingParams>(EMPTY_PARAMS);
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [verificationNote, setVerificationNote] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState('');

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState('');

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'performer') {
      setLoading(false);
      return;
    }

    (async () => {
      if (!localStorage.getItem('accessToken')) {
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch('/listings/me');
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          if (data) {
            const loaded: ListingParams = {
              bio: data.bio ?? '',
              name: data.name ?? EMPTY_PARAMS.name,
              age: data.age ?? EMPTY_PARAMS.age,
              height: data.height ?? EMPTY_PARAMS.height,
              weight: data.weight ?? EMPTY_PARAMS.weight,
              breastSize: data.breastSize ?? EMPTY_PARAMS.breastSize,
              type: data.type ?? EMPTY_PARAMS.type,
              figure: data.figure ?? EMPTY_PARAMS.figure,
              temperament: data.temperament ?? EMPTY_PARAMS.temperament,
              hairColor: data.hairColor ?? EMPTY_PARAMS.hairColor,
              eyeColor: data.eyeColor ?? EMPTY_PARAMS.eyeColor,
              country: data.country ?? EMPTY_PARAMS.country,
              city: data.city ?? EMPTY_PARAMS.city,
              priceHour: data.priceHour ?? null,
              priceNight: data.priceNight ?? null,
              contactPhone: data.contactPhone ?? '',
              contactTelegram: data.contactTelegram ?? '',
              contactWhatsapp: data.contactWhatsapp ?? '',
            };
            setParams(loaded);
            setInitialParams(loaded);
            setStatus(data.status ?? 'draft');
            setVerificationNote(data.verificationNote ?? null);
            setPhotos(data.photos ?? []);
            setVideoUrl(data.videoUrl ?? null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const patchListing = async (payload: Record<string, unknown>) => {
    await authFetch('/listings/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = { bio: params.bio, name: params.name };
      if (params.age !== null) payload.age = params.age;
      if (params.height !== null) payload.height = params.height;
      if (params.weight !== null) payload.weight = params.weight;
      if (params.breastSize !== null) payload.breastSize = params.breastSize;
      if (params.type) payload.type = params.type;
      if (params.figure) payload.figure = params.figure;
      if (params.temperament) payload.temperament = params.temperament;
      if (params.hairColor) payload.hairColor = params.hairColor;
      if (params.eyeColor) payload.eyeColor = params.eyeColor;
      if (params.country) payload.country = params.country;
      if (params.city) payload.city = params.city;
      if (params.priceHour !== null) payload.priceHour = params.priceHour;
      if (params.priceNight !== null) payload.priceNight = params.priceNight;
      payload.contactPhone = params.contactPhone;
      payload.contactTelegram = params.contactTelegram;
      payload.contactWhatsapp = params.contactWhatsapp;
      await patchListing(payload);
      setInitialParams(params);
      setStatus((prev) => prev ?? 'draft');
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(params) !== JSON.stringify(initialParams);

  const parseBody = async (res: Response) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  const submitForReview = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await authFetch('/listings/me/submit', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отправить анкету на проверку');
      setStatus(data.status);
      setVerificationNote(data.verificationNote ?? null);
    } catch (err: any) {
      setSubmitError(err.message || 'Не удалось отправить анкету на проверку');
    } finally {
      setSubmitting(false);
    }
  };

  const hideListing = async () => {
    setVisibilityBusy(true);
    setVisibilityError('');
    try {
      const res = await authFetch('/listings/me/hide', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось скрыть анкету');
      setStatus(data.status);
    } catch (err: any) {
      setVisibilityError(err.message || 'Не удалось скрыть анкету');
    } finally {
      setVisibilityBusy(false);
    }
  };

  const unhideListing = async () => {
    setVisibilityBusy(true);
    setVisibilityError('');
    try {
      const res = await authFetch('/listings/me/unhide', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось вернуть анкету в каталог');
      setStatus(data.status);
    } catch (err: any) {
      setVisibilityError(err.message || 'Не удалось вернуть анкету в каталог');
    } finally {
      setVisibilityBusy(false);
    }
  };

  const handlePhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    setPhotosError('');
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const res = await authFetch('/listings/me/photos', { method: 'POST', body: formData });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить фото');
      setPhotos(data.photos ?? []);
    } catch (err: any) {
      setPhotosError(err.message || 'Не удалось загрузить фото');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = async (url: string) => {
    setPhotosError('');
    try {
      const res = await authFetch('/listings/me/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить фото');
      setPhotos(data.photos ?? []);
    } catch (err: any) {
      setPhotosError(err.message || 'Не удалось удалить фото');
    }
  };

  const photoSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  /** Persists a new photo order — reordering (and choosing a main photo) doesn't touch the anketa's status. */
  const reorderPhotos = async (newOrder: string[]) => {
    const previous = photos;
    setPhotos(newOrder);
    setPhotosError('');
    try {
      const res = await authFetch('/listings/me/photos/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: newOrder }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить порядок фото');
      setPhotos(data.photos ?? newOrder);
    } catch (err: any) {
      setPhotos(previous);
      setPhotosError(err.message || 'Не удалось изменить порядок фото');
    }
  };

  const handlePhotoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.indexOf(active.id as string);
    const newIndex = photos.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderPhotos(arrayMove(photos, oldIndex, newIndex));
  };

  const setMainPhoto = (url: string) => {
    if (photos[0] === url) return;
    reorderPhotos([url, ...photos.filter((p) => p !== url)]);
  };

  const handleVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setVideoError('');
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('/listings/me/video', { method: 'POST', body: formData });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить видео');
      setVideoUrl(data.videoUrl ?? null);
    } catch (err: any) {
      setVideoError(err.message || 'Не удалось загрузить видео');
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = async () => {
    setVideoError('');
    try {
      const res = await authFetch('/listings/me/video', { method: 'DELETE' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить видео');
      setVideoUrl(data.videoUrl ?? null);
    } catch (err: any) {
      setVideoError(err.message || 'Не удалось удалить видео');
    }
  };

  if (user && user.role !== 'performer') {
    return (
      <>
        <h1 className="mb-6 font-display text-2xl font-bold">Моя анкета</h1>
        <div className="card p-6">
          <p className="font-body text-sm text-white/40">Раздел доступен только для аккаунтов исполнителей.</p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <h1 className="mb-6 font-display text-2xl font-bold">Моя анкета</h1>
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      </>
    );
  }

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-3 ${
          (status === 'changes_requested' || status === 'blocked') && verificationNote ? 'mb-2' : 'mb-6'
        }`}
      >
        <h1 className="font-display text-2xl font-bold">Моя анкета</h1>
        {status === null ? null : status === 'published' ? (
          <span className="badge badge-accent">Опубликована</span>
        ) : status === 'pending' ? (
          <span className="badge border border-accent/25 bg-accent/10 text-accent">На проверке</span>
        ) : status === 'changes_requested' ? (
          <span className="badge border border-orange-400/25 bg-orange-400/10 text-orange-300">Требуются исправления</span>
        ) : status === 'hidden' ? (
          <span className="badge border border-white/15 bg-white/[0.08] text-white/50">Скрыта</span>
        ) : status === 'blocked' ? (
          <span className="badge border border-red-500/25 bg-red-500/10 text-red-400">Заблокирована</span>
        ) : (
          <span className="badge border border-white/10 bg-white/[0.06] text-white/40">Черновик</span>
        )}
      </div>
      {(status === 'changes_requested' || status === 'blocked') && verificationNote ? (
        <p className={`mb-6 font-body text-sm ${status === 'blocked' ? 'text-red-400' : 'text-orange-300'}`}>
          {status === 'blocked' ? 'Причина блокировки: ' : 'Комментарий админа: '}
          {verificationNote}
        </p>
      ) : null}

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <TileHeader icon={ImageIcon} title="Фотографии" description="Добавьте не менее 3 фото для анкеты" />

            {status === null ? (
              <p className="mt-5 font-body text-sm text-white/30">
                Сначала создайте анкету, чтобы добавить фото.
              </p>
            ) : (
              <>
                <DndContext sensors={photoSensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
                  <SortableContext items={photos} strategy={rectSortingStrategy}>
                    <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {photos.map((url, index) => (
                        <SortablePhotoTile
                          key={url}
                          url={url}
                          isMain={index === 0}
                          onRemove={() => removePhoto(url)}
                          onSetMain={() => setMainPhoto(url)}
                        />
                      ))}
                      <label
                        className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-white/30 transition-colors hover:border-accent/40 hover:text-accent ${
                          uploadingPhotos ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="font-body text-[11px]">{uploadingPhotos ? 'Загрузка…' : 'Добавить'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePhotosSelected}
                          disabled={uploadingPhotos}
                        />
                      </label>
                    </div>
                  </SortableContext>
                </DndContext>
                {photos.length > 1 ? (
                  <p className="mt-3 font-body text-xs text-white/30">
                    Перетащите фото, чтобы изменить порядок, или нажмите на звезду, чтобы сделать его главным.
                  </p>
                ) : null}
                {photosError ? (
                  <p className="mt-3 font-body text-xs text-red-400">{photosError}</p>
                ) : photos.length < MIN_PHOTOS_FOR_REVIEW ? (
                  <p className="mt-3 font-body text-xs text-white/30">
                    Ещё {MIN_PHOTOS_FOR_REVIEW - photos.length} фото до минимума для отправки на проверку
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="card p-6">
            <TileHeader icon={VideoIcon} title="Видео" description="Добавьте видео-визитку" />
            {status === null ? (
              <p className="mt-5 font-body text-sm text-white/30">
                Сначала создайте анкету, чтобы добавить видео.
              </p>
            ) : videoUrl ? (
              <div className="relative mt-5">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={videoUrl} controls className="w-full rounded-lg border border-white/[0.08]" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Удалить видео"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-10 text-white/30 transition-colors hover:border-accent/40 hover:text-accent ${
                  uploadingVideo ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <Plus className="h-5 w-5" />
                <span className="font-body text-sm">{uploadingVideo ? 'Загрузка…' : 'Загрузить видео'}</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoSelected}
                  disabled={uploadingVideo}
                />
              </label>
            )}
            {videoError ? <p className="mt-3 font-body text-xs text-red-400">{videoError}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <TileHeader icon={BookOpen} title="Биография" description="Расскажите о себе — это увидят клиенты в анкете" />
            <div className="mt-5">
              <Field label="Имя">
                <input
                  type="text"
                  value={params.name}
                  onChange={(e) => setParams((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  placeholder="Например, Алиса"
                  className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-accent"
                />
              </Field>
            </div>
            <textarea
              value={params.bio}
              onChange={(e) => setParams((p) => ({ ...p, bio: e.target.value }))}
              maxLength={3000}
              rows={6}
              placeholder="Немного о себе..."
              className="input mt-5 resize-none"
            />
            <div className="mt-2 flex justify-end">
              <span className="font-body text-xs text-white/25">{params.bio.length}/3000</span>
            </div>
          </div>

          <div className="card p-6">
            <TileHeader icon={SlidersHorizontal} title="Параметры" description="Физические данные и география" />
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Возраст">
                <NumberStepper
                  value={params.age}
                  onChange={(v) => setParams((p) => ({ ...p, age: v }))}
                  min={18}
                  max={80}
                  placeholder="Лет"
                />
              </Field>
              <Field label="Рост">
                <NumberStepper
                  value={params.height}
                  onChange={(v) => setParams((p) => ({ ...p, height: v }))}
                  min={130}
                  max={220}
                  placeholder="См"
                />
              </Field>
              <Field label="Вес">
                <NumberStepper
                  value={params.weight}
                  onChange={(v) => setParams((p) => ({ ...p, weight: v }))}
                  min={30}
                  max={200}
                  placeholder="Кг"
                />
              </Field>
              <Field label="Грудь">
                <NumberStepper
                  value={params.breastSize}
                  onChange={(v) => setParams((p) => ({ ...p, breastSize: v }))}
                  min={0}
                  max={10}
                  placeholder="Размер"
                />
              </Field>
              <Field label="Тип">
                <Select
                  value={params.type}
                  onChange={(v) => setParams((p) => ({ ...p, type: v }))}
                  options={toSelectOptions(TYPE_OPTIONS)}
                />
              </Field>
              <Field label="Фигура">
                <Select
                  value={params.figure}
                  onChange={(v) => setParams((p) => ({ ...p, figure: v }))}
                  options={toSelectOptions(FIGURE_OPTIONS)}
                />
              </Field>
              <Field label="Темперамент">
                <Select
                  value={params.temperament}
                  onChange={(v) => setParams((p) => ({ ...p, temperament: v }))}
                  options={toSelectOptions(TEMPERAMENT_OPTIONS)}
                />
              </Field>
              <Field label="Волосы">
                <Select
                  value={params.hairColor}
                  onChange={(v) => setParams((p) => ({ ...p, hairColor: v }))}
                  options={toSelectOptions(HAIR_COLOR_OPTIONS)}
                />
              </Field>
              <Field label="Глаза">
                <Select
                  value={params.eyeColor}
                  onChange={(v) => setParams((p) => ({ ...p, eyeColor: v }))}
                  options={toSelectOptions(EYE_COLOR_OPTIONS)}
                />
              </Field>
              <Field label="Страна">
                <Select
                  value={params.country}
                  onChange={(v) => setParams((p) => ({ ...p, country: v }))}
                  options={toSelectOptions(COUNTRY_OPTIONS)}
                />
              </Field>
              <Field label="Город">
                <Select
                  value={params.city}
                  onChange={(v) => setParams((p) => ({ ...p, city: v }))}
                  options={toSelectOptions(CITY_OPTIONS)}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <TileHeader icon={Wallet} title="Стоимость" description="Укажите цены за час и ночь" />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Field label="Цена за час, ₽">
                <NumberStepper
                  value={params.priceHour}
                  onChange={(v) => setParams((p) => ({ ...p, priceHour: v }))}
                  min={0}
                  max={100000}
                  step={500}
                  placeholder="Руб."
                />
              </Field>
              <Field label="Цена за ночь, ₽">
                <NumberStepper
                  value={params.priceNight}
                  onChange={(v) => setParams((p) => ({ ...p, priceNight: v }))}
                  min={0}
                  max={500000}
                  step={1000}
                  placeholder="Руб."
                />
              </Field>
            </div>
          </div>

          <div className="card p-6">
            <TileHeader icon={Contact} title="Контакты" description="Показывается клиентам после оплаты тарифа" />
            <div className="mt-5 space-y-4">
              <Field label="Номер телефона">
                <input
                  type="tel"
                  value={params.contactPhone}
                  onChange={(e) => setParams((p) => ({ ...p, contactPhone: e.target.value }))}
                  maxLength={32}
                  placeholder="+7 999 123-45-67"
                  className="input"
                />
              </Field>
              <Field label="Telegram">
                <input
                  type="text"
                  value={params.contactTelegram}
                  onChange={(e) => setParams((p) => ({ ...p, contactTelegram: e.target.value }))}
                  maxLength={100}
                  placeholder="@username"
                  className="input"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  type="tel"
                  value={params.contactWhatsapp}
                  onChange={(e) => setParams((p) => ({ ...p, contactWhatsapp: e.target.value }))}
                  maxLength={32}
                  placeholder="+7 999 123-45-67"
                  className="input"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {saved ? <span className="font-body text-sm text-emerald-400">Сохранено</span> : null}
          {submitError ? <span className="font-body text-sm text-red-400">{submitError}</span> : null}
          {visibilityError ? <span className="font-body text-sm text-red-400">{visibilityError}</span> : null}

          {status === null ? (
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Создаём…' : 'Создать'}
            </button>
          ) : (
            <>
                  {status === 'pending' ? (
                <span className="font-body text-sm text-white/40">Анкета на проверке у администратора</span>
              ) : status === 'blocked' ? (
                <span className="font-body text-sm text-red-400">Анкета заблокирована администратором</span>
              ) : status === 'published' ? (
                <>
                  <span className="font-body text-sm text-white/40">Анкета опубликована</span>
                  <button
                    type="button"
                    onClick={hideListing}
                    disabled={visibilityBusy}
                    className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <EyeOff className="h-4 w-4" />
                    {visibilityBusy ? 'Скрываем…' : 'Скрыть анкету'}
                  </button>
                </>
              ) : status === 'hidden' ? (
                <>
                  <span className="font-body text-sm text-white/40">Анкета скрыта из каталога</span>
                  <button
                    type="button"
                    onClick={unhideListing}
                    disabled={visibilityBusy}
                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Eye className="h-4 w-4" />
                    {visibilityBusy ? 'Публикуем…' : 'Вернуть в каталог'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={submitForReview}
                  disabled={submitting || saving || isDirty || photos.length < MIN_PHOTOS_FOR_REVIEW}
                  title={
                    photos.length < MIN_PHOTOS_FOR_REVIEW
                      ? `Добавьте не менее ${MIN_PHOTOS_FOR_REVIEW} фото`
                      : isDirty
                        ? 'Сначала сохраните изменения'
                        : undefined
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Отправляем…' : 'Отправить на проверку'}
                </button>
              )}

              <button
                type="button"
                onClick={() => save()}
                disabled={saving || !isDirty}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
