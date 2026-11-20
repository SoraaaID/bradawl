import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://bradawl.dev",
  compressHTML: true,
  experimental: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ],
    },
  },
  build: {
    inlineStylesheets: "auto",
  },
});
