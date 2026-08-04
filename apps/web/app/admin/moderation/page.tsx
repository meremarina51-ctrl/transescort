'use client';

import { useMemo, useState, useEffect } from 'react';
import { Check, ImageOff, MessageSquare, RefreshCw, ShieldAlert, ShieldCheck, Video, X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface ModerationListing {
  id: string;
  status: 'draft' | 'published';
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

type Decision = 'approved' | 'rejected' | 'changes_requested';

interface DecisionTarget {
  id: string;
  decision: 'rejected' | 'changes_requested';
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

function SubHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-2 flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-wide text-white/35">
      {title} <span className="text-white/25">· {count}</span>
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

function StubColumn({ title, icon: Icon, description }: { title: string; icon: typeof MessageSquare; description: string }) {
  return (
    <div className="min-w-0">
      <ColumnHeader title={title} count={0} />
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <Icon className="h-6 w-6 text-white/20" strokeWidth={1.4} />
        <p className="font-body text-xs text-white/35">{description}</p>
      </div>
    </div>
  );
}

function ModerationCard({
  item,
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
  busy: boolean;
  decisionTarget: DecisionTarget | null;
  decisionNote: string;
  onNoteChange: (v: string) => void;
  onConfirm: () => void;
  onOpenDecision: (decision: 'rejected' | 'changes_requested') => void;
  onCancelDecision: () => void;
  onSubmitDecision: () => void;
  onPhotoClick: (url: string) => void;
}) {
  const isDeciding = decisionTarget?.id === item.id;

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        {item.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photos[0]}
            alt=""
            onClick={() => onPhotoClick(item.photos[0])}
            className="h-16 w-16 flex-shrink-0 cursor-zoom-in rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
            <ImageOff className="h-5 w-5 text-white/20" strokeWidth={1.4} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-semibold text-white">{item.name || 'Без имени'}</p>
          <p className="font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>
          <p className="mt-1 font-body text-xs text-white/40">
            {[item.age ? `${item.age} лет` : null, item.city].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </div>

      {item.bio ? <p className="mt-3 line-clamp-2 font-body text-xs text-white/40">{item.bio}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 font-body text-[11px] text-white/30">
        <span>
          {item.photos.length} фото{item.videoUrl ? ' · есть видео' : ''}
        </span>
        {item.videoUrl ? <Video className="h-3.5 w-3.5 text-white/25" /> : null}
        {item.submittedAt ? <span className="ml-auto">{new Date(item.submittedAt).toLocaleDateString('ru-RU')}</span> : null}
      </div>

      {isDeciding ? (
        <div className="mt-3 space-y-2">
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
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-body text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                decisionTarget?.decision === 'rejected'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {busy
                ? 'Сохраняем…'
                : decisionTarget?.decision === 'rejected'
                  ? 'Подтвердить отклонение'
                  : 'Отправить запрос на замену'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenDecision('rejected')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 py-1.5 font-body text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Отклонить
          </button>
          <button
            type="button"
            onClick={() => onOpenDecision('changes_requested')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 px-3.5 py-1.5 font-body text-xs font-medium text-orange-300 transition-colors hover:bg-orange-400/10 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Запросить замену
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {busy ? 'Публикуем…' : 'Подтвердить'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  const [queue, setQueue] = useState<ModerationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, []);

  const newItems = useMemo(() => queue.filter((item) => item.status === 'draft'), [queue]);
  const modifiedItems = useMemo(() => queue.filter((item) => item.status === 'published'), [queue]);

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

  const openDecision = (id: string, decision: 'rejected' | 'changes_requested') => {
    setDecisionTarget({ id, decision });
    setDecisionNote('');
    setActionError('');
  };

  const renderGroup = (items: ModerationListing[]) => (
    <div className="space-y-3">
      {items.map((item) => (
        <ModerationCard
          key={item.id}
          item={item}
          busy={actionId === item.id}
          decisionTarget={decisionTarget}
          decisionNote={decisionNote}
          onNoteChange={setDecisionNote}
          onConfirm={() => verify(item.id, 'approved')}
          onOpenDecision={(decision) => openDecision(item.id, decision)}
          onCancelDecision={() => setDecisionTarget(null)}
          onSubmitDecision={() => verify(item.id, decisionTarget!.decision, decisionNote.trim())}
          onPhotoClick={setLightboxUrl}
        />
      ))}
    </div>
  );

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Модерация</h1>

      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {actionError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <ColumnHeader title="Анкеты" count={queue.length} />

          {loading ? (
            <p className="font-body text-sm text-white/40">Загрузка…</p>
          ) : loadError ? (
            <p className="font-body text-sm text-red-400">{loadError}</p>
          ) : queue.length === 0 ? (
            <EmptyColumn text="Очередь пуста — нет анкет, ожидающих проверки" />
          ) : (
            <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
              <div>
                <SubHeader title="Новые" count={newItems.length} />
                {newItems.length === 0 ? (
                  <p className="font-body text-xs text-white/25">Нет новых анкет на проверке</p>
                ) : (
                  renderGroup(newItems)
                )}
              </div>
              <div>
                <SubHeader title="Изменённые" count={modifiedItems.length} />
                {modifiedItems.length === 0 ? (
                  <p className="font-body text-xs text-white/25">Нет изменённых анкет на проверке</p>
                ) : (
                  renderGroup(modifiedItems)
                )}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <ColumnHeader title="Медиа" count={queue.length} />

          {loading ? null : loadError ? null : queue.length === 0 ? (
            <EmptyColumn text="Нет фото и видео на проверке" />
          ) : (
            <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
              {queue.map((item) => (
                <div key={item.id} className="card p-4">
                  <p className="truncate font-body text-sm font-semibold text-white">{item.name || 'Без имени'}</p>
                  <p className="mb-3 font-body text-xs text-white/35">@{item.ownerLogin ?? '—'}</p>

                  {item.photos.length === 0 && !item.videoUrl ? (
                    <p className="font-body text-xs text-white/30">Фото и видео не загружены</p>
                  ) : (
                    <>
                      {item.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {item.photos.map((url) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={url}
                              src={url}
                              alt=""
                              onClick={() => setLightboxUrl(url)}
                              className="aspect-square w-full cursor-zoom-in rounded-md object-cover transition-opacity hover:opacity-80"
                            />
                          ))}
                        </div>
                      ) : null}

                      {item.videoUrl ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={item.videoUrl}
                          controls
                          className={`w-full rounded-lg border border-white/[0.08] ${item.photos.length > 0 ? 'mt-2' : ''}`}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <StubColumn
          title="Отзывы"
          icon={MessageSquare}
          description="Система отзывов ещё не реализована — модерировать пока нечего"
        />
        <StubColumn
          title="Жалобы"
          icon={ShieldAlert}
          description="Система жалоб ещё не реализована — модерировать пока нечего"
        />
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
    </>
  );
}
