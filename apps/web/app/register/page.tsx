'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';
import { Select } from '@/components/Select';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';
import { type Role, CONTACT_METHOD_OPTIONS } from './register.constants';

function RequiredMark() {
  return <span className="text-red-400"> *</span>;
}

export default function RegisterPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>('client');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [contactMethod, setContactMethod] = useState<string | null>(null);
  const [contactValue, setContactValue] = useState('');
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

    if (role === 'performer' && (!contactMethod || !contactValue.trim())) {
      setError('Укажите способ связи и контакт');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = { login, password, role };
      if (role !== 'client') {
        payload.contactMethod = contactMethod;
        payload.contactValue = contactValue.trim();
      }

      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string | string[] }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось зарегистрироваться';
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
      setError(err.message || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  const finishRegistration = () => {
    if (!pendingAuth) return;
    authLogin(pendingAuth.accessToken, pendingAuth.refreshToken, pendingAuth.user);
    router.push('/cabinet');
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
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                Логин
                <RequiredMark />
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                minLength={3}
                placeholder="ivan_petrov"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                Пароль
                <RequiredMark />
              </label>
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

            {role === 'performer' ? (
              <>
                <div>
                  <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                    Способ связи
                    <RequiredMark />
                  </label>
                  <Select value={contactMethod} onChange={setContactMethod} options={CONTACT_METHOD_OPTIONS} />
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
                    Контакт
                    <RequiredMark />
                  </label>
                  <input
                    type="text"
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    required
                    placeholder="@username, номер или email"
                    className="input"
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-white/40">
            Уже есть аккаунт?{' '}
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
          confirmLabel="Я сохранил(а) код — перейти в кабинет"
          onConfirm={finishRegistration}
        />
      ) : null}
    </div>
  );
}
