/*
 * Fetch layer for the Go backend (proxied as /be-api, see next.config.js).
 * Normalizes its three response envelopes to { data, meta }.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

/** "true" = tables run on their mock rows, no login. */
export const MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30_000;
const TEL_TIMEOUT =
  Number(process.env.NEXT_PUBLIC_TELEMETRY_API_TIMEOUT) || 300_000;

export type Meta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};
// Backend rows are untyped; adapters map them to typed rows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Raw = any;

const TOKENS = "auth_tokens";
type Tokens = { accessToken: string; refreshToken: string };

export const tokens = {
  get: (): Tokens | undefined => {
    try {
      return JSON.parse(localStorage.getItem(TOKENS) ?? "null") ?? undefined;
    } catch {
      return undefined;
    }
  },
  set: (t?: Tokens) => {
    if (t) localStorage.setItem(TOKENS, JSON.stringify(t));
    else localStorage.removeItem(TOKENS);
    // Mirror for proxy.ts, which can't read localStorage.
    document.cookie = t
      ? `auth_token=${t.accessToken}; path=/; max-age=${7 * 86400}; samesite=lax`
      : "auth_token=; path=/; max-age=0";
  },
};

/** One refresh at a time; the refresh token rotates on every call. */
let refreshing: Promise<boolean> | undefined;
const refresh = () =>
  (refreshing ??= fetch("/be-api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.get()?.refreshToken }),
  })
    .then(async (r) => (r.ok ? (tokens.set(await r.json()), true) : false))
    .catch(() => false)
    .finally(() => (refreshing = undefined)));

export const logoutRedirect = () => {
  tokens.set();
  localStorage.removeItem("auth_user");
  location.href = "/login";
};

type Init = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
};

const query = (params: Init["params"] = {}) => {
  const q = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined || v === "" ? [] : [[k, String(v)]],
    ),
  ).toString();
  return q ? `?${q}` : "";
};

/** `path` is relative to /be-api; a leading "/" means an absolute app path (e.g. /tel-api/...). */
export async function request<T = Raw>(
  path: string,
  { method = "GET", body, params, headers }: Init = {},
  retried = false,
): Promise<{ data: T; meta?: Meta; raw: Raw }> {
  const isForm =
    body instanceof FormData ||
    body instanceof Blob ||
    typeof body === "string";
  const token = tokens.get()?.accessToken;
  const res = await fetch(
    `${path.startsWith("/") ? path : `/be-api/${path}`}${query(params)}`,
    {
      method,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as BodyInit)
            : JSON.stringify(body),
      headers: {
        ...(body === undefined || isForm
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: AbortSignal.timeout(
        path.startsWith("/tel-api") ? TEL_TIMEOUT : TIMEOUT,
      ),
    },
  );
  if (res.status === 401 && !path.startsWith("auth/") && !retried) {
    if (await refresh())
      return request(path, { method, body, params, headers }, true);
    logoutRedirect();
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? res.statusText);
  return {
    data: (json?.data !== undefined ? json.data : json) ?? [],
    meta: json?.meta,
    raw: json,
  };
}

/** Every page of a list (backend caps limit silently). */
export async function fetchAll(
  path: string,
  params: Init["params"] = {},
): Promise<Raw[]> {
  const out: Raw[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await request<Raw[]>(path, {
      params: { ...params, page, limit: 100 },
    });
    out.push(...(data ?? []));
    if (!meta || !data?.length || out.length >= meta.total) return out;
  }
}

export const lower = (v: unknown) => String(v ?? "").toLowerCase();
export const cap = (v: unknown) =>
  lower(v).replace(/^./, (c) => c.toUpperCase());
/** "a, b" or ["a", "b"] -> ["a", "b"] */
export const list = (v: unknown): string[] =>
  (Array.isArray(v) ? v : String(v ?? "").split(","))
    .map((s) => String(s).trim())
    .filter(Boolean);
/** Backend absolute url -> same file through the proxy. */
export const img = (url?: string) =>
  url ? `/be-api/${url.split("/api/").pop()}` : "";

/** Multipart body; skips empty values, appends arrays as repeated fields. */
export const toForm = (o: Record<string, unknown>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o))
    for (const x of [v].flat())
      if (
        x !== undefined &&
        x !== null &&
        x !== "" &&
        !(x instanceof File && !x.size)
      )
        f.append(k, x instanceof Blob ? x : String(x));
  return f;
};

/** GET once per path (cached across page changes); `undefined` path = idle. */
export function useFetch<T = Raw>(path?: string, params?: Init["params"]) {
  const key = path && !MOCK ? path + query(params) : undefined;
  const q = useQuery({
    queryKey: [key],
    queryFn: () => request<T>(path!, { params }).then((r) => r.data),
    enabled: !!key,
  });
  return {
    data: q.data,
    error: q.error?.message,
    loading: !!key && q.isPending,
  };
}

/** `{ data: [{ id, name }] }` dropdown -> label map; `fallback` in mock mode. */
export function useOptions(
  path?: string,
  fallback: Record<string, string> = {},
) {
  const { data } = useFetch<{ id: string; name: string }[]>(path);
  return React.useMemo(
    () =>
      MOCK || !data
        ? fallback
        : Object.fromEntries(data.map((o) => [o.id, o.name])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
}
