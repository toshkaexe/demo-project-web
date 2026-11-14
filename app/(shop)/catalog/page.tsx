import { Suspense } from "react";
import { API_URL, type Product } from "@/lib/api";
import { readCart } from "@/lib/cart";
import { CartControls } from "@/app/ui/cart-controls";
import { formatPrice } from "@/lib/format";

export default function CatalogPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Каталог
      </h1>
      <Suspense fallback={<ListSkeleton />}>
        <ProductList />
      </Suspense>
    </>
  );
}

async function ProductList() {
  let products: Product[];
  try {
    const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    products = (await res.json()) as Product[];
  } catch {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Не удалось загрузить каталог, попробуйте обновить страницу.
      </p>
    );
  }

  if (products.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Каталог пока пуст.</p>;
  }

  const cart = await readCart();

  return (
    <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-zinc-950">
      {products.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</h2>
            {p.quantity === 0 ? (
              <p className="text-sm text-red-600 dark:text-red-400">Нет в наличии</p>
            ) : (
              <p className="text-sm text-zinc-500">{formatPrice(p.price)}</p>
            )}
          </div>
          <CartControls productId={p.id} inCart={cart[p.id] ?? 0} max={p.quantity} />
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="h-16 animate-pulse rounded-lg bg-zinc-200/60 dark:bg-zinc-900" />
      ))}
    </ul>
  );
}
