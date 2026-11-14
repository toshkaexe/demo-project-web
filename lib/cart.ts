import { cookies } from "next/headers";

export const CART_COOKIE = "cart";
export const MAX_ITEM_QUANTITY = 1000; // лимит POST /orders
export const MAX_CART_ITEMS = 100; // лимит POST /orders

/** productId -> количество */
export type Cart = Record<number, number>;

export async function readCart(): Promise<Cart> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const cart: Cart = {};
    for (const [id, qty] of Object.entries(parsed)) {
      const productId = Number(id);
      if (Number.isInteger(productId) && Number.isInteger(qty) && qty > 0) {
        cart[productId] = Math.min(qty, MAX_ITEM_QUANTITY);
      }
    }
    return cart;
  } catch {
    return {};
  }
}

export function cartCount(cart: Cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}
