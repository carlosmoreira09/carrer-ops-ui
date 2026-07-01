import { readUserFile } from "@/lib/write/files";
import { PageHeader } from "@/components/primitives";
import { FileEditor } from "@/components/FileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, cv, portals] = await Promise.all([
    readUserFile("profile"),
    readUserFile("cv"),
    readUserFile("portals"),
  ]);
  return (
    <div>
      <PageHeader
        title="Profile & CV"
        subtitle="Edit your user-layer files — the source of truth for evaluations & CVs"
      />
      <FileEditor
        files={[
          { key: "profile", label: "profile.yml", lang: "yaml", content: profile },
          { key: "cv", label: "cv.md", lang: "markdown", content: cv },
          { key: "portals", label: "portals.yml", lang: "yaml", content: portals },
        ]}
      />
    </div>
  );
}
