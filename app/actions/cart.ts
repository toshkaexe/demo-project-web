"use server";

import { cookies } from "next/headers";
import { API_URL, type Product } from "@/lib/api";
import {
  CART_COOKIE,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
  readCart,
  type Cart,
} from "@/lib/cart";

async function writeCart(cart: Cart) {
  const store = await cookies();
  if (Object.keys(cart).length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

/** Ставит количество товара в корзине; 0 — убирает товар. */
export async function setCartQuantity(productId: number, quantity: number) {
  if (!Number.isInteger(productId) || !Number.isInteger(quantity)) return;
  const cart = await readCart();

  if (quantity <= 0) {
    delete cart[productId];
    await writeCart(cart);
    return;
  }

  if (!(productId in cart) && Object.keys(cart).length >= MAX_CART_ITEMS) return;

  // Не даём положить больше, чем есть на складе
  let stock = MAX_ITEM_QUANTITY;
  try {
    const res = await fetch(`${API_URL}/products/${productId}`, { cache: "no-store" });
    if (res.status === 404) {
      delete cart[productId];
      await writeCart(cart);
      return;
    }
    if (res.ok) stock = ((await res.json()) as Product).quantity;
  } catch {
    // бэкенд недоступен — ограничимся общим лимитом
  }

  const next = Math.min(quantity, stock, MAX_ITEM_QUANTITY);
  if (next <= 0) delete cart[productId];
  else cart[productId] = next;
  await writeCart(cart);
}

export async function clearCart() {
  (await cookies()).delete(CART_COOKIE);
}
