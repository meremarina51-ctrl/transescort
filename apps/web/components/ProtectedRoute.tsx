'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useAuth } from './AuthProvider';
import { Role } from '@/lib/enums';
import { ROUTES, loginWithRedirect } from '@/lib/routes';
import { FullScreenState } from '@/components/ui/FullScreenState';

interface IProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
}

export function ProtectedRoute({
  children,
  requiredRoles,
}: IProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRedirecting = useRef(false);
  const t = useTranslations('protectedRoute');

  useEffect(() => {
    if (loading) return;
    if (isRedirecting.current) return;

    if (!user && pathname !== ROUTES.LOGIN) {
      isRedirecting.current = true;
      router.replace(loginWithRedirect(pathname || ROUTES.HOME));
    }
  }, [user, loading, pathname, router]);

  if (loading || (!user && pathname !== ROUTES.LOGIN)) {
    return (
      <FullScreenState>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-accent" />
          <p className="font-body text-sm text-white/40">{t('loading')}</p>
        </div>
      </FullScreenState>
    );
  }

  if (user && requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <FullScreenState className="p-6">
        <div className="card max-w-sm p-8 text-center">
          <h2 className="mb-2 font-display text-xl font-bold">{t('accessDeniedTitle')}</h2>
          <p className="mb-6 font-body text-sm text-white/40">{t('accessDeniedDescription')}</p>
          <Link href={ROUTES.CABINET} className="btn-primary">
            {t('goToCabinet')}
          </Link>
        </div>
      </FullScreenState>
    );
  }

  return <>{children}</>;
}
