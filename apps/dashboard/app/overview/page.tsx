import { ActiveProblems } from "@/components/overview/active-problems";
import { ActiveProjects } from "@/components/overview/active-projects";
import { FleetStats } from "@/components/overview/fleet-stats";
import { KpiCard } from "@/components/overview/kpi-card";
import { OpenMaintenance } from "@/components/overview/open-maintenance";
import { PendingDocs } from "@/components/overview/pending-docs";
import { PendingLoans } from "@/components/overview/pending-loans";
import { kpis } from "@/components/overview/data";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <FleetStats />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Kolom utama */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ActiveProblems />
            <OpenMaintenance />
          </div>
          <ActiveProjects />
        </div>

        {/* Kolom samping */}
        <div className="flex min-w-0 flex-col gap-4">
          <PendingLoans />
        </div>
      </div>

      <PendingDocs />
    </div>
  );
}
