'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

type Role = 'client' | 'performer';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string | string[] }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось зарегистрироваться';
        throw new Error(msg);
      }

      const data = await response.json();
      login(data.accessToken, data.refreshToken, data.user);
      router.push('/cabinet');
    } catch (err: any) {
      setError(err.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className="mb-6 text-center font-display text-2xl font-bold">Регистрация</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-wide text-white/40">
                Я регистрируюсь как
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['client', 'Клиент'],
                  ['performer', 'Исполнитель'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`rounded-lg border py-2.5 font-body text-sm font-medium transition-colors ${
                      role === value
                        ? 'border-crimson/40 bg-crimson/10 text-crimson'
                        : 'border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Имя</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Иван Петров"
                className="input"
              />
            </div>
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
                minLength={8}
                placeholder="Минимум 8 символов"
                className="input"
              />
            </div>

            {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-white/40">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-medium text-crimson hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
