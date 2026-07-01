import { getEnvStatus } from "@/lib/settings";
import { PROJECT_ROOT } from "@/lib/paths";
import { PageHeader } from "@/components/primitives";
import { SettingsPanel } from "@/components/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const env = await getEnvStatus();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Environment & system health" />
      <SettingsPanel env={env} root={PROJECT_ROOT} />
    </div>
  );
}
