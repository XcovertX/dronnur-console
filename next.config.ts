import type { NextConfig } from "next";

// Set this in your GitHub Actions step (or locally) to flip GH Pages settings:
//   GITHUB_PAGES=true
const isGithubPages = process.env.GITHUB_PAGES === "true";

// CHANGE THIS to your repo name when deploying to a *project page*
// e.g. https://<you>.github.io/<repo> → repo = "<repo>"
const repo = "dronnur-console";

const config: NextConfig = {
  // Emit a fully static site to ./out
  output: "export",

  // For project pages, serve under /<repo>. For user/org pages, leave empty.
  basePath: isGithubPages ? `/${repo}` : "",
  assetPrefix: isGithubPages ? `/${repo}/` : "",

  // Next/Image optimizer is disabled in static export
  images: { unoptimized: true },

  // Helps GH Pages serve nested routes as /path/index.html
  trailingSlash: true,
};

export default config;
