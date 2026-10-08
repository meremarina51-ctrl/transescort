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
import { getSiteLink } from '@/lib/site-nav.constants';
import { ROUTES } from '@/lib/routes';

type Translate = (key: string) => string;

export const SIDEBAR_COLLAPSED_KEY = 'cabinet-sidebar-collapsed';

/** Overview page tiles — one set per role, mirroring that role's sidebar nav (+ Настройки) so nothing on /cabinet is missing a shortcut. */
export const getPerformerOverviewTiles = (tNav: Translate, tDesc: Translate) => [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: tNav('profile'), description: tDesc('profile') },
  { href: ROUTES.CABINET_LISTING, icon: FileText, title: tNav('listing'), description: tDesc('listing') },
  { href: ROUTES.CABINET_PHOTOS, icon: ImageIcon, title: tNav('photos'), description: tDesc('photos') },
  { href: ROUTES.CABINET_REVIEWS, icon: Star, title: tNav('reviews'), description: tDesc('reviewsPerformer') },
  { href: ROUTES.CABINET_STATS, icon: BarChart3, title: tNav('stats'), description: tDesc('stats') },
  { href: ROUTES.CABINET_CHATS, icon: MessageSquare, title: tNav('chats'), description: tDesc('chatsPerformer') },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: tNav('settings'), description: tDesc('settings') },
] as const;

export const getClientOverviewTiles = (tNav: Translate, tDesc: Translate) => [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: tNav('profile'), description: tDesc('profile') },
  { href: ROUTES.CABINET_FAVORITES, icon: Heart, title: tNav('favorites'), description: tDesc('favorites') },
  { href: ROUTES.CABINET_REVIEWS, icon: Star, title: tNav('myReviews'), description: tDesc('reviewsClient') },
  { href: ROUTES.CABINET_MESSAGES, icon: MessageSquare, title: tNav('chats'), description: tDesc('chatsClient') },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: tNav('settings'), description: tDesc('settings') },
] as const;

/** Fallback for any account that's neither performer nor client (e.g. an admin visiting /cabinet directly). */
export const getDefaultOverviewTiles = (tNav: Translate, tDesc: Translate) => [
  { href: ROUTES.CABINET_PROFILE, icon: User, title: tNav('profile'), description: tDesc('profile') },
  { href: ROUTES.CABINET_MESSAGES, icon: MessageSquare, title: tNav('chats'), description: tDesc('chatsDefault') },
  { href: ROUTES.CABINET_SETTINGS, icon: Settings, title: tNav('settings'), description: tDesc('settings') },
] as const;

export const getBaseNav = (t: Translate) => [{ href: ROUTES.CABINET, label: t('overview'), icon: Home }] as const;

export const getPerformerNav = (t: Translate) => [
  { href: ROUTES.CABINET_PROFILE, label: t('profile'), icon: User },
  { href: ROUTES.CABINET_LISTING, label: t('listing'), icon: FileText },
  { href: ROUTES.CABINET_PHOTOS, label: t('photos'), icon: ImageIcon },
  { href: ROUTES.CABINET_REVIEWS, label: t('reviews'), icon: Star },
  { href: ROUTES.CABINET_STATS, label: t('stats'), icon: BarChart3 },
  { href: ROUTES.CABINET_CHATS, label: t('chats'), icon: MessageSquare },
  // { href: ROUTES.CABINET_TARIFF, label: t('tariff'), icon: CreditCard },
] as const;

export const getClientNav = (t: Translate) => [
  { href: ROUTES.CABINET_PROFILE, label: t('profile'), icon: User },
  { href: ROUTES.CABINET_FAVORITES, label: t('favorites'), icon: Heart },
  { href: ROUTES.CABINET_REVIEWS, label: t('myReviews'), icon: Star },
  { href: ROUTES.CABINET_MESSAGES, label: t('chats'), icon: MessageSquare },
] as const;

export const getDefaultNav = (t: Translate) => [
  { href: ROUTES.CABINET_PROFILE, label: t('profile'), icon: User },
  { href: ROUTES.CABINET_MESSAGES, label: t('chats'), icon: MessageSquare },
] as const;

export const getTailNav = (t: Translate) => [{ href: ROUTES.CABINET_SETTINGS, label: t('settings'), icon: Settings }] as const;

/** Quick links shown in the header instead of the sidebar, for the client role. */
export const getClientHeaderLinks = (t: Translate, tSidebar: Translate) => [{ href: ROUTES.CATALOG, label: t('catalog'), icon: LayoutGrid }, getSiteLink(tSidebar)] as const;

/** Same header links plus a shortcut to the public Помощь page — cabinet-only, not shown in the admin header. */
export const getCabinetHeaderLinks = (t: Translate, tSidebar: Translate) => [
  ...getClientHeaderLinks(t, tSidebar),
  { href: ROUTES.SUPPORT, label: t('help'), icon: HelpCircle },
] as const;
