import { Home, User, Settings, FileText, BarChart3, CreditCard, type LucideIcon } from 'lucide-react';

export const OVERVIEW_TILES = [
  {
    href: '/cabinet/profile',
    icon: User,
    title: 'Профиль',
    description: 'Имя, логин и данные аккаунта',
  },
  {
    href: '/cabinet/settings',
    icon: Settings,
    title: 'Настройки',
    description: 'Сессия и выход из аккаунта',
  },
] as const;

export const SIDEBAR_COLLAPSED_KEY = 'cabinet-sidebar-collapsed';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const BASE_NAV = [{ href: '/cabinet', label: 'Обзор', icon: Home }] as const;

export const PERFORMER_NAV = [
  { href: '/cabinet/listing', label: 'Моя анкета', icon: FileText },
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/stats', label: 'Статистика', icon: BarChart3 },
  { href: '/cabinet/tariff', label: 'Тариф', icon: CreditCard },
] as const;

export const DEFAULT_NAV = [{ href: '/cabinet/profile', label: 'Профиль', icon: User }] as const;

export const TAIL_NAV = [{ href: '/cabinet/settings', label: 'Настройки', icon: Settings }] as const;
