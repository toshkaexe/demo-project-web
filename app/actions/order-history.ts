"use server";

import type { OrderStatusHistoryEntry } from "@/lib/api";
import { authFetch } from "@/lib/session";

export type HistoryResult = { entries?: OrderStatusHistoryEntry[]; error?: string };

export async function getOrderHistory(orderId: number): Promise<HistoryResult> {
  if (!Number.isInteger(orderId)) return { error: "Некорректный запрос" };
  try {
    const res = await authFetch(`/orders/${orderId}/history`);
    if (!res) return { error: "Сессия закончилась, войдите снова" };
    if (res.status === 404) return { error: "Заказ не найден" };
    if (!res.ok) return { error: "Не удалось загрузить историю" };
    return { entries: (await res.json()) as OrderStatusHistoryEntry[] };
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }
}
