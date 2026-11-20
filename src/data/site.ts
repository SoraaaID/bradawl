// Single source of truth for the brand. Renaming the site means editing this
// file and public/og.png (npm run og) — nothing else hardcodes the name.
export const SITE = {
  name: "bradawl",
  url: "https://bradawl.dev",
  email: "hello@bradawl.dev",
  repo: "https://github.com/SoraaaID/bradawl",
} as const;

export const TAGLINE = "security tools that run in your tab";
