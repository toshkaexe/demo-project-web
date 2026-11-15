export const API_URL = process.env.LAVKA_API_URL ?? "http://localhost:8080";

/**
 * Ставить ли cookie флаг Secure (только HTTPS). По умолчанию — в production.
 * Для production-сборки по http (например, в Docker на localhost) — COOKIE_SECURE=false.
 */
export const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 дней

export type TokenPair = { access_token: string; refresh_token: string };

export type ApiError = {
  status?: number;
  error?: string;
  message?: string;
};

export type User = {
  id: number;
  email: string;
  role: "CUSTOMER" | "WAREHOUSE";
  created_at: string;
  updated_at: string;
};

export async function readError(res: Response): Promise<ApiError> {
  try {
    return (await res.json()) as ApiError;
  } catch {
    return { status: res.status };
  }
}

export type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

export const ORDER_STATUSES = ["CREATED", "PROCESSING", "READY", "COMPLETED", "CANCELLED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Проверка во время выполнения: тип OrderStatus существует только для TypeScript. */
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export type OrderItem = {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  amount: number;
};

export type Order = {
  id: number;
  user_id: number;
  user_email: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  created_at: string;
  completed_at: string | null;
  /** Копия адреса на момент заказа; null только у заказов, оформленных до появления адресов. */
  delivery_address: DeliveryAddress | null;
};

export type DeliveryAddress = Pick<
  Address,
  "recipient_name" | "postal_code" | "country" | "city" | "street" | "house" | "apartment" | "courier_note"
>;

export type OrderStatusHistoryEntry = {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_at: string;
  changed_by: number | null;
};

/** Поля адреса доставки в том виде, в каком их принимает и отдаёт API. */
export const ADDRESS_FIELDS = [
  { name: "recipient_name", label: "Получатель", max: 200, required: true, placeholder: "Имя и фамилия" },
  { name: "country", label: "Страна", max: 100, required: true, placeholder: "Россия" },
  { name: "city", label: "Город", max: 100, required: true, placeholder: "Москва" },
  { name: "postal_code", label: "Индекс", max: 20, required: true, placeholder: "101000" },
  { name: "street", label: "Улица", max: 300, required: true, placeholder: "Тверская" },
  { name: "house", label: "Дом", max: 20, required: true, placeholder: "12к2" },
  { name: "apartment", label: "Квартира", max: 20, required: false, placeholder: "Нет — частный дом" },
  { name: "courier_note", label: "Комментарий курьеру", max: 500, required: false, placeholder: "Подъезд, этаж, домофон" },
] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number]["name"];

export type AddressInput = Record<AddressField, string>;

export type Address = {
  id: number;
  postal_code: string;
  country: string;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  recipient_name: string;
  courier_note: string | null;
  /** Активный адрес выбран по умолчанию при оформлении заказа. Он у пользователя ровно один. */
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** «Тверская, д. 12к2, кв. 45» */
export function addressLine(a: DeliveryAddress): string {
  return [`${a.street}, д. ${a.house}`, a.apartment && `кв. ${a.apartment}`].filter(Boolean).join(", ");
}

/** Столько адресов бэкенд разрешает одному пользователю. */
export const MAX_ADDRESSES = 10;
