"use client";

/*
 * Dev tools run on the telemetry service (proxied as /tel-api), on demand:
 * T38 = analysis run, T39 = CSV / xlsx preview + import.
 */

import * as React from "react";
import { Button } from "@repo/ui/ui/button";
import { Card, CardContent } from "@repo/ui/ui/card";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { DataTable } from "@/components/data-table";
import { DATETIME, fmtDate, join, text } from "@/components/cells";
import { FilterSelect } from "@/components/overview/filter-select";
import { MOCK, type Raw, request, useFetch } from "@/lib/http";

const TEL = "/tel-api/api/v1/devtools";

/** Run `fn`, keeping its result / error / busy state. */
function useRun<T>(initial: T) {
  const [state, setState] = React.useState<{ data: T; error?: string; busy?: boolean }>({ data: initial });
  const run = async (fn: () => Promise<T>) => {
    setState((s) => ({ ...s, busy: true, error: undefined }));
    try {
      setState({ data: await fn() });
    } catch (e) {
      setState((s) => ({ ...s, busy: false, error: (e as Error).message }));
    }
  };
  return { ...state, run };
}

// T38 — `id` = assetId. `checks` = which rules ran for the vessel.
type VesselResult = {
  id: string;
  name: string;
  suspects: { FLOWMETER: number; PLC: number; GPS: number };
  sampleCount: number;
  checks: Record<string, boolean>;
};

const vessels: VesselResult[] = [
  { id: "A-01", name: "KM Demo 1", suspects: { FLOWMETER: 2, PLC: 0, GPS: 1 }, sampleCount: 1440, checks: { flowMeterWhileEngineOff: true, fuelOverBaseline: true, rpmJumper: true, gps: true } },
  { id: "A-02", name: "KM Demo 2", suspects: { FLOWMETER: 0, PLC: 3, GPS: 0 }, sampleCount: 720, checks: { flowMeterWhileEngineOff: true, fuelOverBaseline: true, rpmJumper: true, gps: false } },
];

const suspect = (key: keyof VesselResult["suspects"], header: string) => ({
  header,
  cell: (v: VesselResult) => v.suspects[key],
});

const WINDOWS = { now: "Now", morning: "Morning", evening: "Evening" };

export function IterationAnalysisTable() {
  const { data, error, busy, run } = useRun<VesselResult[]>(MOCK ? vessels : []);
  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          run(() =>
            request(`${TEL}/analysis/iteration`, {
              params: { window: String(f.get("window")), date: String(f.get("date")) },
            }).then(({ data }) =>
              (data.vessels ?? []).map((v: Raw) => ({ ...v, id: v.assetId })),
            ),
          );
        }}
      >
        <Field label="Window">
          <FilterSelect<string> name="window" options={WINDOWS} defaultValue="now" />
        </Field>
        <Field label="Date">
          <Input name="date" type="date" />
        </Field>
        <Button type="submit" disabled={busy || MOCK}>
          {busy ? "Running…" : "Run"}
        </Button>
      </form>
      <DataTable
        title="Findings"
        items={data}
        error={error}
        loading={busy}
        columns={[
          text("name", "Vessel", true),
          suspect("FLOWMETER", "Flowmeter"),
          suspect("PLC", "PLC"),
          suspect("GPS", "GPS"),
          text("sampleCount", "Samples", true),
          {
            header: "Coverage",
            cell: (v) => {
              const missing = Object.entries(v.checks ?? {}).filter(([, ran]) => !ran);
              return missing.length ? `Not checked: ${missing.map(([k]) => k).join(", ")}` : "All checks ran";
            },
          },
        ]}
        noun="vessels"
        emptyLabel="Run an analysis to see results."
      />
    </div>
  );
}

// T39 — `id` = table
type DatasetSummary = {
  id: string;
  table: string;
  rows: number;
  willReplace: number;
  willInsert: number;
  range: { start: string; end: string };
  devices: string[];
};

const datasets: DatasetSummary[] = [
  { id: "telemetry", table: "telemetry", rows: 5000, willReplace: 1200, willInsert: 3800, range: { start: "2026-10-01T00:00", end: "2026-10-07T23:59" }, devices: ["DEV-001", "DEV-002"] },
];

type Company = { compId: string; name: string; assets: { assetId: string; name: string }[] };

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function ReplaceDbTable() {
  const { data: catalog } = useFetch<{ companies?: Company[] }>(`${TEL}/csv/catalog`);
  const companies = catalog?.companies ?? [];
  const [compId, setCompId] = React.useState("");
  const [assetId, setAssetId] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const preview = useRun<{ rows: DatasetSummary[]; errors: string[] }>({ rows: MOCK ? datasets : [], errors: [] });
  const imported = useRun<string>("");

  const send = (step: "preview" | "import") =>
    request(`${TEL}/csv/${step}`, {
      method: "POST",
      params: { compId, assetId },
      body: file,
      headers: { "Content-Type": /\.xlsx$/i.test(file!.name) ? XLSX : "text/csv" },
    });

  const assets = Object.fromEntries(
    (companies.find((c) => c.compId === compId)?.assets ?? []).map((a) => [a.assetId, a.name]),
  );
  const ready = !!(compId && assetId && file) && !MOCK;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Company">
          <FilterSelect
            options={Object.fromEntries(companies.map((c) => [c.compId, c.name]))}
            value={compId || null}
            onValueChange={(v) => (setCompId(v), setAssetId(""))}
          />
        </Field>
        <Field label="Vessel">
          <FilterSelect options={assets} value={assetId || null} onValueChange={setAssetId} disabled={!compId} />
        </Field>
        <Field label="File (.csv / .xlsx)">
          <Input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0])} />
        </Field>
        <Button
          disabled={!ready || preview.busy}
          onClick={() =>
            preview.run(() =>
              send("preview").then(({ data }) => ({
                rows: (data.summary ?? []).map((d: Raw) => ({ ...d, id: d.table ?? d.dataset })),
                errors: (data.errors ?? []).map((e: Raw) => `Line ${e.line}: ${e.message}`),
              })),
            )
          }
        >
          {preview.busy ? "Checking…" : "Preview"}
        </Button>
        <Button
          variant="destructive"
          disabled={!ready || !preview.data.rows.length || imported.busy}
          onClick={() => imported.run(() => send("import").then(({ data }) => data.message ?? "Imported."))}
        >
          {imported.busy ? "Importing…" : "Replace"}
        </Button>
      </div>
      {(imported.data || imported.error) && (
        <p className={imported.error ? "text-sm text-destructive" : "text-sm"}>{imported.error ?? imported.data}</p>
      )}
      {preview.data.errors.length > 0 && (
        <Card>
          <CardContent className="max-h-40 overflow-y-auto text-xs text-destructive">
            {preview.data.errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </CardContent>
        </Card>
      )}
      <DataTable
        title="Preview"
        items={preview.data.rows}
        error={preview.error}
        columns={[
          text("table", "Table"),
          text("rows", "Total"),
          text("willReplace", "Replace"),
          text("willInsert", "Insert"),
          {
            header: "Time range",
            cell: (d) => (
              <div className="flex flex-col">
                {fmtDate(d.range?.start, DATETIME)}
                <span className="text-xs text-muted-foreground">to {fmtDate(d.range?.end, DATETIME)}</span>
              </div>
            ),
          },
          join("devices", "Devices"),
        ]}
        noun="tables"
        emptyLabel="Upload a file and run Preview."
      />
    </div>
  );
}
