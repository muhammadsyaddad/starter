import { GroupsTable } from "@/components/tables/ship-data";

export default function GroupsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Groups</h1>
      <GroupsTable />
    </div>
  );
}
