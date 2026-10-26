"use client";

import { Info, Page, useParam } from "@/components/detail";

export default function CompanyDetailPage() {
  const id = useParam();
  return (
    <Page title="Company Detail">
      <Info
        title="Perusahaan"
        path={`client/companies/${id}`}
        rows={(c) => [
          ["Nama Perusahaan", c.name],
          ["PIC", c.pic],
          ["Phone", c.phone],
          ["Address", c.address],
          ["Assets", c.assets],
          ["Status", c.status],
        ]}
      />
    </Page>
  );
}
