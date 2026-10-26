import { UsersTable } from "@/components/tables/user-management";

export default function UsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Users</h1>
      <UsersTable />
    </div>
  );
}
