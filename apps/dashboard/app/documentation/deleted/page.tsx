import { DeletedDocumentsTable } from "@/components/tables/documentation";

export default function DeletedDocumentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Deleted Documents</h1>
      <DeletedDocumentsTable />
    </div>
  );
}
