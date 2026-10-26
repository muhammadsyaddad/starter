"use client";

import { ResourceTable } from "@/components/data-table";
import { DATETIME, badge, date, join, text, truncate } from "@/components/cells";
import { COMPANY_SOURCE, shipSource } from "@/components/tables/ship-data";
import { useAdapter } from "@/components/detail";
import { type Adapter, keyed, rest } from "@/lib/api";
import { fetchAll, list, lower, request } from "@/lib/http";
import { ACTIVE_INACTIVE, MAINT_CHANNEL, MAINT_STATUS, MAINT_TYPE, labels } from "@/lib/enums";

// T25 — `id` = MTN short id; the backend's :maintenance_id routes take only that.
export type Maintenance = {
  id: string;
  company_id: string;
  ship_id: string;
  shipName: string;
  problemDescription: string;
  type: keyof typeof MAINT_TYPE;
  technicians: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  status: keyof typeof MAINT_STATUS;
  channel: keyof typeof MAINT_CHANNEL;
};

const STATUS_BY_CHANNEL = {
  remote: ["in_queue", "in_progress", "completed", "canceled"],
  dispatch: ["in_progress", "scheduled", "completed", "canceled"],
} as const;

export const maintenance: Maintenance[] = [
  { id: "MT-001", company_id: "", ship_id: "", shipName: "KM Demo 1", problemDescription: "Flowmeter tidak mengirim data sejak pagi", type: "CORRECTIVE", technicians: ["Teknisi A"], startDate: "2026-10-20", endDate: "2026-10-21", createdAt: "2026-10-20T07:30", status: "completed", channel: "remote" },
  { id: "MT-002", company_id: "", ship_id: "", shipName: "KM Demo 2", problemDescription: "Pengecekan rutin PLC", type: "PREVENTIVE", technicians: ["Teknisi B", "Teknisi C"], startDate: "2026-10-25", endDate: "", createdAt: "2026-10-18T10:00", status: "in_progress", channel: "remote" },
];

const PATH = "ship-data-management/maintenances";

/** Status is set by the backend on create (in_queue / scheduled). No channel = both. */
export const maintenanceApi = (channel?: "remote" | "dispatch", shipId?: string) =>
  rest<Maintenance>(
    PATH,
    "MAINTENANCE",
    (m) => ({
      id: m.maintenance_id,
      company_id: m.company_id ?? "",
      ship_id: m.ship_id ?? "",
      shipName: m.kapal,
      problemDescription: m.problem ?? "",
      type: m.tipe,
      technicians: m.teknisi ?? [],
      startDate: m.mulai ?? "",
      endDate: m.selesai ?? "",
      createdAt: m.created_at,
      status: m.status,
      channel: m.maintenance_type,
    }),
    {
      params: { maintenance_type: channel, sort_order: "desc", ship_id: shipId },
      toApi: (m) => ({
        company_id: m.company_id,
        ship_id: m.ship_id,
        problem: m.problemDescription,
        tipe: m.type,
        teknisi: list(m.technicians),
        mulai: m.startDate || undefined,
        selesai: m.endDate || undefined,
        status: m.id ? m.status : undefined,
        maintenance_type: m.id ? undefined : channel,
      }),
    },
  );
export const maintenanceApis = { remote: maintenanceApi("remote"), dispatch: maintenanceApi("dispatch") };

/** Moves a remote report to dispatch in place (backend sets status scheduled). */
const forward = (m: Maintenance) =>
  request(`${PATH}/${m.id}`, { method: "PATCH", body: { maintenance_type: "dispatch" } });

export const MaintenanceTable = ({ type }: { type: "remote" | "dispatch" }) => {
  const statusOptions = Object.fromEntries(
    STATUS_BY_CHANNEL[type].map((s) => [s, MAINT_STATUS[s][0]]),
  );
  return (
    <ResourceTable
      title="Maintenance"
      adapter={maintenanceApis[type]}
      mock={maintenance}
      actions={
        type === "remote"
          ? [
              {
                label: "Forward",
                confirm: "Teruskan Laporan ke Dispatch?",
                visible: (m) => m.status !== "forwarded" && m.status !== "completed",
                onClick: forward,
              },
            ]
          : undefined
      }
      columns={[
        text("id", "ID", true),
        text("shipName", "Kapal", true),
        truncate("problemDescription", "Problem"),
        badge("type", "Tipe", MAINT_TYPE),
        join("technicians", "Teknisi"),
        text("startDate", "Mulai"),
        text("endDate", "Selesai"),
        date("createdAt", "Created At", DATETIME, true),
        badge("status", "Status", MAINT_STATUS),
      ]}
      actionsHeader="Action"
      addLabel="Tambah Maintenance"
      search={(m) => `${m.id} ${m.shipName} ${m.problemDescription}`}
      placeholder="Cari maintenance..."
      filters={[
        { key: "status", options: statusOptions, allLabel: "All" },
        { key: "type", options: labels(MAINT_TYPE), allLabel: "All" },
      ]}
      fields={[
        { key: "company_id", label: "Company", source: COMPANY_SOURCE },
        { key: "ship_id", label: "Kapal", source: shipSource },
        { key: "problemDescription", label: "Problem" },
        { key: "type", label: "Tipe", options: labels(MAINT_TYPE) },
        { key: "technicians", label: "Teknisi (pisahkan koma)" },
        { key: "status", label: "Status", options: statusOptions, on: "edit" },
        { key: "startDate", label: "Mulai", type: "date", optional: true },
        { key: "endDate", label: "Selesai", type: "date", optional: true },
      ]}
      detailHref={(m) => `/maintenance/${type}/${m.id}`}
      noun="entries"
    />
  );
};

// T08 / T22 — no technician filter in the backend, so names are matched here.
export function MaintenanceRecords({ shipId, technician }: { shipId?: string; technician?: string }) {
  const adapter = useAdapter(() => {
    const api = maintenanceApi(undefined, shipId);
    const who = lower(technician);
    return {
      ...api,
      list: keyed(["maintenance-records", shipId, technician], () =>
        api.list().then((rows) => rows.filter((r) => !who || r.technicians.some((t) => lower(t).includes(who)))),
      ),
    };
  }, [shipId, technician]);
  return (
    <ResourceTable
      title="Maintenance Records"
      adapter={adapter}
      mock={[]}
      readOnly
      columns={[
        text("startDate", "Date", true),
        text("shipName", "Ship/Client Name"),
        badge("channel", "Type", MAINT_CHANNEL),
        truncate("problemDescription", "Problem"),
        badge("status", "Status", MAINT_STATUS),
      ]}
      defaultSort={{ key: "startDate", desc: true }}
      search={(m) => `${m.shipName} ${m.startDate}`}
      placeholder="Search ship or date..."
      pageSize={5}
      detailHref={(m) => `/maintenance/${m.channel}/${m.id}`}
      noun="records"
      emptyLabel="No maintenance records found."
    />
  );
}

// T24 GSM — no connectivity backend: read GSM fields off each ship's detail
// (the ship list lacks them). Edit them on the ship.
type Gsm = {
  id: string;
  name: string;
  companyName: string;
  gsm_number: string;
  imei_number: string;
  telco_operator: string;
  status: "active" | "inactive";
};

const gsmMock: Gsm[] = [
  { id: "1", name: "KM Demo 1", companyName: "PT Demo Bahari", gsm_number: "0800000001", imei_number: "350000000000001", telco_operator: "Telkomsel", status: "active" },
  { id: "2", name: "KM Demo 2", companyName: "PT Contoh Samudra", gsm_number: "0800000002", imei_number: "", telco_operator: "XL", status: "inactive" },
];

const SHIPS = "ship-data-management/ships";
export const gsmApi: Adapter<Gsm> = {
  perm: "SHIP_MANAGEMENT",
  list: async () => {
    const ships = await fetchAll(SHIPS);
    const details = await Promise.all(ships.map((s) => request(`${SHIPS}/${s.id}`).then((r) => r.data)));
    return details
      .filter((s) => s.gsm_number || s.imei_number)
      .map((s) => ({
        id: s.id,
        name: s.alias || s.name,
        companyName: s.company_name ?? "",
        gsm_number: s.gsm_number ?? "",
        imei_number: s.imei_number ?? "",
        telco_operator: s.telco_operator ?? "",
        status: lower(s.status) as Gsm["status"],
      }));
  },
};

export const GsmTable = () => (
  <ResourceTable
    title="GSM"
    adapter={gsmApi}
    mock={gsmMock}
    readOnly
    columns={[
      text("name", "Kapal", true),
      text("companyName", "Company", true),
      text("gsm_number", "GSM Number"),
      text("imei_number", "IMEI"),
      text("telco_operator", "Telco Operator", true),
      badge("status", "Status", ACTIVE_INACTIVE),
    ]}
    actionsHeader="Action"
    search={(g) => `${g.name} ${g.companyName} ${g.gsm_number} ${g.imei_number}`}
    placeholder="Filter GSM nodes..."
    filters={[{ key: "status", options: labels(ACTIVE_INACTIVE), allLabel: "All Status" }]}
    detailHref={(g) => `/ship-data/data-kapal/${g.id}`}
    noun="GSM entries"
    emptyLabel="Belum ada kapal dengan nomor GSM."
  />
);

// T24 VPN — no backend anywhere yet, mock only.
type Connectivity = {
  id: string;
  name: string;
  ip: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

const nodes: Connectivity[] = [
  { id: "1", name: "node-01", ip: "10.0.0.1", status: "active", createdAt: "2026-08-01", updatedAt: "2026-10-01" },
  { id: "2", name: "node-02", ip: "10.0.0.2", status: "inactive", createdAt: "2026-08-15", updatedAt: "2026-09-20" },
];

export const ConnectivityTable = ({ label }: { label: "GSM" | "VPN" }) => (
  <ResourceTable
    title={label}
    mock={nodes}
    columns={[
      text("id", "ID"),
      text("name", `${label} Name`),
      text("ip", `${label} IP`),
      badge("status", "Status", ACTIVE_INACTIVE),
      text("createdAt", "Created At"),
      text("updatedAt", "Updated At"),
    ]}
    actionsHeader="Action"
    addLabel={`Add ${label}`}
    search={(c) => `${c.name} ${c.ip}`}
    placeholder={`Filter ${label} nodes...`}
    filters={[{ key: "status", options: labels(ACTIVE_INACTIVE), allLabel: "All Status" }]}
    fields={[
      { key: "name", label: `${label} Name` },
      { key: "ip", label: `${label} IP` },
      { key: "status", label: "Status", options: labels(ACTIVE_INACTIVE) },
    ]}
    noun={`${label} entries`}
    emptyLabel="No entries found matching your search."
  />
);
