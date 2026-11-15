import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MAX_ADDRESSES, type Address } from "@/lib/api";
import { authFetch } from "@/lib/session";
import { currentUser, ROLE_LABEL } from "@/lib/user";
import { AddressCard } from "@/app/ui/address-card";
import { NewAddress } from "@/app/ui/new-address";

const card =
  "rounded-xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950";

export default function ProfilePage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Профиль
      </h1>
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-900" />
        }
      >
        <Profile />
      </Suspense>
    </>
  );
}

async function Profile() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/profile");

  const res = await authFetch("/users/me/addresses", {
    cache: "no-store",
  }).catch(() => null);
  const addresses = res?.ok ? ((await res.json()) as Address[]) : null;

  return (
    <div className="flex flex-col gap-8">
      <section className={card}>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="mt-0.5 font-medium break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Роль</dt>
            <dd className="mt-0.5 font-medium">
              {ROLE_LABEL[user.role] ?? user.role}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">С нами с</dt>
            <dd className="mt-0.5 font-medium">
              {new Date(user.created_at).toLocaleDateString("ru-RU", {
                dateStyle: "long",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Адреса доставки
            </h2>
            <p className="text-sm text-zinc-500">
              Заказы отправляются на активный адрес. При оформлении можно
              выбрать другой.
            </p>
          </div>
          {addresses && addresses.length > 0 && (
            <span className="text-sm text-zinc-500 tabular-nums">
              {addresses.length} из {MAX_ADDRESSES}
            </span>
          )}
        </div>

        {addresses === null ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Не удалось загрузить адреса, попробуйте обновить страницу.
          </p>
        ) : (
          <>
            {addresses.length > 0 && (
              <ul className="flex flex-col gap-3">
                {addresses.map((a) => (
                  <li key={a.id} className={card}>
                    <AddressCard address={a} />
                  </li>
                ))}
              </ul>
            )}
            {addresses.length < MAX_ADDRESSES ? (
              <div className={addresses.length === 0 ? card : ""}>
                {addresses.length === 0 && (
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Адресов пока нет. Добавьте адрес, куда привезти заказ.
                  </p>
                )}
                <NewAddress first={addresses.length === 0} />
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Сохранено максимум адресов. Чтобы добавить новый, удалите один
                из старых.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
