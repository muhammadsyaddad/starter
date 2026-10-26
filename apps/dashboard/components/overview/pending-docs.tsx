"use client";

import { differenceInCalendarDays } from "date-fns";
import { FilesIcon } from "@phosphor-icons/react";
import { dueDateInfo } from "@/components/cells";
import { documents, documentsApi } from "@/components/tables/documentation";
import { useResource } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LIMIT, SummaryCard, SummaryRow } from "./summary-card";

/** Nearest due date first; no date last. */
const byDue = (a: string, b: string) => (a || "9999").localeCompare(b || "9999");
const overdue = (due: string) => !!due && differenceInCalendarDays(new Date(due), new Date()) < 0;

export function PendingDocs() {
  const { items, loading, error } = useResource(documentsApi, documents);
  const open = items.filter((d) => d.status !== "FINISHED").sort((a, b) => byDue(a.due_date, b.due_date));

  return (
    <SummaryCard
      title="Dokumen Belum Selesai"
      icon={FilesIcon}
      href="/documentation"
      perm={documentsApi.perm}
      count={open.length}
      loading={loading}
      error={error}
      emptyLabel="Semua dokumen selesai."
    >
      {open.slice(0, LIMIT).map((d) => (
        <SummaryRow
          key={d.id}
          href={`/documentation/${d.id}`}
          title={d.title}
          subtitle={`${d.doc_id} · ${d.client || "-"}`}
          right={
            d.due_date && (
              <span className={cn("text-xs", overdue(d.due_date) ? "text-destructive" : "text-muted-foreground")}>
                {dueDateInfo(d.due_date, d.status)}
              </span>
            )
          }
        />
      ))}
    </SummaryCard>
  );
}
