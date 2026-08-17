'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Image as ImageIcon, Plus, Upload, X } from 'lucide-react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { SortablePhotoTile } from '@/components/SortablePhotoTile';
import { PHOTO_REVIEW_STATUS_CLASS, PHOTO_REVIEW_STATUS_LABEL, type PhotoReview } from '@/components/PhotoReviewPanel';
import { authFetch } from '@/lib/auth-fetch';
import { parseBody } from '@/lib/parse-body';

const MIN_PHOTOS_FOR_REVIEW = 3;

export default function PhotosPage() {
  const [loading, setLoading] = useState(true);
  const [hasListing, setHasListing] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState('');
  const [photosSubmittedAt, setPhotosSubmittedAt] = useState<string | null>(null);
  const [submittingPhotos, setSubmittingPhotos] = useState(false);
  const [photosSubmitError, setPhotosSubmitError] = useState('');
  const [photoReviews, setPhotoReviews] = useState<PhotoReview[]>([]);
  const [rejectionsModalOpen, setRejectionsModalOpen] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const photoSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/listings/me');
        const data = res.ok ? await parseBody(res) : null;
        if (!data) {
          setHasListing(false);
          return;
        }
        setHasListing(true);
        setPhotos(data.photos ?? []);
        setVideoUrl(data.videoUrl ?? null);
        setPhotosSubmittedAt(data.photosSubmittedAt ?? null);

        if ((data.photos ?? []).length > 0) {
          const reviewsRes = await authFetch('/listings/me/photo-reviews');
          if (reviewsRes.ok) {
            setPhotoReviews((await parseBody(reviewsRes)) ?? []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      setPhotosSubmittedAt(data.photosSubmittedAt ?? null);
    } catch (err: any) {
      setPhotosError(err.message || 'Не удалось удалить фото');
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
      setPhotosSubmittedAt(data.photosSubmittedAt ?? null);
    } catch (err: any) {
      setPhotosError(err.message || 'Не удалось загрузить фото');
    } finally {
      setUploadingPhotos(false);
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

  const setMainPhoto = (url: string) => {
    if (photos[0] === url) return;
    reorderPhotos([url, ...photos.filter((p) => p !== url)]);
  };

  const submitPhotos = async () => {
    setSubmittingPhotos(true);
    setPhotosSubmitError('');
    try {
      const res = await authFetch('/listings/me/photos/submit', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отправить фото на проверку');
      setPhotosSubmittedAt(data.photosSubmittedAt ?? null);
    } catch (err: any) {
      setPhotosSubmitError(err.message || 'Не удалось отправить фото на проверку');
    } finally {
      setSubmittingPhotos(false);
    }
  };

  const rejectedPhotos = photoReviews.filter((r) => r.status === 'rejected' && r.note && photos.includes(r.url));

  if (loading) {
    return <p className="font-body text-sm text-white/40">Загрузка…</p>;
  }

  if (!hasListing) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <ImageIcon className="h-8 w-8 text-white/25" strokeWidth={1.4} />
        <h2 className="font-body text-sm font-medium text-white/60">Анкета ещё не создана</h2>
        <p className="max-w-sm font-body text-sm text-white/35">
          Сначала создайте анкету — после этого можно будет добавить фото и видео.
        </p>
        <Link href="/cabinet/listing" className="btn-primary mt-2">
          Создать анкету
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start">
          <h1 className="mb-2 font-display text-2xl font-bold">Фото</h1>
          <p className="text-white/30">Портфолио анкеты. Первое фото — главное на карточке.</p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-accent/25 bg-accent/10 px-4 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/20 sm:self-auto"
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Добавить фото
        </button>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotosSelected}
          disabled={uploadingPhotos}
        />
      </div>

      <DndContext sensors={photoSensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
        <SortableContext items={photos} strategy={rectSortingStrategy}>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((url, index) => {
              const review = photoReviews.find((r) => r.url === url);
              return (
                <div key={url} className="space-y-1">
                  <div className="relative">
                    <SortablePhotoTile
                      url={url}
                      isMain={index === 0}
                      onRemove={() => removePhoto(url)}
                      onSetMain={() => setMainPhoto(url)}
                    />
                    {review && review.status !== 'pending' ? (
                      <span
                        className={`pointer-events-none absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 font-body text-[9px] font-semibold ${PHOTO_REVIEW_STATUS_CLASS[review.status]}`}
                      >
                        {PHOTO_REVIEW_STATUS_LABEL[review.status]}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submitPhotos}
          disabled={submittingPhotos || uploadingPhotos || photos.length < MIN_PHOTOS_FOR_REVIEW || Boolean(photosSubmittedAt)}
          title={
            photos.length < MIN_PHOTOS_FOR_REVIEW
              ? `Добавьте не менее ${MIN_PHOTOS_FOR_REVIEW} фото`
              : photosSubmittedAt
                ? 'Фото уже отправлены на проверку'
                : undefined
          }
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingPhotos ? 'Отправляем…' : 'Отправить фото на проверку'}
        </button>
        {photosSubmitError ? (
          <span className="font-body text-xs text-red-400">{photosSubmitError}</span>
        ) : photosSubmittedAt ? (
          <span className="inline-flex items-center gap-1.5 font-body text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Фото отправлены на проверку
          </span>
        ) : null}

        {rejectedPhotos.length > 0 ? (
          <button
            type="button"
            onClick={() => setRejectionsModalOpen(true)}
            className="inline-flex items-center gap-1.5 font-body text-xs text-red-400 hover:text-red-300"
          >
            <AlertCircle className="h-3.5 w-3.5" /> Причины отклонения фото
          </button>
        ) : null}
      </div>

      <div className="mt-8 sm:mt-[30px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start">
            <h1 className="mb-2 font-display text-2xl font-bold">Видео</h1>
            <p className="text-white/30">Видео для анкеты — проходит ту же модерацию, что и фото.</p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-accent/25 bg-accent/10 px-4 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent/10 sm:self-auto"
            onClick={() => videoInputRef.current?.click()}
            disabled={Boolean(videoUrl)}
            title={videoUrl ? 'Сначала удалите текущее видео' : undefined}
          >
            <Upload className="h-4 w-4" />
            Добавить видео
          </button>
        </div>

        {videoUrl ? (
          <div className="relative mt-5 max-w-[400px]">
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
            <span className="font-body text-sm">{uploadingVideo ? 'Загрузка…' : 'Добавить видео'}</span>
            <input
              ref={videoInputRef}
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

      {rejectionsModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setRejectionsModalOpen(false)} />
              <div className="card relative flex max-h-[85vh] w-full flex-col p-6 !rounded-b-none sm:max-w-lg sm:!rounded-2xl">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                <div className="mb-4 flex flex-shrink-0 items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Причины отклонения фото</h2>
                  <button type="button" onClick={() => setRejectionsModalOpen(false)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                  {rejectedPhotos.map((r) => (
                    <div key={r.url} className="flex gap-3 rounded-xl bg-white/[0.04] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                      <p className="min-w-0 flex-1 whitespace-pre-line break-words font-body text-sm text-white/70">{r.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
