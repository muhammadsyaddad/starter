"use client";

import { DATETIME, fmtDate } from "@/components/cells";
import { Info, Page, useParam } from "@/components/detail";
import type { Raw } from "@/lib/http";

/** No detail endpoint: pick the alert from the firing list. */
export default function ProblemDetailPage() {
  const id = useParam();
  return (
    <Page title="Problem Detail">
      <Info
        title="Alert"
        path="ship-data-management/alerts"
        rows={(list: Raw[]) => {
          const a = list.find((x) => String(x.id) === id);
          if (!a) return [["Status", "Alert is no longer firing."]];
          return [
            ["Kapal", a.clientId],
            ["Kategori", a.alertKey],
            ["Level", a.level],
            ["Status", a.status],
            ["Source", a.source],
            ["Message", a.message],
            ["First Fired", fmtDate(a.firstFiredAt, DATETIME)],
            ["Last Fired", fmtDate(a.lastFiredAt, DATETIME)],
            ["Payload", <pre key="p" className="text-xs whitespace-pre-wrap">{JSON.stringify(a.payload, null, 2)}</pre>],
          ];
        }}
      />
    </Page>
  );
}
