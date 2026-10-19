export const TYPE_OPTIONS = ['Активный', 'Универсал', 'Пассивный'];
export const FIGURE_OPTIONS = ['Стройная', 'Спортивная', 'Худощавая', 'Пышная', 'Модельная'];
export const TEMPERAMENT_OPTIONS = ['Нежная', 'Страстная', 'Доминантная', 'Игривая', 'Спокойная'];
export const HAIR_COLOR_OPTIONS = ['Блондинка', 'Брюнетка', 'Шатенка', 'Рыжая', 'Другой'];
export const EYE_COLOR_OPTIONS = ['Голубые', 'Зелёные', 'Карие', 'Серые', 'Чёрные'];
export const COUNTRY_OPTIONS = ['Россия', 'Беларусь', 'Украина', 'Казахстан', 'ОАЭ', 'Другая'];
export const CITY_OPTIONS = ['Москва', 'Балашиха', 'Люберцы', 'Одинцово', 'Химки', 'Мытищи', 'Подольск', 'Дубай', 'Абу-Даби', 'Другой'];

const GEO_LABELS_EN: Record<string, string> = {
  Россия: 'Russia',
  Беларусь: 'Belarus',
  Украина: 'Ukraine',
  Казахстан: 'Kazakhstan',
  ОАЭ: 'UAE',
  Другая: 'Other',
  Москва: 'Moscow',
  Балашиха: 'Balashikha',
  Люберцы: 'Lyubertsy',
  Одинцово: 'Odintsovo',
  Химки: 'Khimki',
  Мытищи: 'Mytishchi',
  Подольск: 'Podolsk',
  Дубай: 'Dubai',
  'Абу-Даби': 'Abu Dhabi',
  Другой: 'Other',
};

// Country/city values are stored in Russian; translate them for display only.
export const geoLabel = (value: string, locale: string) =>
  locale === 'en' ? (GEO_LABELS_EN[value] ?? value) : value;

export const toSelectOptions = (values: string[], label: (v: string) => string = (v) => v) =>
  values.map((v) => ({ value: v, label: label(v) }));
