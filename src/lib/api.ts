const TOKEN_KEY = "tefu.cashier.access";
const REFRESH_KEY = "tefu.cashier.refresh";

export type ApiResult<T> = { success: boolean; message: string; data: T; code?: string };

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export async function api<T>(path: string, init?: RequestInit & { idempotencyKey?: string }): Promise<ApiResult<T>> {
  const headers = new Headers(authHeaders(init?.headers));
  if (init?.idempotencyKey) headers.set("Idempotency-Key", init.idempotencyKey);
  const response = await fetch(`/api/v1/cashier${path}`, { ...init, headers });
  const body = (await response.json()) as ApiResult<T>;
  if (!response.ok || !body.success) {
    throw Object.assign(new Error(body.message || "Request failed."), { code: body.code, status: response.status });
  }
  return body;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(value);
}

export function uid() {
  return crypto.randomUUID();
}
