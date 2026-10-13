export const CURRENCY_OPTIONS = ['RUB', 'USD', 'EUR', 'AED'] as const;
export type Currency = (typeof CURRENCY_OPTIONS)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  AED: 'AED',
};

/** "5000" -> "5 000 ₽" — thousands-grouped, no fractional part (prices are always whole units). */
export function formatPrice(value: number, currency: Currency = 'RUB'): string {
  const amount = new Intl.NumberFormat('ru-RU').format(value);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return currency === 'USD' ? `${symbol}${amount}` : `${amount} ${symbol}`;
}
