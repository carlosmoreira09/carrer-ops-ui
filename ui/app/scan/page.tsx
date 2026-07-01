import { readScanHistory } from "@/lib/parse/scan-history";
import { getEnvStatus } from "@/lib/settings";
import { PageHeader } from "@/components/primitives";
import { ScanPanel } from "@/components/ScanPanel";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const rows = await readScanHistory();
  await getEnvStatus();
  // Newest first
  const sorted = [...rows].sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
  return (
    <div>
      <PageHeader
        title="Scan"
        subtitle={`${rows.length} jobs in scan history · run the zero-token portal scanner`}
      />
      <ScanPanel rows={sorted} />
    </div>
  );
}
