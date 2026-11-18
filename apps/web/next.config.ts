import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Jede Seite hängt von der Session ab. Das alte Caching-Modell reicht und läuft sicher mit OpenNext.
  cacheComponents: false,
  transpilePackages: ["@bwd/shared", "@bwd/db"],
  poweredByHeader: false,
};

export default nextConfig;

initOpenNextCloudflareForDev();
