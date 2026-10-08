'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';
import { ROUTES } from '@/lib/routes';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function RecoverPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth.recover');
  const tModal = useTranslations('auth.recoveryModal');

  const [login, setLoginValue] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{
    accessToken: string;
    refreshToken: string;
    user: any;
    recoveryCode: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/recover'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, recoveryCode, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: unknown }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : (msgRaw as string) || t('errorDefault');
        throw new Error(msg);
      }

      const data = await response.json();
      setPendingAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        recoveryCode: data.recoveryCode,
      });
    } catch (err: any) {
      setErrorMessage(err.message || t('errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = () => {
    if (!pendingAuth) return;

    authLogin(pendingAuth.accessToken, pendingAuth.refreshToken, pendingAuth.user);
    router.push(ROUTES.CABINET);
  };

  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
      modal={
        pendingAuth ? (
          <RecoveryCodeModal
            code={pendingAuth.recoveryCode}
            title={t('newCodeTitle')}
            description={t('newCodeDescription')}
            confirmLabel={tModal('confirmAndEnter')}
            onConfirm={onConfirm}
          />
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">{t('loginLabel')}</label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLoginValue(e.target.value)}
            required
            placeholder={t('loginPlaceholder')}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            {t('codeLabel')}
          </label>
          <input
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            required
            placeholder={t('codePlaceholder')}
            className="input font-mono uppercase"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            {t('newPasswordLabel')}
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder={t('newPasswordPlaceholder')}
            className="input"
          />
        </div>

        <FormError error={errorMessage} />

        <SubmitButton isLoading={isLoading} loadingText={t('submitting')} text={t('submit')} />
      </form>

      <p className="mt-6 text-center font-body text-sm text-white/40">
        {t('rememberedPassword')}{' '}
        <Link href={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </AuthCard>
  );
};
