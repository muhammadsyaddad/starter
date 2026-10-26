"use client";

/*
 * Building blocks for detail pages: a key/value card over one GET, and the
 * edit-history / comment tables several detail pages share.
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/ui/card";
import { ResourceTable } from "@/components/data-table";
import { DATETIME, date, str, text } from "@/components/cells";
import { type Adapter, keyed } from "@/lib/api";
import { MOCK, type Raw, fetchAll, request, useFetch } from "@/lib/http";

/** Route param of the current page. */
export const useParam = (key = "id") => decodeURIComponent(String(useParams()[key] ?? ""));

/** Key/value card for `path`'s object; `rows` picks what to show. */
export function Info({
  title,
  path,
  rows,
  children,
}: {
  title: string;
  path?: string;
  rows: (d: Raw) => [string, React.ReactNode][];
  children?: (d: Raw) => React.ReactNode;
}) {
  const { data, loading, error } = useFetch(path);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {MOCK ? (
            <p className="text-sm text-muted-foreground">Mock mode: no detail data.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">Failed to load: {error}</p>
          ) : (
            data && (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {rows(data).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="break-words">{v == null || typeof v !== "object" ? str(v) : v}</dd>
                  </div>
                ))}
              </dl>
            )
          )}
        </CardContent>
      </Card>
      {data && children?.(data)}
    </>
  );
}

/** Stable adapter per `deps` (a new adapter object refetches). */
export const useAdapter = <T,>(make: () => Adapter<T>, deps: unknown[]) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useMemo(make, deps);

type Change = { id: string; user_name: string; changes: string; created_at: string };

/** Edit history; `id` = uuid, except maintenance = MTN id. */
export function History({ type, id }: { type: string; id: string }) {
  const adapter = useAdapter<Change>(
    () => {
      const path = `ship-data-management/edit-histories/${type}/${id}`;
      return { list: keyed([path], () => fetchAll(path)) };
    },
    [type, id],
  );
  return (
    <ResourceTable
      title="Edit History"
      adapter={adapter}
      mock={[]}
      readOnly
      columns={[text("user_name", "User"), text("changes", "Changes"), date("created_at", "Date", DATETIME)]}
      noun="changes"
      emptyLabel="No changes yet."
    />
  );
}

type Comment = { id: string; user_name: string; comment: string; created_at: string };

/** Maintenance comments; JWT only, owner or admin may edit / delete. */
export function Comments({ id }: { id: string }) {
  const adapter = useAdapter<Comment>(
    () => ({
      list: keyed([`ship-data-management/maintenances/${id}/comments`], () =>
        fetchAll(`ship-data-management/maintenances/${id}/comments`),
      ),
      save: (c) =>
        c.id
          ? request(`ship-data-management/maintenance-comments/${c.id}`, { method: "PATCH", body: { comment: c.comment } })
          : request(`ship-data-management/maintenances/${id}/comments`, { method: "POST", body: { comment: c.comment } }),
      remove: (cid) => request(`ship-data-management/maintenance-comments/${cid}`, { method: "DELETE" }),
    }),
    [id],
  );
  return (
    <ResourceTable
      title="Comments"
      adapter={adapter}
      mock={[]}
      columns={[text("user_name", "User"), text("comment", "Comment"), date("created_at", "Date", DATETIME)]}
      addLabel="Comment"
      fields={[{ key: "comment", label: "Comment" }]}
      noun="comments"
      emptyLabel="No comments yet."
    />
  );
}

/** Page shell: heading + stacked cards. */
export const Page = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-4 p-6">
    <h1 className="text-3xl font-bold">{title}</h1>
    {children}
  </div>
);
