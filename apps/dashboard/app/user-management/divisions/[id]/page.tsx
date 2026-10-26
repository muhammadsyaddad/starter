"use client";

import { DATE_DMY, fmtDate } from "@/components/cells";
import { Info, Page, useParam } from "@/components/detail";
import { DivisionMembersTable } from "@/components/tables/user-management";

export default function DivisionDetailPage() {
  const id = useParam();
  return (
    <Page title="Division Detail">
      <Info
        title="Division"
        path={`user-management/division/${id}`}
        rows={(d) => [
          ["Name", d.name],
          ["Head of Division", d.division_head],
          ["Staff", d.staff],
          ["Description", d.description],
          ["Created At", fmtDate(d.createdAt, DATE_DMY)],
        ]}
      />
      <DivisionMembersTable divisionId={id} />
    </Page>
  );
}
