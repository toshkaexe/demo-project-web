import { cache } from "react";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, API_URL, type User } from "@/lib/api";

export const ROLE_LABEL: Record<User["role"], string> = {
  CUSTOMER: "Покупатель",
  WAREHOUSE: "Сотрудник склада",
};

/** Текущий пользователь по access-токену; один запрос к /users/me на рендер. */
export const currentUser = cache(async (): Promise<User | null> => {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as User) : null;
  } catch {
    return null;
  }
});
