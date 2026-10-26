/*
 * Column helpers for <DataTable>. Each returns a DataColumn; pass `true` as
 * the last argument to make the column sortable.
 */

import type * as React from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { Badge } from "@repo/ui/ui/badge";
import type { DataColumn } from "@/components/data-table";
import type { Enum } from "@/lib/enums";
import { cn } from "@/lib/utils";

export const DATETIME = "dd MMM yyyy HH:mm";
export const DATE_MDY = "MMM d, yyyy";
export const DATE_DMY = "dd/MM/yyyy";
export const DATE_SHORT = "dd MMM yyyy";

type Key<T> = keyof T & string;

export const str = (v: unknown) =>
  v == null || v === "" ? "-" : String(v);

const col = <T, K extends Key<T>>(
  key: K,
  header: string,
  cell: (v: T[K], row: T) => React.ReactNode,
  sort?: boolean,
): DataColumn<T> => ({
  header,
  cell: (row) => cell(row[key], row),
  sort: sort ? key : undefined,
});

export const index = <T,>(header = "#"): DataColumn<T> => ({
  header,
  cell: (_, i) => i + 1,
  className: "text-muted-foreground",
  blur: false,
});

export const text = <T,>(key: Key<T>, header: string, sort?: boolean) =>
  col<T, Key<T>>(key, header, str, sort);

export const truncate = <T,>(key: Key<T>, header: string, sort?: boolean) =>
  col<T, Key<T>>(
    key,
    header,
    (v) => (
      <span title={str(v)} className="block max-w-48 truncate">
        {str(v)}
      </span>
    ),
    sort,
  );

export const join = <T,>(key: Key<T>, header: string) =>
  col<T, Key<T>>(key, header, (v) => [v ?? []].flat().join(", ") || "-");

export const twoLine = <T,>(
  header: string,
  a: Key<T>,
  b: Key<T>,
  sort?: boolean,
) =>
  col<T, Key<T>>(
    a,
    header,
    (v, row) => (
      <div className="flex flex-col">
        <span className="font-medium">{str(v)}</span>
        <span className="text-xs text-muted-foreground">{str(row[b])}</span>
      </div>
    ),
    sort,
  );

export const BadgeOf = ({ value, e }: { value: unknown; e?: Enum }) => {
  const s = str(value);
  const [label, variant] = e?.[s] ?? e?.[s.toLowerCase()] ?? ([s, "outline"] as const);
  return <Badge variant={variant}>{label}</Badge>;
};

/** Enum badge; without `e` a plain outline tag. */
export const badge = <T,>(key: Key<T>, header: string, e?: Enum, sort?: boolean) =>
  col<T, Key<T>>(key, header, (v) => <BadgeOf value={v} e={e} />, sort);

export const dot = <T,>(
  key: Key<T>,
  header: string,
  on: (v: unknown) => boolean,
  sort?: boolean,
) =>
  col<T, Key<T>>(
    key,
    header,
    (v) => (
      <span className="inline-flex items-center gap-1.5 capitalize">
        <span
          className={cn(
            "size-2 rounded-full",
            on(v) ? "bg-success" : "bg-muted-foreground",
          )}
        />
        {str(v)}
      </span>
    ),
    sort,
  );

export const fmtDate = (v: unknown, fmt: string) =>
  v ? format(new Date(String(v)), fmt) : "-";

export const date = <T,>(key: Key<T>, header: string, fmt: string, sort?: boolean) =>
  col<T, Key<T>>(key, header, (v) => fmtDate(v, fmt), sort);

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export const idr = <T,>(key: Key<T>, header: string, sort?: boolean) =>
  col<T, Key<T>>(key, header, (v) => rupiah.format(Number(v)), sort);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const avatar = <T,>(key: Key<T>, header: string, sort?: boolean) =>
  col<T, Key<T>>(
    key,
    header,
    (v) => (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {initials(str(v))}
        </span>
        {str(v)}
      </span>
    ),
    sort,
  );

export function dueDateInfo(due: string, status: string) {
  if (status === "FINISHED") return "Finished";
  const d = differenceInCalendarDays(new Date(due), new Date());
  if (d < 0) return status === "PENDING" ? `Pending (${-d}d overdue)` : `${-d}d missed`;
  return d === 0 ? "Due today" : `${d}d left`;
}
