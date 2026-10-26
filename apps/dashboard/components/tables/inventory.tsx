"use client";

import { ResourceTable } from "@/components/data-table";
import { dot, idr, index, text, truncate } from "@/components/cells";
import { rest } from "@/lib/api";
import { cap, img, lower, toForm } from "@/lib/http";
import { ACTIVE_INACTIVE, AVAILABILITY, labels } from "@/lib/enums";

// T09 — price / details only come with the detail fetch.
type Device = {
  id: string;
  id_device: string;
  name: string;
  qty: number;
  price?: number;
  details?: string;
  status: "active" | "inactive";
};

const devices: Device[] = [
  { id: "1", id_device: "DEV-001", name: "Flowmeter", qty: 10, status: "active" },
  { id: "2", id_device: "DEV-002", name: "GPS Tracker", qty: 0, status: "inactive" },
];

export const devicesApi = rest<Device>(
  "inventory/devices",
  "DEVICE",
  (d) => ({ ...d, status: lower(d.status) as Device["status"] }),
  {
    detail: true,
    toApi: ({ id_device, name, qty, price, details, status }) => ({
      id_device, name, qty, price, details, status: cap(status),
    }),
  },
);

export const DevicesTable = () => (
  <ResourceTable
    title="Devices"
    adapter={devicesApi}
    mock={devices}
    columns={[
      index(),
      text("id_device", "DEVICE ID", true),
      text("name", "NAME", true),
      text("qty", "QTY", true),
      dot("status", "STATUS", (v) => v === "active", true),
    ]}
    actionsHeader="ACTIONS"
    search={(d) => `${d.name} ${d.id_device}`}
    placeholder="Search by name or id..."
    filters={[{ key: "status", options: labels(ACTIVE_INACTIVE), allLabel: "All Status" }]}
    fields={[
      { key: "id_device", label: "Device ID" },
      { key: "name", label: "Name" },
      // Backend rejects 0 for qty / price.
      { key: "qty", label: "Qty", type: "number" },
      { key: "price", label: "Price", type: "number" },
      { key: "details", label: "Details", optional: true },
      { key: "status", label: "Status", options: labels(ACTIVE_INACTIVE) },
    ]}
    detailHref={(d) => `/inventory/devices/${d.id}`}
    noun="items"
  />
);

// T10
type Tool = {
  id: string;
  id_tool: string;
  name: string;
  qty: number;
  stock: number;
  availability: keyof typeof AVAILABILITY;
  price: number;
  details: string;
  photo_url?: string;
  tool_photo?: File;
};

const tools: Tool[] = [
  { id: "1", id_tool: "TL-001", name: "Multimeter", qty: 3, stock: 5, availability: "available", price: 750000, details: "Digital multimeter" },
  { id: "2", id_tool: "TL-002", name: "Crimping Tool", qty: 0, stock: 2, availability: "unavailable", price: 250000, details: "RJ45 crimper" },
];

// Multipart create / update.
export const toolsApi = rest<Tool>(
  "inventory/tools",
  "TOOLS",
  (t) => ({
    id: t.id,
    id_tool: t.id_tool,
    name: t.name,
    qty: t.qty,
    stock: t.stock,
    availability: lower(t.availability) as Tool["availability"],
    price: t.price,
    details: t.details ?? "",
    photo_url: img(t.photo_url),
  }),
  {
    toApi: ({ id_tool, name, qty, stock, availability, price, details, tool_photo }) =>
      toForm({ id_tool, name, qty, stock, availability, price, details, tool_photo }),
  },
);

export const ToolsTable = () => (
  <ResourceTable
    title="Tools"
    adapter={toolsApi}
    mock={tools}
    columns={[
      index(),
      text("id_tool", "Tool ID", true),
      text("name", "NAME", true),
      {
        header: "QTY",
        sort: "qty",
        cell: (t) => (t.qty <= 0 ? `Out of Stock (0 / ${t.stock})` : `${t.qty} / ${t.stock}`),
      },
      dot("availability", "AVAILABILITY", (v) => v === "available", true),
      idr("price", "PRICE", true),
      truncate("details", "DETAILS", true),
    ]}
    actionsHeader="ACTIONS"
    search={(t) => `${t.name} ${t.id_tool}`}
    placeholder="Search by name or id..."
    filters={[{ key: "availability", options: AVAILABILITY, allLabel: "All Availability" }]}
    fields={[
      { key: "id_tool", label: "Tool ID" },
      { key: "name", label: "Name" },
      { key: "qty", label: "Qty", type: "number" },
      { key: "stock", label: "Stock", type: "number" },
      { key: "availability", label: "Availability", options: AVAILABILITY },
      { key: "price", label: "Price", type: "number" },
      { key: "details", label: "Details", optional: true },
      { key: "tool_photo", label: "Photo", type: "file", optional: true },
    ]}
    detailHref={(t) => `/inventory/tools/${t.id}`}
    noun="items"
  />
);
