"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, register, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

const inputClass =
  "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-[invalid=true]:border-red-500 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-white/10";

type Mode = "login" | "register";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const checkout = useSearchParams().get("next") === "/basket";

  return (
    <div className="flex flex-col gap-6">
      {checkout && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Войдите или зарегистрируйтесь, чтобы оформить заказ. Корзина сохранится.
        </p>
      )}
      <div
        role="tablist"
        className="grid grid-cols-2 rounded-lg bg-zinc-100 p-1 text-sm font-medium dark:bg-zinc-900"
      >
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className="h-9 rounded-md text-zinc-600 transition aria-selected:bg-white aria-selected:text-zinc-900 aria-selected:shadow-sm dark:text-zinc-400 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50"
          >
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>
      {/* key сбрасывает состояние формы при переключении вкладки */}
      <AuthForm key={mode} mode={mode} />
    </div>
  );
}

function AuthForm({ mode }: { mode: Mode }) {
  const next = useSearchParams().get("next") ?? "";
  const [state, formAction, pending] = useActionState(
    mode === "login" ? login : register,
    initialState,
  );
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete={isLogin ? "username" : "email"}
          required
          defaultValue={state.values?.email}
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          className={inputClass}
        />
        {state.errors?.email && (
          <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          aria-invalid={!!state.errors?.password}
          aria-describedby={
            state.errors?.password ? "password-error" : undefined
          }
          className={inputClass}
        />
        {state.errors?.password && (
          <p
            id="password-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {state.errors.password}
          </p>
        )}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-red-600 dark:text-red-400">
        {state.message}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-zinc-900 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending
          ? isLogin ? "Входим…" : "Создаём аккаунт…"
          : isLogin ? "Войти" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
