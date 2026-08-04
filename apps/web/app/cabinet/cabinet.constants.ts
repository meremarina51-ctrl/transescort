import {
  Home,
  User,
  Settings,
  FileText,
  BarChart3,
  CreditCard,
  LayoutGrid,
  Heart,
  MessageCircle,
  MessageSquare,
  Image as ImageIcon,
  Star,
  LifeBuoy,
} from 'lucide-react';
import { SITE_LINK } from '@/lib/site-nav.constants';

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

export const BASE_NAV = [{ href: '/cabinet', label: 'Обзор', icon: Home }] as const;

export const PERFORMER_NAV = [
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/listing', label: 'Моя анкета', icon: FileText },
  { href: '/cabinet/photos', label: 'Фото и видео', icon: ImageIcon },
  { href: '/cabinet/reviews', label: 'Отзывы', icon: Star },
  { href: '/cabinet/stats', label: 'Статистика', icon: BarChart3 },
  { href: '/cabinet/chats', label: 'Чаты', icon: MessageSquare },
  { href: '/cabinet/support', label: 'Поддержка', icon: LifeBuoy },
  // { href: '/cabinet/tariff', label: 'Тариф', icon: CreditCard },
] as const;

export const CLIENT_NAV = [
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/favorites', label: 'Избранное', icon: Heart },
  { href: '/cabinet/reviews', label: 'Мои отзывы', icon: Star },
  { href: '/cabinet/messages', label: 'Чаты', icon: MessageSquare },
  { href: '/cabinet/support', label: 'Поддержка', icon: LifeBuoy },
] as const;

export const DEFAULT_NAV = [{ href: '/cabinet/profile', label: 'Профиль', icon: User }] as const;

export const TAIL_NAV = [{ href: '/cabinet/settings', label: 'Настройки', icon: Settings }] as const;

/** Quick links shown in the header instead of the sidebar, for the client role. */
export const CLIENT_HEADER_LINKS = [{ href: '/catalog', label: 'Каталог', icon: LayoutGrid }, SITE_LINK] as const;
