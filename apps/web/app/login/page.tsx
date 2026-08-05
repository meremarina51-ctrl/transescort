'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

export default function LoginPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const [login, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : (msgRaw as string) || 'Не удалось войти';
        throw new Error(msg);
      }

      const data = await response.json();
      authLogin(data.accessToken, data.refreshToken, data.user);
      router.push('/cabinet');
    } catch (err: any) {
      setError(err.message || 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className="mb-6 text-center font-display text-2xl font-bold">Вход</h1>

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
              <div className="mb-1 flex items-center justify-between">
                <label className="block font-body text-xs uppercase tracking-wide text-white/40">Пароль</label>
                <Link href="/recover" className="font-body text-xs text-accent hover:underline">
                  Забыли пароль?
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

            {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-white/40">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
