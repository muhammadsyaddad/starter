"use client";

import { ListChecksIcon } from "@phosphor-icons/react";
import { DATE_SHORT, fmtDate } from "@/components/cells";
import { projectsApi } from "@/components/tables/projects";
import { useResource } from "@/lib/api";
import { LIMIT, SummaryCard, SummaryRow } from "./summary-card";

const PROJECTS = projectsApi("projects");

/** Nearest target date first; no date last. */
const byTarget = (a: string, b: string) => (a || "9999").localeCompare(b || "9999");

export function ActiveProjects() {
  const { items, loading, error } = useResource(PROJECTS, []);
  const active = items
    .filter((p) => p.status === "On Progress")
    .sort((a, b) => byTarget(a.targetDate, b.targetDate));

  return (
    <SummaryCard
      title="Project Berjalan"
      icon={ListChecksIcon}
      href="/projects/overview"
      perm={PROJECTS.perm}
      count={active.length}
      loading={loading}
      error={error}
      emptyLabel="Belum ada project berjalan."
    >
      {active.slice(0, LIMIT).map((p) => (
        <SummaryRow
          key={p.id}
          href={`/projects/overview/${p.id}`}
          title={`${p.shipName || "-"} · ${p.code}`}
          subtitle={`${p.companyName || "-"} · Target ${fmtDate(p.targetDate, DATE_SHORT)}`}
          right={
            <>
              <div className="h-1.5 w-16 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="w-9 text-right text-xs tabular-nums">{p.progress}%</span>
            </>
          }
        />
      ))}
    </SummaryCard>
  );
}
