export interface MockReview {
  id: string;
  name: string;
  date: string;
  rating: number;
  text: string;
}

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: '1',
    name: 'Игорь',
    date: '2026-06-02',
    rating: 5,
    text: 'Всё прошло чётко: анкета совпала с реальностью, общение через платформу — без лишних вопросов.',
  },
  {
    id: '2',
    name: 'Дмитрий',
    date: '2026-05-18',
    rating: 5,
    text: 'Понравилась верификация анкет — сразу видно, что это не фейк. Буду пользоваться дальше.',
  },
  {
    id: '3',
    name: 'Сергей',
    date: '2026-05-03',
    rating: 4,
    text: 'Удобный интерфейс, быстро нашёл подходящую анкету по фильтрам. Из минусов — хотелось бы больше городов.',
  },
  {
    id: '4',
    name: 'Александр',
    date: '2026-04-20',
    rating: 5,
    text: 'Приватность на высоте: никаких лишних данных не спрашивают, оплата контакта прошла мгновенно.',
  },
];

export interface MockTariff {
  id: string;
  name: string;
  price: string;
  features: string[];
}

export const MOCK_TARIFFS: MockTariff[] = [
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
