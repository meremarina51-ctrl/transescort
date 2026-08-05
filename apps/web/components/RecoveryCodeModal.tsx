'use client';

import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';

interface RecoveryCodeModalProps {
  code: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/** Shown once after a backup code is (re)generated — the plaintext is never retrievable again. */
export function RecoveryCodeModal({
  code,
  title = 'Ваш код восстановления',
  description = 'Сохраните этот код в надёжном месте — он понадобится, если вы забудете пароль. Он показывается только один раз.',
  confirmLabel = 'Я сохранил(а) код',
  onConfirm,
}: RecoveryCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the code is still selectable/visible on screen
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <KeyRound className="h-6 w-6 text-accent" strokeWidth={1.6} />
        </div>
        <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
        <p className="font-body text-sm text-white/40">{description}</p>

        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <code className="break-all font-mono text-sm tracking-wide text-white">{code}</code>
          <button
            type="button"
            onClick={copyCode}
            title="Скопировать"
            className="flex-shrink-0 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2.5 font-body text-sm text-white/50 select-none">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
              saved ? 'border-accent bg-accent' : 'border-white/[0.15] bg-white/[0.04] peer-focus-visible:border-accent/50'
            }`}
          >
            <Check
              className={`h-3.5 w-3.5 text-white transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}
              strokeWidth={3}
            />
          </span>
          Я сохранил(а) код в надёжном месте
        </label>

        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onConfirm} disabled={!saved} className="btn-primary w-full disabled:opacity-40">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
