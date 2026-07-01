import { listArtifacts, listHtmlFiles } from "@/lib/artifacts";
import { PageHeader } from "@/components/primitives";
import { ArtifactsPanel } from "@/components/ArtifactsPanel";

export const dynamic = "force-dynamic";

export default async function ArtifactsPage() {
  const artifacts = await listArtifacts();
  const htmls = await listHtmlFiles();
  return (
    <div>
      <PageHeader
        title="Artifacts"
        subtitle={`${artifacts.length} PDFs in output/ · preview, download, generate`}
      />
      <ArtifactsPanel artifacts={artifacts} htmls={htmls} />
    </div>
  );
}
