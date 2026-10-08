'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { SidebarShell, type NavItem } from '@/components/SidebarShell';
import { useUnreadChatsCount } from '@/lib/useUnreadChatsCount';
import {
  SIDEBAR_COLLAPSED_KEY,
  getBaseNav,
  getPerformerNav,
  getClientNav,
  getCabinetHeaderLinks,
  getDefaultNav,
  getTailNav,
} from './cabinet.constants';
import { Role } from '@/lib/enums';

const CHAT_HREFS = new Set(['/cabinet/chats', '/cabinet/messages']);

function CabinetShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isClient = user?.role === Role.Client;
  const unreadChats = useUnreadChatsCount();
  const t = useTranslations('cabinet.nav');
  const tSidebar = useTranslations('sidebar');

  const baseNav = user?.role === Role.Performer ? getPerformerNav(t) : isClient ? getClientNav(t) : getDefaultNav(t);
  const nav: NavItem[] = [
    ...getBaseNav(t),
    ...baseNav.map((item) => (CHAT_HREFS.has(item.href) ? { ...item, badge: unreadChats } : item)),
    ...getTailNav(t),
  ];

  return (
    <SidebarShell
      nav={nav}
      rootHref="/cabinet"
      storageKey={SIDEBAR_COLLAPSED_KEY}
      headerLinks={[...getCabinetHeaderLinks(t, tSidebar)]}
    >
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
