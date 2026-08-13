'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ImageOff,
  MessageSquare,
  MessageSquareOff,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { PhotoReviewPanel, type PhotoReview } from '@/components/PhotoReviewPanel';

interface ModerationListing {
  id: string;
  status: 'pending';
  everPublished: boolean;
  name: string | null;
  bio: string | null;
  age: number | null;
  city: string | null;
  photos: string[];
  videoUrl: string | null;
  submittedAt: string | null;
  ownerLogin: string | null;
  ownerFullName: string | null;
}

type Decision = 'approved' | 'changes_requested';

interface DecisionTarget {
  id: string;
}

type ListingStatus = 'draft' | 'pending' | 'changes_requested' | 'published' | 'hidden' | 'blocked';

interface MediaListing {
  id: string;
  status: ListingStatus;
  name: string | null;
  photos: string[];
  videoUrl: string | null;
  updatedAt: string;
  ownerLogin: string | null;
  photoReviews: PhotoReview[];
}

const MEDIA_STATUS_LABEL: Record<ListingStatus, string> = {
  draft: 'Черновик',
  pending: 'На проверке',
  changes_requested: 'Исправления',
  published: 'Опубликована',
  hidden: 'Скрыта',
  blocked: 'Заблокирована',
};

interface AdminReview {
  id: string;
  rating: number;
  text: string;
  status: 'pending' | 'published' | 'rejected' | 'hidden';
  moderatorNote: string | null;
  createdAt: string;
  authorLogin: string | null;
  authorFullName: string | null;
  listingName: string | null;
  listingSlug: string | null;
}

type ReportTargetType = 'listing' | 'review' | 'message' | 'user';

interface AdminReportItem {
  id: string;
  targetType: ReportTargetType;
  category: string;
  text: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNote: string | null;
  createdAt: string;
  reporterLogin: string | null;
  reporterFullName: string | null;
  target: { label: string; href: string | null; restrictableUserId: string | null; messagingRestricted: boolean };
}

const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  listing: 'Анкета',
  review: 'Отзыв',
  message: 'Сообщение',
  user: 'Пользователь',
};

const REPORT_CATEGORY_LABEL: Record<string, string> = {
  spam: 'Спам',
  fake: 'Мошенничество / фейк',
  harassment: 'Оскорбления',
  inappropriate: 'Неприемлемый контент',
  other: 'Другое',
};

interface AdminConversationParticipant {
  id: string;
  login: string;
  fullName: string | null;
}

interface AdminConversationMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface AdminConversationView {
  conversationId: string;
  participants: AdminConversationParticipant[];
  messages: AdminConversationMessage[];
  reportedMessageId: string;
}

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function ColumnHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-xs text-white/50">{count}</span>
    </div>
  );
}

function EmptyColumn({ text }: { text: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center">
      <ShieldCheck className="h-6 w-6 text-white/20" strokeWidth={1.4} />
      <p className="font-body text-xs text-white/35">{text}</p>
    </div>
  );
}

function ChevronCell({ expanded }: { expanded: boolean }) {
  return (
    <td className="w-8 px-2 py-3 text-white/25">
      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </td>
  );
}

function Thumb({ url }: { url: string | undefined }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
  ) : (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
      <ImageOff className="h-4 w-4 text-white/20" strokeWidth={1.4} />
    </div>
  );
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

function ListingRow({
  item,
  expanded,
  onToggle,
  busy,
  decisionTarget,
  decisionNote,
  onNoteChange,
  onConfirm,
  onOpenDecision,
  onCancelDecision,
  onSubmitDecision,
  onPhotoClick,
}: {
  item: ModerationListing;
  expanded: boolean;
  onToggle: () => void;
  busy: boolean;
  decisionTarget: DecisionTarget | null;
  decisionNote: string;
  onNoteChange: (v: string) => void;
  onConfirm: () => void;
  onOpenDecision: () => void;
  onCancelDecision: () => void;
  onSubmitDecision: () => void;
  onPhotoClick: (url: string) => void;
}) {
  const isDeciding = decisionTarget?.id === item.id;
  const meta = [item.age ? `${item.age} лет` : null, item.city].filter(Boolean).join(' · ');

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Thumb url={item.photos[0]} />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-semibold text-white">{item.name || 'Без имени'}</p>
              <p className="truncate font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
            {item.everPublished ? 'Изменённая' : 'Новая'}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.photos.length} фото{item.videoUrl ? ' · видео' : ''}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ru-RU') : '—'}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onOpenDecision}
              disabled={busy}
              title="Запросить исправления"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/30 text-orange-300 transition-colors hover:bg-orange-400/10 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              title="Подтвердить"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-white/[0.04] bg-white/[0.015] last:border-0">
          <td colSpan={6} className="px-4 py-4">
            {meta ? <p className="mb-2 font-body text-xs text-white/35">{meta}</p> : null}
            {item.bio ? <p className="mb-3 whitespace-pre-line font-body text-xs text-white/50">{item.bio}</p> : null}
            {item.photos.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {item.photos.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    onClick={() => onPhotoClick(url)}
                    className="h-16 w-16 cursor-zoom-in rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}
            {item.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={item.videoUrl} controls className="mb-3 w-full max-w-md rounded-lg border border-white/[0.08]" />
            ) : null}

            {isDeciding ? (
              <div className="space-y-2">
                <textarea
                  value={decisionNote}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Комментарий — обязателен, покажем исполнителю"
                  rows={2}
                  maxLength={1000}
                  className="input resize-none text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelDecision}
                    disabled={busy}
                    className="btn-secondary !px-4 !py-1.5 text-xs disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitDecision}
                    disabled={busy || !decisionNote.trim()}
                    title={!decisionNote.trim() ? 'Комментарий обязателен' : undefined}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                  >
                    {busy ? 'Сохраняем…' : 'Отправить запрос на исправления'}
                  </button>
                </div>
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MediaRow({
  item,
  expanded,
  onToggle,
  onPhotoClick,
  onChanged,
}: {
  item: MediaListing;
  expanded: boolean;
  onToggle: () => void;
  onPhotoClick: (url: string) => void;
  onChanged: (reviews: PhotoReview[]) => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Thumb url={item.photos[0]} />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-semibold text-white">{item.name || 'Без имени'}</p>
              <p className="truncate font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
            {MEDIA_STATUS_LABEL[item.status]}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.photos.length} фото{item.videoUrl ? ' · видео' : ''}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.updatedAt).toLocaleDateString('ru-RU')}
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-white/[0.04] bg-white/[0.015] last:border-0">
          <td colSpan={4} className="px-4 py-4">
            <PhotoReviewPanel
              listingId={item.id}
              photos={item.photos}
              initialReviews={item.photoReviews}
              onPhotoClick={onPhotoClick}
              onChanged={(reviews) => onChanged(reviews)}
            />
            {item.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={item.videoUrl}
                controls
                className={`w-full max-w-md rounded-lg border border-white/[0.08] ${item.photos.length > 0 ? 'mt-3' : ''}`}
              />
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ReviewRow({
  item,
  expanded,
  onToggle,
  busy,
  decisionTarget,
  decisionNote,
  onNoteChange,
  onApprove,
  onOpenDecision,
  onCancelDecision,
  onSubmitDecision,
}: {
  item: AdminReview;
  expanded: boolean;
  onToggle: () => void;
  busy: boolean;
  decisionTarget: DecisionTarget | null;
  decisionNote: string;
  onNoteChange: (v: string) => void;
  onApprove: () => void;
  onOpenDecision: () => void;
  onCancelDecision: () => void;
  onSubmitDecision: () => void;
}) {
  const isDeciding = decisionTarget?.id === item.id;

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <p className="truncate font-body text-sm font-semibold text-white">
            {item.authorFullName || item.authorLogin || 'Клиент'}
          </p>
          <p className="truncate font-body text-xs text-white/35">на «{item.listingName || 'Без имени'}»</p>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <StarRow rating={item.rating} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.createdAt).toLocaleDateString('ru-RU')}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onOpenDecision}
              disabled={busy}
              title="Отклонить"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              title="Опубликовать"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-white/[0.04] bg-white/[0.015] last:border-0">
          <td colSpan={4} className="px-4 py-4">
            <p className="mb-3 whitespace-pre-line font-body text-xs text-white/60">{item.text}</p>

            {isDeciding ? (
              <div className="space-y-2">
                <textarea
                  value={decisionNote}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Причина отклонения — обязательна, покажем клиенту"
                  rows={2}
                  maxLength={1000}
                  className="input resize-none text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelDecision}
                    disabled={busy}
                    className="btn-secondary !px-4 !py-1.5 text-xs disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitDecision}
                    disabled={busy || !decisionNote.trim()}
                    title={!decisionNote.trim() ? 'Причина обязательна' : undefined}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {busy ? 'Сохраняем…' : 'Отклонить'}
                  </button>
                </div>
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ReportRow({
  item,
  expanded,
  onToggle,
  busy,
  note,
  onNoteChange,
  onResolve,
  onDismiss,
  onViewConversation,
  restrictBusy,
  onToggleMessagingRestriction,
}: {
  item: AdminReportItem;
  expanded: boolean;
  onToggle: () => void;
  busy: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  onResolve: () => void;
  onDismiss: () => void;
  onViewConversation: () => void;
  restrictBusy: boolean;
  onToggleMessagingRestriction: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
              {REPORT_TARGET_LABEL[item.targetType]}
            </span>
            <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 font-body text-[11px] text-red-300">
              {REPORT_CATEGORY_LABEL[item.category] ?? item.category}
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.reporterFullName || item.reporterLogin || 'пользователя'}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.createdAt).toLocaleDateString('ru-RU')}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onDismiss}
              disabled={busy}
              title="Отклонить"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onResolve}
              disabled={busy}
              title="Обработано"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-white/[0.04] bg-white/[0.015] last:border-0">
          <td colSpan={4} className="px-4 py-4">
            {item.target.href ? (
              <Link href={item.target.href} className="mb-1 block truncate font-body text-xs text-accent hover:underline">
                {item.target.label}
              </Link>
            ) : (
              <p className="mb-1 truncate font-body text-xs text-white/50">{item.target.label}</p>
            )}

            {item.targetType === 'message' ? (
              <button
                type="button"
                onClick={onViewConversation}
                className="mb-1 inline-flex items-center gap-1.5 font-body text-xs text-accent hover:underline"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Посмотреть переписку
              </button>
            ) : null}

            {item.target.restrictableUserId ? (
              <button
                type="button"
                onClick={onToggleMessagingRestriction}
                disabled={restrictBusy}
                className={`mb-2 flex items-center gap-1.5 font-body text-xs transition-colors disabled:opacity-50 ${
                  item.target.messagingRestricted ? 'text-orange-400 hover:text-orange-300' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {item.target.messagingRestricted ? (
                  <MessageSquareOff className="h-3.5 w-3.5" />
                ) : (
                  <MessageSquareText className="h-3.5 w-3.5" />
                )}
                {item.target.messagingRestricted ? 'Ограничение отправки сообщений — снять' : 'Ограничить отправку сообщений'}
              </button>
            ) : null}

            <p className="mb-3 whitespace-pre-line font-body text-xs text-white/60">{item.text}</p>

            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Заметка для админов — необязательно"
              rows={2}
              maxLength={1000}
              className="input mb-2 resize-none text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onDismiss}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 font-body text-xs font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Отклонить
              </button>
              <button
                type="button"
                onClick={onResolve}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> {busy ? 'Сохраняем…' : 'Обработано'}
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function AdminModerationPage() {
  const [queue, setQueue] = useState<ModerationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);

  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [mediaQueue, setMediaQueue] = useState<MediaListing[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaLoadError, setMediaLoadError] = useState('');
  const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null);

  const [reviewQueue, setReviewQueue] = useState<AdminReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsLoadError, setReviewsLoadError] = useState('');
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);
  const [reviewDecisionTarget, setReviewDecisionTarget] = useState<DecisionTarget | null>(null);
  const [reviewDecisionNote, setReviewDecisionNote] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const [reportQueue, setReportQueue] = useState<AdminReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsLoadError, setReportsLoadError] = useState('');
  const [reportActionError, setReportActionError] = useState('');
  const [reportActionId, setReportActionId] = useState<string | null>(null);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const [conversationView, setConversationView] = useState<AdminConversationView | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [conversationOpen, setConversationOpen] = useState(false);

  const [restrictActionId, setRestrictActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/admin/moderation/listings');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить очередь');
      setQueue(data ?? []);
    } catch (err: any) {
      setLoadError(err.message || 'Не удалось загрузить очередь');
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    setMediaLoading(true);
    setMediaLoadError('');
    try {
      const res = await authFetch('/admin/moderation/media');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить фото на проверку');
      setMediaQueue(data ?? []);
    } catch (err: any) {
      setMediaLoadError(err.message || 'Не удалось загрузить фото на проверку');
    } finally {
      setMediaLoading(false);
    }
  };

  /** Once every photo on the card has a decision (confirmed or rejected, none left pending), the card drops off this queue — nothing more for the admin to do right now. */
  const handleMediaReviewChanged = (listingId: string, reviews: PhotoReview[]) => {
    const stillPending = reviews.some((r) => r.status === 'pending');
    if (!stillPending) {
      setMediaQueue((prev) => prev.filter((item) => item.id !== listingId));
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    setReviewsLoadError('');
    try {
      const res = await authFetch('/admin/reviews');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить отзывы');
      setReviewQueue((data ?? []).filter((r: AdminReview) => r.status === 'pending'));
    } catch (err: any) {
      setReviewsLoadError(err.message || 'Не удалось загрузить отзывы');
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    setReportsLoadError('');
    try {
      const res = await authFetch('/admin/reports');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить жалобы');
      setReportQueue((data ?? []).filter((r: AdminReportItem) => r.status === 'pending'));
    } catch (err: any) {
      setReportsLoadError(err.message || 'Не удалось загрузить жалобы');
    } finally {
      setReportsLoading(false);
    }
  };

  const verifyReport = async (id: string, decision: 'resolved' | 'dismissed') => {
    setReportActionError('');
    setReportActionId(id);
    try {
      const res = await authFetch(`/admin/reports/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: reportNotes[id]?.trim() || undefined }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить решение');
      }
      setReportQueue((prev) => prev.filter((item) => item.id !== id));
      setReportNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      setReportActionError(err.message || 'Не удалось сохранить решение');
    } finally {
      setReportActionId(null);
    }
  };

  const openConversation = async (reportId: string) => {
    setConversationOpen(true);
    setConversationView(null);
    setConversationLoading(true);
    setConversationError('');
    try {
      const res = await authFetch(`/admin/reports/${reportId}/conversation`);
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить переписку');
      setConversationView(data);
    } catch (err: any) {
      setConversationError(err.message || 'Не удалось загрузить переписку');
    } finally {
      setConversationLoading(false);
    }
  };

  const toggleMessagingRestriction = async (report: AdminReportItem) => {
    const userId = report.target.restrictableUserId;
    if (!userId) return;
    const restricted = !report.target.messagingRestricted;
    setReportActionError('');
    setRestrictActionId(report.id);
    try {
      const res = await authFetch(`/admin/users/${userId}/messaging-restriction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restricted }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить ограничение');
      setReportQueue((prev) =>
        prev.map((item) =>
          item.target.restrictableUserId === userId
            ? { ...item, target: { ...item.target, messagingRestricted: restricted } }
            : item,
        ),
      );
    } catch (err: any) {
      setReportActionError(err.message || 'Не удалось изменить ограничение');
    } finally {
      setRestrictActionId(null);
    }
  };

  useEffect(() => {
    load();
    loadMedia();
    loadReviews();
    loadReports();
  }, []);

  const verify = async (id: string, decision: Decision, note?: string) => {
    setActionError('');
    setActionId(id);
    try {
      const res = await authFetch(`/admin/moderation/listings/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить решение');
      }
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setDecisionTarget(null);
    } catch (err: any) {
      setActionError(err.message || 'Не удалось сохранить решение');
    } finally {
      setActionId(null);
    }
  };

  const openDecision = (id: string) => {
    setDecisionTarget({ id });
    setDecisionNote('');
    setActionError('');
    setExpandedListingId(id);
  };

  const verifyReview = async (id: string, decision: 'approved' | 'rejected', note?: string) => {
    setReviewActionError('');
    setReviewActionId(id);
    try {
      const res = await authFetch(`/admin/reviews/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить решение');
      }
      setReviewQueue((prev) => prev.filter((item) => item.id !== id));
      setReviewDecisionTarget(null);
    } catch (err: any) {
      setReviewActionError(err.message || 'Не удалось сохранить решение');
    } finally {
      setReviewActionId(null);
    }
  };

  const openReviewDecision = (id: string) => {
    setReviewDecisionTarget({ id });
    setReviewDecisionNote('');
    setReviewActionError('');
    setExpandedReviewId(id);
  };

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Модерация</h1>

      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {actionError}
        </p>
      ) : null}

      <div className="space-y-8">
        <section>
          <ColumnHeader title="Анкеты" count={queue.length} />
          {loading ? (
            <p className="font-body text-sm text-white/40">Загрузка…</p>
          ) : loadError ? (
            <p className="font-body text-sm text-red-400">{loadError}</p>
          ) : queue.length === 0 ? (
            <EmptyColumn text="Очередь пуста — нет анкет, ожидающих проверки" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">Анкета</th>
                    <th className="px-4 py-3 font-medium">Тип</th>
                    <th className="px-4 py-3 font-medium">Медиа</th>
                    <th className="px-4 py-3 font-medium">Отправлено</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <ListingRow
                      key={item.id}
                      item={item}
                      expanded={expandedListingId === item.id}
                      onToggle={() => setExpandedListingId((prev) => (prev === item.id ? null : item.id))}
                      busy={actionId === item.id}
                      decisionTarget={decisionTarget}
                      decisionNote={decisionNote}
                      onNoteChange={setDecisionNote}
                      onConfirm={() => verify(item.id, 'approved')}
                      onOpenDecision={() => openDecision(item.id)}
                      onCancelDecision={() => setDecisionTarget(null)}
                      onSubmitDecision={() => verify(item.id, 'changes_requested', decisionNote.trim())}
                      onPhotoClick={setLightboxUrl}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <ColumnHeader title="Медиа" count={mediaQueue.length} />
          {mediaLoading ? (
            <p className="font-body text-sm text-white/40">Загрузка…</p>
          ) : mediaLoadError ? (
            <p className="font-body text-sm text-red-400">{mediaLoadError}</p>
          ) : mediaQueue.length === 0 ? (
            <EmptyColumn text="Нет фото, ожидающих проверки" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">Анкета</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Фото</th>
                    <th className="px-4 py-3 font-medium">Обновлено</th>
                  </tr>
                </thead>
                <tbody>
                  {mediaQueue.map((item) => (
                    <MediaRow
                      key={item.id}
                      item={item}
                      expanded={expandedMediaId === item.id}
                      onToggle={() => setExpandedMediaId((prev) => (prev === item.id ? null : item.id))}
                      onPhotoClick={setLightboxUrl}
                      onChanged={(reviews) => handleMediaReviewChanged(item.id, reviews)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <ColumnHeader title="Отзывы" count={reviewQueue.length} />
          {reviewActionError ? (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
              {reviewActionError}
            </p>
          ) : null}
          {reviewsLoading ? (
            <p className="font-body text-sm text-white/40">Загрузка…</p>
          ) : reviewsLoadError ? (
            <p className="font-body text-sm text-red-400">{reviewsLoadError}</p>
          ) : reviewQueue.length === 0 ? (
            <EmptyColumn text="Очередь пуста — нет отзывов, ожидающих проверки" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">Клиент / анкета</th>
                    <th className="px-4 py-3 font-medium">Оценка</th>
                    <th className="px-4 py-3 font-medium">Дата</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewQueue.map((item) => (
                    <ReviewRow
                      key={item.id}
                      item={item}
                      expanded={expandedReviewId === item.id}
                      onToggle={() => setExpandedReviewId((prev) => (prev === item.id ? null : item.id))}
                      busy={reviewActionId === item.id}
                      decisionTarget={reviewDecisionTarget}
                      decisionNote={reviewDecisionNote}
                      onNoteChange={setReviewDecisionNote}
                      onApprove={() => verifyReview(item.id, 'approved')}
                      onOpenDecision={() => openReviewDecision(item.id)}
                      onCancelDecision={() => setReviewDecisionTarget(null)}
                      onSubmitDecision={() => verifyReview(item.id, 'rejected', reviewDecisionNote.trim())}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <ColumnHeader title="Жалобы" count={reportQueue.length} />
          {reportActionError ? (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
              {reportActionError}
            </p>
          ) : null}
          {reportsLoading ? (
            <p className="font-body text-sm text-white/40">Загрузка…</p>
          ) : reportsLoadError ? (
            <p className="font-body text-sm text-red-400">{reportsLoadError}</p>
          ) : reportQueue.length === 0 ? (
            <EmptyColumn text="Очередь пуста — нет жалоб на рассмотрении" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">Тип / категория</th>
                    <th className="px-4 py-3 font-medium">От кого</th>
                    <th className="px-4 py-3 font-medium">Дата</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {reportQueue.map((item) => (
                    <ReportRow
                      key={item.id}
                      item={item}
                      expanded={expandedReportId === item.id}
                      onToggle={() => setExpandedReportId((prev) => (prev === item.id ? null : item.id))}
                      busy={reportActionId === item.id}
                      note={reportNotes[item.id] ?? ''}
                      onNoteChange={(v) => setReportNotes((prev) => ({ ...prev, [item.id]: v }))}
                      onResolve={() => verifyReport(item.id, 'resolved')}
                      onDismiss={() => verifyReport(item.id, 'dismissed')}
                      onViewConversation={() => openConversation(item.id)}
                      restrictBusy={restrictActionId === item.id}
                      onToggleMessagingRestriction={() => toggleMessagingRestriction(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      ) : null}

      {conversationOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setConversationOpen(false)} />
          <div className="card relative flex max-h-[85vh] w-full flex-col p-6 !rounded-b-none sm:max-w-lg sm:!rounded-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mb-4 flex flex-shrink-0 items-center justify-between">
              <h2 className="font-display text-lg font-bold">Переписка</h2>
              <button type="button" onClick={() => setConversationOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {conversationLoading ? (
              <p className="font-body text-sm text-white/40">Загрузка…</p>
            ) : conversationError ? (
              <p className="font-body text-sm text-red-400">{conversationError}</p>
            ) : conversationView ? (
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                {conversationView.messages.map((m) => {
                  const sender = conversationView.participants.find((p) => p.id === m.senderId);
                  const isReported = m.id === conversationView.reportedMessageId;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl p-3 ${isReported ? 'border border-red-500/40 bg-red-500/10' : 'bg-white/[0.04]'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-body text-xs font-semibold text-white">
                          {sender?.fullName || sender?.login || 'Пользователь'}
                        </p>
                        <span className="flex-shrink-0 font-body text-[11px] text-white/30">
                          {new Date(m.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-line font-body text-sm text-white/80">{m.body}</p>
                      {isReported ? (
                        <p className="mt-1 font-body text-[11px] font-semibold text-red-400">Сообщение из жалобы</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
