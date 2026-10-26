import { ProjectsTable } from "@/components/tables/projects";

export default function SurveyPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Survey</h1>
      <ProjectsTable kind="surveys" />
    </div>
  );
}
