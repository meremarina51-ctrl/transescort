'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, Loader2, MonitorX, Send, UserX } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';

interface TelegramStatus {
  linked: boolean;
  username: string | null;
}

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function SettingsPage() {
  const { logout } = useAuth();

  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [recoveryPromptOpen, setRecoveryPromptOpen] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);

  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramUnlinking, setTelegramUnlinking] = useState(false);
  const [telegramError, setTelegramError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/telegram/status');
        if (res.ok) setTelegramStatus(await res.json());
      } finally {
        setTelegramLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!telegramLinking) return;
    const interval = setInterval(async () => {
      try {
        const res = await authFetch('/telegram/status');
        if (!res.ok) return;
        const data: TelegramStatus = await res.json();
        if (data.linked) {
          setTelegramStatus(data);
          setTelegramLinking(false);
        }
      } catch {
        // keep polling — a single failed check shouldn't abort the wait
      }
    }, 3000);
    const timeout = setTimeout(() => setTelegramLinking(false), 10 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [telegramLinking]);

  const startTelegramLink = async () => {
    setTelegramError('');
    try {
      const res = await authFetch('/telegram/link-token', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось создать ссылку');
      if (!data.deepLink) {
        setTelegramError('Telegram-бот временно недоступен. Попробуйте позже.');
        return;
      }
      window.open(data.deepLink, '_blank', 'noopener,noreferrer');
      setTelegramLinking(true);
    } catch (err: any) {
      setTelegramError(err.message || 'Не удалось создать ссылку');
    }
  };

  const unlinkTelegram = async () => {
    setTelegramUnlinking(true);
    setTelegramError('');
    try {
      const res = await authFetch('/telegram', { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось отвязать Telegram');
      setTelegramStatus({ linked: false, username: null });
    } catch (err: any) {
      setTelegramError(err.message || 'Не удалось отвязать Telegram');
    } finally {
      setTelegramUnlinking(false);
    }
  };

  const confirmLogoutAll = async () => {
    setLoggingOutAll(true);
    setLogoutAllError('');
    try {
      const res = await authFetch('/auth/logout-all', { method: 'POST' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось завершить сессии');
      logout();
    } catch (err: any) {
      setLogoutAllError(err.message || 'Не удалось завершить сессии');
      setLoggingOutAll(false);
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeletePassword('');
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Введите пароль для подтверждения');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await authFetch('/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить аккаунт');
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Не удалось удалить аккаунт');
      setDeleting(false);
    }
  };

  const closeRecoveryPrompt = () => {
    if (regenerating) return;
    setRecoveryPromptOpen(false);
    setRecoveryPassword('');
    setRecoveryError('');
  };

  const confirmRegenerateRecoveryCode = async () => {
    if (!recoveryPassword) {
      setRecoveryError('Введите пароль для подтверждения');
      return;
    }
    setRegenerating(true);
    setRecoveryError('');
    try {
      const res = await authFetch('/auth/recovery-code/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: recoveryPassword }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось перевыпустить код');
      setRecoveryPromptOpen(false);
      setRecoveryPassword('');
      setNewRecoveryCode(data.recoveryCode);
    } catch (err: any) {
      setRecoveryError(err.message || 'Не удалось перевыпустить код');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Настройки</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Send className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-body text-sm uppercase tracking-wide text-white/35">Telegram</h2>
                <p className="mt-0.5 font-body text-xs text-white/30">Уведомления и быстрые действия в мессенджере</p>
              </div>
            </div>
            {telegramStatus?.linked ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                @{telegramStatus.username ?? 'привязан'}
              </span>
            ) : (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Не привязан
              </span>
            )}
          </div>

          {telegramError ? <p className="mt-3 font-body text-xs text-red-400">{telegramError}</p> : null}

          {telegramLoading ? null : telegramStatus?.linked ? (
            <button
              type="button"
              onClick={unlinkTelegram}
              disabled={telegramUnlinking}
              className="mt-5 rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              {telegramUnlinking ? 'Отвязываем…' : 'Отвязать Telegram'}
            </button>
          ) : telegramLinking ? (
            <button type="button" disabled className="btn-secondary mt-5 inline-flex items-center gap-2 opacity-70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ждём подтверждения в Telegram…
            </button>
          ) : (
            <button type="button" onClick={startTelegramLink} className="btn-secondary mt-5">
              Привязать Telegram
            </button>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">Сессия</h2>
          <p className="mb-4 font-body text-sm text-white/40">Завершить текущую сессию на этом устройстве.</p>
          <button
            onClick={logout}
            className="rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            Выйти из аккаунта
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">Код восстановления</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            Позволяет сбросить пароль без email. Перевыпуск делает старый код недействительным.
          </p>
          <button
            type="button"
            onClick={() => {
              setRecoveryError('');
              setRecoveryPromptOpen(true);
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <KeyRound className="h-4 w-4" strokeWidth={1.8} />
            Перевыпустить код
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">Все устройства</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            Завершить все активные сессии на всех устройствах, включая текущее. Потребуется войти заново.
          </p>
          <button
            type="button"
            onClick={() => {
              setLogoutAllError('');
              setLogoutAllOpen(true);
            }}
            className="rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            Выйти со всех устройств
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">Удаление аккаунта</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            Аккаунт и все связанные данные будут удалены без возможности восстановления.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 font-body text-sm font-semibold text-white transition-all hover:bg-red-600"
          >
            <UserX className="h-4 w-4" strokeWidth={1.8} />
            Удалить аккаунт
          </button>
        </div>
      </div>

      {logoutAllOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={loggingOutAll ? undefined : () => setLogoutAllOpen(false)}
          />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <MonitorX className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Выйти со всех устройств?</h2>
            <p className="font-body text-sm text-white/40">
              Все активные сессии, включая текущую, будут завершены. Для входа потребуется ввести логин и пароль
              заново.
            </p>

            {logoutAllError ? <p className="mt-4 font-body text-sm text-red-400">{logoutAllError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLogoutAllOpen(false)}
                disabled={loggingOutAll}
                className="btn-secondary disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmLogoutAll}
                disabled={loggingOutAll}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {loggingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loggingOutAll ? 'Завершаем…' : 'Выйти со всех устройств'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDelete} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Удалить аккаунт?</h2>
            <p className="font-body text-sm text-white/40">
              Это действие необратимо: аккаунт, анкета и избранное будут удалены без возможности восстановления.
              Введите пароль, чтобы подтвердить.
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Текущий пароль"
              autoFocus
              className="input mt-4 text-center"
            />

            {deleteError ? <p className="mt-4 font-body text-sm text-red-400">{deleteError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeDelete} disabled={deleting} className="btn-secondary disabled:opacity-50">
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? 'Удаляем…' : 'Удалить аккаунт'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {recoveryPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRecoveryPrompt} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <KeyRound className="h-6 w-6 text-accent" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Перевыпустить код восстановления?</h2>
            <p className="font-body text-sm text-white/40">
              Текущий код перестанет действовать. Введите пароль, чтобы подтвердить.
            </p>

            <input
              type="password"
              value={recoveryPassword}
              onChange={(e) => setRecoveryPassword(e.target.value)}
              placeholder="Текущий пароль"
              autoFocus
              className="input mt-4 text-center"
            />

            {recoveryError ? <p className="mt-4 font-body text-sm text-red-400">{recoveryError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={closeRecoveryPrompt}
                disabled={regenerating}
                className="btn-secondary disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmRegenerateRecoveryCode}
                disabled={regenerating}
                className="btn-primary disabled:opacity-50"
              >
                {regenerating ? 'Перевыпускаем…' : 'Перевыпустить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {newRecoveryCode ? (
        <RecoveryCodeModal
          code={newRecoveryCode}
          title="Новый код восстановления"
          description="Старый код больше не действует. Сохраните этот новый код в надёжном месте."
          onConfirm={() => setNewRecoveryCode(null)}
        />
      ) : null}
    </>
  );
}
