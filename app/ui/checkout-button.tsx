"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/order";

export function CheckoutButton({ disabledReason }: { disabledReason?: string }) {
  const [state, action, pending] = useActionState<CheckoutState>(placeOrder, {});
  const message = state.error ?? disabledReason;

  return (
    <form action={action} className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="submit"
        disabled={pending || !!disabledReason}
        className="h-11 rounded-lg bg-zinc-900 px-6 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Оформляем…" : "Оформить заказ"}
      </button>
      {message && (
        <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400 sm:text-right">
          {message}
        </p>
      )}
    </form>
  );
}
