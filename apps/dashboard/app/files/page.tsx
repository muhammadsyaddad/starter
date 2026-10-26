import { FilesTable } from "@/components/tables/files";

export default function FilesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">File Storage</h1>
      <FilesTable />
    </div>
  );
}
