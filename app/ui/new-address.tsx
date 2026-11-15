"use client";

import { useState } from "react";
import { AddressForm } from "@/app/ui/address-form";

/** Кнопка «Добавить адрес», которая раскрывается в форму. Первый адрес — сразу форма. */
export function NewAddress({ first }: { first: boolean }) {
  const [open, setOpen] = useState(first);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 self-start rounded-lg border border-dashed border-black/20 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        + Добавить адрес
      </button>
    );
  }

  return (
    <AddressForm
      onDone={() => setOpen(false)}
      onCancel={first ? undefined : () => setOpen(false)}
    />
  );
}
