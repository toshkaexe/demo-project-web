import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/app/ui/login-form";

export default function WelcomePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Добро пожаловать в Лавку
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Войдите или зарегистрируйтесь
          </p>
        </div>
        <Suspense fallback={<div className="h-80" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/catalog"
            className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Перейти в каталог без входа
          </Link>
        </p>
      </main>
    </div>
  );
}
