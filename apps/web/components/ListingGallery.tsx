'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, ImageOff, Loader2, MessageCircle, Phone, Play, Send, Star, X } from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ReportButton } from '@/components/ReportButton';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import type { ListingReviewsSummary } from '@/lib/listing.types';

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

type Media = { type: 'photo' | 'video'; url: string };

interface Vital {
  label: string;
  value: string | number;
}

interface Props {
  id: string;
  name: string;
  photos: string[];
  videoUrl: string | null;
  vitals: Vital[];
  bio: string | null;
  priceHour: number | null;
  priceNight: number | null;
  ownerLogin: string | null;
  ownerTelegramLinked: boolean;
  telegramBotUsername: string | null;
  initialReviews: ListingReviewsSummary;
  photosVerified: boolean;
}

const PLACEHOLDER_COUNT = 6;

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StarRow({ rating, className = 'h-3.5 w-3.5' }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= rating ? 'fill-accent text-accent' : 'text-white/15'}`} strokeWidth={1.5} />
      ))}
    </div>
  );
}

export function ListingGallery({
  id,
  name,
  photos,
  videoUrl,
  vitals,
  bio,
  priceHour,
  priceNight,
  ownerLogin,
  ownerTelegramLinked,
  telegramBotUsername,
  initialReviews,
  photosVerified,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const media: Media[] = [
    ...photos.map((url): Media => ({ type: 'photo', url })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl } as Media] : []),
  ];
  const [active, setActive] = useState(0);
  const total = media.length;
  const current = media[active];

  const [contactOpen, setContactOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [startChatError, setStartChatError] = useState('');

  /** Fire-and-forget — analytics must never block or fail the actual contact flow. */
  const trackContact = (action: 'click' | 'platform' | 'telegram') => {
    authFetch(`/catalog/${id}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  };

  const handleContactClick = () => {
    setStartChatError('');
    setContactOpen(true);
    trackContact('click');
  };

  const startTelegramChat = () => {
    if (!telegramBotUsername) return;
    trackContact('telegram');
    window.open(`https://t.me/${telegramBotUsername}?start=c_${id}`, '_blank', 'noopener,noreferrer');
    setContactOpen(false);
  };

  const startPlatformChat = async () => {
    trackContact('platform');
    if (!user) {
      router.push('/login');
      return;
    }
    if (!ownerLogin) return;
    setStartingChat(true);
    setStartChatError('');
    try {
      const res = await authFetch('/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: ownerLogin }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось начать чат');
      const chatsHref = user?.role === 'performer' ? '/cabinet/chats' : '/cabinet/messages';
      router.push(`${chatsHref}?c=${data.id}`);
    } catch (err: any) {
      setStartChatError(err.message || 'Не удалось начать чат');
      setStartingChat(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'gallery' | 'reviews'>('gallery');
  const [reviews] = useState(initialReviews);

  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const openReviewsTab = () => setActiveTab('reviews');

  const submitReview = async () => {
    if (reviewRating < 1) {
      setReviewError('Поставьте оценку');
      return;
    }
    if (!reviewText.trim()) {
      setReviewError('Напишите текст отзыва');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await authFetch('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, rating: reviewRating, text: reviewText.trim() }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отправить отзыв');
      setReviewSubmitted(true);
      setReviewFormOpen(false);
      setReviewRating(0);
      setReviewText('');
    } catch (err: any) {
      setReviewError(err.message || 'Не удалось отправить отзыв');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="relative h-[60vh] bg-black lg:h-[calc(100vh-4rem)] lg:flex-1">
        {current ? (
          current.type === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={current.url} src={current.url} alt={name} className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video key={current.url} src={current.url} controls className="h-full w-full object-contain" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
            <ImageOff className="h-12 w-12 text-white/15" strokeWidth={1.2} />
          </div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((p) => (p - 1 + total) % total)}
              aria-label="Предыдущее"
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((p) => (p + 1) % total)}
              aria-label="Следующее"
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg text-white/70 transition-colors hover:bg-black/80 hover:text-white"
            >
              ›
            </button>
          </>
        )}

        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {total > 1 && (
            <div className="rounded-full bg-black/50 px-3 py-1 font-body text-xs text-white/60">
              {active + 1} / {total}
            </div>
          )}
          <FavoriteButton listingId={id} positionClassName="" />
          <button
            type="button"
            onClick={() => router.push('/catalog')}
            aria-label="Закрыть просмотр анкеты"
            title="Закрыть просмотр анкеты"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 pt-16">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow-sm">{name}</h1>
            {photosVerified ? (
              <span
                title="Фото подтверждены модератором"
                className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 font-body text-xs font-medium text-white backdrop-blur-sm"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                Фото подтверждены
              </span>
            ) : null}
          </div>
          {priceHour || priceNight ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {priceHour ? (
                <span className="badge badge-accent">{formatPrice(priceHour)} / час</span>
              ) : null}
              {priceNight ? (
                <span className="badge badge-accent">{formatPrice(priceNight)} / ночь</span>
              ) : null}
            </div>
          ) : null}
          {vitals.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-white/70">
              {vitals.map((v) => (
                <span key={v.label}>
                  {v.label}: <span className="text-white/90">{v.value}</span>
                </span>
              ))}
            </div>
          )}
          {bio && <p className="mt-2 max-w-lg whitespace-pre-line font-body text-sm text-white/70">{bio}</p>}
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-black p-3 lg:h-[calc(100vh-4rem)] lg:w-[36%] lg:border-l lg:border-t-0">
        <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border-[3px] border-accent/40 bg-[#161616]">
          <div className="flex-shrink-0 px-4 pb-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-accent/40 ring-offset-1 ring-offset-[#161616]">
                {photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[0]} alt={name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-bold text-white">{name}</div>
                <div className="font-body text-[11px] text-white/35">
                  {photos.length > 0 ? `${photos.length} фото` : 'Фото'}
                  {videoUrl ? ', 1 видео' : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 border-t border-white/[0.06] px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`rounded-t-lg px-3 py-2 font-body text-xs font-semibold transition-colors ${
                activeTab === 'gallery' ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Галерея
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`rounded-t-lg px-3 py-2 font-body text-xs font-semibold transition-colors ${
                activeTab === 'reviews' ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Отзывы{reviews.count > 0 ? ` (${reviews.count})` : ''}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeTab === 'gallery' ? (
              total > 0 ? (
                <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                  {media.map((item, i) => (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => setActive(i)}
                      className={`relative aspect-square overflow-hidden transition-opacity ${
                        active === i ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {item.type === 'photo' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-accent">
                              <Play className="h-3 w-3 fill-current" strokeWidth={0} />
                            </span>
                          </div>
                        </>
                      )}
                      {active === i && <div className="pointer-events-none absolute inset-0 border-2 border-accent" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                  {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
                    <div key={i} className="flex aspect-square items-center justify-center bg-[#161616]">
                      <ImageOff className="h-5 w-5 text-white/15" strokeWidth={1.2} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    {reviews.count > 0 ? (
                      <div className="flex items-center gap-2">
                        <StarRow rating={Math.round(reviews.averageRating)} className="h-4 w-4" />
                        <span className="font-body text-sm text-white/70">
                          {reviews.averageRating.toFixed(1)} · {reviews.count}
                        </span>
                      </div>
                    ) : (
                      <p className="font-body text-sm text-white/30">Отзывов пока нет</p>
                    )}
                  </div>
                  {user && user.role === 'client' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewFormOpen((v) => !v);
                        setReviewSubmitted(false);
                        setReviewError('');
                      }}
                      className="flex-shrink-0 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-body text-xs font-semibold text-accent transition-colors hover:bg-accent/15"
                    >
                      Оставить отзыв
                    </button>
                  ) : null}
                </div>

                {!user ? (
                  <p className="mb-4 font-body text-xs text-white/35">
                    <Link href="/login" className="text-accent hover:underline">
                      Войдите
                    </Link>{' '}
                    как клиент, чтобы оставить отзыв
                  </p>
                ) : null}

                {reviewSubmitted ? (
                  <p className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 font-body text-xs text-emerald-400">
                    Спасибо! Отзыв отправлен на модерацию и появится здесь после проверки.
                  </p>
                ) : null}

                {reviewFormOpen ? (
                  <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                    <div
                      className="mb-2 flex gap-1"
                      onMouseLeave={() => setReviewHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(n)}
                          onClick={() => setReviewRating(n)}
                          aria-label={`${n} из 5`}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              n <= (reviewHoverRating || reviewRating) ? 'fill-accent text-accent' : 'text-white/15'
                            }`}
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Расскажите о своём опыте..."
                      maxLength={2000}
                      rows={3}
                      className="input resize-none text-sm"
                    />
                    {reviewError ? <p className="mt-2 font-body text-xs text-red-400">{reviewError}</p> : null}
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewFormOpen(false)}
                        disabled={reviewSubmitting}
                        className="rounded-full px-3 py-1.5 font-body text-xs font-medium text-white/50 hover:text-white disabled:opacity-50"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={submitReview}
                        disabled={reviewSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-body text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
                      >
                        {reviewSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {reviewSubmitting ? 'Отправляем…' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {reviews.items.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.items.map((review) => (
                      <div key={review.id} className="border-b border-white/[0.04] pb-4 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-body text-sm font-semibold text-white">{review.authorName}</p>
                          <span className="flex-shrink-0 font-body text-[11px] text-white/30">
                            {formatReviewDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <StarRow rating={review.rating} />
                        </div>
                        <p className="mt-2 whitespace-pre-line font-body text-sm text-white/70">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid flex-shrink-0 grid-cols-3 gap-2 border-t border-white/[0.06] p-3">
            <button
              type="button"
              onClick={handleContactClick}
              className="flex items-center justify-center gap-1.5 rounded-full bg-accent px-2 py-2 font-body text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-accent/30"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Связаться
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-2 py-2 font-body text-xs font-semibold text-white/80 transition-all hover:border-accent hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              Контакты
            </button>
            <button
              type="button"
              onClick={openReviewsTab}
              className={`flex items-center justify-center gap-1.5 rounded-full border px-2 py-2 font-body text-xs font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-white/15 text-white/80 hover:border-accent hover:text-white'
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Отзывы
            </button>
          </div>

          <div className="flex flex-shrink-0 justify-center border-t border-white/[0.06] py-2">
            <ReportButton targetType="listing" targetId={id} label="Пожаловаться на анкету" />
          </div>
        </div>
      </div>

      {contactOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setContactOpen(false)} />
          <div className="card relative w-full p-6 !rounded-b-none sm:max-w-sm sm:!rounded-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Связаться с {name}</h2>
              <button type="button" onClick={() => setContactOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {ownerTelegramLinked && telegramBotUsername ? (
                <button
                  type="button"
                  onClick={startTelegramChat}
                  className="flex w-full items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-left transition-colors hover:bg-accent/15"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-white">Написать в Telegram</p>
                    <p className="font-body text-xs text-white/40">Без регистрации на сайте</p>
                  </div>
                </button>
              ) : null}

              <button
                type="button"
                onClick={startPlatformChat}
                disabled={startingChat || !ownerLogin}
                className="flex w-full items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-left transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  {startingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-white">Написать на платформе</p>
                  <p className="font-body text-xs text-white/40">Откроется чат в личном кабинете</p>
                </div>
              </button>
            </div>

            {startChatError ? <p className="mt-3 font-body text-sm text-red-400">{startChatError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
