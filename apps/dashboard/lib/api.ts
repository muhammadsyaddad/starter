"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { MOCK, type Raw, fetchAll, request } from "@/lib/http";

/** One table's backend. Omitted parts = the table can't do that. */
export type Adapter<T> = {
  /** Backend PAGE key for `can()`. */
  perm?: string;
  list: () => Promise<T[]>;
  /** Full row for the edit dialog (lists often lack fields). */
  get?: (row: T) => Promise<T>;
  save?: (row: T) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  /** Refetch interval, ms. */
  poll?: number;
};

/**
 * Cache key on a list fn: same key = rows shared and kept across page changes.
 * On the fn (not the adapter) so wrappers that override `list` must set their own.
 */
export const keyed = <F extends () => unknown>(key: unknown[], list: F) => Object.assign(list, { key });

/**
 * Standard CRUD: GET list (all pages) · GET/PATCH/DELETE `path/:id` · POST `path`.
 * `toApi` builds the write body (JSON object or FormData).
 */
export function rest<T extends { id: string }>(
  path: string,
  perm: string,
  fromApi: (raw: Raw) => T,
  opts: {
    params?: Record<string, string | undefined>;
    toApi?: (row: T) => unknown;
    detail?: boolean;
    method?: "PATCH" | "PUT";
  } = {},
): Adapter<T> {
  const { params, toApi = (r) => r, detail, method = "PATCH" } = opts;
  return {
    perm,
    list: keyed([path, params], () => fetchAll(path, params).then((rows) => rows.map(fromApi))),
    get: detail
      ? (row) => request(`${path}/${row.id}`).then(({ data }) => ({ ...row, ...fromApi(data) }))
      : undefined,
    save: (row) =>
      request(row.id ? `${path}/${row.id}` : path, {
        method: row.id ? method : "POST",
        body: toApi(row),
      }),
    remove: (id) => request(`${path}/${id}`, { method: "DELETE" }),
  };
}

const ids = new WeakMap<object, number>();
let nextId = 0;
/** `rest()` lists carry `[path, params]`; other adapters get one key per object. */
export const keyOf = (a: { list: object }): unknown[] =>
  (a.list as { key?: unknown[] }).key ?? ["adapter", ids.get(a) ?? (ids.set(a, ++nextId), nextId)];

/**
 * Rows from `adapter` (react-query cache: kept across page changes), or `mock`
 * kept in memory when mock mode is on / no adapter.
 */
export function useResource<T extends { id: string }>(adapter: Adapter<T> | undefined, mock: T[]) {
  const live = !MOCK && !!adapter;
  const [local, setLocal] = React.useState<T[]>(mock);
  const q = useQuery({
    queryKey: live ? keyOf(adapter) : ["mock"],
    queryFn: () => adapter!.list(),
    enabled: live,
    refetchInterval: adapter?.poll,
  });

  const reload = async () => void (await q.refetch());

  const save = async (row: T) => {
    if (!live)
      return setLocal((l) =>
        row.id ? l.map((x) => (x.id === row.id ? row : x)) : [...l, { ...row, id: crypto.randomUUID() }],
      );
    await adapter!.save!(row);
    await reload();
  };

  const remove = async (id: string) => {
    if (!live) return setLocal((l) => l.filter((x) => x.id !== id));
    await adapter!.remove!(id);
    await reload();
  };

  return {
    items: live ? (q.data ?? []) : local,
    // No data yet; background refetches keep showing the old rows.
    loading: live && q.isPending,
    error: q.error?.message,
    save,
    remove,
    reload,
    live,
  };
}
