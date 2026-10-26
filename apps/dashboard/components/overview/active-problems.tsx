"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { BadgeOf } from "@/components/cells";
import { alerts, alertsApi } from "@/components/tables/ship-data";
import { useResource } from "@/lib/api";
import { ALERT_LEVEL } from "@/lib/enums";
import { LIMIT, SummaryCard, SummaryRow } from "./summary-card";

const LEVELS = Object.keys(ALERT_LEVEL);
/** Unknown levels sort last. */
const rank = (level: string) => {
  const i = LEVELS.indexOf(level.toUpperCase());
  return i < 0 ? LEVELS.length : i;
};

export function ActiveProblems() {
  const { items, loading, error } = useResource(alertsApi, alerts);
  const sorted = [...items].sort((a, b) => rank(a.level) - rank(b.level));

  return (
    <SummaryCard
      title="Problem Aktif"
      icon={WarningCircleIcon}
      href="/ship-data/problem"
      perm={alertsApi.perm}
      count={sorted.length}
      loading={loading}
      error={error}
      emptyLabel="Tidak ada alert aktif."
    >
      {sorted.slice(0, LIMIT).map((a) => (
        <SummaryRow
          key={a.id}
          href={`/ship-data/problem/${a.id}`}
          title={a.clientId}
          subtitle={a.alertKey}
          right={<BadgeOf value={a.level} e={ALERT_LEVEL} />}
        />
      ))}
    </SummaryCard>
  );
}
