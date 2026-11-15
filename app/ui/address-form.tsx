"use client";

import { useActionState } from "react";
import { saveAddress, type AddressFormState } from "@/app/actions/address";
import { ADDRESS_FIELDS, type Address } from "@/lib/api";

const input =
  "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-900 dark:focus:ring-white/10";

/** Форма адреса: без `address` — новый, с ним — изменение существующего. */
export function AddressForm({
  address,
  onDone,
  onCancel,
}: {
  address?: Address;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState<AddressFormState, FormData>(
    async (prev, formData) => {
      const result = await saveAddress(prev, formData);
      if (result.savedAt) onDone?.();
      return result;
    },
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {ADDRESS_FIELDS.map((field) => {
          const error = state.fieldErrors?.[field.name];
          const id = `${address?.id ?? "new"}-${field.name}`;
          const wide =
            field.name === "recipient_name" ||
            field.name === "street" ||
            field.name === "courier_note";
          return (
            <label
              key={field.name}
              htmlFor={id}
              className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {field.label}
                {!field.required && (
                  <span className="font-normal text-zinc-400">
                    {" "}
                    · необязательно
                  </span>
                )}
              </span>
              <input
                id={id}
                name={field.name}
                maxLength={field.max}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={
                  state.values?.[field.name] ?? address?.[field.name] ?? ""
                }
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`${input} ${error ? "border-red-500" : "border-black/10 dark:border-white/15"}`}
              />
              {error && (
                <span
                  id={`${id}-error`}
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  {error}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Сохраняем…" : address ? "Сохранить" : "Добавить адрес"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="h-10 rounded-lg border border-black/10 px-4 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-zinc-900"
          >
            Отмена
          </button>
        )}
        {state.error && (
          <p
            aria-live="polite"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
