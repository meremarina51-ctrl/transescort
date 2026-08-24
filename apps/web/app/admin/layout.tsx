'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarShell } from '@/components/SidebarShell';
import { CLIENT_HEADER_LINKS } from '../cabinet/cabinet.constants';
import { ADMIN_NAV, ADMIN_SIDEBAR_COLLAPSED_KEY } from './admin.constants';
import { Role } from '@/lib/enums';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[Role.Admin]}>
      <SidebarShell
        nav={ADMIN_NAV}
        rootHref="/admin"
        storageKey={ADMIN_SIDEBAR_COLLAPSED_KEY}
        headerLinks={[...CLIENT_HEADER_LINKS]}
      >
        {children}
      </SidebarShell>
    </ProtectedRoute>
  );
}
