import { ROUTES } from "@/lib/routes";

export const NAV_LINKS = [
    { href: ROUTES.HOME_ABOUT, label: 'О нас' },
    { href: ROUTES.CATALOG, label: 'Каталог' },
    { href: ROUTES.CONTACTS, label: 'Контакты' },
    { href: ROUTES.SUPPORT, label: 'Помощь' },
] as const;


export const LEGAL_DOCS = [
    { file: 'Оферта LuxEscortia.pdf', label: 'Публичная оферта' },
    { file: 'Политика конфиденциальности LuxEscortia.pdf', label: 'Политика обработки персональных данных' },
    { file: 'Персональные данные LuxEscortia.pdf', label: 'Согласие на обработку персональных данных' },
] as const;
