"use client";

import { useTransition } from "react";
import { setCartQuantity } from "@/app/actions/cart";

type Props = {
  productId: number;
  inCart: number;
  /** сколько можно положить (остаток на складе), не показывается */
  max: number;
};

const btn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-lg font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:bg-zinc-900";

export function CartControls({ productId, inCart, max }: Props) {
  const [pending, startTransition] = useTransition();
  const set = (qty: number) =>
    startTransition(() => setCartQuantity(productId, qty));

  if (inCart === 0) {
    return (
      <button
        type="button"
        onClick={() => set(1)}
        disabled={pending || max <= 0}
        className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        В корзину
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      <button
        type="button"
        onClick={() => set(inCart - 1)}
        disabled={pending}
        className={btn}
        aria-label="Убрать одну штуку"
      >
        −
      </button>
      <span className="w-8 text-center font-medium tabular-nums">{inCart}</span>
      <button
        type="button"
        onClick={() => set(inCart + 1)}
        disabled={pending || inCart >= max}
        className={btn}
        aria-label="Добавить ещё одну"
      >
        +
      </button>
    </div>
  );
}
