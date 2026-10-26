"use client";

import Link from "next/link";
import { History, Info, Page, useParam } from "@/components/detail";

export default function InstallationDetailPage() {
  const id = useParam();
  return (
    <Page title="Installation Detail">
      <Info
        title="Pemasangan"
        path={`ship-data-management/installations/${id}`}
        rows={(i) => [
          ["ID", i.installation_id],
          ["Kapal", i.kapal],
          ["Company", i.company_name],
          ["Tipe", i.tipe],
          ["Mulai", i.start_date],
          ["Selesai", i.finish_date],
          ["Lokasi", i.lokasi],
          ["Teknisi", (i.teknisi ?? []).join(", ")],
          ["Devices", i.devices],
          ["Status", i.status],
          ["Survey", i.survey_number],
          ["Notes", i.notes],
          ["Conclusion", i.conclusion],
          [
            "Documents",
            (i.documentations ?? []).map((d: { id: string; doc_id: string; title: string }) => (
              <Link key={d.id} href={`/documentation/${d.id}`} className="block underline">
                {d.doc_id} {d.title}
              </Link>
            )),
          ],
        ]}
      />
      <History type="installation" id={id} />
    </Page>
  );
}
