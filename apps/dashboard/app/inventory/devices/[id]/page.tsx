"use client";

import { DATETIME, fmtDate } from "@/components/cells";
import { Info, Page, useParam } from "@/components/detail";

export default function DeviceDetailPage() {
  const id = useParam();
  return (
    <Page title="Device Detail">
      <Info
        title="Device"
        path={`inventory/devices/${id}`}
        rows={(d) => [
          ["Device ID", d.id_device],
          ["Name", d.name],
          ["Qty", d.qty],
          ["Price", d.price],
          ["Status", d.status],
          ["Details", d.details],
          ["Updated At", fmtDate(d.updated_at, DATETIME)],
        ]}
      />
    </Page>
  );
}
