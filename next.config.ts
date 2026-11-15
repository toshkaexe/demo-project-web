import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // минимальная сборка для Docker: .next/standalone со своим server.js
  output: "standalone",
  // сайт сразу открывается каталогом, вход — на /login
  redirects() {
    return [{ source: "/", destination: "/catalog", permanent: false }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
