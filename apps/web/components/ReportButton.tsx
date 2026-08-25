'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Flag, Loader2, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { ROUTES } from '@/lib/routes';
import { parseBody } from '@/lib/parse-body';

type ReportTargetType = 'listing' | 'review' | 'message' | 'user';

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Спам' },
  { value: 'fake', label: 'Мошенничество / фейк' },
  { value: 'harassment', label: 'Оскорбления' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'other', label: 'Другое' },
];

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  /** Overrides the default icon+text trigger styling — pass a full className to restyle it (e.g. icon-only in a toolbar). */
  className?: string;
  label?: string;
}

export function ReportButton({ targetType, targetId, className, label = 'Пожаловаться' }: Props) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = () => {
    setOpen(true);
    setCategory('');
    setText('');
    setError('');
    setSubmitted(false);
  };

  const submit = async () => {
    if (!category) {
      setError('Выберите причину');
      return;
    }
    if (!text.trim()) {
      setError('Опишите жалобу');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, category, text: text.trim() }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отправить жалобу');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить жалобу');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={className ?? 'inline-flex items-center gap-1.5 font-body text-xs text-white/35 transition-colors hover:text-red-400'}
      >
        <Flag className="h-3.5 w-3.5" />
        {label}
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
              <div className="card relative w-full p-6 !rounded-b-none sm:max-w-md sm:!rounded-2xl">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">Пожаловаться</h2>
                  <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {!user ? (
                  <p className="font-body text-sm text-white/50">
                    <Link href={ROUTES.LOGIN} className="text-accent hover:underline">
                      Войдите
                    </Link>
                    , чтобы отправить жалобу
                  </p>
                ) : submitted ? (
                  <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 font-body text-sm text-emerald-400">
                    Спасибо! Жалоба отправлена на рассмотрение.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCategory(opt.value)}
                          className={`rounded-full px-3.5 py-1.5 font-body text-xs font-medium transition-colors ${
                            category === opt.value ? 'bg-accent text-white' : 'bg-white/[0.06] text-white/50 hover:text-white/80'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Опишите, что произошло..."
                      rows={4}
                      maxLength={2000}
                      className="input resize-none text-sm"
                    />
                    {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={submitting}
                        className="btn-secondary disabled:opacity-50"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={submit}
                        disabled={submitting || !category || !text.trim()}
                        title={!category ? 'Выберите причину' : !text.trim() ? 'Опишите жалобу' : undefined}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {submitting ? 'Отправляем…' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
