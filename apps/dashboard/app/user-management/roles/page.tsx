import { RolesTable } from "@/components/tables/user-management";

export default function RolesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Roles</h1>
      <RolesTable />
    </div>
  );
}
