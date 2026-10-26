"use client";

import { BoatIcon, WarningIcon, WifiHighIcon, PulseIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { StatCard } from "@/components/stat-card";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { problemActivity, summaryStats } from "@/components/ship-data/data";
import { type Adapter, useResource } from "@/lib/api";
import { type Raw, MOCK, fetchAll, lower } from "@/lib/http";

const icons: Record<(typeof summaryStats)[number]["id"], Icon> = {
  "total-kapal": BoatIcon,
  "kapal-online": PulseIcon,
  konektivitas: WifiHighIcon,
  problem: WarningIcon,
};

// No summary endpoint: count the lists. Konektivitas has no backend (mock).
const all = (path: string): Adapter<Raw> => ({ list: () => fetchAll(path) });
const SHIPS = all("ship-data-management/ships");
const ALERTS = all("ship-data-management/alerts");
const INSTALLS = all("ship-data-management/installations");
const MAINTS = all("ship-data-management/maintenances");

/** Per-day count of installation starts + maintenance starts. */
const activity = (dates: string[]) => {
  const counts = new Map<string, number>();
  for (const d of dates) if (d) counts.set(d.slice(0, 10), (counts.get(d.slice(0, 10)) ?? 0) + 1);
  const today = Date.now();
  return Array.from({ length: 364 }, (_, i) => {
    const date = new Date(today - (363 - i) * 86400_000).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
};

export default function ShipSummaryPage() {
  const ships = useResource(SHIPS, []).items;
  const alerts = useResource(ALERTS, []).items;
  const installs = useResource(INSTALLS, []).items;
  const maints = useResource(MAINTS, []).items;

  const live: Record<string, string> = {
    "total-kapal": String(ships.length),
    "kapal-online": String(ships.filter((s) => lower(s.status) === "active").length),
    problem: String(alerts.length),
  };
  const stats = summaryStats.map((s) =>
    MOCK || !(s.id in live) ? s : { ...s, value: live[s.id]!, delta: undefined, bars: undefined },
  );
  const data = MOCK
    ? problemActivity
    : activity([...installs.map((i) => i.start_date), ...maints.map((m) => m.mulai)]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ id, ...stat }) => (
          <StatCard key={id} icon={icons[id]} {...stat} />
        ))}
      </div>
      <ActivityHeatmap title="Aktivitas Instalasi & Maintenance" data={data} />
    </div>
  );
}
