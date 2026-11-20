// Captures the README screenshots from a local build.
//   npm run build && npm run preview      (serves dist on :4321)
//   node scripts/capture.cjs
// Playwright is not a dependency of this repo. Install it anywhere, then point
// NODE_PATH at it, e.g.
//   npm i playwright && npx playwright install chromium
//   set NODE_PATH=%APPDATA%\npm\node_modules
// Set PW_CHANNEL=msedge or chrome to use an installed browser instead of the
// bundled download.
// All demo values below are fabricated: RFC 2606 domains, fake JWTs, fake headers.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:4321";
const OUT = path.resolve(__dirname, "..", "docs", "screens");

const JWT_HEADER = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const NOW = Math.floor(Date.now() / 1000);
const JWT_PAYLOAD = Buffer.from(
  JSON.stringify({
    sub: "demo-user-1042",
    role: "editor",
    tenant: "example",
    iat: NOW,
    exp: NOW + 3600,
  })
).toString("base64url");
const JWT = `${JWT_HEADER}.${JWT_PAYLOAD}.Q2hhbmdlVGhpc1NpZ25hdHVyZUtleUZvckRlbW8`;

const CSP = "default-src *; script-src 'unsafe-inline' 'unsafe-eval' http:; style-src 'unsafe-inline'; object-src *; base-uri *";

const HEADERS = [
  "HTTP/1.1 200 OK",
  "Content-Type: text/html; charset=utf-8",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy: no-referrer",
  "Strict-Transport-Security: max-age=86400",
  "Permissions-Policy: camera=*",
].join("\n");

const ENDPOINTS = [
  "https://api.example.com/v1/users/1042?include=profile&page=2",
  "https://api.example.com/v1/users/999?include=profile&page=3",
  "https://api.example.com/v1/orders/8f14e45f-ceea-467a-9a1b-2c3d4e5f6a7b?expand=items",
  "https://api.example.com/v1/search?q=widget&sort=price&limit=50",
  "https://api.example.com/v1/users/1042/avatar",
].join("\n");

async function type(page, selector, text) {
  const el = page.locator(selector).first();
  await el.fill("");
  await el.fill(text);
  await el.dispatchEvent("input");
  await page.waitForTimeout(350);
}

const jobs = [
  {
    file: "01-home.png",
    url: "/",
    viewport: true,
  },
  {
    file: "02-toolkit.png",
    url: "/",
    target: "#tools",
  },
  {
    file: "03-har-sanitizer.png",
    url: "/tools/har-sanitizer",
    async setup(page) {
      await page.locator("[data-sample]").click();
      await page.waitForTimeout(700);
    },
  },
  {
    file: "04-jwt-inspector.png",
    url: "/tools/jwt-inspector",
    async setup(page) {
      await type(page, "[data-input]", JWT);
    },
  },
  {
    file: "05-csp-evaluator.png",
    url: "/tools/csp-evaluator",
    async setup(page) {
      await type(page, "[data-input]", CSP);
    },
  },
  {
    file: "06-header-analyzer.png",
    url: "/tools/header-analyzer",
    async setup(page) {
      await type(page, "[data-input]", HEADERS);
    },
  },
  {
    file: "07-payload-bench.png",
    url: "/tools/payload-bench",
    async setup(page) {
      await type(page, "[data-input]", "<script>alert(document.domain)</script> &q=1#frag");
    },
  },
  {
    file: "08-endpoint-mapper.png",
    url: "/tools/endpoint-mapper",
    async setup(page) {
      await type(page, "[data-input]", ENDPOINTS);
    },
  },
  {
    file: "09-field-notes.png",
    url: "/",
    target: "#notes",
  },
];

const PANEL = {
  "/tools/har-sanitizer": "[data-har]",
  "/tools/jwt-inspector": "[data-jwt]",
  "/tools/csp-evaluator": "[data-csp]",
  "/tools/header-analyzer": "[data-hdrs]",
  "/tools/payload-bench": "[data-pb]",
  "/tools/endpoint-mapper": "[data-ep]",
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    bypassCSP: true, // the site ships a strict CSP meta tag; allow the injected helper styles
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("console error:", m.text());
  });

  // Fast-forward every reveal animation to its end state. Waiting for them is
  // fragile and reduced-motion leaves some elements parked at opacity 0.
  const settle = async (p) => {
    await p.evaluate(() => {
      for (const a of document.getAnimations()) {
        try { a.finish(); } catch {}
      }
    });
    await p.waitForTimeout(250);
  };

  for (const job of jobs) {
    await page.goto(BASE + job.url, { waitUntil: "networkidle" });
    // force dark theme so the set is consistent
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
      try { localStorage.setItem("bw-theme", "dark"); } catch {}
    });
    await settle(page);
    if (job.setup) {
      await job.setup(page);
      await settle(page);
    }
    await page.waitForTimeout(300);

    const dest = path.join(OUT, job.file);
    if (job.target) {
      // whole-viewport shot with the section sitting below a comfortable margin
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90);
      }, job.target);
      await page.waitForTimeout(300);
      await page.screenshot({ path: dest });
    } else if (PANEL[job.url] && !job.viewport) {
      await page.addStyleTag({ content: "header.nav{display:none!important}" });
      await page.waitForTimeout(200);
      await page.locator(PANEL[job.url]).screenshot({ path: dest });
    } else {
      await page.screenshot({ path: dest });
    }
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`${job.file}  ${kb} KB`);
  }

  await browser.close();
})();
