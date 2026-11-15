import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, API_URL, type Order } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { currentUser } from "@/lib/user";
import { OrderStatusActions } from "@/app/ui/order-status-actions";
import { OrderHistory } from "@/app/ui/order-history";
import { allowedNextStatuses, STATUS } from "@/lib/order-status";
import Link from "next/link";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function OrdersPage() {
  return (
    <>
      <Suspense
        fallback={
          <ul className="mt-14 flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <li
                key={i}
                className="h-32 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-900"
              />
            ))}
          </ul>
        }
      >
        <OrderList />
      </Suspense>
    </>
  );
}

async function OrderList() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/orders");
  const isWarehouse = user.role === "WAREHOUSE";
  const title = (
    <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {isWarehouse ? "Все заказы" : "Мои заказы"}
    </h1>
  );

  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  const res = await fetch(`${API_URL}/orders`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  }).catch(() => null);
  if (res?.status === 401) redirect("/login?next=/orders");
  if (!res?.ok) {
    return (
      <>
        {title}
        <p className="text-zinc-600 dark:text-zinc-400">
          Не удалось загрузить заказы, попробуйте обновить страницу.
        </p>
      </>
    );
  }
  const orders = (await res.json()) as Order[];

  if (orders.length === 0) {
    return (
      <>
        {title}
        <div className="rounded-xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            {isWarehouse ? "Заказов пока нет." : "У вас пока нет заказов."}
          </p>
          {!isWarehouse && (
            <Link
              href="/catalog"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Перейти в каталог
            </Link>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {title}
      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-black/5 px-5 py-3 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold">№{o.id}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[o.status]?.className ?? ""}`}
                >
                  {STATUS[o.status]?.label ?? o.status}
                </span>
                {isWarehouse && (
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{o.user_email}</span>
                )}
              </div>
              <span className="text-right text-sm text-zinc-500">
                {dateFormat.format(new Date(o.created_at))}
                {o.completed_at && (
                  <span className="block text-green-700 dark:text-green-400">
                    выполнен {dateFormat.format(new Date(o.completed_at))}
                  </span>
                )}
              </span>
            </div>
            <ul className="px-5 py-3 text-sm">
              {o.items.map((i) => (
                <li key={i.product_id} className="flex justify-between gap-4 py-0.5">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {i.name} <span className="text-zinc-500">× {i.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(i.amount)}</span>
                </li>
              ))}
            </ul>
            <OrderHistory
              orderId={o.id}
              customerId={o.user_id}
              status={o.status}
              ownOrder={!isWarehouse}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-5 py-3 dark:border-white/10">
              <OrderStatusActions orderId={o.id} next={allowedNextStatuses(o.status, user.role)} />
              <span className="ml-auto font-semibold tabular-nums">
                Итого {formatPrice(o.total)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
