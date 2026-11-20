// Single source of truth for the brand. Renaming the site means editing this
// file and public/og.png (npm run og) — nothing else hardcodes the name.
// The public host lives here too: swap `url` and the `contact` line in
// public/.well-known/security.txt when a custom domain is attached.
export const SITE = {
  name: "bradawl",
  url: "https://bradawl.soradev-id.workers.dev",
  contact: "https://github.com/SoraaaID/bradawl/issues",
  repo: "https://github.com/SoraaaID/bradawl",
} as const;

export const TAGLINE = "security tools that run in your tab";
