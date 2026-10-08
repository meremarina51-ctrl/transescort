'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarShell } from '@/components/SidebarShell';
import { getClientHeaderLinks } from '../cabinet/cabinet.constants';
import { getAdminNav, ADMIN_SIDEBAR_COLLAPSED_KEY } from './admin.constants';
import { Role } from '@/lib/enums';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.nav');
  const tCabinetNav = useTranslations('cabinet.nav');
  const tSidebar = useTranslations('sidebar');

  return (
    <ProtectedRoute requiredRoles={[Role.Admin]}>
      <SidebarShell
        nav={getAdminNav(t)}
        rootHref="/admin"
        storageKey={ADMIN_SIDEBAR_COLLAPSED_KEY}
        headerLinks={[...getClientHeaderLinks(tCabinetNav, tSidebar)]}
      >
        {children}
      </SidebarShell>
    </ProtectedRoute>
  );
}
