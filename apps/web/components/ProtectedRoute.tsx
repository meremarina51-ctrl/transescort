'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Role } from '@/lib/enums';

export function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (isRedirecting.current) return;

    if (!user && pathname !== '/login') {
      isRedirecting.current = true;
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [user, loading, pathname, router]);

  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-accent" />
          <p className="font-body text-sm text-white/40">Загрузка…</p>
        </div>
      </div>
    );
  }

  if (user && requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6">
        <div className="card max-w-sm p-8 text-center">
          <h2 className="mb-2 font-display text-xl font-bold">Доступ запрещён</h2>
          <p className="mb-6 font-body text-sm text-white/40">У вас нет прав для просмотра этой страницы.</p>
          <Link href="/cabinet" className="btn-primary">
            В личный кабинет
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
