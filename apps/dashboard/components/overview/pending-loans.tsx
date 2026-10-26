"use client";

import { ClipboardTextIcon } from "@phosphor-icons/react";
import { BadgeOf, DATETIME, fmtDate } from "@/components/cells";
import { requestsApi } from "@/components/tables/tool-loans";
import { useResource } from "@/lib/api";
import { TX_STATUS } from "@/lib/enums";
import { LIMIT, SummaryCard, SummaryRow } from "./summary-card";

const REQUESTS = requestsApi();
const WAITING = ["pending", "return_pending"];
// No detail page: requests open in a dialog on the list page.
const HREF = "/inventory/tools/loan-requests";

export function PendingLoans() {
  const { items, loading, error } = useResource(REQUESTS, []);
  const waiting = items
    .filter((r) => WAITING.includes(r.status))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <SummaryCard
      title="Menunggu Persetujuan"
      icon={ClipboardTextIcon}
      href={HREF}
      perm={REQUESTS.perm}
      count={waiting.length}
      loading={loading}
      error={error}
      emptyLabel="Tidak ada permintaan pinjam."
    >
      {waiting.slice(0, LIMIT).map((r) => (
        <SummaryRow
          key={r.id}
          href={HREF}
          title={r.borrower_name}
          subtitle={`${r.items} item · ${fmtDate(r.created_at, DATETIME)}`}
          right={<BadgeOf value={r.status} e={TX_STATUS} />}
        />
      ))}
    </SummaryCard>
  );
}
