'use client';

import { Fragment, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
import { Role } from '@/lib/enums';
import { parseBody } from '@/lib/parse-body';

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

function getMediaStatusLabels(t: (key: string) => string): Record<ListingStatus, string> {
  return {
    draft: t('mediaStatus.draft'),
    pending: t('mediaStatus.pending'),
    changes_requested: t('mediaStatus.changesRequested'),
    published: t('mediaStatus.published'),
    hidden: t('mediaStatus.hidden'),
    blocked: t('mediaStatus.blocked'),
  };
}

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

function getReportTargetLabels(t: (key: string) => string): Record<ReportTargetType, string> {
  return {
    listing: t('reportTarget.listing'),
    review: t('reportTarget.review'),
    message: t('reportTarget.message'),
    user: t('reportTarget.user'),
  };
}

function getReportCategoryLabel(t: (key: string) => string, category: string): string {
  const known = ['spam', 'fake', 'harassment', 'inappropriate', 'other'];
  return known.includes(category) ? t(`reportCategory.${category}`) : category;
}

interface TelegramBotReportItem {
  id: string;
  threadId: string;
  reporterRole: Role.Client | Role.Performer;
  category: string;
  status: 'pending' | 'resolved' | 'dismissed';
  adminNote: string | null;
  createdAt: string;
  performerLogin: string | null;
  performerName: string | null;
  clientUsername: string | null;
  clientTelegramId: string;
}

interface TelegramReportMessage {
  direction: 'client_to_performer' | 'performer_to_client';
  body: string | null;
  createdAt: string;
}

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
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
  const isDeciding = decisionTarget?.id === item.id;
  const meta = [item.age ? `${item.age} ${t('ageSuffix')}` : null, item.city].filter(Boolean).join(' · ');

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Thumb url={item.photos[0]} />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-semibold text-white">{item.name || t('unnamed')}</p>
              <p className="truncate font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
            {item.everPublished ? t('typeChanged') : t('typeNew')}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.photos.length} {t('photosUnit')}{item.videoUrl ? t('videoSuffix') : ''}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString(locale) : '—'}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onOpenDecision}
              disabled={busy}
              title={t('requestChangesTitle')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/30 text-orange-300 transition-colors hover:bg-orange-400/10 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              title={t('approveTitle')}
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
                  placeholder={t('commentPlaceholder')}
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
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitDecision}
                    disabled={busy || !decisionNote.trim()}
                    title={!decisionNote.trim() ? t('commentRequiredTitle') : undefined}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                  >
                    {busy ? t('saving') : t('submitChangesRequest')}
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
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
  const statusLabels = getMediaStatusLabels(t);

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Thumb url={item.photos[0]} />
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-semibold text-white">{item.name || t('unnamed')}</p>
              <p className="truncate font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
            {statusLabels[item.status]}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.photos.length} {t('photosUnit')}{item.videoUrl ? t('videoSuffix') : ''}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.updatedAt).toLocaleDateString(locale)}
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
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
  const isDeciding = decisionTarget?.id === item.id;

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <p className="truncate font-body text-sm font-semibold text-white">
            {item.authorFullName || item.authorLogin || t('clientFallback')}
          </p>
          <p className="truncate font-body text-xs text-white/35">{t('forListingPrefix', { name: item.listingName || t('unnamed') })}</p>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <StarRow rating={item.rating} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.createdAt).toLocaleDateString(locale)}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onOpenDecision}
              disabled={busy}
              title={t('rejectTitle')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              title={t('publishTitle')}
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
                  placeholder={t('rejectReasonPlaceholder')}
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
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitDecision}
                    disabled={busy || !decisionNote.trim()}
                    title={!decisionNote.trim() ? t('reasonRequiredTitle') : undefined}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {busy ? t('saving') : t('reject')}
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
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
  const targetLabels = getReportTargetLabels(t);

  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
        <ChevronCell expanded={expanded} />
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-[11px] text-white/50">
              {targetLabels[item.targetType]}
            </span>
            <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 font-body text-[11px] text-red-300">
              {getReportCategoryLabel(t, item.category)}
            </span>
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
          {item.reporterFullName || item.reporterLogin || t('fromFallback')}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
          {new Date(item.createdAt).toLocaleDateString(locale)}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onDismiss}
              disabled={busy}
              title={t('dismiss')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onResolve}
              disabled={busy}
              title={t('resolve')}
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
                <MessageSquare className="h-3.5 w-3.5" /> {t('viewConversation')}
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
                {item.target.messagingRestricted ? t('restrictionRemove') : t('restrictionApply')}
              </button>
            ) : null}

            <p className="mb-3 whitespace-pre-line font-body text-xs text-white/60">{item.text}</p>

            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={t('notePlaceholder')}
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
                <X className="h-3.5 w-3.5" /> {t('dismiss')}
              </button>
              <button
                type="button"
                onClick={onResolve}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> {busy ? t('saving') : t('resolve')}
              </button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default function AdminModerationPage() {
  const t = useTranslations('admin.moderation');
  const locale = useLocale();
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

  const [telegramReportQueue, setTelegramReportQueue] = useState<TelegramBotReportItem[]>([]);
  const [telegramReportsLoading, setTelegramReportsLoading] = useState(true);
  const [telegramReportsLoadError, setTelegramReportsLoadError] = useState('');
  const [telegramReportActionError, setTelegramReportActionError] = useState('');
  const [telegramReportActionId, setTelegramReportActionId] = useState<string | null>(null);
  const [expandedTelegramReportId, setExpandedTelegramReportId] = useState<string | null>(null);
  const [telegramConversations, setTelegramConversations] = useState<Record<string, TelegramReportMessage[]>>({});
  const [telegramConversationLoadingId, setTelegramConversationLoadingId] = useState<string | null>(null);
  const [telegramConversationError, setTelegramConversationError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/admin/moderation/listings');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || t('errorLoadQueue'));
      setQueue(data ?? []);
    } catch (err: any) {
      setLoadError(err.message || t('errorLoadQueue'));
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
      if (!res.ok) throw new Error(data?.message || t('errorLoadMedia'));
      setMediaQueue(data ?? []);
    } catch (err: any) {
      setMediaLoadError(err.message || t('errorLoadMedia'));
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
      if (!res.ok) throw new Error(data?.message || t('errorLoadReviews'));
      setReviewQueue((data ?? []).filter((r: AdminReview) => r.status === 'pending'));
    } catch (err: any) {
      setReviewsLoadError(err.message || t('errorLoadReviews'));
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
      if (!res.ok) throw new Error(data?.message || t('errorLoadReports'));
      setReportQueue((data ?? []).filter((r: AdminReportItem) => r.status === 'pending'));
    } catch (err: any) {
      setReportsLoadError(err.message || t('errorLoadReports'));
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
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || t('errorDefault'));
      }
      setReportQueue((prev) => prev.filter((item) => item.id !== id));
      setReportNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      setReportActionError(err.message || t('errorDefault'));
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
      if (!res.ok) throw new Error(data?.message || t('errorLoadConversation'));
      setConversationView(data);
    } catch (err: any) {
      setConversationError(err.message || t('errorLoadConversation'));
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
      if (!res.ok) throw new Error(data?.message || t('errorToggleRestriction'));
      setReportQueue((prev) =>
        prev.map((item) =>
          item.target.restrictableUserId === userId
            ? { ...item, target: { ...item.target, messagingRestricted: restricted } }
            : item,
        ),
      );
    } catch (err: any) {
      setReportActionError(err.message || t('errorToggleRestriction'));
    } finally {
      setRestrictActionId(null);
    }
  };

  const loadTelegramReports = async () => {
    setTelegramReportsLoading(true);
    setTelegramReportsLoadError('');
    try {
      const res = await authFetch('/admin/telegram-reports');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || t('errorLoadTelegramReports'));
      setTelegramReportQueue((data ?? []).filter((r: TelegramBotReportItem) => r.status === 'pending'));
    } catch (err: any) {
      setTelegramReportsLoadError(err.message || t('errorLoadTelegramReports'));
    } finally {
      setTelegramReportsLoading(false);
    }
  };

  const verifyTelegramReport = async (id: string, decision: 'resolved' | 'dismissed') => {
    setTelegramReportActionError('');
    setTelegramReportActionId(id);
    try {
      const res = await authFetch(`/admin/telegram-reports/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || t('errorResolveTelegramReport'));
      setTelegramReportQueue((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setTelegramReportActionError(err.message || t('errorResolveTelegramReport'));
    } finally {
      setTelegramReportActionId(null);
    }
  };

  const toggleTelegramReportConversation = async (id: string) => {
    if (expandedTelegramReportId === id) {
      setExpandedTelegramReportId(null);
      return;
    }
    setExpandedTelegramReportId(id);
    setTelegramConversationError('');
    if (telegramConversations[id]) return;

    setTelegramConversationLoadingId(id);
    try {
      const res = await authFetch(`/admin/telegram-reports/${id}/conversation`);
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || t('errorLoadConversation'));
      setTelegramConversations((prev) => ({ ...prev, [id]: data ?? [] }));
    } catch (err: any) {
      setTelegramConversationError(err.message || t('errorLoadConversation'));
    } finally {
      setTelegramConversationLoadingId(null);
    }
  };

  useEffect(() => {
    load();
    loadMedia();
    loadReviews();
    loadReports();
    loadTelegramReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || t('errorDefault'));
      }
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setDecisionTarget(null);
    } catch (err: any) {
      setActionError(err.message || t('errorDefault'));
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
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || t('errorDefault'));
      }
      setReviewQueue((prev) => prev.filter((item) => item.id !== id));
      setReviewDecisionTarget(null);
    } catch (err: any) {
      setReviewActionError(err.message || t('errorDefault'));
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
      <h1 className="mb-6 font-display text-2xl font-bold">{t('title')}</h1>

      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {actionError}
        </p>
      ) : null}

      <div className="space-y-8">
        <section>
          <ColumnHeader title={t('listingsHeading')} count={queue.length} />
          {loading ? (
            <p className="font-body text-sm text-white/40">{t('loading')}</p>
          ) : loadError ? (
            <p className="font-body text-sm text-red-400">{loadError}</p>
          ) : queue.length === 0 ? (
            <EmptyColumn text={t('emptyListings')} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">{t('colListing')}</th>
                    <th className="px-4 py-3 font-medium">{t('colType')}</th>
                    <th className="px-4 py-3 font-medium">{t('colMedia')}</th>
                    <th className="px-4 py-3 font-medium">{t('colSubmitted')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('colActions')}</th>
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
          <ColumnHeader title={t('mediaHeading')} count={mediaQueue.length} />
          {mediaLoading ? (
            <p className="font-body text-sm text-white/40">{t('loading')}</p>
          ) : mediaLoadError ? (
            <p className="font-body text-sm text-red-400">{mediaLoadError}</p>
          ) : mediaQueue.length === 0 ? (
            <EmptyColumn text={t('emptyMedia')} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">{t('colListing')}</th>
                    <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                    <th className="px-4 py-3 font-medium">{t('colPhotos')}</th>
                    <th className="px-4 py-3 font-medium">{t('colUpdated')}</th>
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
          <ColumnHeader title={t('reviewsHeading')} count={reviewQueue.length} />
          {reviewActionError ? (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
              {reviewActionError}
            </p>
          ) : null}
          {reviewsLoading ? (
            <p className="font-body text-sm text-white/40">{t('loading')}</p>
          ) : reviewsLoadError ? (
            <p className="font-body text-sm text-red-400">{reviewsLoadError}</p>
          ) : reviewQueue.length === 0 ? (
            <EmptyColumn text={t('emptyReviews')} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">{t('colClientListing')}</th>
                    <th className="px-4 py-3 font-medium">{t('colRating')}</th>
                    <th className="px-4 py-3 font-medium">{t('colDate')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('colActions')}</th>
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
          <ColumnHeader title={t('reportsHeading')} count={reportQueue.length} />
          {reportActionError ? (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
              {reportActionError}
            </p>
          ) : null}
          {reportsLoading ? (
            <p className="font-body text-sm text-white/40">{t('loading')}</p>
          ) : reportsLoadError ? (
            <p className="font-body text-sm text-red-400">{reportsLoadError}</p>
          ) : reportQueue.length === 0 ? (
            <EmptyColumn text={t('emptyReports')} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-2 py-3" />
                    <th className="px-4 py-3 font-medium">{t('colTypeCategory')}</th>
                    <th className="px-4 py-3 font-medium">{t('colFrom')}</th>
                    <th className="px-4 py-3 font-medium">{t('colDate')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('colActions')}</th>
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

          <div className="mb-3 mt-8 flex items-center gap-2">
            <h3 className="font-display text-sm font-bold text-white/70">{t('telegramReportsHeading')}</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-xs text-white/50">{telegramReportQueue.length}</span>
          </div>
          {telegramReportActionError ? (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-body text-xs text-red-400">
              {telegramReportActionError}
            </p>
          ) : null}
          {telegramReportsLoading ? (
            <p className="font-body text-sm text-white/40">{t('loading')}</p>
          ) : telegramReportsLoadError ? (
            <p className="font-body text-sm text-red-400">{telegramReportsLoadError}</p>
          ) : telegramReportQueue.length === 0 ? (
            <EmptyColumn text={t('emptyTelegramReports')} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                    <th className="px-4 py-3 font-medium">{t('colReason')}</th>
                    <th className="px-4 py-3 font-medium">{t('colReporter')}</th>
                    <th className="px-4 py-3 font-medium">{t('colPerformer')}</th>
                    <th className="px-4 py-3 font-medium">{t('colClient')}</th>
                    <th className="px-4 py-3 font-medium">{t('colDate')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {telegramReportQueue.map((report) => (
                    <Fragment key={report.id}>
                      <tr className="border-b border-white/[0.04] last:border-0">
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 font-body text-[11px] text-red-300">
                            {getReportCategoryLabel(t, report.category)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/50">
                          {report.reporterRole === Role.Performer ? t('reporterPerformer') : t('reporterClient')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/50">
                          {report.performerName || report.performerLogin || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/50">
                          {report.clientUsername ? `@${report.clientUsername}` : `id ${report.clientTelegramId}`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/30">
                          {new Date(report.createdAt).toLocaleDateString(locale)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleTelegramReportConversation(report.id)}
                              title={t('viewConversation')}
                              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                                expandedTelegramReportId === report.id
                                  ? 'border-accent/40 bg-accent/10 text-accent'
                                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyTelegramReport(report.id, 'dismissed')}
                              disabled={telegramReportActionId === report.id}
                              title={t('dismiss')}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => verifyTelegramReport(report.id, 'resolved')}
                              disabled={telegramReportActionId === report.id}
                              title={t('resolve')}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedTelegramReportId === report.id ? (
                        <tr className="border-b border-white/[0.04] bg-white/[0.015] last:border-0">
                          <td colSpan={6} className="px-4 py-4">
                            {telegramConversationLoadingId === report.id ? (
                              <p className="font-body text-xs text-white/40">{t('loadingConversation')}</p>
                            ) : telegramConversationError ? (
                              <p className="font-body text-xs text-red-400">{telegramConversationError}</p>
                            ) : (telegramConversations[report.id]?.length ?? 0) === 0 ? (
                              <p className="font-body text-xs text-white/40">
                                {t('noConversation')}
                              </p>
                            ) : (
                              <div className="max-h-80 space-y-2 overflow-y-auto">
                                {telegramConversations[report.id]!.map((msg, i) => (
                                  <div
                                    key={i}
                                    className={`max-w-[80%] rounded-xl px-3 py-2 font-body text-xs ${
                                      msg.direction === 'client_to_performer'
                                        ? 'bg-white/[0.06] text-white/70'
                                        : 'ml-auto bg-accent/15 text-white/80'
                                    }`}
                                  >
                                    <p className="mb-1 font-medium text-white/40">
                                      {msg.direction === 'client_to_performer' ? t('reporterClient') : t('reporterPerformer')} ·{' '}
                                      {new Date(msg.createdAt).toLocaleString(locale)}
                                    </p>
                                    <p className="whitespace-pre-line">{msg.body ?? t('textUnavailable')}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
            aria-label={t('close')}
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
              <h2 className="font-display text-lg font-bold">{t('conversationTitle')}</h2>
              <button type="button" onClick={() => setConversationOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {conversationLoading ? (
              <p className="font-body text-sm text-white/40">{t('loading')}</p>
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
                          {sender?.fullName || sender?.login || t('userFallback')}
                        </p>
                        <span className="flex-shrink-0 font-body text-[11px] text-white/30">
                          {new Date(m.createdAt).toLocaleString(locale, {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-line font-body text-sm text-white/80">{m.body}</p>
                      {isReported ? (
                        <p className="mt-1 font-body text-[11px] font-semibold text-red-400">{t('reportedMessageBadge')}</p>
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
