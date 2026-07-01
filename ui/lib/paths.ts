import path from "node:path";

/**
 * Root of the career-ops project. The Next app lives in `ui/`, so by default
 * the project root is the parent of the Next process cwd. Override with
 * CAREER_OPS_ROOT if the UI is run from elsewhere.
 */
export const PROJECT_ROOT =
  process.env.CAREER_OPS_ROOT || path.resolve(process.cwd(), "..");

export const paths = {
  root: PROJECT_ROOT,
  applications: path.join(PROJECT_ROOT, "data", "applications.md"),
  pipeline: path.join(PROJECT_ROOT, "data", "pipeline.md"),
  scanHistory: path.join(PROJECT_ROOT, "data", "scan-history.tsv"),
  profileYml: path.join(PROJECT_ROOT, "config", "profile.yml"),
  cv: path.join(PROJECT_ROOT, "cv.md"),
  portals: path.join(PROJECT_ROOT, "portals.yml"),
  reportsDir: path.join(PROJECT_ROOT, "reports"),
  outputDir: path.join(PROJECT_ROOT, "output"),
  trackerAdditions: path.join(PROJECT_ROOT, "batch", "tracker-additions"),
  env: path.join(PROJECT_ROOT, ".env"),
  // scripts
  mergeTracker: path.join(PROJECT_ROOT, "merge-tracker.mjs"),
  scan: path.join(PROJECT_ROOT, "scan.mjs"),
  generatePdf: path.join(PROJECT_ROOT, "generate-pdf.mjs"),
  generateCover: path.join(PROJECT_ROOT, "generate-cover-letter.mjs"),
  openaiEval: path.join(PROJECT_ROOT, "openai-eval.mjs"),
  geminiEval: path.join(PROJECT_ROOT, "gemini-eval.mjs"),
  doctor: path.join(PROJECT_ROOT, "doctor.mjs"),
  verifyPipeline: path.join(PROJECT_ROOT, "verify-pipeline.mjs"),
};

/** Guard: ensure a resolved path stays inside a whitelisted base dir. */
export function isInside(base: string, target: string): boolean {
  const rel = path.relative(base, target);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}
