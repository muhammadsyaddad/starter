import { ToolsTable } from "@/components/tables/inventory";

export default function ToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Tools</h1>
      <ToolsTable />
    </div>
  );
}
