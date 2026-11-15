"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/order";
import { addressLine, MAX_ADDRESSES, type Address } from "@/lib/api";
import { NewAddress } from "@/app/ui/new-address";

/**
 * Выбор адреса доставки и кнопка «Оформить заказ».
 * `addresses === null` — гость: адрес он выберет после входа.
 */
export function CheckoutButton({
  addresses,
  disabledReason,
}: {
  addresses: Address[] | null;
  disabledReason?: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    {},
  );
  const activeId = addresses?.find((a) => a.active)?.id ?? addresses?.[0]?.id;
  const [chosen, setChosen] = useState(activeId);
  // выбранный адрес удалили (например, в другой вкладке) — возвращаемся к активному
  const selected = addresses?.some((a) => a.id === chosen) ? chosen : activeId;

  const noAddress = addresses !== null && addresses.length === 0;
  const reason =
    disabledReason ??
    (noAddress ? "Добавьте адрес, куда привезти заказ" : undefined);
  const message = state.error ?? reason;

  return (
    <div className="flex flex-col gap-4">
      {addresses === null ? (
        <p className="text-sm text-zinc-500">
          Адрес доставки вы выберете после входа.
        </p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Куда доставить
          </legend>
          {addresses.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                selected === a.id
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                  : "border-black/10 hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-zinc-900"
              }`}
            >
              <input
                type="radio"
                name="delivery"
                checked={selected === a.id}
                onChange={() => setChosen(a.id)}
                className="mt-1 accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.recipient_name}</span>
                  {a.active && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                      Активный
                    </span>
                  )}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {a.postal_code}, {a.city}, {addressLine(a)}
                </span>
                {a.courier_note && (
                  <span className="text-zinc-500">
                    Курьеру: {a.courier_note}
                  </span>
                )}
              </span>
            </label>
          ))}
          {addresses.length < MAX_ADDRESSES && (
            <NewAddress first={addresses.length === 0} />
          )}
        </fieldset>
      )}

      <form
        action={action}
        className="flex flex-col items-stretch gap-2 sm:items-end"
      >
        <input type="hidden" name="address_id" value={selected ?? ""} />
        <button
          type="submit"
          disabled={pending || !!reason}
          className="h-11 rounded-lg bg-zinc-900 px-6 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Оформляем…" : "Оформить заказ"}
        </button>
        {message && (
          <p
            aria-live="polite"
            className="text-sm text-red-600 dark:text-red-400 sm:text-right"
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
