import { DivisionsTable } from "@/components/tables/user-management";

export default function DivisionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Divisions</h1>
      <DivisionsTable />
    </div>
  );
}
