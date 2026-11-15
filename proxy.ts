import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  COOKIE_SECURE,
  API_URL,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  type TokenPair,
} from "@/lib/api";

/** Секунд до истечения JWT (подпись не проверяем — это делает бэкенд). */
function secondsLeft(jwt: string): number {
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return payload.exp ? payload.exp - Date.now() / 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Перед страницами магазина обновляет access-токен по refresh-токену,
 * если access нет или он истекает в ближайшие 30 секунд.
 */
export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh || (access && secondsLeft(access) > 30)) {
    return NextResponse.next();
  }

  let tokens: TokenPair;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.next(); // страница сама отправит на вход
    tokens = (await res.json()) as TokenPair;
  } catch {
    return NextResponse.next();
  }

  // новые токены видны серверному рендеру этого же запроса…
  request.cookies.set(ACCESS_COOKIE, tokens.access_token);
  request.cookies.set(REFRESH_COOKIE, tokens.refresh_token);
  const response = NextResponse.next({ request: { headers: request.headers } });

  // …и сохраняются в браузере
  const base = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, { ...base, maxAge: REFRESH_MAX_AGE });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
  return response;
}

export const config = {
  matcher: ["/catalog", "/basket", "/orders", "/stock", "/profile"],
};
