import { ReplaceDbTable } from "@/components/tables/dev-tools";

export default function ReplaceDbCsvPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Replace DB Data From CSV</h1>
      <ReplaceDbTable />
    </div>
  );
}
