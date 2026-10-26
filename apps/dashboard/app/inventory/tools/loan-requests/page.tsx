"use client";

import { BorrowRequests } from "@/components/tables/tool-loans";
import { X, useAuth } from "@/lib/auth";

export default function LoanRequestsPage() {
  const { can } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Loan Requests</h1>
      {can("TOOLS", X) ? <BorrowRequests /> : <p className="text-sm text-muted-foreground">No access.</p>}
    </div>
  );
}
