"use client";

import { Info, Page, useParam } from "@/components/detail";
import { CompaniesTable } from "@/components/tables/ship-data";

export default function GroupDetailPage() {
  const id = useParam();
  return (
    <Page title="Group Detail">
      <Info
        title="Group"
        path={`client/groups/${id}`}
        rows={(g) => [
          ["Nama Group", g.name],
          ["Alias", g.alias],
          ["Telp", g.telp],
          ["Kota", g.city],
          ["Company Count", g.company_count],
        ]}
      />
      <CompaniesTable groupId={id} />
    </Page>
  );
}
