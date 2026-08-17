import {
  Home,
  User,
  Settings,
  FileText,
  BarChart3,
  LayoutGrid,
  Heart,
  HelpCircle,
  MessageSquare,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import { SITE_LINK } from '@/lib/site-nav.constants';

/** Overview page tiles — one set per role, mirroring that role's sidebar nav (+ Настройки) so nothing on /cabinet is missing a shortcut. */
export const PERFORMER_OVERVIEW_TILES = [
  { href: '/cabinet/profile', icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: '/cabinet/listing', icon: FileText, title: 'Моя анкета', description: 'Данные анкеты, цены и статус проверки' },
  { href: '/cabinet/photos', icon: ImageIcon, title: 'Фото и видео', description: 'Фото, видео и статус модерации' },
  { href: '/cabinet/reviews', icon: Star, title: 'Отзывы', description: 'Отзывы клиентов о вас' },
  { href: '/cabinet/stats', icon: BarChart3, title: 'Статистика', description: 'Просмотры, избранное и обращения' },
  { href: '/cabinet/chats', icon: MessageSquare, title: 'Чаты', description: 'Переписка с клиентами' },
  { href: '/cabinet/settings', icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
] as const;

export const CLIENT_OVERVIEW_TILES = [
  { href: '/cabinet/profile', icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: '/cabinet/favorites', icon: Heart, title: 'Избранное', description: 'Сохранённые анкеты' },
  { href: '/cabinet/reviews', icon: Star, title: 'Мои отзывы', description: 'Отзывы, которые вы оставили' },
  { href: '/cabinet/messages', icon: MessageSquare, title: 'Чаты', description: 'Переписка с исполнителями' },
  { href: '/cabinet/settings', icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
] as const;

/** Fallback for any account that's neither performer nor client (e.g. an admin visiting /cabinet directly). */
export const DEFAULT_OVERVIEW_TILES = [
  { href: '/cabinet/profile', icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: '/cabinet/messages', icon: MessageSquare, title: 'Чаты', description: 'Переписка' },
  { href: '/cabinet/settings', icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
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
  // { href: '/cabinet/tariff', label: 'Тариф', icon: CreditCard },
] as const;

export const CLIENT_NAV = [
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/favorites', label: 'Избранное', icon: Heart },
  { href: '/cabinet/reviews', label: 'Мои отзывы', icon: Star },
  { href: '/cabinet/messages', label: 'Чаты', icon: MessageSquare },
] as const;

export const DEFAULT_NAV = [
  { href: '/cabinet/profile', label: 'Профиль', icon: User },
  { href: '/cabinet/messages', label: 'Чаты', icon: MessageSquare },
] as const;

export const TAIL_NAV = [{ href: '/cabinet/settings', label: 'Настройки', icon: Settings }] as const;

/** Quick links shown in the header instead of the sidebar, for the client role. */
export const CLIENT_HEADER_LINKS = [{ href: '/catalog', label: 'Каталог', icon: LayoutGrid }, SITE_LINK] as const;

/** Same header links plus a shortcut to the public Помощь page — cabinet-only, not shown in the admin header. */
export const CABINET_HEADER_LINKS = [
  ...CLIENT_HEADER_LINKS,
  { href: '/support', label: 'Помощь', icon: HelpCircle },
] as const;
