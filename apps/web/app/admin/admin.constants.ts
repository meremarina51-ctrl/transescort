import { LayoutDashboard, ShieldCheck, Users, UserCog } from 'lucide-react';
import type { NavItem } from '@/components/SidebarShell';

export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Обзор', icon: LayoutDashboard },
  { href: '/admin/moderation', label: 'Модерация', icon: ShieldCheck },
  { href: '/admin/performers', label: 'Исполнители', icon: Users },
  { href: '/admin/users', label: 'Пользователи', icon: UserCog },
];
