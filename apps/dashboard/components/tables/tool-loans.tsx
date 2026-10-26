"use client";

import * as React from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@repo/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/ui/dialog";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { DataTable, FormShell, ResourceTable, type DataAction } from "@/components/data-table";
import { DATETIME, DATE_DMY, badge, date, text } from "@/components/cells";
import { useAdapter } from "@/components/detail";
import { FilterSelect } from "@/components/overview/filter-select";
import { COMPANY_SOURCE } from "@/components/tables/ship-data";
import { type Adapter, keyed, useResource } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { type Raw, fetchAll, img, lower, request, toForm, useFetch, useOptions } from "@/lib/http";
import { TX_STATUS } from "@/lib/enums";

// Shared tool transaction row (T06 T11 T14).
type Tx = {
  id: string;
  tool_name: string;
  borrower_name: string;
  quantity_borrowed: number;
  borrowDate: string;
  returnDate: string;
  status: keyof typeof TX_STATUS;
  note: string;
  borrowPhotos: string[];
  returnPhotos: string[];
  tab: "Current" | "History";
};

const HISTORY = ["returned", "returned_broke", "return_rejected", "declined"];

/** New `photos[]`, else the legacy single url. */
const photos = (t: Raw, type: "borrow" | "return") => {
  const p = (t.photos ?? []).filter((x: Raw) => x.type === type).map((x: Raw) => img(x.photo_url));
  return p.length ? p : t[`${type}_photo_url`] ? [img(t[`${type}_photo_url`])] : [];
};

const txFrom = (t: Raw): Tx => ({
  id: t.id,
  tool_name: t.tool_name,
  borrower_name: t.borrower_name,
  quantity_borrowed: t.quantity_borrowed,
  borrowDate: t.borrow_date ?? t.borrowed_at ?? "",
  returnDate: t.return_date ?? t.returned_at ?? "",
  status: t.status,
  note: [t.detail, t.responsible].filter(Boolean).join(" · "),
  borrowPhotos: photos(t, "borrow"),
  returnPhotos: photos(t, "return"),
  tab: HISTORY.includes(t.status) ? "History" : "Current",
});

const photoCell = {
  header: "Photos",
  cell: (t: Tx) => (
    <span className="flex gap-2 text-xs">
      {[...t.borrowPhotos.map((u) => ["Borrow", u]), ...t.returnPhotos.map((u) => ["Return", u])].map(
        ([k, u]) => (
          <a key={u} href={u} target="_blank" rel="noreferrer" className="underline">
            {k}
          </a>
        ),
      )}
    </span>
  ),
};

// T11
export const ToolTransactionsTable = ({ toolId }: { toolId: string }) => (
  <ResourceTable
    title="Transaction History"
    adapter={useAdapter<Tx>(
      () => {
        const path = `inventory/tools/${toolId}/transactions`;
        return { list: keyed([path], () => fetchAll(path).then((r) => r.map(txFrom))) };
      },
      [toolId],
    )}
    mock={[]}
    readOnly
    columns={[
      text("borrower_name", "Borrower"),
      date("borrowDate", "Borrow Date", DATETIME),
      date("returnDate", "Return Date", DATETIME),
      text("quantity_borrowed", "Quantity"),
      badge("status", "Status", TX_STATUS),
      photoCell,
    ]}
    noun="transactions"
    emptyLabel="No transactions found for this tool."
  />
);

// T12 / T13
export type BorrowRequest = {
  id: string;
  borrower_name: string;
  created_at: string;
  items: number;
  status: keyof typeof TX_STATUS;
  txs: Tx[];
};

const requestFrom = (r: Raw): BorrowRequest => ({
  id: r.id,
  borrower_name: r.borrower_name,
  created_at: r.created_at,
  items: (r.transactions ?? []).length,
  status: r.status, // computed by the backend
  txs: (r.transactions ?? []).map(txFrom),
});

export const requestsApi = (mine?: boolean): Adapter<BorrowRequest> => ({
  perm: "TOOLS",
  list: keyed(["tool-requests", !!mine], () =>
    fetchAll(mine ? "inventory/tools/my-borrowings" : "inventory/tools/requests").then((r) =>
      r.map(requestFrom),
    ),
  ),
});

// T06 — no per-user endpoint: match the free-text borrower name. 403 = empty.
export const UserBorrowedToolsTable = ({ name }: { name: string }) => (
  <ResourceTable
    title="Borrowed Tools"
    adapter={useAdapter<Tx>(
      () => ({
        list: keyed(["user-borrowed-tools", name], () =>
          requestsApi()
            .list()
            .then((rs) =>
              rs.flatMap((r) => r.txs).filter((t) => lower(t.borrower_name).includes(lower(name))),
            )
            .catch(() => []),
        ),
      }),
      [name],
    )}
    mock={[]}
    readOnly
    columns={[
      text("tool_name", "Tool Name"),
      text("quantity_borrowed", "Quantity"),
      date("borrowDate", "Borrow Date", DATE_DMY, true),
      date("returnDate", "Return Date", DATE_DMY),
      badge("status", "Status", TX_STATUS),
    ]}
    filters={[{ key: "tab", options: { Current: "Current", History: "History" }, allLabel: "All" }]}
    search={(t) => `${t.tool_name} ${t.borrowDate}`}
    placeholder="Search tools or date..."
    pageSize={5}
    noun="tools"
    emptyLabel="No tool records found."
  />
);

const TX = "inventory/tools/transactions";
const act = (id: string, action: string, body?: unknown) =>
  request(`${TX}/${id}/${action}`, { method: "POST", body });

/** Approve / decline every actionable transaction of the requests. */
const decideAll = (txs: Tx[], approve: boolean) =>
  Promise.all(
    txs.map((t) =>
      t.status === "pending"
        ? act(t.id, approve ? "approve_borrow" : "decline_borrow")
        : t.status === "return_pending"
          ? act(t.id, "approve_return", { status: approve ? "returned" : "return_rejected" })
          : undefined,
    ),
  );

const ADMIN_PICK = ["pending", "return_pending"];
const RETURNABLE = ["on_loan", "return_rejected", "return_pending"];
const is =
  (...s: string[]) =>
  (t: Tx) =>
    s.includes(t.status);

/** Loan requests (admin, TOOLS/X) or my borrowings (`mine`). */
export function BorrowRequests({ mine }: { mine?: boolean }) {
  const adapter = React.useMemo(() => requestsApi(mine), [mine]);
  const { items, loading, error, reload } = useResource(adapter, []);
  const [open, setOpen] = React.useState<string>();
  const done =
    <A extends unknown[]>(fn: (...a: A) => Promise<unknown>) =>
    async (...a: A) => (await fn(...a), reload());

  return (
    <>
      <DataTable
        title={mine ? "My Borrowings" : "Loan Requests"}
        items={items}
        loading={loading}
        error={error}
        columns={[
          text("borrower_name", "Borrower", !mine),
          date("created_at", "Request Date", DATETIME, true),
          text("items", "Items"),
          badge("status", "Status", TX_STATUS),
        ]}
        defaultSort={{ key: "created_at", desc: true }}
        search={(r) => (mine ? r.txs.map((t) => t.tool_name).join(" ") : r.borrower_name)}
        placeholder={mine ? "Search tools..." : "Search requests..."}
        filters={[
          {
            key: "status",
            options: Object.fromEntries(Object.entries(TX_STATUS).map(([k, [l]]) => [k, l])),
            allLabel: "All Status",
          },
        ]}
        select={mine ? undefined : (r) => r.txs.some(is(...ADMIN_PICK))}
        bulk={[
          {
            label: "Approve Selected",
            onClick: done((rs: BorrowRequest[]) =>
              decideAll(
                rs.flatMap((r) => r.txs),
                true,
              ),
            ),
          },
          {
            label: "Decline Selected",
            onClick: done((rs: BorrowRequest[]) =>
              decideAll(
                rs.flatMap((r) => r.txs),
                false,
              ),
            ),
          },
        ]}
        actions={[{ label: "View Details", confirm: false, onClick: (r) => setOpen(r.id) }]}
        addLabel="Borrow"
        renderDialog={
          mine ? (p) => <BorrowDialog open={!!p.row} onClose={p.onClose} onDone={reload} /> : undefined
        }
        noun="items"
      />
      <TxDialog
        request={items.find((r) => r.id === open)}
        admin={!mine}
        onClose={() => setOpen(undefined)}
        onDone={reload}
      />
    </>
  );
}

// T14
function TxDialog({
  request: req,
  admin,
  onClose,
  onDone,
}: {
  request?: BorrowRequest;
  admin: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [returning, setReturning] = React.useState<Tx[]>();
  const run = (fn: (t: Tx) => Promise<unknown>) => async (t: Tx) => (await fn(t), onDone());
  const a = (
    label: string,
    visible: (t: Tx) => boolean,
    fn: (t: Tx) => Promise<unknown>,
  ): DataAction<Tx> => ({
    label,
    visible,
    onClick: run(fn),
  });
  const actions = admin
    ? [
        a("Approve Borrow", is("pending", "declined"), (t) => act(t.id, "approve_borrow")),
        a("Decline Borrow", is("pending", "on_loan"), (t) => act(t.id, "decline_borrow")),
        a("Approve Return", is("return_pending", "return_rejected", "returned_broke"), (t) =>
          act(t.id, "approve_return", { status: "returned" }),
        ),
        a("Decline Return", is("return_pending", "returned", "returned_broke"), (t) =>
          act(t.id, "approve_return", { status: "return_rejected" }),
        ),
        a("Broken/Missing", is("return_pending", "returned", "return_rejected"), (t) =>
          act(t.id, "approve_return", { status: "returned_broke" }),
        ),
      ]
    : [
        // Cancel deletes the transaction.
        a("Cancel", is("pending"), (t) => act(t.id, "cancel")),
        {
          label: "Return",
          visible: is(...RETURNABLE),
          confirm: false as const,
          onClick: (t: Tx) => setReturning([t]),
        },
      ];

  return (
    <>
      <Dialog open={!!req} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Request by {req?.borrower_name}</DialogTitle>
          </DialogHeader>
          <DataTable
            title="Items"
            items={req?.txs ?? []}
            columns={[
              text("tool_name", "Tool Name"),
              text("quantity_borrowed", "Qty"),
              {
                header: "Status",
                cell: (t) => (
                  <div className="flex flex-col gap-1">
                    {badge<Tx>("status", "", TX_STATUS).cell(t, 0)}
                    <span className="text-xs text-muted-foreground">{t.note}</span>
                  </div>
                ),
              },
              photoCell,
            ]}
            select={admin ? is(...ADMIN_PICK) : is(...RETURNABLE)}
            bulk={
              admin
                ? [
                    {
                      label: "Approve Selected",
                      onClick: async (ts: Tx[]) => (await decideAll(ts, true), onDone()),
                    },
                    {
                      label: "Decline Selected",
                      onClick: async (ts: Tx[]) => (await decideAll(ts, false), onDone()),
                    },
                  ]
                : [{ label: "Return Selected", onClick: (ts: Tx[]) => setReturning(ts) }]
            }
            actions={actions}
            pageSize={50}
          />
        </DialogContent>
      </Dialog>
      <ReturnDialog txs={returning} onClose={() => setReturning(undefined)} onDone={onDone} />
    </>
  );
}

// G2 — per-transaction return (TOOLS/R); the bulk endpoint needs TOOLS/X.
function ReturnDialog({
  txs,
  onClose,
  onDone,
}: {
  txs?: Tx[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <FormShell
      open={!!txs}
      title="Return Tools"
      onClose={onClose}
      onSubmit={async (f) => {
        const files = f.getAll("return_photos").filter((x) => x instanceof File && x.size);
        for (const t of txs ?? []) {
          const condition = String(f.get(`condition-${t.id}`));
          await request(`${TX}/${t.id}/return`, {
            method: "POST",
            body: toForm({
              quantity_returned: t.quantity_borrowed,
              condition,
              detail: f.get(`detail-${t.id}`),
              responsible: f.get(`responsible-${t.id}`),
              return_photos: files,
            }),
          });
        }
        await onDone();
      }}
    >
      {txs?.map((t) => (
        <div key={t.id} className="grid gap-2 sm:grid-cols-4">
          <Field label="Tool">
            <Input value={`${t.tool_name} × ${t.quantity_borrowed}`} readOnly />
          </Field>
          <Field label="Condition">
            <FilterSelect<string>
              name={`condition-${t.id}`}
              defaultValue="good"
              options={{ good: "Good", broken: "Broken" }}
            />
          </Field>
          <Field label="Detail">
            <Input name={`detail-${t.id}`} />
          </Field>
          <Field label="Responsible">
            <Input name={`responsible-${t.id}`} />
          </Field>
        </div>
      ))}
      <Field label="Return Photos (required unless broken)">
        <Input name="return_photos" type="file" accept="image/*" multiple />
      </Field>
    </FormShell>
  );
}

// G1
function BorrowDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const { user } = useAuth();
  const { data: tools = [] } = useFetch<{ id: string; name: string; qty: number }[]>(
    open ? "inventory/tools/simple" : undefined,
  );
  const clients = useOptions(open ? COMPANY_SOURCE : undefined);
  const [client, setClient] = React.useState("");
  const [ship, setShip] = React.useState("");
  const ships = useOptions(client ? `ship-data-management/dropdown-ship?company_id=${client}` : undefined);
  const [rows, setRows] = React.useState([{ key: 0, tool_id: "", quantity: 1 }]);
  const toolOptions = Object.fromEntries(
    (tools ?? []).map((t) => [t.id, t.qty > 0 ? `${t.name} (${t.qty})` : `${t.name} (Unavailable)`]),
  );
  const set = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <FormShell
      open={open}
      title="Borrow Tools"
      onClose={onClose}
      onSubmit={async (f) => {
        const items = rows.filter((r) => r.tool_id && r.quantity > 0);
        if (!items.length) throw new Error("Pick at least one tool.");
        if (items.some((r) => (tools ?? []).find((t) => t.id === r.tool_id)!.qty < r.quantity))
          throw new Error("Quantity exceeds what is available.");
        const body = toForm({
          borrower_name: f.get("borrower_name"),
          client_id: client,
          client_name: clients[client],
          ship_id: ship,
          ship_name: ships[ship],
          borrow_photos: f.getAll("borrow_photos"),
          ...Object.fromEntries(
            items.flatMap((r, i) => [
              [`items[${i}].tool_id`, r.tool_id],
              [`items[${i}].quantity`, r.quantity],
            ]),
          ),
        });
        await request("inventory/tools/borrow-request", { method: "POST", body });
        await onDone();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Borrower">
          <Input name="borrower_name" defaultValue={user?.fullName || user?.username} required />
        </Field>
        <Field label="Client">
          <FilterSelect
            options={clients}
            value={client || null}
            onValueChange={(v) => (setClient(v), setShip(""))}
          />
        </Field>
        <Field label="Ship">
          <FilterSelect options={ships} value={ship || null} onValueChange={setShip} disabled={!client} />
        </Field>
      </div>
      {rows.map((r, i) => (
        <div key={r.key} className="flex items-end gap-2">
          <Field label="Tool Name" className="flex-1">
            <FilterSelect
              options={toolOptions}
              value={r.tool_id || null}
              onValueChange={(v) => set(i, { tool_id: v })}
            />
          </Field>
          <Field label="Qty" className="w-24">
            <Input
              type="number"
              min={1}
              value={r.quantity}
              onChange={(e) => set(i, { quantity: Number(e.target.value) })}
            />
          </Field>
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => setRows((x) => [...x, { key: Date.now(), tool_id: "", quantity: 1 }])}
      >
        <PlusIcon /> Add Item
      </Button>
      <Field label="Borrow Photos">
        <Input name="borrow_photos" type="file" accept="image/*" multiple required />
      </Field>
    </FormShell>
  );
}
