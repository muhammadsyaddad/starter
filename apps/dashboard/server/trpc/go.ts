/*
 * Server-side fetch to the Go backend (lib/http.ts is browser-only).
 * Unwraps { data, meta } like lib/http.ts `request`; maps errors to TRPCError.
 */

import { TRPCError } from "@trpc/server";
import type { Meta, Raw } from "@/lib/http";

// Same default as the /be-api rewrite in next.config.js.
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

type Init = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
};

export async function go<T = Raw>(
  path: string,
  token: string,
  { method = "GET", body, params }: Init = {},
): Promise<{ data: T; meta?: Meta }> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params ?? {}))
    if (v !== undefined) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);

  if (res.status === 401) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (!res.ok)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: json?.error ?? json?.message ?? res.statusText,
    });

  return {
    data: (json?.data !== undefined ? json.data : json) ?? [],
    meta: json?.meta,
  };
}
