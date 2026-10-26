"use client";

import * as React from "react";
import { ResourceTable } from "@/components/data-table";
import { DATETIME, badge, date, index, join, text, truncate } from "@/components/cells";
import { FilterSelect } from "@/components/overview/filter-select";
import { useAdapter } from "@/components/detail";
import { type Adapter, keyed, rest } from "@/lib/api";
import { type Raw, cap, fetchAll, list, lower, request, useOptions } from "@/lib/http";
import { ACTIVE_INACTIVE, INSTALL_STATUS, SHIP_TYPE, labels } from "@/lib/enums";

const STATUS = labels(ACTIVE_INACTIVE);

/** Company -> ship selects for forms. */
export const COMPANY_SOURCE = "client/dropdown-company";
export const shipSource = (v: Record<string, string>) =>
  v.company_id ? `ship-data-management/dropdown-ship?company_id=${v.company_id}` : undefined;

// T15
type Company = {
  id: string;
  companyName: string;
  pic: string;
  phone: string;
  address: string;
  assets: number;
  status: "active" | "inactive";
  group_id?: string;
};

const companies: Company[] = [
  { id: "1", companyName: "PT Demo Bahari", pic: "PIC Demo", phone: "+62 000 0000", address: "", assets: 12, status: "active" },
  { id: "2", companyName: "PT Contoh Samudra", pic: "PIC Demo", phone: "+62 000 0001", address: "", assets: 3, status: "inactive" },
];

// `assets` = ship count (backend). group_id is create-only.
export const companiesApi = (groupId?: string) => rest<Company>(
  "client/companies",
  "COMPANY",
  (c) => ({
    id: c.id,
    companyName: c.name,
    pic: c.pic ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    assets: c.assets ?? 0,
    status: lower(c.status) as Company["status"],
  }),
  {
    toApi: (c) => ({
      name: c.companyName,
      pic: c.pic,
      phone: c.phone,
      address: c.address,
      status: cap(c.status),
      group_id: c.group_id || groupId,
    }),
    params: { group_id: groupId },
  },
);

/** `groupId` = only that group's companies (group detail page). */
export const CompaniesTable = ({ groupId }: { groupId?: string }) => (
  <ResourceTable
    title="Perusahaan"
    adapter={useAdapter(() => companiesApi(groupId), [groupId])}
    mock={companies}
    columns={[
      text("companyName", "Nama Perusahaan", true),
      text("pic", "PIC"),
      text("phone", "Phone"),
      text("assets", "Assets"),
      badge("status", "Status", ACTIVE_INACTIVE),
    ]}
    actionsHeader="Aksi"
    search={(c) => c.companyName}
    placeholder="Cari perusahaan..."
    filters={[{ key: "status", options: STATUS, allLabel: "All Status" }]}
    fields={[
      { key: "companyName", label: "Nama Perusahaan" },
      { key: "pic", label: "PIC", optional: true },
      { key: "phone", label: "Phone", optional: true },
      { key: "address", label: "Address", optional: true },
      { key: "status", label: "Status", options: STATUS },
      ...(groupId ? [] : [{ key: "group_id" as const, label: "Group", source: "client/dropdown-groups", on: "create" as const }]),
    ]}
    detailHref={(c) => `/ship-data/companies/${c.id}`}
    noun="perusahaan"
    emptyLabel="Tidak ada perusahaan yang ditemukan."
  />
);

// T16
type Group = {
  id: string;
  name: string;
  alias: string;
  city: string;
  telp: string;
  company_count: number;
  created_at: string;
  updated_at: string;
};

const groups: Group[] = [
  { id: "1", name: "Group Barat", alias: "GB", city: "Jakarta", telp: "", company_count: 4, created_at: "2026-03-01T08:00", updated_at: "2026-09-12T10:30" },
  { id: "2", name: "Group Timur", alias: "GT", city: "Surabaya", telp: "", company_count: 2, created_at: "2026-04-15T09:00", updated_at: "2026-10-01T14:00" },
];

export const groupsApi = rest<Group>("client/groups", "GROUP", (g) => g, {
  toApi: ({ name, alias, telp, city }) => ({ name, alias, telp, city }),
});

export const GroupsTable = () => (
  <ResourceTable
    title="Groups"
    adapter={groupsApi}
    mock={groups}
    columns={[
      index("No"),
      text("name", "Nama Group", true),
      text("alias", "Alias"),
      text("city", "Kota"),
      text("company_count", "Company Count"),
      date("created_at", "Created At", DATETIME),
      date("updated_at", "Updated At", DATETIME),
    ]}
    actionsHeader="Action"
    addLabel="Tambah Group"
    search={(g) => `${g.name} ${g.alias} ${g.city}`}
    placeholder="Cari group..."
    fields={[
      { key: "name", label: "Nama Group" },
      { key: "alias", label: "Alias", optional: true },
      { key: "telp", label: "Telp", optional: true },
      { key: "city", label: "Kota", optional: true },
    ]}
    detailHref={(g) => `/ship-data/groups/${g.id}`}
    noun="groups"
    emptyLabel="Tidak ada group yang ditemukan."
  />
);

// T17
type Ship = {
  id: string;
  name: string;
  alias: string;
  shipType: string;
  type: keyof typeof SHIP_TYPE;
  status: "active" | "inactive";
  totalDevice: number;
  companyName: string;
  // Detail-only (edit loads it); undefined = not sent, so a failed load can't wipe them.
  gsm_number?: string;
  imei_number?: string;
  telco_operator?: string;
};

const ships: Ship[] = [
  { id: "1", name: "KM Demo 1", alias: "KM Demo 1", shipType: "Tanker", type: "FMS", status: "active", totalDevice: 6, companyName: "PT Demo Bahari" },
  { id: "2", name: "KM Demo 2", alias: "KM Demo 2", shipType: "Tug Boat", type: "EMS", status: "inactive", totalDevice: 2, companyName: "PT Contoh Samudra" },
];

/** Ships of one company; the list has no company name, so it comes from the select. */
const shipsApi = (companyId: string, companyName: string): Adapter<Ship> => {
  const api = rest<Ship>(
    "ship-data-management/ships",
    "SHIP_MANAGEMENT",
    (s) => ({
      id: s.id,
      name: s.name,
      alias: s.alias,
      shipType: s.ship_type ?? "",
      type: String(s.type ?? "").toUpperCase() as Ship["type"],
      status: lower(s.status) as Ship["status"],
      totalDevice: s.total_device ?? 0,
      companyName,
      gsm_number: s.gsm_number,
      imei_number: s.imei_number,
      telco_operator: s.telco_operator,
    }),
    {
      params: { company_id: companyId },
      detail: true,
      toApi: (s) => ({
        name: s.name,
        alias: s.alias,
        ship_type: s.shipType,
        type: s.type,
        status: cap(s.status),
        company_id: companyId,
        gsm_number: s.gsm_number,
        imei_number: s.imei_number,
        telco_operator: s.telco_operator,
      }),
    },
  );
  return {
    ...api,
    list: keyed(["ship-data-management/ships", companyId], () => (companyId ? api.list() : Promise.resolve([]))),
  };
};

export function ShipsTable() {
  const companies = useOptions(COMPANY_SOURCE);
  const [picked, setPicked] = React.useState<string>();
  const companyId = picked ?? Object.keys(companies)[0] ?? "";
  const companyName = companies[companyId] ?? "";
  const adapter = React.useMemo(() => shipsApi(companyId, companyName), [companyId, companyName]);
  return (
    <ResourceTable
      title="Kapal"
      adapter={adapter}
      mock={ships}
      toolbar={
        Object.keys(companies).length > 0 && (
          <FilterSelect options={companies} value={companyId} onValueChange={setPicked} />
        )
      }
      columns={[
        text("alias", "Alias", true),
        text("shipType", "Tipe Kapal"),
        badge("type", "Type"),
        badge("status", "Status", ACTIVE_INACTIVE),
        text("totalDevice", "Total Device"),
      ]}
      actionsHeader="Action"
      search={(s) => `${s.alias} ${s.id} ${s.companyName}`}
      placeholder="Cari kapal..."
      filters={[
        { key: "status", options: STATUS, allLabel: "All Status" },
        { key: "type", options: SHIP_TYPE, allLabel: "All Type" },
      ]}
      fields={[
        { key: "name", label: "Nama Kapal" },
        { key: "alias", label: "Alias" },
        { key: "shipType", label: "Tipe Kapal", optional: true },
        { key: "type", label: "Type", options: SHIP_TYPE },
        { key: "status", label: "Status", options: STATUS },
        // Typed text: left empty = unchanged (not sent).
        { key: "gsm_number", label: "GSM Number", type: "text", optional: true },
        { key: "imei_number", label: "IMEI", type: "text", optional: true },
        { key: "telco_operator", label: "Telco Operator", type: "text", optional: true },
      ]}
      detailHref={(s) => `/ship-data/data-kapal/${s.id}`}
      noun="kapal"
      emptyLabel="Tidak ada kapal yang ditemukan."
    />
  );
}

// T23
type Installation = {
  id: string;
  installationId: string;
  shipName: string;
  companyName: string;
  company_id: string;
  ship_id: string;
  type: "FMS" | "EMS";
  startDate: string;
  finishDate: string;
  location: string;
  technicians: string[];
  equipment: string;
  status: keyof typeof INSTALL_STATUS;
  createdAt: string;
};

const installations: Installation[] = [
  { id: "1", installationId: "INS-001", shipName: "KM Demo 1", companyName: "PT Demo Bahari", company_id: "", ship_id: "", type: "FMS", startDate: "2026-10-01", finishDate: "2026-10-03", location: "Tanjung Priok", technicians: ["Teknisi A", "Teknisi B"], equipment: "Flowmeter, PLC, GPS", status: "finish", createdAt: "2026-09-25T09:00" },
  { id: "2", installationId: "INS-002", shipName: "KM Demo 2", companyName: "PT Contoh Samudra", company_id: "", ship_id: "", type: "EMS", startDate: "2026-10-20", finishDate: "", location: "Tanjung Perak", technicians: ["Teknisi C"], equipment: "PLC", status: "scheduled", createdAt: "2026-10-10T13:00" },
];

// List lacks ship_id -> edit loads the detail. Dates are "YYYY-MM-DD".
const installationsRest = (shipId?: string) => rest<Installation>(
  "ship-data-management/installations",
  "INSTALLATION",
  (i) => ({
    id: i.id,
    installationId: i.installation_id || i.id,
    shipName: i.kapal,
    companyName: i.company_name,
    company_id: i.company_id ?? "",
    ship_id: i.ship_id ?? "",
    type: String(i.tipe ?? "").toUpperCase() as Installation["type"],
    startDate: i.start_date ?? "",
    finishDate: i.finish_date ?? "",
    location: i.lokasi ?? "",
    technicians: i.teknisi ?? [],
    equipment: i.devices ?? "",
    status: lower(i.status) as Installation["status"],
    createdAt: i.created_at,
  }),
  {
    params: { sort_order: "desc", ship_id: shipId },
    detail: true,
    toApi: (i) => ({
      company_id: i.company_id,
      ship_id: i.ship_id,
      tipe: i.type,
      start_date: i.startDate || undefined,
      finish_date: i.finishDate || undefined,
      lokasi: i.location,
      teknisi: list(i.technicians),
      devices: i.equipment,
      status: i.status,
    }),
  },
);
export const installationsApi = installationsRest();

export const InstallationsTable = () => (
  <ResourceTable
    title="Pemasangan"
    adapter={installationsApi}
    mock={installations}
    columns={[
      text("installationId", "ID", true),
      text("shipName", "KAPAL", true),
      text("companyName", "COMPANY", true),
      badge("type", "TIPE"),
      text("startDate", "MULAI", true),
      text("finishDate", "SELESAI", true),
      text("location", "LOKASI", true),
      join("technicians", "TEKNISI"),
      truncate("equipment", "DEVICES"),
      badge("status", "STATUS", INSTALL_STATUS, true),
      date("createdAt", "CREATED AT", DATETIME, true),
    ]}
    defaultSort={{ key: "startDate", desc: true }}
    actionsHeader="ACTION"
    addLabel="Tambah Pemasangan"
    search={(i) => `${i.installationId} ${i.shipName} ${i.companyName} ${i.location}`}
    placeholder="Cari pemasangan..."
    filters={[
      { key: "status", options: labels(INSTALL_STATUS), allLabel: "All" },
      { key: "type", options: SHIP_TYPE, allLabel: "All" },
    ]}
    fields={[
      { key: "company_id", label: "Company", source: COMPANY_SOURCE },
      { key: "ship_id", label: "Kapal", source: shipSource },
      { key: "type", label: "Tipe", options: SHIP_TYPE },
      { key: "startDate", label: "Mulai", type: "date", optional: true },
      { key: "finishDate", label: "Selesai", type: "date", optional: true },
      { key: "location", label: "Lokasi", optional: true },
      { key: "technicians", label: "Teknisi (pisahkan koma)", optional: true },
      { key: "equipment", label: "Devices", optional: true },
      { key: "status", label: "Status", options: labels(INSTALL_STATUS) },
    ]}
    detailHref={(i) => `/ship-data/data-pemasangan/${i.id}`}
    noun="pemasangan"
    emptyLabel="Tidak ada data pemasangan ditemukan."
  />
);

// T26
export type Alert = { id: string; clientId: string; alertKey: string; level: string };

export const alerts: Alert[] = [
  { id: "1", clientId: "KM Demo 1", alertKey: "FLOWMETER", level: "HIGH" },
  { id: "2", clientId: "KM Demo 2", alertKey: "GPS", level: "LOW" },
];

// Firing alerts cached by the backend; no history, no detail endpoint.
export const alertsApi: Adapter<Alert> = {
  ...rest<Alert>("ship-data-management/alerts", "PROBLEM", (a) => ({
    id: String(a.id),
    clientId: a.clientId,
    alertKey: a.alertKey,
    level: a.level,
  })),
  poll: 60_000,
};

export const ProblemsTable = () => (
  <ResourceTable
    title="Problem"
    adapter={alertsApi}
    mock={alerts}
    readOnly
    columns={[
      index("No"),
      text("clientId", "Kapal"),
      text("alertKey", "Kategori"),
      text("level", "Level"),
    ]}
    actionsHeader="Action"
    detailHref={(a) => `/ship-data/problem/${a.id}`}
    noun="alerts"
    emptyLabel="No alerts found."
  />
);

// T07 / T21 — no technician filter in the backend, so names are matched here.
export function InstallationRecords({ shipId, technician }: { shipId?: string; technician?: string }) {
  const adapter = useAdapter<Installation>(() => {
    const api = installationsRest(shipId);
    const who = lower(technician);
    return {
      ...api,
      list: keyed(["installation-records", shipId, technician], () =>
        api.list().then((rows) => rows.filter((r) => !who || r.technicians.some((t) => lower(t).includes(who)))),
      ),
    };
  }, [shipId, technician]);
  return (
    <ResourceTable
      title="Installation Records"
      adapter={adapter}
      mock={[]}
      readOnly
      columns={[
        text("startDate", "Date", true),
        text("shipName", "Ship/Client Name"),
        text("location", "Location"),
        badge("status", "Status", INSTALL_STATUS),
      ]}
      defaultSort={{ key: "startDate", desc: true }}
      search={(i) => `${i.shipName} ${i.startDate}`}
      placeholder="Search ship or date..."
      pageSize={5}
      detailHref={(i) => `/ship-data/data-pemasangan/${i.id}`}
      noun="records"
      emptyLabel="No installation records found."
    />
  );
}

// T18 / T19 — rows live under the ship, edits under ship-devices / ship-items.
type ShipDevice = { id: string; device_name: string; unique_id: string; device_status: "active" | "inactive" };
type ShipItem = { id: string; item_name: string; unique_id: string; status: "active" | "inactive" };

function shipChild<T extends { id: string }>(
  shipId: string,
  kind: "devices" | "items",
  fromApi: (r: Raw) => T,
  toApi: (r: T) => unknown,
): Adapter<T> {
  const base = rest<T>(`ship-data-management/ship-${kind}`, "SHIP_MANAGEMENT", fromApi, { toApi });
  const parent = `ship-data-management/ships/${shipId}/${kind}`;
  return {
    ...base,
    list: keyed([parent], () => fetchAll(parent).then((rows) => rows.map(fromApi))),
    save: (row) => (row.id ? base.save!(row) : request(parent, { method: "POST", body: toApi(row) })),
  };
}

export const ShipDevicesTable = ({ shipId }: { shipId: string }) => (
  <ResourceTable
    title="Devices"
    adapter={useAdapter(
      () =>
        shipChild<ShipDevice>(
          shipId,
          "devices",
          (d) => ({ ...d, device_status: lower(d.device_status) as ShipDevice["device_status"] }),
          ({ device_name, unique_id, device_status }) => ({ device_name, unique_id, device_status: cap(device_status) }),
        ),
      [shipId],
    )}
    mock={[]}
    columns={[
      text("device_name", "Device Name"),
      badge("device_status", "Status", ACTIVE_INACTIVE),
      text("unique_id", "Unique ID"),
    ]}
    addLabel="Add Device"
    fields={[
      { key: "device_name", label: "Device Name" },
      // Backend 500s on an empty or duplicate unique id.
      { key: "unique_id", label: "Unique ID" },
      { key: "device_status", label: "Status", options: STATUS },
    ]}
    noun="devices"
    emptyLabel="Belum ada device."
  />
);

export const ShipItemsTable = ({ shipId }: { shipId: string }) => (
  <ResourceTable
    title="Items"
    adapter={useAdapter(
      () =>
        shipChild<ShipItem>(
          shipId,
          "items",
          (i) => ({ ...i, status: lower(i.status) as ShipItem["status"] }),
          ({ item_name, unique_id, status }) => ({ item_name, unique_id, status: cap(status) }),
        ),
      [shipId],
    )}
    mock={[]}
    columns={[text("item_name", "Item Name"), badge("status", "Status", ACTIVE_INACTIVE), text("unique_id", "Unique ID")]}
    addLabel="Add Item"
    fields={[
      { key: "item_name", label: "Item Name" },
      { key: "unique_id", label: "Unique ID" },
      { key: "status", label: "Status", options: STATUS },
    ]}
    detailHref={(i) => `/ship-data/data-kapal/${shipId}/items/${i.id}`}
    noun="items"
    emptyLabel="Belum ada item."
  />
);

// T20 — on-loan tool transactions for this ship.
type ShipTool = { id: string; tool_name: string; borrower_name: string; quantity_borrowed: number; borrowed_at: string };

export const ShipBorrowedToolsTable = ({ shipId }: { shipId: string }) => (
  <ResourceTable
    title="Borrowed Tools"
    adapter={useAdapter<ShipTool>(
      () => ({ perm: "SHIP_MANAGEMENT", list: keyed([`ship-data-management/ships/${shipId}/borrowed-tools`], () => fetchAll(`ship-data-management/ships/${shipId}/borrowed-tools`)) }),
      [shipId],
    )}
    mock={[]}
    readOnly
    columns={[
      text("tool_name", "Tool Name"),
      text("borrower_name", "Borrower"),
      text("quantity_borrowed", "Qty"),
      date("borrowed_at", "Borrowed At", DATETIME),
    ]}
    noun="tools"
    emptyLabel="Tidak ada alat yang sedang dipinjam."
  />
);
