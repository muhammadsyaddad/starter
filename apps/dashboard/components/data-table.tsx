"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@repo/ui/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/ui/dialog";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/ui/table";
import { type Adapter, useResource } from "@/lib/api";
import { D, W, useAuth } from "@/lib/auth";
import { useOptions } from "@/lib/http";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/overview/filter-select";

export type DataColumn<T> = {
  header: string;
  /** `i` = row number across pages, from 0. */
  cell: (row: T, i: number) => React.ReactNode;
  className?: string;
  /** Blurred when the row is hidden. Defaults to true. */
  blur?: boolean;
  /** Field to sort by when the header is clicked. */
  sort?: keyof T;
};

export type DataFilter<T> = {
  key: keyof T & string;
  options: Record<string, string>;
  allLabel: string;
};

/** Form field for the built-in add / edit dialog. */
export type DataField<T> = {
  key: keyof T & string;
  label: string;
  /** Select options; the mock-mode fallback when `source` is set. */
  options?: Record<string, string>;
  /**
   * Dropdown endpoint for the options. A function gets the dialog's current
   * select values (company -> ship) and returns undefined while not ready.
   */
  source?: string | ((values: Record<string, string>) => string | undefined);
  type?: React.HTMLInputTypeAttribute;
  optional?: boolean;
  /** Only in the new or only in the edit dialog. */
  on?: "create" | "edit";
};

/** Extra row button; `confirm` = dialog title, `false` = no dialog. */
export type DataAction<T> = {
  label: string;
  onClick: (row: T) => unknown;
  visible?: (row: T) => boolean;
  confirm?: string | false;
  /** Permission bit on the adapter's PAGE key. Defaults to W. */
  need?: number;
};

type Sort<T> = { key: keyof T; desc: boolean };

export type DataTableProps<T> = {
  title: string;
  items: T[];
  columns: DataColumn<T>[];
  /** Text the search box matches against. No search box when omitted. */
  search?: (row: T) => string;
  placeholder?: string;
  filters?: DataFilter<T>[];
  emptyLabel?: string;
  loading?: boolean;
  error?: string;
  /** Footer: "Showing X of Y <noun>". */
  noun?: string;
  pageSize?: number;
  defaultSort?: Sort<T>;
  actionsHeader?: string;
  addLabel?: string;
  /** Detail link per row; undefined hides it. */
  detailHref?: (row: T) => string | undefined;
  /** Per-row gate for edit / delete. */
  can?: (row: T, action: "edit" | "delete") => boolean;
  /** Builds the add / edit dialog when `renderDialog` is omitted. */
  fields?: DataField<T>[];
  /** Fetches the full row before the edit dialog opens. */
  load?: (row: T) => Promise<T>;
  actions?: DataAction<T>[];
  /** Extra controls next to search / filters. */
  toolbar?: React.ReactNode;
  onSave?: (row: T) => unknown;
  onDelete?: (id: string) => unknown;
  /** `row` undefined = closed, `{}` = new. `onSave` saves then closes. */
  renderDialog?: (p: {
    row?: Partial<T>;
    onClose: () => void;
    onSave: (row: T) => Promise<void>;
  }) => React.ReactNode;
  /** Rows that get a checkbox; with `bulk`, buttons run on the checked rows. */
  select?: (row: T) => boolean;
  bulk?: { label: string; onClick: (rows: T[]) => unknown }[];
};

/**
 * Card with search, filters, sortable headers, pagination, an Add button and
 * hide / detail / edit / delete row actions. Pages bring their own columns.
 */
export function DataTable<T extends { id: string }>({
  title,
  items,
  columns,
  search,
  placeholder = "Search",
  filters = [],
  emptyLabel = "No data found.",
  loading,
  error,
  noun = "items",
  pageSize = 10,
  defaultSort,
  actionsHeader = "Actions",
  addLabel = "Add",
  detailHref,
  can = () => true,
  fields,
  load,
  actions = [],
  toolbar,
  onSave,
  onDelete,
  renderDialog = fields &&
    ((p) => <FormDialog key={p.row?.id ?? "new"} title={title} fields={fields} {...p} />),
  select,
  bulk = [],
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState(defaultSort);
  const [page, setPage] = React.useState(0);
  const [hidden, setHidden] = React.useState<Set<string>>(new Set());
  const [editing, setEditing] = React.useState<Partial<T>>();
  const [confirm, setConfirm] = React.useState<{ title: string; label: string; run: () => unknown }>();
  const [confirmError, setConfirmError] = React.useState<string>();
  const [checked, setChecked] = React.useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const rows = items.filter(
    (row) =>
      filters.every(
        ({ key }) =>
          (values[key] ?? "all") === "all" || row[key] === values[key],
      ) &&
      (!search || search(row).toLowerCase().includes(q)),
  );
  if (sort)
    rows.sort(
      (a, b) =>
        String(a[sort.key] ?? "").localeCompare(
          String(b[sort.key] ?? ""),
          undefined,
          { numeric: true },
        ) * (sort.desc ? -1 : 1),
    );

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const p = Math.min(page, pages - 1);
  const visible = rows.slice(p * pageSize, (p + 1) * pageSize);
  const span = columns.length + (select ? 2 : 1);
  const picked = items.filter((r) => checked.has(r.id) && select?.(r));

  const toggleHidden = (id: string) =>
    setHidden((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const message = (text: string) => (
    <TableRow>
      <TableCell colSpan={span} className="py-6 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {renderDialog && (
          <CardAction>
            <Button size="sm" onClick={() => setEditing({})}>
              <PlusIcon /> {addLabel}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(search || filters.length > 0 || toolbar) && (
          <div className="flex flex-wrap items-center gap-2">
            {search && (
              <div className="relative min-w-48 flex-1">
                <MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder={placeholder}
                  className="pl-8"
                />
              </div>
            )}
            {filters.map(({ key, options, allLabel }) => (
              <FilterSelect
                key={key}
                value={values[key] ?? "all"}
                onValueChange={(v) => {
                  setValues((s) => ({ ...s, [key]: v }));
                  setPage(0);
                }}
                options={options}
                allLabel={allLabel}
              />
            ))}
            {toolbar}
          </div>
        )}
        {picked.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {picked.length} selected
            {bulk.map((b) => (
              <Button
                key={b.label}
                size="sm"
                variant="outline"
                onClick={() =>
                  setConfirm({
                    title: `${b.label} (${picked.length})?`,
                    label: b.label,
                    run: async () => (await b.onClick(picked), setChecked(new Set())),
                  })
                }
              >
                {b.label}
              </Button>
            ))}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {select && <TableHead />}
              {columns.map((col) => {
                const on = sort && sort.key === col.sort;
                const Caret = !on
                  ? CaretUpDownIcon
                  : sort.desc
                    ? CaretDownIcon
                    : CaretUpIcon;
                return (
                  <TableHead key={col.header}>
                    {col.sort ? (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() =>
                          setSort({ key: col.sort!, desc: !!on && !sort.desc })
                        }
                      >
                        {col.header}
                        <Caret className={cn("size-3", !on && "opacity-40")} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
              <TableHead>{actionsHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, i) => {
              const isHidden = hidden.has(row.id);
              const href = detailHref?.(row);
              return (
                <TableRow key={row.id}>
                  {select && (
                    <TableCell>
                      {select(row) && (
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={checked.has(row.id)}
                          onChange={() =>
                            setChecked((s) => {
                              const next = new Set(s);
                              if (!next.delete(row.id)) next.add(row.id);
                              return next;
                            })
                          }
                        />
                      )}
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.header}
                      className={cn(
                        col.className,
                        isHidden &&
                          col.blur !== false &&
                          "blur-sm select-none",
                      )}
                    >
                      {col.cell(row, p * pageSize + i)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <IconButton
                        label={isHidden ? "Show" : "Hide"}
                        onClick={() => toggleHidden(row.id)}
                      >
                        {isHidden ? <EyeSlashIcon /> : <EyeIcon />}
                      </IconButton>
                      {href && (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={href}>
                            <ArrowRightIcon />
                            <span className="sr-only">Detail</span>
                          </Link>
                        </Button>
                      )}
                      {actions
                        .filter((a) => a.visible?.(row) ?? true)
                        .map((a) => (
                          <Button
                            key={a.label}
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              a.confirm === false
                                ? a.onClick(row)
                                : setConfirm({
                                    title: a.confirm ?? `${a.label}?`,
                                    label: a.label,
                                    run: () => a.onClick(row),
                                  })
                            }
                          >
                            {a.label}
                          </Button>
                        ))}
                      {renderDialog && can(row, "edit") && (
                        <IconButton
                          label="Edit"
                          onClick={() =>
                            load
                              ? load(row).then(setEditing, () => setEditing(row))
                              : setEditing(row)
                          }
                        >
                          <PencilSimpleIcon />
                        </IconButton>
                      )}
                      {onDelete && can(row, "delete") && (
                        <IconButton
                          label="Delete"
                          onClick={() =>
                            setConfirm({
                              title: "Delete row?",
                              label: "Delete",
                              run: () => onDelete(row.id),
                            })
                          }
                          className="text-destructive"
                        >
                          <TrashIcon />
                        </IconButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {loading
              ? message("Loading…")
              : error
                ? message(`Failed to load: ${error}`)
                : rows.length === 0 && message(emptyLabel)}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Showing {visible.length} of {rows.length} {noun}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={p === 0}
                onClick={() => setPage(p - 1)}
              >
                Prev
              </Button>
              Page {p + 1} of {pages}
              <Button
                variant="outline"
                size="sm"
                disabled={p === pages - 1}
                onClick={() => setPage(p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {renderDialog?.({
        row: editing,
        onClose: () => setEditing(undefined),
        onSave: async (r) => {
          await onSave?.(r);
          setEditing(undefined);
        },
      })}

      <Dialog
        open={!!confirm}
        onOpenChange={(o) => !o && (setConfirm(undefined), setConfirmError(undefined))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription className={cn(confirmError && "text-destructive")}>
              {confirmError ?? "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant={confirm?.label === "Delete" ? "destructive" : "default"}
              onClick={async () => {
                try {
                  await confirm?.run();
                  setConfirm(undefined);
                  setConfirmError(undefined);
                } catch (e) {
                  setConfirmError((e as Error).message);
                }
              }}
            >
              {confirm?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button variant="ghost" size="icon-sm" {...props}>
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

/** Form dialog shell with error line + Save / Cancel. */
export function FormShell({
  open,
  title,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (f: FormData) => Promise<unknown>;
  children: React.ReactNode;
}) {
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await onSubmit(new FormData(e.currentTarget));
              onClose();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Generic add / edit popup built from `fields`. */
function FormDialog<T>({
  title,
  fields,
  row,
  onClose,
  onSave,
}: {
  title: string;
  fields: DataField<T>[];
  row?: Partial<T>;
  onClose: () => void;
  onSave: (row: T) => Promise<void>;
}) {
  const isNew = !(row as { id?: string })?.id;
  const shown = fields.filter((f) => !f.on || f.on === (isNew ? "create" : "edit"));
  // Select values live in state so dependent `source`s can read them.
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      shown.map(({ key, options, source }) => [
        key,
        String(row?.[key] ?? (source ? "" : Object.keys(options ?? {})[0] ?? "")),
      ]),
    ),
  );
  const [error, setError] = React.useState<string>();

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const entries = shown.map(({ key, type }) => {
              const v = data.get(key) ?? "";
              const empty = v === "" || (v instanceof File && !v.size);
              return [key, empty && type ? undefined : type === "number" ? Number(v) : v];
            });
            try {
              await onSave({ ...row, ...Object.fromEntries(entries) } as T);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isNew ? "New" : "Edit"} {title}
            </DialogTitle>
            {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.options || f.source ? (
                  <SelectField
                    field={f}
                    values={values}
                    onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                  />
                ) : (
                  <Input
                    name={f.key}
                    type={f.type}
                    defaultValue={
                      f.type === "file" || row?.[f.key] == null ? undefined : String(row[f.key])
                    }
                    required={!f.optional}
                  />
                )}
              </Field>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelectField<T>({
  field,
  values,
  onChange,
}: {
  field: DataField<T>;
  values: Record<string, string>;
  onChange: (v: string) => void;
}) {
  const { key, source, options = {} } = field;
  const path = typeof source === "function" ? source(values) : source;
  const fetched = useOptions(path, options);
  return (
    <FilterSelect
      name={key}
      options={source ? fetched : options}
      value={values[key] || null}
      onValueChange={(v) => onChange(String(v))}
      disabled={!!source && !path}
    />
  );
}

/** DataTable wired to `useResource`: API via `adapter` when on, else `mock`. */
export function ResourceTable<T extends { id: string }>({
  adapter,
  mock,
  readOnly,
  actions,
  ...props
}: Omit<DataTableProps<T>, "items" | "loading" | "error" | "onSave" | "onDelete" | "load"> & {
  /** Omitted = no backend for this table, mock rows only. */
  adapter?: Adapter<T>;
  mock: T[];
  /** No add / edit / delete. */
  readOnly?: boolean;
}) {
  const { items, loading, error, save, remove, reload, live } = useResource(adapter, mock);
  const { can } = useAuth();
  const write = !readOnly && can(adapter?.perm, W);
  const after = <A extends unknown[]>(fn: (...a: A) => unknown) => async (...a: A) => (await fn(...a), reload());
  return (
    <DataTable
      {...props}
      items={items}
      loading={loading}
      error={error}
      onSave={save}
      onDelete={!readOnly && can(adapter?.perm, D) ? remove : undefined}
      fields={write ? props.fields : undefined}
      renderDialog={write ? props.renderDialog : undefined}
      load={live ? adapter?.get : undefined}
      actions={
        live
          ? actions
              ?.filter((a) => can(adapter?.perm, a.need ?? W))
              .map((a) => ({ ...a, onClick: a.confirm === false ? a.onClick : after(a.onClick) }))
          : undefined
      }
      bulk={live ? props.bulk?.map((b) => ({ ...b, onClick: after(b.onClick) })) : undefined}
    />
  );
}
