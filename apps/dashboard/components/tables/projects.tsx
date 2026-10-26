"use client";

import { ResourceTable } from "@/components/data-table";
import { DATE_SHORT, badge, date, index, text, truncate, twoLine } from "@/components/cells";
import { rest } from "@/lib/api";
import { PROJECT_STATUS, labels } from "@/lib/enums";

// T29 / T30 — `code` = PRJ-… / SRV-… id.
export type Project = {
  id: string;
  code: string;
  shipName: string;
  companyName: string;
  status: string;
  progress: number;
  issue: string;
  next_action: string;
  pic: string;
  targetDate: string;
  last_update_detail: string;
  updatedAt: string;
};

type Kind = "projects" | "surveys";

// Company / ship are free names (backend creates or links them). Backend sort param is `sort`.
export const projectsApi = (kind: Kind) =>
  rest<Project>(
    kind,
    "PROJECTS",
    (p) => ({
      id: p.id,
      code: p.project_id ?? p.survey_id ?? "",
      shipName: p.ship_name ?? "",
      companyName: p.company_name ?? "",
      status: p.status ?? "",
      progress: p.progress ?? 0,
      issue: p.issue ?? "",
      next_action: p.next_action ?? "",
      pic: p.pic ?? "",
      targetDate: p.target_date ?? "",
      last_update_detail: p.last_update_detail ?? "",
      updatedAt: p.updated_at,
    }),
    {
      params: { sort: "desc" },
      toApi: (p) => ({
        company_name: p.companyName,
        ship_name: p.shipName,
        status: p.status,
        progress: kind === "projects" ? p.progress : undefined,
        issue: p.issue,
        next_action: p.next_action,
        pic: p.pic,
        target_date: p.targetDate || undefined,
        last_update_detail: p.last_update_detail,
      }),
    },
  );
export const projectApis = { projects: projectsApi("projects"), surveys: projectsApi("surveys") };

export function ProjectsTable({ kind }: { kind: Kind }) {
  const project = kind === "projects";
  return (
    <ResourceTable
      title={project ? "Project Overview" : "Survey"}
      adapter={projectApis[kind]}
      mock={[]}
      columns={[
        index("No"),
        twoLine("Project / Vessel", "shipName", "code"),
        text("companyName", "Client"),
        badge("status", "Status", PROJECT_STATUS),
        ...(project
          ? [
              {
                header: "Progress",
                cell: (p: Project) => (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                    </div>
                    {p.progress}%
                  </div>
                ),
              },
            ]
          : []),
        truncate("issue", "Issue"),
        text("pic", "PIC"),
        date("targetDate", "Target Date", DATE_SHORT),
        date("updatedAt", "Last Update", DATE_SHORT, true),
      ]}
      defaultSort={{ key: "updatedAt", desc: true }}
      actionsHeader="Aksi"
      search={(p) => `${p.code} ${p.shipName} ${p.companyName} ${p.status}`}
      placeholder="Search by project, client, or status..."
      fields={[
        { key: "companyName", label: "Client" },
        { key: "shipName", label: "Vessel" },
        { key: "status", label: "Status", options: labels(PROJECT_STATUS) },
        ...(project ? [{ key: "progress" as const, label: "Progress (%)", type: "number", optional: true }] : []),
        { key: "issue", label: "Issue", optional: true },
        { key: "next_action", label: "Next Action", optional: true },
        { key: "pic", label: "PIC", optional: true },
        { key: "targetDate", label: "Target Date", type: "date", optional: true },
        { key: "last_update_detail", label: "Last Update Detail", optional: true },
      ]}
      detailHref={(p) => `/projects/${project ? "overview" : "survey"}/${p.id}`}
      noun={kind}
      emptyLabel={project ? "Belum ada data project overview" : "Belum ada data survey"}
    />
  );
}
