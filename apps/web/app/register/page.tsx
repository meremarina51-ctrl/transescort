'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { RecoveryCodeModal } from '@/components/RecoveryCodeModal';
import { ContactFields } from '@/components/register/ContactFields';
import { RequiredMark } from '@/components/register/RequiredMark';
import { RoleSelector } from '@/components/register/RoleSelector';
import { apiUrl } from '@/lib/api-url';
import { Role } from '@/lib/enums';
import { ROUTES } from '@/lib/routes';
import { PendingAuth, RegistrableRole } from '@/components/register/types';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function RegisterPage() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  
  const [role, setRole] = useState<RegistrableRole>(Role.Client);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  
  const [contactMethod, setContactMethod] = useState<string | null>(null);
  const [contactValue, setContactValue] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (role === Role.Performer && (!contactMethod || !contactValue.trim())) {
      setErrorMessage('Укажите способ связи и контакт');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = { login, password, role };

      if (role !== Role.Client) {
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
      setErrorMessage(err.message || 'Не удалось зарегистрироваться');
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
      title="Регистрация"
      modal={
        pendingAuth ? (
          <RecoveryCodeModal
            code={pendingAuth.recoveryCode}
            confirmLabel="Я сохранил(а) код — перейти в кабинет"
            onConfirm={onConfirm}
          />
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <RoleSelector value={role} onChange={setRole} />

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

        {role === Role.Performer ? (
          <ContactFields
            contactMethod={contactMethod}
            onContactMethodChange={setContactMethod}
            contactValue={contactValue}
            onContactValueChange={setContactValue}
          />
        ) : null}

        <FormError error={errorMessage} />

        <SubmitButton isLoading={isLoading} loadingText="Создаём аккаунт…" text="Зарегистрироваться" />
      </form>

      <p className="mt-6 text-center font-body text-sm text-white/40">
        Уже есть аккаунт?{' '}
        <Link href={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Войти
        </Link>
      </p>
    </AuthCard>
  );
};
