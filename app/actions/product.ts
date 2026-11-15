"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { API_URL, type Product } from "@/lib/api";
import { authFetch } from "@/lib/session";

export type UpdateQuantityResult = { error?: string; quantity?: number };

const MAX_QUANTITY = 2_147_483_647; // int32 на бэкенде

/**
 * Меняет остаток товара. PUT /products/{id} заменяет все поля,
 * поэтому сначала берём актуальные название и цену.
 */
export async function updateProductQuantity(
  productId: unknown,
  quantity: unknown,
): Promise<UpdateQuantityResult> {
  if (typeof productId !== "number" || !Number.isInteger(productId)) {
    return { error: "Некорректный запрос" };
  }
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
    return { error: "Введите целое число от 0" };
  }
  if (quantity > MAX_QUANTITY) return { error: "Слишком большое число" };

  let current: Product;
  try {
    const res = await fetch(`${API_URL}/products/${productId}`, { cache: "no-store" });
    if (res.status === 404) {
      refresh();
      return { error: "Товар удалён" };
    }
    if (!res.ok) return { error: "Не удалось загрузить товар" };
    current = (await res.json()) as Product;
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  let res: Response | null;
  try {
    res = await authFetch(`/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current.name, price: current.price, quantity }),
    });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect("/login?next=/stock");
  if (res.ok) {
    refresh();
    return { quantity: ((await res.json()) as Product).quantity };
  }
  if (res.status === 403) return { error: "Менять остатки может только склад" };
  if (res.status === 404) {
    refresh();
    return { error: "Товар удалён" };
  }
  if (res.status === 400) return { error: "Бэкенд не принял значение" };
  return { error: "Не удалось сохранить, попробуйте позже" };
}
