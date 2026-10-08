'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';
import { ROUTES } from '@/lib/routes';
import { reachGoal } from '@/lib/metrika';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const t = useTranslations('auth.login');
  const [login, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: unknown }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : (msgRaw as string) || t('errorDefault');
        throw new Error(msg);
      }

      const data = await response.json();
      reachGoal('login_success');
      authLogin(data.accessToken, data.refreshToken, data.user);
      router.push(ROUTES.CABINET);
    } catch (err: any) {
      setErrorMessage(err.message || t('errorDefault'));
      reachGoal('login_failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t('title')}>
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
          <div className="mb-1 flex items-center justify-between">
            <label className="block font-body text-xs uppercase tracking-wide text-white/40">{t('passwordLabel')}</label>
            <Link href={ROUTES.RECOVER} className="font-body text-xs text-accent hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="input"
          />
        </div>

        <FormError error={errorMessage} />

        <SubmitButton isLoading={isLoading} loadingText={t('submitting')} text={t('submit')} />
      </form>

      <p className="mt-6 text-center font-body text-sm text-white/40">
        {t('noAccount')}{' '}
        <Link href={ROUTES.REGISTER} className="font-medium text-accent hover:underline">
          {t('registerLink')}
        </Link>
      </p>
    </AuthCard>
  );
};
