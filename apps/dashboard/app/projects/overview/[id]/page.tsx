"use client";

import { usePathname } from "next/navigation";
import { DATE_SHORT, fmtDate } from "@/components/cells";
import { History, Info, Page, useParam } from "@/components/detail";

/** Also the survey detail (`survey` path segment). */
export default function ProjectDetailPage() {
  const id = useParam();
  const survey = usePathname().startsWith("/projects/survey");
  return (
    <Page title={survey ? "Survey Detail" : "Project Detail"}>
      <Info
        title={survey ? "Survey" : "Project"}
        path={`${survey ? "surveys" : "projects"}/${id}`}
        rows={(p) => [
          ["ID", p.project_id ?? p.survey_id],
          ["Vessel", p.ship_name],
          ["Client", p.company_name],
          ["Status", p.status],
          ...(survey ? [] : [["Progress", `${p.progress ?? 0}%`] as [string, string]]),
          ["Issue", p.issue],
          ["Next Action", p.next_action],
          ["PIC", p.pic],
          ["Target Date", fmtDate(p.target_date, DATE_SHORT)],
          ["Last Update", p.last_update_detail],
        ]}
      />
      <History type={survey ? "survey" : "project"} id={id} />
    </Page>
  );
}
