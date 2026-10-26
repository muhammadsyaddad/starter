import { DevicesTable } from "@/components/tables/inventory";

export default function DevicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Devices</h1>
      <DevicesTable />
    </div>
  );
}
