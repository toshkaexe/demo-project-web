import { Suspense } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { cartCount, readCart } from "@/lib/cart";
import { currentUser, ROLE_LABEL } from "@/lib/user";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4">
          <Suspense fallback={<Logo href="/catalog" />}>
            <Nav />
          </Suspense>
          <Suspense fallback={null}>
            <UserBar />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}

const navLink =
  "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="text-lg font-semibold tracking-tight">
      Лавка
    </Link>
  );
}

/** Склад видит «Лавка», «Заказы» и «Товары», остальные — каталог и корзину. */
async function Nav() {
  const user = await currentUser();

  if (user?.role === "WAREHOUSE") {
    return (
      <nav className="flex items-center gap-5 text-sm font-medium">
        <Logo href="/orders" />
        <Link href="/orders" className={navLink}>
          Заказы
        </Link>
        <Link href="/stock" className={navLink}>
          Товары
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-5 text-sm font-medium">
      <Logo href="/catalog" />
      <Link href="/catalog" className={navLink}>
        Каталог
      </Link>
      <Link href="/basket" className={navLink}>
        Корзина
        <BasketBadge />
      </Link>
      {user && (
        <Link href="/orders" className={navLink}>
          Мои заказы
        </Link>
      )}
    </nav>
  );
}

async function BasketBadge() {
  const count = cartCount(await readCart());
  if (count === 0) return null;
  return (
    <span className="ml-1.5 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white tabular-nums dark:bg-zinc-50 dark:text-zinc-900">
      {count}
    </span>
  );
}

async function UserBar() {
  const user = await currentUser();
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="hidden text-right sm:block">
        <div className="font-medium">{user.email}</div>
        <div className="text-zinc-500">{ROLE_LABEL[user.role] ?? user.role}</div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="h-9 rounded-lg border border-black/10 px-3 font-medium transition hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
