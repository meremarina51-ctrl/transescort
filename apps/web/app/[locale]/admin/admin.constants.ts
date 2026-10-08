import { LayoutDashboard, ShieldCheck, Users, UserCog, Settings } from 'lucide-react';
import type { NavItem } from '@/components/SidebarShell';
import { ROUTES } from '@/lib/routes';

type Translate = (key: string) => string;

export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export const getAdminNav = (t: Translate): NavItem[] => [
  { href: ROUTES.ADMIN, label: t('overview'), icon: LayoutDashboard },
  { href: ROUTES.ADMIN_MODERATION, label: t('moderation'), icon: ShieldCheck },
  { href: ROUTES.ADMIN_PERFORMERS, label: t('performers'), icon: Users },
  { href: ROUTES.ADMIN_USERS, label: t('users'), icon: UserCog },
  { href: ROUTES.ADMIN_SETTINGS, label: t('settings'), icon: Settings },
];
