"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  ADDRESS_FIELDS,
  MAX_ADDRESSES,
  type AddressField,
  type AddressInput,
} from "@/lib/api";
import { authFetch } from "@/lib/session";

export type AddressFormState = {
  error?: string;
  fieldErrors?: Partial<Record<AddressField, string>>;
  /** Что ввёл пользователь: после ошибки форма показывает это, а не пустые поля. */
  values?: AddressInput;
  /** Меняется при каждом успешном сохранении, чтобы форма поняла, что можно закрыться. */
  savedAt?: number;
};

const LOGIN = "/login?next=/profile";

/**
 * Создаёт адрес или, если в форме есть id, заменяет его целиком (PUT).
 * Те же проверки, что на бэкенде, чтобы показать ошибку у конкретного поля.
 */
export async function saveAddress(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const values = {} as AddressInput;
  const fieldErrors: AddressFormState["fieldErrors"] = {};
  for (const field of ADDRESS_FIELDS) {
    const raw = formData.get(field.name);
    const value = typeof raw === "string" ? raw.trim() : "";
    values[field.name] = value;
    if (field.required && !value) fieldErrors[field.name] = "Заполните поле";
    else if (value.length > field.max)
      fieldErrors[field.name] = `Не длиннее ${field.max} символов`;
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId !== "" ? Number(rawId) : null;
  if (id !== null && !(Number.isInteger(id) && id > 0)) {
    return { error: "Некорректный запрос", values };
  }

  const body = {
    ...values,
    apartment: values.apartment || null,
    courier_note: values.courier_note || null,
  };

  let res: Response | null;
  try {
    res = await authFetch(
      id === null ? "/users/me/addresses" : `/users/me/addresses/${id}`,
      {
        method: id === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } catch {
    return { error: "Сервер недоступен, попробуйте позже", values };
  }

  if (!res) redirect(LOGIN);
  if (res.ok) {
    refresh();
    return { savedAt: Date.now() };
  }
  if (res.status === 404) {
    refresh();
    return { error: "Адрес уже удалён", values };
  }
  if (res.status === 409) {
    return {
      error: `Можно сохранить не больше ${MAX_ADDRESSES} адресов`,
      values,
    };
  }
  if (res.status === 400) return { error: "Проверьте поля адреса", values };
  return { error: "Не удалось сохранить, попробуйте позже", values };
}

export async function deleteAddress(id: unknown): Promise<{ error?: string }> {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return { error: "Некорректный запрос" };
  }

  let res: Response | null;
  try {
    res = await authFetch(`/users/me/addresses/${id}`, { method: "DELETE" });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect(LOGIN);
  // 404 — адрес уже удалили в другой вкладке: результат тот же
  if (res.ok || res.status === 404) {
    refresh();
    return {};
  }
  return { error: "Не удалось удалить, попробуйте позже" };
}

/** Делает адрес активным: он выбран по умолчанию при оформлении заказа. */
export async function setActiveAddress(
  id: unknown,
): Promise<{ error?: string }> {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return { error: "Некорректный запрос" };
  }

  let res: Response | null;
  try {
    res = await authFetch(`/users/me/addresses/${id}/active`, {
      method: "PUT",
    });
  } catch {
    return { error: "Сервер недоступен, попробуйте позже" };
  }

  if (!res) redirect(LOGIN);
  if (res.ok) {
    refresh();
    return {};
  }
  if (res.status === 404) {
    refresh();
    return { error: "Адрес уже удалён" };
  }
  return { error: "Не удалось сохранить, попробуйте позже" };
}
