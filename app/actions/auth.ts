"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CART_COOKIE } from "@/lib/cart";
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE, type TokenPair, type User } from "@/lib/api";
import { saveTokens } from "@/lib/session";

export type AuthState = {
  errors?: { email?: string; password?: string };
  message?: string;
  values?: { email: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Только относительные пути внутри сайта, иначе null. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : null;
}

/** Куда вести после входа, если не задан ?next: склад — к заказам, покупатель — в каталог. */
async function homeFor(accessToken: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (res.ok && ((await res.json()) as User).role === "WAREHOUSE") return "/orders";
  } catch {
    // не удалось узнать роль — ведём в каталог
  }
  return "/catalog";
}

async function authenticate(
  mode: "login" | "register",
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { email };
  const next = safeNext(formData.get("next"));

  const errors: AuthState["errors"] = {};
  if (!email) errors.email = "Введите email";
  else if (mode === "register" && !EMAIL_RE.test(email))
    errors.email = "Некорректный email";
  else if (email.length > 254) errors.email = "Слишком длинный email";

  if (!password) errors.password = "Введите пароль";
  else if (mode === "register" && password.length < 6)
    errors.password = "Пароль должен быть не короче 6 символов";
  else if (mode === "register" && password.length > 100)
    errors.password = "Пароль должен быть не длиннее 100 символов";
  else if (new TextEncoder().encode(password).length > 72)
    // BCrypt на бэкенде принимает максимум 72 байта, иначе 500
    errors.password = "Пароль слишком длинный: не больше 72 латинских символов или 36 кириллических";

  if (errors.email || errors.password) return { errors, values };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { message: "Сервер недоступен, попробуйте позже", values };
  }

  if (!res.ok) {
    if (res.status === 401) return { message: "Неверный email или пароль", values };
    if (res.status === 409)
      return { errors: { email: "Этот email уже зарегистрирован" }, values };
    if (res.status === 400)
      return { message: "Проверьте введённые данные", values };
    return { message: "Что-то пошло не так, попробуйте позже", values };
  }

  const tokens = (await res.json()) as TokenPair;
  await saveTokens(tokens);
  redirect(next ?? (await homeFor(tokens.access_token)));
}

export async function login(_prev: AuthState, formData: FormData) {
  return authenticate("login", formData);
}

export async function register(_prev: AuthState, formData: FormData) {
  return authenticate("register", formData);
}

export async function logout() {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (refresh) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: "no-store",
      });
    } catch {
      // даже если бэкенд недоступен, локально выходим
    }
  }

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(CART_COOKIE);
  redirect("/catalog");
}
