"use client";

import { useState, useTransition } from "react";
import { changeOrderStatus } from "@/app/actions/order-status";
import type { OrderStatus } from "@/lib/api";
import { ACTION_LABEL } from "@/lib/order-status";

type Props = { orderId: number; next: OrderStatus[] };

export function OrderStatusActions({ orderId, next }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  if (next.length === 0) return null;

  const change = (to: OrderStatus) => {
    if (to === "CANCELLED" && !confirm(`Отменить заказ №${orderId}? Товары вернутся на склад.`)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, to);
      setError(result.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      {next.map((to) =>
        to === "CANCELLED" ? (
          <button
            key={to}
            type="button"
            disabled={pending}
            onClick={() => change(to)}
            className="h-9 rounded-lg px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            {ACTION_LABEL[to]}
          </button>
        ) : (
          <button
            key={to}
            type="button"
            disabled={pending}
            onClick={() => change(to)}
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "…" : ACTION_LABEL[to]}
          </button>
        ),
      )}
    </div>
  );
}
