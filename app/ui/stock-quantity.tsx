"use client";

import { useState, useTransition } from "react";
import { updateProductQuantity } from "@/app/actions/product";

const btn =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:bg-zinc-900";

export function StockQuantity({ productId, quantity }: { productId: number; quantity: number }) {
  const [value, setValue] = useState(String(quantity));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // остаток изменился на сервере (сохранили или обновили страницу) — показываем свежий
  const [shown, setShown] = useState(quantity);
  if (shown !== quantity) {
    setShown(quantity);
    setValue(String(quantity));
  }

  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;
  const dirty = valid && parsed !== quantity;

  const save = (next: number) => {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProductQuantity(productId, next);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <form
      className="flex flex-col items-end gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty) save(parsed);
      }}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={btn}
          disabled={pending || !valid || parsed <= 0}
          onClick={() => setValue(String(Math.max(0, parsed - 1)))}
          aria-label="Уменьшить"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Остаток, шт."
          aria-invalid={!valid}
          className={`h-8 w-20 rounded-lg border px-2 text-right tabular-nums outline-none focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-900 dark:focus:ring-white/10 ${
            valid ? "border-black/10 dark:border-white/15" : "border-red-500"
          } ${quantity === 0 && !dirty ? "text-red-600 dark:text-red-400" : ""}`}
        />
        <button
          type="button"
          className={btn}
          disabled={pending || !valid}
          onClick={() => setValue(String(parsed + 1))}
          aria-label="Увеличить"
        >
          +
        </button>
        <button
          type="submit"
          disabled={pending || !dirty}
          className="h-8 w-24 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "…" : saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>
      {dirty && !pending && (
        <span className="text-xs text-zinc-500">было {quantity} шт.</span>
      )}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  );
}
