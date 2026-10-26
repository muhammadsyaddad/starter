import { DocumentsTable } from "@/components/tables/documentation";

export default function DocumentationPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Documentation</h1>
      <DocumentsTable />
    </div>
  );
}
