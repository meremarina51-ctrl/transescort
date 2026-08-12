'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { ReportButton } from '@/components/ReportButton';
import type { PublicReview } from '@/lib/listing.types';

type ReviewStatus = 'pending' | 'published' | 'rejected' | 'hidden';

interface OwnReview {
  id: string;
  listingId: string;
  listingName: string | null;
  listingSlug: string | null;
  rating: number;
  text: string;
  status: ReviewStatus;
  moderatorNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'На модерации',
  published: 'Опубликован',
  rejected: 'Отклонён',
  hidden: 'Скрыт',
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  published: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-red-500/10 text-red-400',
  hidden: 'bg-white/10 text-white/50',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= rating ? 'fill-accent text-accent' : 'text-white/15'}`} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-12 text-center">
      <Star className="h-8 w-8 text-white/25" strokeWidth={1.4} />
      <p className="max-w-sm font-body text-sm text-white/35">{text}</p>
    </div>
  );
}

function ClientReviews() {
  const [reviews, setReviews] = useState<OwnReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/reviews/mine');
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить отзывы');
        if (!cancelled) setReviews(data ?? []);
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Не удалось загрузить отзывы');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await authFetch(`/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить отзыв');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // no-op — leave the review in place if deletion failed
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="font-body text-sm text-white/40">Загрузка…</p>;
  if (loadError) return <p className="font-body text-sm text-red-400">{loadError}</p>;
  if (reviews.length === 0) {
    return <EmptyState text="Здесь появятся отзывы, которые вы оставили на анкеты." />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {review.listingSlug ? (
                <Link href={`/catalog/${review.listingSlug}`} className="font-body text-sm font-semibold text-white hover:text-accent">
                  {review.listingName || 'Анкета'}
                </Link>
              ) : (
                <span className="font-body text-sm font-semibold text-white/50">{review.listingName || 'Анкета удалена'}</span>
              )}
              <div className="mt-1 flex items-center gap-2">
                <StarRow rating={review.rating} />
                <span className="font-body text-[11px] text-white/30">{formatDate(review.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className={`badge ${STATUS_CLASS[review.status]}`}>{STATUS_LABEL[review.status]}</span>
              <button
                type="button"
                onClick={() => remove(review.id)}
                disabled={deletingId === review.id}
                aria-label="Удалить отзыв"
                className="rounded-full p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line font-body text-sm text-white/70">{review.text}</p>
          {review.status === 'rejected' && review.moderatorNote ? (
            <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 font-body text-xs text-red-400">
              Причина отклонения: {review.moderatorNote}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PerformerReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [count, setCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await authFetch('/listings/me');
        const meText = await meRes.text();
        const me = meText ? JSON.parse(meText) : null;
        if (!meRes.ok) throw new Error(me?.message || 'Не удалось загрузить анкету');
        if (!me?.id) {
          if (!cancelled) setLoading(false);
          return;
        }
        const res = await authFetch(`/reviews/listing/${me.id}`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить отзывы');
        if (!cancelled) {
          setReviews(data?.items ?? []);
          setCount(data?.count ?? 0);
          setAverageRating(data?.averageRating ?? 0);
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Не удалось загрузить отзывы');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="font-body text-sm text-white/40">Загрузка…</p>;
  if (loadError) return <p className="font-body text-sm text-red-400">{loadError}</p>;
  if (reviews.length === 0) {
    return <EmptyState text="Здесь появятся опубликованные отзывы клиентов на вашу анкету." />;
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3 p-4">
        <StarRow rating={Math.round(averageRating)} />
        <span className="font-body text-sm text-white/70">
          {averageRating.toFixed(1)} · {count}
        </span>
      </div>
      {reviews.map((review) => (
        <div key={review.id} className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-body text-sm font-semibold text-white">{review.authorName}</p>
            <span className="font-body text-[11px] text-white/30">{formatDate(review.createdAt)}</span>
          </div>
          <div className="mt-1">
            <StarRow rating={review.rating} />
          </div>
          <p className="mt-3 whitespace-pre-line font-body text-sm text-white/70">{review.text}</p>
          <div className="mt-3 flex justify-end">
            <ReportButton targetType="review" targetId={review.id} label="Пожаловаться на отзыв" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const isPerformer = user?.role === 'performer';

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">{isPerformer ? 'Отзывы' : 'Мои отзывы'}</h1>
      {isPerformer ? <PerformerReviews /> : <ClientReviews />}
    </>
  );
}
