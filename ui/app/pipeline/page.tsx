import { readPipeline } from "@/lib/parse/pipeline";
import { getEnvStatus } from "@/lib/settings";
import { PageHeader } from "@/components/primitives";
import { PipelinePanel } from "@/components/PipelinePanel";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const items = await readPipeline();
  const env = await getEnvStatus();
  const pending = items.filter((i) => !i.done);
  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle={`${pending.length} pending · ${items.length} total · evaluate with ${env.provider} (${env.openaiModel})`}
      />
      <PipelinePanel items={items} hasKey={env.hasOpenAIKey} model={env.openaiModel} />
    </div>
  );
}
