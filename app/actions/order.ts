"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readError, type Product } from "@/lib/api";
import { CART_COOKIE, readCart } from "@/lib/cart";
import { authFetch } from "@/lib/session";

export type CheckoutState = { error?: string };

type CreatedOrder = { id: number };

export async function placeOrder(): Promise<CheckoutState> {
  const cart = await readCart();
  const items = Object.entries(cart).map(([id, quantity]) => ({
    product_id: Number(id),
    quantity,
  }));
  if (items.length === 0) return { error: "Корзина пуста" };

  let res: Response | null;
  try {
    res = await authFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect("/?next=/basket"); // не вошёл или сессия закончилась

  if (res.status === 201) {
    const order = (await res.json()) as CreatedOrder;
    (await cookies()).delete(CART_COOKIE);
    redirect(`/basket?order=${order.id}`);
  }

  const err = await readError(res);
  const productId = Number(err.message?.match(/product (\d+)/i)?.[1]);
  const name = productId ? await productName(productId) : null;
  const what = name ? `«${name}»` : "одного из товаров";

  if (res.status === 409) {
    return { error: `Недостаточно ${what} на складе. Уменьшите количество в корзине.` };
  }
  if (res.status === 400 && /not found/i.test(err.message ?? "")) {
    return { error: "Один из товаров больше не продаётся. Уберите его из корзины." };
  }
  if (res.status === 400) return { error: "Не удалось оформить заказ: проверьте корзину" };
  return { error: "Что-то пошло не так, попробуйте позже" };
}

async function productName(id: number): Promise<string | null> {
  try {
    const res = await authFetch(`/products/${id}`);
    return res?.ok ? ((await res.json()) as Product).name : null;
  } catch {
    return null;
  }
}
