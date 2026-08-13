'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { SidebarShell, type NavItem } from '@/components/SidebarShell';
import { useUnreadChatsCount } from '@/lib/useUnreadChatsCount';
import {
  SIDEBAR_COLLAPSED_KEY,
  BASE_NAV,
  PERFORMER_NAV,
  CLIENT_NAV,
  CABINET_HEADER_LINKS,
  DEFAULT_NAV,
  TAIL_NAV,
} from './cabinet.constants';

const CHAT_HREFS = new Set(['/cabinet/chats', '/cabinet/messages']);

function CabinetShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isClient = user?.role === 'client';
  const unreadChats = useUnreadChatsCount();

  const baseNav = user?.role === 'performer' ? PERFORMER_NAV : isClient ? CLIENT_NAV : DEFAULT_NAV;
  const nav: NavItem[] = [
    ...BASE_NAV,
    ...baseNav.map((item) => (CHAT_HREFS.has(item.href) ? { ...item, badge: unreadChats } : item)),
    ...TAIL_NAV,
  ];

  return (
    <SidebarShell
      nav={nav}
      rootHref="/cabinet"
      storageKey={SIDEBAR_COLLAPSED_KEY}
      headerLinks={[...CABINET_HEADER_LINKS]}
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
