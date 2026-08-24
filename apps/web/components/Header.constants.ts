import { ROUTES } from '@/lib/routes';

export const NAV_LINKS = [
  { href: ROUTES.HOME_ABOUT, label: 'О нас' },
  { href: ROUTES.CATALOG, label: 'Каталог' },
  { href: ROUTES.CONTACTS, label: 'Контакты' },
  { href: ROUTES.SUPPORT, label: 'Помощь' },
] as const;
