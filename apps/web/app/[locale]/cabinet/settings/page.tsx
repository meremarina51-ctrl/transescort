'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, KeyRound, Loader2, MonitorX, Send, UserX } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';
import { parseBody } from '@/lib/parse-body';

interface TelegramStatus {
  linked: boolean;
  username: string | null;
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const t = useTranslations('cabinet.settings');

  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

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
      if (!res.ok) throw new Error(data?.message || t('telegram.errorCreateLink'));
      if (!data.deepLink) {
        setTelegramError(t('telegram.errorBotUnavailable'));
        return;
      }
      window.open(data.deepLink, '_blank', 'noopener,noreferrer');
      setTelegramLinking(true);
    } catch (err: any) {
      setTelegramError(err.message || t('telegram.errorCreateLink'));
    }
  };

  const unlinkTelegram = async () => {
    setTelegramUnlinking(true);
    setTelegramError('');
    try {
      const res = await authFetch('/telegram', { method: 'DELETE' });
      if (!res.ok) throw new Error(t('telegram.errorUnlink'));
      setTelegramStatus({ linked: false, username: null });
    } catch (err: any) {
      setTelegramError(err.message || t('telegram.errorUnlink'));
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
      if (!res.ok) throw new Error(data?.message || t('allDevices.errorDefault'));
      logout();
    } catch (err: any) {
      setLogoutAllError(err.message || t('allDevices.errorDefault'));
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
      setDeleteError(t('recoveryCode.errorPasswordRequired'));
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
      if (!res.ok) throw new Error(data?.message || t('deleteAccount.errorDefault'));
      logout();
    } catch (err: any) {
      setDeleteError(err.message || t('deleteAccount.errorDefault'));
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
      setRecoveryError(t('recoveryCode.errorPasswordRequired'));
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
      if (!res.ok) throw new Error(data?.message || t('recoveryCode.errorRegenerate'));
      setRecoveryPromptOpen(false);
      setRecoveryPassword('');
      setNewRecoveryCode(data.recoveryCode);
    } catch (err: any) {
      setRecoveryError(err.message || t('recoveryCode.errorRegenerate'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;

    setChangingPassword(true);
    setChangePasswordError('');
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await parseBody(res);

      if (!res.ok) {
        throw new Error(data?.message || t('changePassword.errorDefault'));
      }

      // Server ends every session (including this one) on a successful change — log out here too,
      // so the user re-authenticates with the new password instead of riding the old access token
      // until it silently expires.
      logout();
    } catch (err: any) {
      setChangePasswordError(err.message || t('changePassword.errorDefault'));
      setChangingPassword(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">{t('title')}</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Send className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-body text-sm uppercase tracking-wide text-white/35">{t('telegram.heading')}</h2>
                <p className="mt-0.5 font-body text-xs text-white/30">{t('telegram.subtitle')}</p>
              </div>
            </div>
            {telegramStatus?.linked ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                @{telegramStatus.username ?? t('telegram.linkedFallback')}
              </span>
            ) : (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wide text-white/40">
                {t('telegram.notLinked')}
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
              {telegramUnlinking ? t('telegram.unlinking') : t('telegram.unlinkButton')}
            </button>
          ) : telegramLinking ? (
            <button type="button" disabled className="btn-secondary mt-5 inline-flex items-center gap-2 opacity-70">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('telegram.waitingConfirmation')}
            </button>
          ) : (
            <button type="button" onClick={startTelegramLink} className="btn-secondary mt-5">
              {t('telegram.linkButton')}
            </button>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">{t('session.heading')}</h2>
          <p className="mb-4 font-body text-sm text-white/40">{t('session.subtitle')}</p>
          <button
            onClick={logout}
            className="rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            {t('session.logoutButton')}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">
            {t('changePassword.heading')}
          </h2>
          <p className="mb-4 font-body text-sm text-white/40">
            {t('changePassword.subtitle')}
          </p>

          <div className="space-y-4">
            <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">{t('changePassword.currentPasswordLabel')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />

            <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">{t('changePassword.newPasswordLabel')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />

            <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">{t('changePassword.confirmPasswordLabel')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />

            {changePasswordError ? <p className="font-body text-sm text-red-400">{changePasswordError}</p> : null}

            <button
              type="button"
              disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || changingPassword}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              onClick={handleChangePassword}
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {changingPassword ? t('changePassword.changing') : t('changePassword.changeButton')}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">{t('recoveryCode.heading')}</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            {t('recoveryCode.subtitle')}
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
            {t('recoveryCode.regenerateButton')}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">{t('allDevices.heading')}</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            {t('allDevices.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => {
              setLogoutAllError('');
              setLogoutAllOpen(true);
            }}
            className="rounded-full border border-red-500/30 px-5 py-2 font-body text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            {t('allDevices.logoutAllButton')}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-body text-sm uppercase tracking-wide text-white/35">{t('deleteAccount.heading')}</h2>
          <p className="mb-4 font-body text-sm text-white/40">
            {t('deleteAccount.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 font-body text-sm font-semibold text-white transition-all hover:bg-red-600"
          >
            <UserX className="h-4 w-4" strokeWidth={1.8} />
            {t('deleteAccount.deleteButton')}
          </button>
        </div>
      </div>

      {logoutAllOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={loggingOutAll ? undefined : () => setLogoutAllOpen(false)}
          />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <MonitorX className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">{t('allDevices.promptTitle')}</h2>
            <p className="font-body text-sm text-white/40">
              {t('allDevices.promptDescription')}
            </p>

            {logoutAllError ? <p className="mt-4 font-body text-sm text-red-400">{logoutAllError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLogoutAllOpen(false)}
                disabled={loggingOutAll}
                className="btn-secondary disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmLogoutAll}
                disabled={loggingOutAll}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {loggingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loggingOutAll ? t('allDevices.confirming') : t('allDevices.logoutAllButton')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeDelete} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">{t('deleteAccount.promptTitle')}</h2>
            <p className="font-body text-sm text-white/40">
              {t('deleteAccount.promptDescription')}
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
              autoFocus
              className="input mt-4 text-center"
            />

            {deleteError ? <p className="mt-4 font-body text-sm text-red-400">{deleteError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeDelete} disabled={deleting} className="btn-secondary disabled:opacity-50">
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? t('deleteAccount.deleting') : t('deleteAccount.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {recoveryPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeRecoveryPrompt} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <KeyRound className="h-6 w-6 text-accent" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">{t('recoveryCode.promptTitle')}</h2>
            <p className="font-body text-sm text-white/40">
              {t('recoveryCode.promptDescription')}
            </p>

            <input
              type="password"
              value={recoveryPassword}
              onChange={(e) => setRecoveryPassword(e.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
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
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmRegenerateRecoveryCode}
                disabled={regenerating}
                className="btn-primary disabled:opacity-50"
              >
                {regenerating ? t('recoveryCode.regenerating') : t('recoveryCode.regenerateConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {newRecoveryCode ? (
        <RecoveryCodeModal
          code={newRecoveryCode}
          title={t('recoveryCode.newCodeTitle')}
          description={t('recoveryCode.newCodeDescription')}
          onConfirm={() => setNewRecoveryCode(null)}
        />
      ) : null}
    </>
  );
}
