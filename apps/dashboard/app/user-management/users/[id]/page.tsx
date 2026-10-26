"use client";

import { Info, Page, useParam } from "@/components/detail";
import { InstallationRecords } from "@/components/tables/ship-data";
import { MaintenanceRecords } from "@/components/tables/operations";
import { UserBorrowedToolsTable } from "@/components/tables/tool-loans";

export default function UserDetailPage() {
  const id = useParam();
  return (
    <Page title="User Detail">
      <Info
        title="User"
        path={`user-management/user/${id}`}
        rows={(u) => [
          ["Name", u.fullName],
          ["Username", u.username],
          ["Email", u.email],
          ["Role", u.role?.name],
          ["Division", u.division?.name],
          ["Status", u.status],
        ]}
      >
        {/* Records match the user's name: the backend has no per-user filter. */}
        {(u) => (
          <>
            <UserBorrowedToolsTable name={u.fullName || u.username} />
            <InstallationRecords technician={u.fullName || u.username} />
            <MaintenanceRecords technician={u.fullName || u.username} />
          </>
        )}
      </Info>
    </Page>
  );
}
