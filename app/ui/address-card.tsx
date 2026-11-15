"use client";

import { useState, useTransition } from "react";
import { deleteAddress, setActiveAddress } from "@/app/actions/address";
import { addressLine, type Address } from "@/lib/api";
import { AddressForm } from "@/app/ui/address-form";

const ghost =
  "h-9 rounded-lg border border-black/10 px-3 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-zinc-900";

export function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <AddressForm
        address={address}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const run = (action: () => Promise<{ error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  };

  const remove = () => {
    const question = address.active
      ? "Удалить активный адрес? Активным станет самый старый из оставшихся."
      : "Удалить этот адрес?";
    if (confirm(question)) run(() => deleteAddress(address.id));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {address.recipient_name}
          </span>
          {address.active && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              Активный
            </span>
          )}
        </span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {addressLine(address)}
        </span>
        <span className="text-zinc-500">
          {address.postal_code}, {address.city}, {address.country}
        </span>
        {address.courier_note && (
          <span className="mt-1 text-zinc-500">
            Курьеру: {address.courier_note}
          </span>
        )}
        {error && (
          <span className="mt-1 text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {!address.active && (
          <button
            type="button"
            className={ghost}
            onClick={() => run(() => setActiveAddress(address.id))}
            disabled={pending}
          >
            Сделать активным
          </button>
        )}
        <button
          type="button"
          className={ghost}
          onClick={() => setEditing(true)}
          disabled={pending}
        >
          Изменить
        </button>
        <button
          type="button"
          className={`${ghost} text-red-600 dark:text-red-400`}
          onClick={remove}
          disabled={pending}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
