'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Image as ImageIcon,
  Plus,
  SlidersHorizontal,
  Video as VideoIcon,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';
import { NumberStepper } from '@/components/NumberStepper';
import { Select } from '@/components/Select';

const TYPE_OPTIONS = ['Активный', 'Универсал', 'Пассивный'];
const FIGURE_OPTIONS = ['Стройная', 'Спортивная', 'Худощавая', 'Пышная', 'Модельная'];
const TEMPERAMENT_OPTIONS = ['Нежная', 'Страстная', 'Доминантная', 'Игривая', 'Спокойная'];
const HAIR_COLOR_OPTIONS = ['Блондинка', 'Брюнетка', 'Шатенка', 'Рыжая', 'Другой'];
const EYE_COLOR_OPTIONS = ['Голубые', 'Зелёные', 'Карие', 'Серые', 'Чёрные'];
const COUNTRY_OPTIONS = ['Россия', 'Беларусь', 'Украина', 'Казахстан', 'Другая'];
const CITY_OPTIONS = ['Москва', 'Балашиха', 'Люберцы', 'Одинцово', 'Химки', 'Мытищи', 'Подольск', 'Другой'];

const toSelectOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

interface ListingParams {
  bio: string;
  name: string;
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

const EMPTY_PARAMS: ListingParams = {
  bio: '',
  name: '',
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
};

function TileHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-crimson/10 text-crimson">
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

export default function ListingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<ListingParams>(EMPTY_PARAMS);
  const [initialParams, setInitialParams] = useState<ListingParams>(EMPTY_PARAMS);
  const [status, setStatus] = useState<'draft' | 'published' | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(apiUrl('/listings/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          if (data) {
            const loaded: ListingParams = {
              bio: data.bio ?? '',
              name: data.name ?? '',
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
            };
            setParams(loaded);
            setInitialParams(loaded);
            setStatus(data.status === 'published' ? 'published' : 'draft');
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
    const token = localStorage.getItem('accessToken');
    await fetch(apiUrl('/listings/me'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  };

  const save = async (newStatus: 'draft' | 'published') => {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = { bio: params.bio, status: newStatus, name: params.name };
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
      await patchListing(payload);
      setInitialParams(params);
      setStatus(newStatus);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(params) !== JSON.stringify(initialParams);
  const nameMissing = !params.name.trim();

  const authedFetch = (url: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');
    return fetch(apiUrl(url), {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  };

  const parseBody = async (res: Response) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
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
      const res = await authedFetch('/listings/me/photos', { method: 'POST', body: formData });
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
      const res = await authedFetch('/listings/me/photos', {
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

  const handleVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setVideoError('');
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authedFetch('/listings/me/video', { method: 'POST', body: formData });
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
      const res = await authedFetch('/listings/me/video', { method: 'DELETE' });
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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Моя анкета</h1>
        {status === 'published' ? (
          <span className="badge badge-crimson">Опубликовано</span>
        ) : status === 'draft' ? (
          <span className="badge border border-white/10 bg-white/[0.06] text-white/40">Черновик</span>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <TileHeader icon={ImageIcon} title="Фотографии" description="Добавьте несколько фото для анкеты" />

            {status === null ? (
              <p className="mt-5 font-body text-sm text-white/30">
                Сначала создайте анкету, чтобы добавить фото.
              </p>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((url) => (
                    <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Удалить фото"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <label
                    className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-white/30 transition-colors hover:border-crimson/40 hover:text-crimson ${
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
                {photosError ? <p className="mt-3 font-body text-xs text-red-400">{photosError}</p> : null}
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
                className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-10 text-white/30 transition-colors hover:border-crimson/40 hover:text-crimson ${
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
              <Field label="Имя" required>
                <input
                  type="text"
                  value={params.name}
                  onChange={(e) => setParams((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  placeholder="Например, Алиса"
                  className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-crimson"
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

        <div className="flex items-center justify-end gap-3">
          {saved ? <span className="font-body text-sm text-emerald-400">Сохранено</span> : null}
          {nameMissing ? (
            <span className="font-body text-sm text-red-400">Укажите имя для анкеты</span>
          ) : null}
          {status === null ? (
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving || nameMissing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Создаём…' : 'Создать'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={saving || nameMissing || (!isDirty && status === 'draft')}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохраняем…' : 'Сохранить как черновик'}
              </button>
              <button
                type="button"
                onClick={() => save('published')}
                disabled={saving || nameMissing || (!isDirty && status === 'published')}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Публикуем…' : 'Опубликовать'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
