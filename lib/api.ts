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
};

export type OrderStatusHistoryEntry = {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_at: string;
  changed_by: number | null;
};
