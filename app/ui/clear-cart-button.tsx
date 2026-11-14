"use client";

import { useTransition } from "react";
import { clearCart } from "@/app/actions/cart";

export function ClearCartButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => clearCart())}
      className="text-sm font-medium text-zinc-500 hover:text-red-600 disabled:opacity-50"
    >
      Очистить корзину
    </button>
  );
}
