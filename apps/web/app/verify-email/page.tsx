'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

function VerifyEmailContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const res = await fetch(apiUrl(`/auth/verify-email?token=${encodeURIComponent(token)}`));
        if (!res.ok) {
          setStatus('error');
          return;
        }
        const data = await res.json();
        login(data.accessToken, data.refreshToken, data.user);
        setStatus('ok');
        setTimeout(() => router.push('/cabinet'), 1200);
      } catch {
        setStatus('error');
      }
    })();
  }, [searchParams, login, router]);

  return (
    <div className="card w-full max-w-md p-8 text-center">
      {status === 'pending' && <p className="font-body text-white/50">Подтверждаем email…</p>}
      {status === 'ok' && (
        <>
          <h1 className="font-display text-2xl font-bold">Email подтверждён</h1>
          <p className="mt-3 font-body text-sm text-white/50">Перенаправляем в личный кабинет…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="font-display text-2xl font-bold">Ссылка недействительна</h1>
          <p className="mt-3 font-body text-sm text-white/50">
            Возможно, срок её действия истёк. Запросите новое письмо на странице входа.
          </p>
          <Link href="/login" className="btn-secondary mt-8 inline-flex">
            К странице входа
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <Suspense fallback={<p className="font-body text-white/50">Загрузка…</p>}>
          <VerifyEmailContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
