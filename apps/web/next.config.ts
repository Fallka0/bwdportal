import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Jede Seite hängt von der Session ab. Das alte Caching-Modell reicht und läuft sicher mit OpenNext.
  cacheComponents: false,
  transpilePackages: ["@bwd/shared", "@bwd/db"],
  poweredByHeader: false,
  devIndicators: false,
  // Die App ruft /api/v1 mit Bearer-Token auf (keine Cookies). CORS ohne Credentials ist darum unbedenklich.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Headers", value: "authorization, content-type, accept" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
