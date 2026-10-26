"use client";

import { Info, Page, useParam } from "@/components/detail";

export default function ShipItemPage() {
  const id = useParam("itemId");
  return (
    <Page title="Item Detail">
      <Info
        title="Item"
        path={`ship-data-management/ship-items/${id}`}
        rows={(i) => [
          ["Item Name", i.item_name],
          ["Unique ID", i.unique_id],
          ["Status", i.status],
          // Free key / value map.
          ...Object.entries<string>(i.description ?? {}),
        ]}
      />
    </Page>
  );
}
