"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readError, type Product } from "@/lib/api";
import { CART_COOKIE, readCart } from "@/lib/cart";
import { authFetch } from "@/lib/session";

export type CheckoutState = { error?: string };

type CreatedOrder = { id: number };

/** Оформляет заказ из корзины на выбранный адрес (`address_id` из формы). */
export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const rawAddress = formData.get("address_id");
  const addressId =
    typeof rawAddress === "string" && rawAddress !== ""
      ? Number(rawAddress)
      : null;
  if (addressId !== null && !(Number.isInteger(addressId) && addressId > 0)) {
    return { error: "Некорректный адрес доставки" };
  }

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
      // без address_id бэкенд берёт активный адрес
      body: JSON.stringify({ items, address_id: addressId }),
    });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect("/login?next=/basket"); // не вошёл или сессия закончилась

  if (res.status === 201) {
    const order = (await res.json()) as CreatedOrder;
    (await cookies()).delete(CART_COOKIE);
    redirect(`/basket?order=${order.id}`);
  }

  const err = await readError(res);

  if (res.status === 400 && /no delivery address/i.test(err.message ?? "")) {
    return { error: "Добавьте адрес доставки" };
  }
  if (res.status === 400 && /^address/i.test(err.message ?? "")) {
    refresh();
    return { error: "Этого адреса больше нет, выберите другой" };
  }
  const productId = Number(err.message?.match(/product (\d+)/i)?.[1]);
  const name = productId ? await productName(productId) : null;
  const what = name ? `«${name}»` : "одного из товаров";

  if (res.status === 409) {
    return {
      error: `Недостаточно ${what} на складе. Уменьшите количество в корзине.`,
    };
  }
  if (res.status === 400 && /not found/i.test(err.message ?? "")) {
    return {
      error: "Один из товаров больше не продаётся. Уберите его из корзины.",
    };
  }
  if (res.status === 400)
    return { error: "Не удалось оформить заказ: проверьте корзину" };
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
