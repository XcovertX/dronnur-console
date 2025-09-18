import type { NextConfig } from "next";

// Toggle static export ONLY when building a GH Pages demo.
// For LAN/server builds, leave these env vars unset.
const repo = "dronnur-console"; // your repo name for project pages
const isStatic =
  process.env.GITHUB_PAGES === "true" || process.env.STATIC_EXPORT === "true";

// If you use a user/org page (repo named <you>.github.io), set this to true.
const isUserPage = false;

const staticConfig: NextConfig = {
  output: "export",
  basePath: isUserPage ? "" : `/${repo}`,
  assetPrefix: isUserPage ? "" : `/${repo}/`,
  images: { unoptimized: true },
  trailingSlash: true,
};

const serverConfig: NextConfig = {
  // IMPORTANT: no `output` here — keeps Node/server runtime so /api routes work
};

const config: NextConfig = isStatic ? staticConfig : serverConfig;
export default config;
