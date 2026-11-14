"use client";

import { useEffect, useState, useTransition } from "react";
import { getOrderHistory, type HistoryResult } from "@/app/actions/order-history";
import type { OrderStatus } from "@/lib/api";
import { STATUS } from "@/lib/order-status";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = {
  orderId: number;
  customerId: number;
  status: OrderStatus;
  /** смотрит сам покупатель — его изменения подписываем «вы» */
  ownOrder?: boolean;
};

export function OrderHistory({ orderId, customerId, status, ownOrder }: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<HistoryResult>();
  const [pending, startTransition] = useTransition();

  // загружаем при открытии и заново после смены статуса
  useEffect(() => {
    if (!open) return;
    startTransition(async () => setResult(await getOrderHistory(orderId)));
  }, [open, orderId, status]);

  const who = (id: number | null) =>
    id === null ? "система" : id === customerId ? (ownOrder ? "вы" : "покупатель") : "склад";

  return (
    <div className="border-t border-black/5 px-5 py-2 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {open ? "Скрыть историю" : "История статусов"}
      </button>

      {open && (
        <div className="pb-2 pt-3 text-sm">
          {result?.error ? (
            <p className="text-red-600 dark:text-red-400">{result.error}</p>
          ) : !result ? (
            <p className="text-zinc-500">Загрузка…</p>
          ) : (
            <ol className={`flex flex-col gap-2 ${pending ? "opacity-60" : ""}`}>
              {result.entries?.map((e, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="w-36 shrink-0 tabular-nums text-zinc-500">
                    {dateFormat.format(new Date(e.changed_at))}
                  </span>
                  <span>
                    {e.from_status ? (
                      <>
                        {STATUS[e.from_status]?.label ?? e.from_status} →{" "}
                        <b className="font-medium">{STATUS[e.to_status]?.label ?? e.to_status}</b>
                      </>
                    ) : (
                      <b className="font-medium">{STATUS[e.to_status]?.label ?? e.to_status}</b>
                    )}
                  </span>
                  <span className="text-zinc-500">· {who(e.changed_by)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
