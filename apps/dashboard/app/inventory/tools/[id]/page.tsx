"use client";

import { Info, Page, useParam } from "@/components/detail";
import { ToolTransactionsTable } from "@/components/tables/tool-loans";
import { img } from "@/lib/http";

export default function ToolDetailPage() {
  const id = useParam();
  return (
    <Page title="Tool Detail">
      <Info
        title="Tool"
        path={`inventory/tools/${id}`}
        rows={(t) => [
          ["Tool ID", t.id_tool],
          ["Name", t.name],
          ["Qty", `${t.qty} / ${t.stock}`],
          ["Borrowed", t.borrowed_qty],
          ["Availability", t.availability],
          ["Price", t.price],
          ["Details", t.details],
          // eslint-disable-next-line @next/next/no-img-element
          ["Photo", t.photo_url ? <img src={img(t.photo_url)} alt={t.name} className="max-h-40 rounded" /> : "-"],
        ]}
      />
      <ToolTransactionsTable toolId={id} />
    </Page>
  );
}
