"use client";

import { DATE_MDY, fmtDate } from "@/components/cells";
import { Info, Page, useParam } from "@/components/detail";
import { DocItemsTable } from "@/components/tables/documentation";

export default function DocumentDetailPage() {
  const id = useParam();
  return (
    <Page title="Document Detail">
      <Info
        title="Document"
        path={`documentation/${id}`}
        rows={(d) => [
          ["Id", d.doc_id],
          ["Type", d.doc_type],
          ["Title", d.title],
          ["Status", d.status],
          ["Client", d.client],
          ["Ship", d.ship_name],
          ["Division", d.division],
          ["Created By", d.created_by_name],
          ["Date", fmtDate(d.date, DATE_MDY)],
          ["Due Date", fmtDate(d.due_date, DATE_MDY)],
          ["Reimbursement", d.reimbursement],
          ["Required Docs", (d.required_docs ?? []).join(", ")],
          ["Description", d.description],
          [
            "Attachments",
            (d.attachments ?? []).map((a: { id: string; file_name: string }) => (
              <a
                key={a.id}
                href={`/be-api/documentation/attachments/${a.id}/download`}
                className="block underline"
              >
                {a.file_name}
              </a>
            )),
          ],
        ]}
      >
        {(d) => <DocItemsTable rows={d.item_list} total={d.total_cost} />}
      </Info>
    </Page>
  );
}
