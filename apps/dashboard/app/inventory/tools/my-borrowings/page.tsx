import { BorrowRequests } from "@/components/tables/tool-loans";

export default function MyBorrowingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Borrowings</h1>
      <BorrowRequests mine />
    </div>
  );
}
