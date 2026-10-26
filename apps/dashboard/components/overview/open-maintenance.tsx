"use client";

import { WrenchIcon } from "@phosphor-icons/react";
import { BadgeOf } from "@/components/cells";
import { type Maintenance, maintenance, maintenanceApi } from "@/components/tables/operations";
import { useResource } from "@/lib/api";
import { MAINT_STATUS } from "@/lib/enums";
import { LIMIT, SummaryCard, SummaryRow } from "./summary-card";

/** Both channels; one instance so `useResource` keeps a stable adapter. */
export const OPEN_MAINTENANCE = maintenanceApi();

/** Still needs work: not finished, canceled or moved to dispatch. */
export const isOpen = (m: Maintenance) => !["completed", "canceled", "forwarded"].includes(m.status);

export function OpenMaintenance() {
  const { items, loading, error } = useResource(OPEN_MAINTENANCE, maintenance);
  const open = items.filter(isOpen).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <SummaryCard
      title="Maintenance Terbuka"
      icon={WrenchIcon}
      href="/maintenance"
      perm={OPEN_MAINTENANCE.perm}
      count={open.length}
      loading={loading}
      error={error}
      emptyLabel="Tidak ada maintenance terbuka."
    >
      {open.slice(0, LIMIT).map((m) => (
        <SummaryRow
          key={m.id}
          href={`/maintenance/${m.channel}/${m.id}`}
          title={`${m.id} · ${m.shipName}`}
          subtitle={m.problemDescription || "-"}
          right={<BadgeOf value={m.status} e={MAINT_STATUS} />}
        />
      ))}
    </SummaryCard>
  );
}
