import { ShipsTable } from "@/components/tables/ship-data";

export default function DataKapalPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Data Kapal</h1>
      <ShipsTable />
    </div>
  );
}
