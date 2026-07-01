import { readFile, writeFile } from "node:fs/promises";
import { load as yamlLoad } from "js-yaml";
import { paths } from "@/lib/paths";

export type UserFileKey = "profile" | "cv" | "portals";

const map: Record<UserFileKey, string> = {
  profile: paths.profileYml,
  cv: paths.cv,
  portals: paths.portals,
};

export async function readUserFile(key: UserFileKey): Promise<string> {
  try {
    return await readFile(map[key], "utf8");
  } catch {
    return "";
  }
}

export async function writeUserFile(key: UserFileKey, content: string): Promise<void> {
  // For YAML files, validate before writing so we never corrupt config.
  if (key === "profile" || key === "portals") {
    try {
      yamlLoad(content);
    } catch (e) {
      throw new Error(`Invalid YAML: ${(e as Error).message}`);
    }
  }
  await writeFile(map[key], content, "utf8");
}
