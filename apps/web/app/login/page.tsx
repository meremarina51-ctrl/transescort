'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setResent(false);
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: unknown; code?: string }));
        if (errorData.code === 'EMAIL_NOT_VERIFIED' || (response.status === 403 && errorData.message)) {
          setUnverified(true);
          throw new Error('Email ещё не подтверждён. Проверьте почту или отправьте письмо повторно.');
        }
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : (msgRaw as string) || 'Не удалось войти';
        throw new Error(msg);
      }

      const data = await response.json();
      login(data.accessToken, data.refreshToken, data.user);
      router.push('/cabinet');
    } catch (err: any) {
      setError(err.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    await fetch(apiUrl('/auth/resend-verification'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResent(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className="mb-6 text-center font-display text-2xl font-bold">Вход</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}
            {unverified && !resent ? (
              <button type="button" onClick={handleResend} className="font-body text-sm text-crimson hover:underline">
                Отправить письмо повторно
              </button>
            ) : null}
            {resent ? <p className="font-body text-sm text-emerald-400">Письмо отправлено повторно.</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-white/40">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-medium text-crimson hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
