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
import { ROUTES } from '@/lib/routes';

/** Overview page tiles — one set per role, mirroring that role's sidebar nav (+ Настройки) so nothing on /cabinet is missing a shortcut. */
export const PERFORMER_OVERVIEW_TILES = [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: ROUTES.CABINET_LISTING, icon: FileText, title: 'Моя анкета', description: 'Данные анкеты, цены и статус проверки' },
  { href: ROUTES.CABINET_PHOTOS, icon: ImageIcon, title: 'Фото и видео', description: 'Фото, видео и статус модерации' },
  { href: ROUTES.CABINET_REVIEWS, icon: Star, title: 'Отзывы', description: 'Отзывы клиентов о вас' },
  { href: ROUTES.CABINET_STATS, icon: BarChart3, title: 'Статистика', description: 'Просмотры, избранное и обращения' },
  { href: ROUTES.CABINET_CHATS, icon: MessageSquare, title: 'Чаты', description: 'Переписка с клиентами' },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
] as const;

export const CLIENT_OVERVIEW_TILES = [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: ROUTES.CABINET_FAVORITES, icon: Heart, title: 'Избранное', description: 'Сохранённые анкеты' },
  { href: ROUTES.CABINET_REVIEWS, icon: Star, title: 'Мои отзывы', description: 'Отзывы, которые вы оставили' },
  { href: ROUTES.CABINET_MESSAGES, icon: MessageSquare, title: 'Чаты', description: 'Переписка с исполнителями' },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
] as const;

/** Fallback for any account that's neither performer nor client (e.g. an admin visiting /cabinet directly). */
export const DEFAULT_OVERVIEW_TILES = [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: 'Профиль', description: 'Имя, логин и данные аккаунта' },
  { href: ROUTES.CABINET_MESSAGES, icon: MessageSquare, title: 'Чаты', description: 'Переписка' },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: 'Настройки', description: 'Сессия и выход из аккаунта' },
] as const;

export const SIDEBAR_COLLAPSED_KEY = 'cabinet-sidebar-collapsed';

export const BASE_NAV = [{ href: ROUTES.CABINET, label: 'Обзор', icon: Home }] as const;

export const PERFORMER_NAV = [
  { href: ROUTES.CABINET_PROFILE, label: 'Профиль', icon: User },
  { href: ROUTES.CABINET_LISTING, label: 'Моя анкета', icon: FileText },
  { href: ROUTES.CABINET_PHOTOS, label: 'Фото и видео', icon: ImageIcon },
  { href: ROUTES.CABINET_REVIEWS, label: 'Отзывы', icon: Star },
  { href: ROUTES.CABINET_STATS, label: 'Статистика', icon: BarChart3 },
  { href: ROUTES.CABINET_CHATS, label: 'Чаты', icon: MessageSquare },
  // { href: ROUTES.CABINET_TARIFF, label: 'Тариф', icon: CreditCard },
] as const;

export const CLIENT_NAV = [
  { href: ROUTES.CABINET_PROFILE, label: 'Профиль', icon: User },
  { href: ROUTES.CABINET_FAVORITES, label: 'Избранное', icon: Heart },
  { href: ROUTES.CABINET_REVIEWS, label: 'Мои отзывы', icon: Star },
  { href: ROUTES.CABINET_MESSAGES, label: 'Чаты', icon: MessageSquare },
] as const;

export const DEFAULT_NAV = [
  { href: ROUTES.CABINET_PROFILE, label: 'Профиль', icon: User },
  { href: ROUTES.CABINET_MESSAGES, label: 'Чаты', icon: MessageSquare },
] as const;

export const TAIL_NAV = [{ href: ROUTES.CABINET_SETTINGS, label: 'Настройки', icon: Settings }] as const;

/** Quick links shown in the header instead of the sidebar, for the client role. */
export const CLIENT_HEADER_LINKS = [{ href: ROUTES.CATALOG, label: 'Каталог', icon: LayoutGrid }, SITE_LINK] as const;

/** Same header links plus a shortcut to the public Помощь page — cabinet-only, not shown in the admin header. */
export const CABINET_HEADER_LINKS = [
  ...CLIENT_HEADER_LINKS,
  { href: ROUTES.SUPPORT, label: 'Помощь', icon: HelpCircle },
] as const;
