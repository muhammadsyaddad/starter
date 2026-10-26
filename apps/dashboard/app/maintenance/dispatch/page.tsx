import { MaintenanceTable } from "@/components/tables/operations";

export default function DispatchPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Dispatch</h1>
      <MaintenanceTable type="dispatch" />
    </div>
  );
}
