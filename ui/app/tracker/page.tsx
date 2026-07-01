import { readApplications } from "@/lib/parse/applications";
import { PageHeader } from "@/components/primitives";
import { TrackerTable } from "@/components/TrackerTable";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const apps = await readApplications();
  return (
    <div>
      <PageHeader
        title="Tracker"
        subtitle={`${apps.length} applications · edit status & notes inline`}
      />
      <TrackerTable apps={apps} />
    </div>
  );
}
