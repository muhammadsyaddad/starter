"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@repo/ui/ui/button";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { DataTable, FormShell, ResourceTable } from "@/components/data-table";
import { FilterSelect } from "@/components/overview/filter-select";
import { COMPANY_SOURCE } from "@/components/tables/ship-data";
import {
  BadgeOf,
  DATE_MDY,
  DATE_SHORT,
  avatar,
  badge,
  date,
  dueDateInfo,
  fmtDate,
  index,
  text,
} from "@/components/cells";
import { type Adapter, rest } from "@/lib/api";
import { type Raw, list, request, toForm, useOptions } from "@/lib/http";
import { DOC_STATUS, DOC_TYPE, labels } from "@/lib/enums";

// T32
export type Document = {
  id: string;
  doc_id: string;
  doc_type: keyof typeof DOC_TYPE;
  title: string;
  client: string;
  created_by_name: string;
  created_at: string;
  due_date: string;
  status: keyof typeof DOC_STATUS;
  required_docs: string[];
  user_can_edit: boolean;
  user_can_delete: boolean;
  deleted_at?: string;
  // Detail-only; sent back as-is on edit.
  date?: string;
  description?: string;
  client_id?: string;
  item_list?: Item[];
  is_public?: boolean;
  reimbursement?: string;
  extra?: Raw;
  files?: File[];
};

type Item = { id: string; name: string; qty: number; unit_price: number; total: number };

export const documents: Document[] = [
  { id: "1", doc_id: "DOC-001", doc_type: "FSR", title: "Field Service Report", client: "PT Demo Bahari", created_by_name: "Demo Admin", created_at: "2026-10-01", due_date: "2026-10-30", status: "ONGOING", required_docs: ["BA"], user_can_edit: true, user_can_delete: true },
  { id: "2", doc_id: "DOC-002", doc_type: "BA", title: "Berita Acara", client: "PT Contoh Samudra", created_by_name: "Demo Viewer", created_at: "2026-09-10", due_date: "2026-10-05", status: "FINISHED", required_docs: [], user_can_edit: false, user_can_delete: false },
];

const round2 = (n: number) => Math.round(n * 100) / 100;
/** Old rows store item_list as a JSON string. */
const items = (v: unknown): Item[] =>
  (typeof v === "string" ? JSON.parse(v || "[]") : (v ?? [])).map((x: Item, i: number) => ({ ...x, id: String(i) }));

const docFrom = (d: Raw): Document => ({
  ...d,
  due_date: d.due_date ?? "",
  required_docs: d.required_docs ?? [],
  item_list: d.item_list && items(d.item_list),
  extra: d,
});

// Multipart; JSON fields go as strings. Fields not in the form go back unchanged.
const docToApi = (d: Document) => {
  const rows = (d.item_list ?? []).filter((i) => i.name);
  const x = d.extra ?? {};
  return toForm({
    doc_id: d.doc_id || `${d.doc_type}-${format(new Date(), "ddMMyy")}-${crypto.randomUUID().slice(0, 8)}`,
    doc_type: d.doc_type,
    title: d.title,
    status: d.status,
    date: d.date,
    due_date: d.due_date,
    description: d.description,
    client: d.client,
    client_id: d.client_id,
    reimbursement: d.reimbursement,
    is_public: String(!!d.is_public),
    required_docs: JSON.stringify(d.required_docs),
    item_list: JSON.stringify(rows.map(({ name, qty, unit_price, total }) => ({ name, qty, unit_price, total }))),
    total_cost: round2(rows.reduce((s, i) => s + i.total, 0)),
    signings: JSON.stringify(x.signings ?? []),
    user_email: x.user_email,
    division: x.division,
    ship_name: x.ship_name,
    ship_id: x.ship_id,
    source_item: x.source_item,
    files: d.files,
  });
};

export const documentsApi = rest<Document>("documentation", "DOCUMENTATION", docFrom, {
  detail: true,
  method: "PUT",
  toApi: docToApi,
});

export const DocumentsTable = () => (
  <ResourceTable
    title="Documents"
    adapter={documentsApi}
    mock={documents}
    columns={[
      index("No"),
      text("doc_id", "Id"),
      badge("doc_type", "Type", DOC_TYPE),
      {
        header: "Name",
        sort: "title",
        cell: (d) => (
          <div className="flex flex-col">
            <Link href={`/documentation/${d.id}`} className="font-medium hover:underline">
              {d.title}
            </Link>
            <span className="text-xs text-muted-foreground">{d.client}</span>
          </div>
        ),
      },
      avatar("created_by_name", "Created By"),
      date("created_at", "Created At", DATE_MDY),
      {
        header: "Due Date",
        sort: "due_date",
        cell: (d) => (
          <div className="flex flex-col">
            {fmtDate(d.due_date, DATE_MDY)}
            <span className="text-xs text-muted-foreground">
              {dueDateInfo(d.due_date, d.status)}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        cell: (d) => (
          <span className="inline-flex items-center gap-1">
            <BadgeOf value={d.status} e={DOC_STATUS} />
            {d.required_docs.length > 0 && d.status !== "FINISHED" && (
              <WarningIcon className="size-4 text-warning" aria-label="Missing required docs" />
            )}
          </span>
        ),
      },
    ]}
    search={(d) => `${d.doc_id} ${d.title} ${d.client}`}
    placeholder="Search documents..."
    can={(d, action) => (action === "edit" ? d.user_can_edit : d.user_can_delete)}
    renderDialog={(p) => <DocumentDialog key={p.row?.id ?? "new"} {...p} />}
    detailHref={(d) => `/documentation/${d.id}`}
    noun="entries"
    emptyLabel="No documents found"
  />
);

const day = (v?: string) => v?.slice(0, 10);

// G3 — document form with item grid.
function DocumentDialog({
  row,
  onClose,
  onSave,
}: {
  row?: Partial<Document>;
  onClose: () => void;
  onSave: (d: Document) => Promise<void>;
}) {
  const clients = useOptions(row ? COMPANY_SOURCE : undefined);
  const [client, setClient] = React.useState(row?.client_id ?? "");
  const blank = () => ({ id: crypto.randomUUID(), name: "", qty: 1, unit_price: 0, total: 0 });
  const [rows, setRows] = React.useState<Item[]>(() => (row?.item_list?.length ? row.item_list : [blank()]));
  const set = (i: number, patch: Partial<Item>) =>
    setRows((r) =>
      r.map((x, j) => {
        if (j !== i) return x;
        const n = { ...x, ...patch };
        return { ...n, total: round2(n.qty * n.unit_price) };
      }),
    );

  return (
    <FormShell
      open={!!row}
      title={`${row?.id ? "Edit" : "New"} Document`}
      onClose={onClose}
      onSubmit={(f) => {
        const v = (k: string) => String(f.get(k) ?? "");
        return onSave({
          ...(row as Document),
          doc_type: v("doc_type") as Document["doc_type"],
          title: v("title"),
          status: v("status") as Document["status"],
          date: v("date"),
          due_date: v("due_date"),
          description: v("description"),
          client_id: client,
          client: clients[client] ?? row?.client ?? "",
          reimbursement: v("reimbursement"),
          is_public: f.get("is_public") === "on",
          required_docs: list(v("required_docs")),
          item_list: rows,
          files: f.getAll("files") as File[],
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Type">
          <FilterSelect<string> name="doc_type" options={labels(DOC_TYPE)} defaultValue={row?.doc_type ?? "FSR"} />
        </Field>
        <Field label="Title" className="sm:col-span-2">
          <Input name="title" defaultValue={row?.title} required />
        </Field>
        <Field label="Status">
          <FilterSelect<string> name="status" options={labels(DOC_STATUS)} defaultValue={row?.status ?? "PENDING"} />
        </Field>
        <Field label="Date">
          <Input name="date" type="date" defaultValue={day(row?.date) ?? format(new Date(), "yyyy-MM-dd")} />
        </Field>
        <Field label="Due Date">
          <Input name="due_date" type="date" defaultValue={day(row?.due_date)} />
        </Field>
        <Field label="Client">
          <FilterSelect options={clients} value={client || null} onValueChange={setClient} />
        </Field>
        <Field label="Reimbursement">
          <FilterSelect<string> name="reimbursement" options={{ no: "No", yes: "Yes" }} defaultValue={row?.reimbursement ?? "no"} />
        </Field>
        <Field label="Required Docs (pisahkan koma)">
          <Input name="required_docs" defaultValue={row?.required_docs?.join(", ")} />
        </Field>
        <Field label="Description" className="sm:col-span-3">
          <Input name="description" defaultValue={row?.description} />
        </Field>
      </div>
      {rows.map((r, i) => (
        <div key={r.id} className="flex items-end gap-2">
          <Field label="Item Name" className="flex-1">
            <Input value={r.name} onChange={(e) => set(i, { name: e.target.value })} />
          </Field>
          <Field label="Qty" className="w-20">
            <Input type="number" min={1} value={r.qty} onChange={(e) => set(i, { qty: Number(e.target.value) })} />
          </Field>
          <Field label="Unit Price" className="w-32">
            <Input type="number" min={0} value={r.unit_price} onChange={(e) => set(i, { unit_price: Number(e.target.value) })} />
          </Field>
          <span className="w-28 pb-2 text-right text-sm">{r.total.toFixed(2)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={rows.length === 1}
            onClick={() => setRows((x) => x.filter((_, j) => j !== i))}
          >
            <TrashIcon />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between text-sm">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((x) => [...x, blank()])}>
          <PlusIcon /> Add Item
        </Button>
        Total Cost: {round2(rows.filter((r) => r.name).reduce((s, r) => s + r.total, 0)).toFixed(2)}
      </div>
      <div className="flex items-center gap-4">
        <Field label="Attachments" className="flex-1">
          <Input name="files" type="file" multiple />
        </Field>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input type="checkbox" name="is_public" defaultChecked={row?.is_public} /> Public
        </label>
      </div>
    </FormShell>
  );
}

// T36 — read-only item list of one document.
export const DocItemsTable = ({ rows, total }: { rows: unknown; total?: number }) => (
  <DataTable
    title={`Items · Total Cost ${(total ?? 0).toFixed(2)}`}
    items={items(rows)}
    columns={[
      text("name", "Item"),
      text("qty", "Qty"),
      { header: "Unit Price", cell: (i) => Number(i.unit_price).toFixed(2) },
      { header: "Total", cell: (i) => Number(i.total).toFixed(2) },
    ]}
    actionsHeader=""
    noun="items"
  />
);

// T33 — soft-deleted, purged after 30 days.
const timeLeft = (deleted?: string) => {
  const days = Math.floor((new Date(deleted ?? "").getTime() + 30 * 86400_000 - Date.now()) / 86400_000);
  return days < 0 ? "Pending permanent deletion" : days === 0 ? "Less than a day" : `${days} days`;
};

export const deletedApi = rest<Document>("documentation/deleted", "DOCUMENTATION", docFrom);
const restore = (d: Document) => request(`documentation/${d.id}/restore`, { method: "POST" });

export const DeletedDocumentsTable = () => (
  <ResourceTable
    title="Deleted Documents"
    adapter={deletedApi}
    mock={[]}
    readOnly
    actions={[{ label: "Restore", confirm: "Restore document?", onClick: restore }]}
    columns={[
      index("No"),
      text("doc_id", "Id"),
      badge("doc_type", "Type", DOC_TYPE),
      text("title", "Name"),
      avatar("created_by_name", "Created By"),
      date<Document>("deleted_at", "Deleted At", DATE_MDY),
      { header: "Time Left", cell: (d) => timeLeft(d.deleted_at) },
    ]}
    noun="entries"
    emptyLabel="Trash is empty"
  />
);

// T35 / T34 — one list feeds both tables.
type Template = {
  id: string;
  name: string;
  created_at: string;
  status: "published" | "draft";
  current_version: number;
};

const templates: Template[] = [
  { id: "1", name: "Field Service Report", created_at: "2026-08-01", status: "published", current_version: 3 },
  { id: "2", name: "Berita Acara", created_at: "2026-09-12", status: "draft", current_version: 0 },
];

const TEMPLATES = "templates";

/** Edits only touch the draft; publish makes a new version. */
const templatesApi: Adapter<Template> = {
  ...rest<Template>(TEMPLATES, "TEMPLATE_BUILDER", (t) => t),
  save: (t) =>
    t.id
      ? request(`${TEMPLATES}/${t.id}/draft`, { method: "PATCH", body: { name: t.name } })
      : request(TEMPLATES, { method: "POST", body: { name: t.name } }),
};

const publish = (t: Template) => request(`${TEMPLATES}/${t.id}/publish`, { method: "POST" });

export const TemplatesTable = () => (
  <ResourceTable
    title="All Templates"
    adapter={templatesApi}
    mock={templates}
    actions={[{ label: "Publish", confirm: "Publish template?", onClick: publish }]}
    columns={[text("name", "Template Name"), date("created_at", "Date", DATE_SHORT)]}
    addLabel="New Template"
    fields={[{ key: "name", label: "Template Name" }]}
    detailHref={(t) => `/documentation/template-builder/${t.id}/edit`}
    noun="templates"
    emptyLabel="No templates found."
  />
);

// T34
export const AvailableTemplatesTable = () => (
  <ResourceTable
    title="Available Templates"
    adapter={templatesApi}
    mock={templates}
    readOnly
    columns={[
      text("name", "Template Name"),
      text("status", "Status"),
      { header: "Version", cell: (t) => `v${t.current_version}` },
    ]}
    detailHref={(t) =>
      t.status === "published" ? `/documentation/generate/new?templateId=${t.id}` : undefined
    }
    noun="templates"
    emptyLabel="No templates found."
  />
);
