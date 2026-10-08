import { ROUTES } from "@/lib/routes";

type Translate = (key: string) => string;

export const getNavLinks = (t: Translate) => [
    { href: ROUTES.HOME_ABOUT, label: t('about') },
    { href: ROUTES.CATALOG, label: t('catalog') },
    { href: ROUTES.CONTACTS, label: t('contacts') },
    { href: ROUTES.SUPPORT, label: t('support') },
] as const;

export const getLegalDocs = (t: Translate) => [
    { file: 'Оферта LuxEscortia.pdf', label: t('offer') },
    { file: 'Политика конфиденциальности LuxEscortia.pdf', label: t('privacyPolicy') },
    { file: 'Персональные данные LuxEscortia.pdf', label: t('personalDataConsent') },
] as const;
