import { LayoutDashboard, ShieldCheck, Users, UserCog, Settings } from 'lucide-react';
import type { NavItem } from '@/components/SidebarShell';
import { ROUTES } from '@/lib/routes';

export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export const ADMIN_NAV: NavItem[] = [
  { href: ROUTES.ADMIN, label: 'Обзор', icon: LayoutDashboard },
  { href: ROUTES.ADMIN_MODERATION, label: 'Модерация', icon: ShieldCheck },
  { href: ROUTES.ADMIN_PERFORMERS, label: 'Исполнители', icon: Users },
  { href: ROUTES.ADMIN_USERS, label: 'Пользователи', icon: UserCog },
  { href: ROUTES.ADMIN_SETTINGS, label: 'Настройки', icon: Settings },
];
