/** "5000" -> "5 000 ₽" — thousands-grouped, no kopecks (prices are always whole rubles). */
export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
}
