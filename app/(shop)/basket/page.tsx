import { Suspense } from "react";
import Link from "next/link";
import { API_URL, type Product } from "@/lib/api";
import { readCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { CartControls } from "@/app/ui/cart-controls";
import { ClearCartButton } from "@/app/ui/clear-cart-button";
import { CheckoutButton } from "@/app/ui/checkout-button";

export default function BasketPage({ searchParams }: PageProps<"/basket">) {
  return (
    <>
      <Suspense fallback={null}>
        <OrderPlaced searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Корзина
      </h1>
      <Suspense
        fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-900" />}
      >
        <BasketContents />
      </Suspense>
    </>
  );
}

async function OrderPlaced({
  searchParams,
}: {
  searchParams: PageProps<"/basket">["searchParams"];
}) {
  const order = (await searchParams).order;
  const id = typeof order === "string" && /^\d+$/.test(order) ? order : null;
  if (!id) return null;
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-green-600/20 bg-green-50 px-5 py-4 text-green-900 dark:border-green-400/20 dark:bg-green-950/40 dark:text-green-100"
    >
      <p className="font-medium">Заказ №{id} оформлен</p>
      <p className="text-sm opacity-80">
        Следить за статусом можно в{" "}
        <Link href="/orders" className="font-medium underline underline-offset-4">
          моих заказах
        </Link>
        .
      </p>
    </div>
  );
}

async function BasketContents() {
  const cart = await readCart();
  const ids = Object.keys(cart).map(Number);

  if (ids.length === 0) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Корзина пуста.</p>
        <Link
          href="/catalog"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  let products: Product[];
  try {
    const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    products = (await res.json()) as Product[];
  } catch {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Не удалось загрузить корзину, попробуйте обновить страницу.
      </p>
    );
  }

  // товары, которые удалили из каталога, просто не показываем
  const items = products
    .filter((p) => cart[p.id])
    .map((p) => ({ product: p, quantity: cart[p.id] }));
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const shortage = items.some((i) => i.quantity > i.product.quantity);

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-zinc-950">
        {items.map(({ product: p, quantity }) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</h2>
              <p className="text-sm text-zinc-500">{formatPrice(p.price)} за шт.</p>
              {quantity > p.quantity && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {p.quantity === 0 ? "Закончился на складе" : "Столько нет на складе"}
                </p>
              )}
            </div>
            <CartControls productId={p.id} inCart={quantity} max={p.quantity} />
            <span className="w-28 text-right font-semibold tabular-nums">
              {formatPrice(p.price * quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 rounded-xl border border-black/5 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <ClearCartButton />
          <div className="text-right">
            <div className="text-sm text-zinc-500">Итого</div>
            <div className="text-xl font-semibold tabular-nums">{formatPrice(total)}</div>
          </div>
        </div>
        <CheckoutButton
          disabledReason={
            shortage ? "Некоторых товаров не хватает на складе — уменьшите количество" : undefined
          }
        />
      </div>
    </div>
  );
}
