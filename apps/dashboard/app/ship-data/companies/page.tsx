import { CompaniesTable } from "@/components/tables/ship-data";

export default function CompaniesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Companies</h1>
      <CompaniesTable />
    </div>
  );
}
