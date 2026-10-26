import { ProjectsTable } from "@/components/tables/projects";

export default function ProjectOverviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Project Overview</h1>
      <ProjectsTable kind="projects" />
    </div>
  );
}
