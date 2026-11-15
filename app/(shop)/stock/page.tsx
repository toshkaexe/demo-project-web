import { Suspense } from "react";
import { redirect } from "next/navigation";
import { API_URL, type Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { currentUser } from "@/lib/user";
import { StockQuantity } from "@/app/ui/stock-quantity";

export default function StockPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Товары на складе
      </h1>
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-900" />}
      >
        <StockTable />
      </Suspense>
    </>
  );
}

async function StockTable() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/stock");
  if (user.role !== "WAREHOUSE") redirect("/catalog");

  const res = await fetch(`${API_URL}/products`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Не удалось загрузить товары, попробуйте обновить страницу.
      </p>
    );
  }
  const products = (await res.json()) as Product[];

  if (products.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Товаров пока нет.</p>;
  }

  const outOfStock = products.filter((p) => p.quantity === 0).length;
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {products.length} товаров, {totalUnits} шт. на складе
        {outOfStock > 0 && (
          <span className="text-red-600 dark:text-red-400"> · закончилось: {outOfStock}</span>
        )}
      </p>
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="border-b border-black/5 text-left text-zinc-500 dark:border-white/10">
            <tr>
              <th className="px-5 py-3 font-medium">№</th>
              <th className="px-5 py-3 font-medium">Название</th>
              <th className="px-5 py-3 text-right font-medium">Цена</th>
              <th className="px-5 py-3 text-right font-medium">Остаток, шт.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3 tabular-nums text-zinc-500">{p.id}</td>
                <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-50">{p.name}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                  {formatPrice(p.price)}
                </td>
                <td className="px-5 py-3">
                  <StockQuantity productId={p.id} quantity={p.quantity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
