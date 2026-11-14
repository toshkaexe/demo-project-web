const priceFormat = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});

export function formatPrice(value: number) {
  return priceFormat.format(value);
}
