import { BadgeCheck, Lock, Smartphone } from "lucide-react";

type Translate = (key: string) => string;

export const getFeatures = (t: Translate) => [
    {
        Icon: Lock,
        title: t('privacyTitle'),
        text: t('privacyText'),
    },
    {
        Icon: BadgeCheck,
        title: t('verificationTitle'),
        text: t('verificationText'),
    },
    {
        Icon: Smartphone,
        title: t('platformTitle'),
        text: t('platformText'),
    },
];

export const getMockReviews = (t: { raw: (key: string) => { name: string; text: string }[] }) => {
    const items = t.raw('items');
    const dates = ['2026-06-02', '2026-05-18', '2026-05-03', '2026-04-20'];
    const ratings = [5, 5, 4, 5];
    return items.map((item, i) => ({
        id: String(i + 1),
        name: item.name,
        date: dates[i],
        rating: ratings[i],
        text: item.text,
    }));
};

export const MOCK_TARIFFS = [
    {
        id: 'basic',
        name: 'Базовый',
        price: 'Бесплатно',
        features: ['Одна анкета в каталоге', 'Базовая статистика просмотров', 'Стандартная поддержка'],
    },
    {
        id: 'premium',
        name: 'Премиум',
        price: '15 000 ₽',
        features: ['Приоритет в каталоге', 'Расширенная статистика', 'Значок верификации'],
    },
    {
        id: 'elite',
        name: 'Элит',
        price: '40 000 ₽',
        features: ['Топ каталога', 'Персональный менеджер', 'Максимальная видимость анкеты'],
    },
];
