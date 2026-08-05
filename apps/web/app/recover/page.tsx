'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';

export default function RecoverPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const [login, setLoginValue] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{
    accessToken: string;
    refreshToken: string;
    user: any;
    recoveryCode: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : (msgRaw as string) || 'Не удалось восстановить доступ';
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
      setError(err.message || 'Не удалось восстановить доступ');
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    if (!pendingAuth) return;
    authLogin(pendingAuth.accessToken, pendingAuth.refreshToken, pendingAuth.user);
    router.push('/cabinet');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className="mb-2 text-center font-display text-2xl font-bold">Восстановление доступа</h1>
          <p className="mb-6 text-center font-body text-sm text-white/40">
            Введите логин, код восстановления, выданный при регистрации, и новый пароль.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLoginValue(e.target.value)}
                required
                placeholder="ivan_petrov"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                Код восстановления
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="input font-mono uppercase"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Минимум 8 символов"
                className="input"
              />
            </div>

            {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Восстанавливаем…' : 'Восстановить доступ'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-white/40">
            Вспомнили пароль?{' '}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </main>
      <Footer />

      {pendingAuth ? (
        <RecoveryCodeModal
          code={pendingAuth.recoveryCode}
          title="Новый код восстановления"
          description="Старый код больше не действует. Сохраните этот новый код — он понадобится при следующей потере пароля."
          confirmLabel="Я сохранил(а) код — перейти в кабинет"
          onConfirm={finish}
        />
      ) : null}
    </div>
  );
}
