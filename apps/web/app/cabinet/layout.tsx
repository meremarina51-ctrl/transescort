'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { SidebarShell, type NavItem } from '@/components/SidebarShell';
import { SIDEBAR_COLLAPSED_KEY, BASE_NAV, PERFORMER_NAV, CLIENT_NAV, DEFAULT_NAV, TAIL_NAV } from './cabinet.constants';

function CabinetShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const nav: NavItem[] = [
    ...BASE_NAV,
    ...(user?.role === 'performer' ? PERFORMER_NAV : user?.role === 'client' ? CLIENT_NAV : DEFAULT_NAV),
    ...TAIL_NAV,
  ];

  return (
    <SidebarShell nav={nav} rootHref="/cabinet" storageKey={SIDEBAR_COLLAPSED_KEY}>
      {children}
    </SidebarShell>
  );
}

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CabinetShell>{children}</CabinetShell>
    </ProtectedRoute>
  );
}
