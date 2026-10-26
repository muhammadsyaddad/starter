"use client";

import Link from "next/link";
import { BoatIcon, PulseIcon, WarningIcon, WrenchIcon } from "@phosphor-icons/react";
import { StatCard, type StatTone } from "@/components/stat-card";
import { summaryStats } from "@/components/ship-data/data";
import { alerts, alertsApi } from "@/components/tables/ship-data";
import { maintenance } from "@/components/tables/operations";
import { type Adapter, useResource } from "@/lib/api";
import { type Raw, MOCK, fetchAll, lower } from "@/lib/http";
import { OPEN_MAINTENANCE, isOpen } from "./open-maintenance";

// Same counts as /ship-data/summary (no summary endpoint: count the lists).
const SHIPS: Adapter<Raw> = { list: () => fetchAll("ship-data-management/ships") };
const mockValue = (id: string) => summaryStats.find((s) => s.id === id)?.value ?? "0";

/** Fleet headline numbers; each card opens its list page. */
export function FleetStats() {
  const ships = useResource(SHIPS, []).items;
  const problems = useResource(alertsApi, alerts).items;
  const maints = useResource(OPEN_MAINTENANCE, maintenance).items;

  const stats: { id: string; label: string; value: string; icon: typeof BoatIcon; tone: StatTone; href: string }[] = [
    {
      id: "total-kapal",
      label: "Total Kapal",
      value: MOCK ? mockValue("total-kapal") : String(ships.length),
      icon: BoatIcon,
      tone: "dark",
      href: "/ship-data/data-kapal",
    },
    {
      id: "kapal-online",
      label: "Kapal Online",
      value: MOCK ? mockValue("kapal-online") : String(ships.filter((s) => lower(s.status) === "active").length),
      icon: PulseIcon,
      tone: "brand",
      href: "/ship-data/data-kapal",
    },
    {
      id: "problem",
      label: "Problem Aktif",
      value: String(problems.length),
      icon: WarningIcon,
      tone: "muted",
      href: "/ship-data/problem",
    },
    {
      id: "maintenance",
      label: "Maintenance Terbuka",
      value: String(maints.filter(isOpen).length),
      icon: WrenchIcon,
      tone: "default",
      href: "/maintenance",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ id, href, ...stat }) => (
        <Link key={id} href={href} className="transition-opacity hover:opacity-90">
          <StatCard {...stat} />
        </Link>
      ))}
    </div>
  );
}
