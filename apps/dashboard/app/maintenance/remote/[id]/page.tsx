"use client";

import Link from "next/link";
import { Comments, History, Info, Page, useParam } from "@/components/detail";

/** Also the dispatch detail. `id` = MTN short id. */
export default function MaintenanceDetailPage() {
  const id = useParam();
  return (
    <Page title="Maintenance Detail">
      <Info
        title={id}
        path={`ship-data-management/maintenances/${id}`}
        rows={(m) => [
          ["Kapal", m.kapal],
          ["Company", m.company_name],
          ["Channel", m.maintenance_type],
          ["Tipe", m.tipe],
          ["Status", m.status],
          ["Problem", m.problem],
          ["Teknisi", (m.teknisi ?? []).map((t: { name: string }) => t.name).join(", ")],
          ["Mulai", m.mulai],
          ["Selesai", m.selesai],
          ["Severity", m.severity],
          ["Severity Details", m.severity_details],
          ["Details", m.details],
          ["Notes", m.notes],
          ["Conclusion", m.conclusion],
          [
            "Documents",
            (m.documentations ?? []).map((d: { id: string; doc_id: string; title: string }) => (
              <Link key={d.id} href={`/documentation/${d.id}`} className="block underline">
                {d.doc_id} {d.title}
              </Link>
            )),
          ],
        ]}
      />
      <Comments id={id} />
      <History type="maintenance" id={id} />
    </Page>
  );
}
