import { MaintenanceTable } from "@/components/tables/operations";

export default function MaintenancePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Maintenance</h1>
      <MaintenanceTable type="remote" />
    </div>
  );
}
