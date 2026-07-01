import { readFile } from "node:fs/promises";
import { paths } from "@/lib/paths";

export type EnvStatus = {
  hasEnvFile: boolean;
  provider: string;
  openaiModel: string;
  geminiModel: string;
  hasOpenAIKey: boolean;
  hasGeminiKey: boolean;
};

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    val = val.replace(/^["']|["']$/g, "");
    out[key] = val;
  }
  return out;
}

export async function getEnvStatus(): Promise<EnvStatus> {
  let env: Record<string, string> = {};
  let hasEnvFile = false;
  try {
    const text = await readFile(paths.env, "utf8");
    hasEnvFile = true;
    env = parseEnv(text);
  } catch {
    // fall back to process env
  }
  const pick = (k: string) => env[k] ?? process.env[k] ?? "";
  return {
    hasEnvFile,
    provider: pick("AI_ANALYSIS_PROVIDER") || "openai",
    openaiModel: pick("OPENAI_MODEL") || "gpt-4o-mini",
    geminiModel: pick("GEMINI_MODEL") || "gemini-2.5-flash",
    hasOpenAIKey: Boolean(pick("OPENAI_API_KEY")),
    hasGeminiKey: Boolean(pick("GEMINI_API_KEY")),
  };
}
