import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The career-ops repo has its own lockfile one level up; pin the workspace
  // root to this ui/ folder so Turbopack resolves correctly.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
