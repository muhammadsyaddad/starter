import { PermissionsTable } from "@/components/tables/user-management";

export default function PermissionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Permissions</h1>
      <PermissionsTable />
    </div>
  );
}
