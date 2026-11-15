"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isOrderStatus } from "@/lib/api";
import { authFetch } from "@/lib/session";

export type StatusChangeResult = { error?: string };

// Аргументы приходят от клиента как есть, поэтому типы здесь — unknown,
// а значения проверяются во время выполнения.
export async function changeOrderStatus(
  orderId: unknown,
  status: unknown,
): Promise<StatusChangeResult> {
  if (typeof orderId !== "number" || !Number.isInteger(orderId) || !isOrderStatus(status)) {
    return { error: "Некорректный запрос" };
  }

  let res: Response | null;
  try {
    res = await authFetch(`/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect("/login?next=/orders");

  if (res.ok) {
    refresh();
    return {};
  }

  // статус уже поменял кто-то другой — покажем актуальный
  if (res.status === 409 || res.status === 404) refresh();
  if (res.status === 409) return { error: "Статус уже изменился, список обновлён" };
  if (res.status === 404) return { error: "Заказ не найден" };
  if (res.status === 403) return { error: "Недостаточно прав" };
  return { error: "Не удалось сменить статус, попробуйте позже" };
}
