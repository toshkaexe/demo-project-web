import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  API_URL,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  type TokenPair,
} from "@/lib/api";

/** Сохраняет пару токенов в cookies. Только в Server Action / Route Handler. */
export async function saveTokens(tokens: TokenPair) {
  const store = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  store.set(ACCESS_COOKIE, tokens.access_token, { ...base, maxAge: REFRESH_MAX_AGE });
  store.set(REFRESH_COOKIE, tokens.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
}

async function refreshTokens(): Promise<string | null> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as TokenPair;
    await saveTokens(tokens);
    return tokens.access_token;
  } catch {
    return null;
  }
}

/**
 * fetch к бэкенду с access-токеном. Если токена нет или он истёк (401),
 * один раз обновляет пару через /auth/refresh и повторяет запрос.
 * Только в Server Action / Route Handler: пишет cookies.
 * Возвращает null, если пользователя не удалось авторизовать.
 */
export async function authFetch(path: string, init: RequestInit = {}) {
  const send = (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });

  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (access) {
    const res = await send(access);
    if (res.status !== 401) return res;
  }

  const fresh = await refreshTokens();
  return fresh ? send(fresh) : null;
}
