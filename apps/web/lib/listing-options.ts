export const TYPE_OPTIONS = ['Активный', 'Универсал', 'Пассивный'];
export const FIGURE_OPTIONS = ['Стройная', 'Спортивная', 'Худощавая', 'Пышная', 'Модельная'];
export const TEMPERAMENT_OPTIONS = ['Нежная', 'Страстная', 'Доминантная', 'Игривая', 'Спокойная'];
export const HAIR_COLOR_OPTIONS = ['Блондинка', 'Брюнетка', 'Шатенка', 'Рыжая', 'Другой'];
export const EYE_COLOR_OPTIONS = ['Голубые', 'Зелёные', 'Карие', 'Серые', 'Чёрные'];
export const COUNTRY_OPTIONS = ['Россия', 'Беларусь', 'Украина', 'Казахстан', 'Другая'];
export const CITY_OPTIONS = ['Москва', 'Балашиха', 'Люберцы', 'Одинцово', 'Химки', 'Мытищи', 'Подольск', 'Другой'];

export const toSelectOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));
