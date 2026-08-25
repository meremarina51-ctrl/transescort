'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { parseBody } from '@/lib/parse-body';

export type PhotoReviewStatus = 'pending' | 'confirmed' | 'rejected';

export interface PhotoReview {
  url: string;
  status: PhotoReviewStatus;
  note: string | null;
}

export const PHOTO_REVIEW_STATUS_LABEL: Record<PhotoReviewStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
};

export const PHOTO_REVIEW_STATUS_CLASS: Record<PhotoReviewStatus, string> = {
  pending: 'bg-white/10 text-white/60',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
};

type RejectTarget = { mode: 'single'; url: string } | { mode: 'bulk' };

function reviewFor(reviews: PhotoReview[], url: string): PhotoReview {
  return reviews.find((r) => r.url === url) ?? { url, status: 'pending', note: null };
}

/**
 * Per-photo moderation controls, shared by the admin moderation "Медиа" queue and the performer
 * detail page — bulk confirm/reject-all-with-reason at the top, individual confirm/reject-with-reason
 * per thumbnail below. Rejection (single or bulk) always goes through a modal, since the thumbnail
 * grid is too small to fit an inline reason textarea per tile. Manages its own state optimistically;
 * `onChanged` lets the parent sync its own copy of the anketa (e.g. the cached `photosVerified` badge)
 * after any successful action.
 */
export function PhotoReviewPanel({
  listingId,
  photos,
  initialReviews,
  onPhotoClick,
  onChanged,
}: {
  listingId: string;
  photos: string[];
  initialReviews: PhotoReview[];
  onPhotoClick?: (url: string) => void;
  onChanged?: (reviews: PhotoReview[], listing: any) => void;
}) {
  const [reviews, setReviews] = useState<PhotoReview[]>(initialReviews);
  const [error, setError] = useState('');

  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const rejectBusy = rejectTarget?.mode === 'single' ? busyUrl === rejectTarget.url : bulkBusy;

  const openRejectModal = (target: RejectTarget) => {
    setRejectTarget(target);
    setRejectNote('');
    setError('');
  };

  const reviewOne = async (url: string, decision: 'confirmed' | 'rejected', note?: string) => {
    setError('');
    setBusyUrl(url);
    try {
      const res = await authFetch(`/admin/listings/${listingId}/photos/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, decision, note }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить решение');
      }
      const nextReviews = [...reviews.filter((r) => r.url !== url), { url, status: decision, note: note?.trim() || null }];
      setReviews(nextReviews);
      setRejectTarget(null);
      setRejectNote('');
      onChanged?.(nextReviews, data);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить решение');
    } finally {
      setBusyUrl(null);
    }
  };

  const reviewAll = async (decision: 'confirmed' | 'rejected', note?: string) => {
    setError('');
    setBulkBusy(true);
    try {
      const res = await authFetch(`/admin/listings/${listingId}/photos/review-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить решение');
      }
      const nextReviews: PhotoReview[] = photos.map((url) => {
        const current = reviewFor(reviews, url);
        if (current.status === 'confirmed') return current;
        return { url, status: decision, note: note?.trim() || null };
      });
      setReviews(nextReviews);
      setRejectTarget(null);
      setRejectNote('');
      onChanged?.(nextReviews, data);
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить решение');
    } finally {
      setBulkBusy(false);
    }
  };

  const submitReject = () => {
    if (!rejectNote.trim() || !rejectTarget) return;
    if (rejectTarget.mode === 'single') {
      reviewOne(rejectTarget.url, 'rejected', rejectNote);
    } else {
      reviewAll('rejected', rejectNote);
    }
  };

  if (photos.length === 0) return null;

  // Already-confirmed photos are done — keep them out of the working list so admins only see what still needs a decision.
  const pendingPhotos = photos.filter((url) => reviewFor(reviews, url).status !== 'confirmed');

  return (
    <div className="space-y-3">
      {error ? <p className="font-body text-xs text-red-400">{error}</p> : null}

      {pendingPhotos.length === 0 ? (
        <p className="font-body text-xs text-white/35">Все фото подтверждены</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => reviewAll('confirmed')}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {bulkBusy ? 'Сохраняем…' : 'Подтвердить всё'}
          </button>
          <button
            type="button"
            onClick={() => openRejectModal({ mode: 'bulk' })}
            disabled={bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 px-3.5 py-1.5 font-body text-xs font-medium text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Отклонить всё
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {pendingPhotos.map((url) => {
          const review = reviewFor(reviews, url);
          const busy = busyUrl === url;
          return (
            <div key={url} className="space-y-1">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  onClick={() => onPhotoClick?.(url)}
                  className={`aspect-square w-full rounded-md object-cover ${onPhotoClick ? 'cursor-zoom-in' : ''}`}
                />
                <span
                  className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 font-body text-[9px] font-semibold ${PHOTO_REVIEW_STATUS_CLASS[review.status]}`}
                >
                  {PHOTO_REVIEW_STATUS_LABEL[review.status]}
                </span>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => reviewOne(url, 'confirmed')}
                  disabled={busy}
                  title="Подтвердить фото"
                  className="flex flex-1 items-center justify-center rounded-md border border-white/10 py-1 text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openRejectModal({ mode: 'single', url })}
                  disabled={busy}
                  title="Отклонить фото"
                  className="flex flex-1 items-center justify-center rounded-md border border-white/10 py-1 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {rejectTarget
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <div
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={() => (rejectBusy ? undefined : setRejectTarget(null))}
              />
              <div className="card relative w-full p-6 !rounded-b-none sm:max-w-sm sm:!rounded-2xl">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                <h3 className="mb-1 font-display text-base font-bold text-white">
                  {rejectTarget.mode === 'bulk' ? 'Отклонить все фото' : 'Отклонить фото'}
                </h3>
                <p className="mb-3 font-body text-xs text-white/40">Причина обязательна — покажем исполнителю</p>

                {rejectTarget.mode === 'single' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rejectTarget.url} alt="" className="mb-3 h-24 w-24 rounded-lg object-cover" />
                ) : null}

                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Например: фото низкого качества, лицо не видно"
                  rows={3}
                  maxLength={1000}
                  autoFocus
                  className="input resize-none text-sm"
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectTarget(null)}
                    disabled={rejectBusy}
                    className="btn-secondary !px-4 !py-1.5 text-xs disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={submitReject}
                    disabled={rejectBusy || !rejectNote.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {rejectBusy ? 'Сохраняем…' : 'Отклонить'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
