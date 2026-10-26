import { fileURLToPath } from "node:url";

const env = globalThis.process.env;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desktop build (apps/built) bundles a self-contained server; tracing starts at the monorepo root.
  ...(env.BUILD_STANDALONE === "1" && {
    output: "standalone",
    outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  }),
  // Browser -> same-origin proxy -> backends (their CORS does not allow :3001).
  rewrites: async () => [
    {
      source: "/be-api/:path*",
      destination: `${env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"}/:path*`,
    },
    {
      source: "/tel-api/:path*",
      destination: `${env.NEXT_PUBLIC_TELEMETRY_API_URL ?? "https://tel-api.ramus.asia"}/:path*`,
    },
  ],
};

export default nextConfig;
