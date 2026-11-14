import type { OrderStatus, User } from "@/lib/api";

/** Куда склад может перевести заказ из каждого статуса (см. PATCH /orders/{id}/status). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Какие переходы доступны роли: покупатель может только отменить (из «Оформлен»). */
export function allowedNextStatuses(status: OrderStatus, role: User["role"]): OrderStatus[] {
  const next = NEXT_STATUSES[status] ?? [];
  return role === "WAREHOUSE" ? next : next.filter((s) => s === "CANCELLED");
}

/** Подпись кнопки для перехода в статус. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  CREATED: "",
  PROCESSING: "Начать сборку",
  READY: "Собран",
  COMPLETED: "Выполнен",
  CANCELLED: "Отменить заказ",
};

/** Подпись и цвет метки статуса. */
export const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  CREATED: { label: "Оформлен", className: "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" },
  PROCESSING: { label: "Собирается", className: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" },
  READY: { label: "Собран", className: "bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" },
  COMPLETED: { label: "Выполнен", className: "bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-200" },
  CANCELLED: { label: "Отменён", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};
