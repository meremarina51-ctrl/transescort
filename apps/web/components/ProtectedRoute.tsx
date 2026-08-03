'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
