"use client";

import { DATE_SHORT, fmtDate } from "@/components/cells";
import { History, Info, Page, useParam } from "@/components/detail";
import { MaintenanceRecords } from "@/components/tables/operations";
import {
  InstallationRecords,
  ShipBorrowedToolsTable,
  ShipDevicesTable,
  ShipItemsTable,
} from "@/components/tables/ship-data";

export default function ShipDetailPage() {
  const id = useParam();
  return (
    <Page title="Ship Detail">
      <Info
        title="Kapal"
        path={`ship-data-management/ships/${id}`}
        rows={(s) => [
          ["Nama", s.name],
          ["Alias", s.alias],
          ["Company", s.company_name],
          ["Type", s.type],
          ["Tipe Kapal", s.ship_type],
          ["Status", s.status],
          ["Flag", s.flag_code],
          ["PIC", s.pic],
          ["Installation Date", fmtDate(s.installation_date, DATE_SHORT)],
          ["IMO", s.imo_number],
          ["MMSI", s.mmsi_number],
          ["Call Sign", s.call_sign],
          ["Dimension", s.dimension],
          ["Satellite ID", s.satellite_id],
          ["Satellite Operator", s.satellite_operator],
          ["Satellite Device ID", s.satellite_device_id],
          ["Telco Operator", s.telco_operator],
          ["GSM Number", s.gsm_number],
          ["IMEI", s.imei_number],
          ["Antenna Position", s.antenna_position],
          ["Notes", s.notes],
        ]}
      />
      <ShipDevicesTable shipId={id} />
      <ShipItemsTable shipId={id} />
      <ShipBorrowedToolsTable shipId={id} />
      <InstallationRecords shipId={id} />
      <MaintenanceRecords shipId={id} />
      <History type="ship" id={id} />
    </Page>
  );
}
