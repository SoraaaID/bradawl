export type ToolSlug =
  | "har-sanitizer"
  | "jwt-inspector"
  | "csp-evaluator"
  | "header-analyzer"
  | "payload-bench"
  | "endpoint-mapper";

export interface Tool {
  slug: ToolSlug;
  n: string;
  title: string;
  blurb: string;
  long: string;
  tags: string[];
  layout: "feat" | "sm" | "wide";
  notes: string[];
  limits: string[];
}

export const tools: Tool[] = [
  {
    slug: "har-sanitizer",
    n: "01",
    title: "HAR Sanitizer",
    blurb:
      "Drop a .har and strip cookies, bearer tokens, set-cookie headers, emails and JWTs before you attach it to a report. Parsed in this tab. Nothing is uploaded.",
    long:
      "A HAR file is a full recording of a browsing session — cookies, authorization headers, request bodies, response bodies, and every email address the app happened to render. Attaching one raw to a bug report leaks more than the bug. This tool parses the archive in the tab, redacts the fields that matter, and hands back a file you can actually send.",
    tags: ["cookie", "authorization", "set-cookie", "jwt", "email"],
    layout: "feat",
    notes: [
      "Redacts Cookie, Set-Cookie, Authorization, Proxy-Authorization, X-Api-Key, X-Auth-Token, X-Access-Token, X-CSRF-Token, X-XSRF-Token, X-Session-Id, X-Amz-Security-Token and any header name containing auth, token, key, secret, session, signature or credential.",
      "Rewrites sensitive query parameters (token, key, sig, password, session, otp, nonce, state, code, AWS presign params …) in both the URL and the structured queryString array.",
      "Walks JSON bodies and redacts values under keys matching password, secret, token, cookie, auth, api_key, session, csrf, otp, ssn, card, cvv, pin. Form-encoded bodies get the same treatment, and postData params are cleaned individually.",
      "Scrubs email addresses, JWT-shaped strings and Bearer tokens out of free text.",
      "Removes _securityState, which leaks the browser's internal TLS assessment.",
    ],
    limits: [
      "40 MB cap — larger archives fail fast instead of hanging the tab.",
      "Response bodies over 1 MB, or base64-encoded bodies, are left as-is; decompress and re-export if you need them clean.",
      "It never guesses: a field it does not recognise stays untouched, so read the download before you send it.",
    ],
  },
  {
    slug: "jwt-inspector",
    n: "02",
    title: "JWT Inspector",
    blurb:
      "Decode header and payload, flag alg:none, expired claims, missing signatures and obvious weak secrets.",
    long:
      "Paste a token and see the two JSON segments as they actually are, then a row of verdicts: which algorithm signed it, whether it is still valid, whether the signature segment is even present, and whether the payload carries an elevated claim. The optional secret check runs HMAC in WebCrypto against a short list of secrets that show up in real codebases.",
    tags: ["live", "offline", "hmac"],
    layout: "sm",
    notes: [
      "Base64url-decodes header and payload without ever verifying against a key you do not have.",
      "Flags alg:none, absent alg, missing or empty signature, expired exp, and role=admin / is_admin claims.",
      "The secret check rebuilds the signature with HMAC-SHA256/384/512 over 57 common secrets and compares it to the token's third segment.",
    ],
    limits: [
      "HMAC only — RS256, ES256 and PS256 need the public key and are out of scope.",
      "The secret list is a sanity check, not a wordlist attack. A miss proves nothing.",
      "crypto.subtle requires a secure context: https, or localhost during development.",
    ],
  },
  {
    slug: "csp-evaluator",
    n: "03",
    title: "CSP Evaluator",
    blurb:
      "Paste a Content-Security-Policy, get the holes named and a stricter policy you can ship.",
    long:
      "Most policies look fine until you read which directive is missing. This parses the header value into directives, scores fourteen common failure modes, and prints the reason each one matters — not just the name. It also generates a nonce-based starting policy you can adapt.",
    tags: ["live", "generator"],
    layout: "sm",
    notes: [
      "Checks for a missing default-src, unsafe-inline in script-src and style-src, unsafe-eval, bare wildcards, data: scripts, plaintext schemes, third-party script hosts, a missing object-src 'none', base-uri, frame-ancestors and any reporting endpoint.",
      "Scores 100 minus a weighted penalty per finding (high 24, medium 10, low 4) and maps that to an A–F grade.",
      "Generates a strict policy with a fresh 18-byte nonce on every page load.",
    ],
    limits: [
      "Static analysis of the header only — it cannot know whether your app actually needs 'unsafe-inline'.",
      "The generated policy is a starting point; remove directives your app does not use.",
      "Nonce reuse across responses is the usual way a good policy ends up weak.",
    ],
  },
  {
    slug: "header-analyzer",
    n: "04",
    title: "Header Analyzer",
    blurb:
      "A–F grade across HSTS, CSP, X-Frame-Options, Referrer-Policy and the rest, with the why behind each.",
    long:
      "Paste a raw response header block — the output of curl -sI is enough — and get ten weighted checks back as a table: what was found, what state it is in, and what that means. The score is weighted, so a missing CSP costs more than a leaked framework banner.",
    tags: ["live", "grading"],
    layout: "sm",
    notes: [
      "Weights: CSP 20, HSTS 15, nosniff 12, X-Frame-Options 10, Referrer-Policy 10, COOP 9, Permissions-Policy 8, CORP 8, COEP 4, X-Powered-By 4.",
      "HSTS is judged on max-age (180 days floor) and includeSubDomains, not on presence alone.",
      "CSP frame-ancestors counts as frame protection when X-Frame-Options is absent.",
      "Permissions-Policy with a wildcard origin is downgraded, not accepted.",
      "Folded header lines are joined; the status line is ignored.",
      "Copy curl command puts a ready-made collection one-liner on your clipboard.",
    ],
    limits: [
      "Ten headers, not all of them. It says nothing about cookie flags, CORS or TLS configuration.",
      "A grade is a summary of the response you pasted, not a scan of the host.",
      "Nothing is requested — the tool never touches the network.",
    ],
  },
  {
    slug: "payload-bench",
    n: "05",
    title: "Payload Bench",
    blurb:
      "URL, base64, hex and unicode encode/decode, plus reverse-shell generators in seven languages. Strings only.",
    long:
      "The conversion you keep opening a scratch file for: URL, base64, hex, HTML entity and unicode escape both ways, plus a JWT with alg:none. Under it, the reverse-shell one-liners for the shells you actually land in — bash, python, powershell, php, nc, perl, ruby — built from your host and port.",
    tags: ["encoder", "generator"],
    layout: "sm",
    notes: [
      "Six encoders; JWT none is encode-only, the other five decode as well.",
      "JWT none mode builds header.payload with an empty signature segment.",
      "Reverse shells are generated as strings with the port clamped to 1–65535.",
    ],
    limits: [
      "Nothing here executes. The output is text for your own harness.",
      "The shells assume a listener you started yourself.",
      "Unicode mode escapes code points above 126 and leaves ASCII alone.",
    ],
  },
  {
    slug: "endpoint-mapper",
    n: "06",
    title: "Endpoint Mapper",
    blurb:
      "Paste an endpoint list, tag the parameters that matter, export a testing checklist per engagement.",
    long:
      "Drop the URLs you pulled out of a JS bundle or a proxy history, one per line, with or without a method. The mapper separates host, path and parameters, marks the names that usually hide object references, and exports a markdown checklist grouped by host so you can work through it methodically.",
    tags: ["live", "export"],
    layout: "wide",
    notes: [
      "Accepts GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS prefixes; defaults to GET.",
      "Extracts query keys plus numeric and UUID path segments.",
      "Marks hot parameters — id, uid, uuid, account, order, file, doc, invoice, payment, txn, tenant, org, workspace, project, redirect, next, callback, url, path, token, key, email, phone.",
      "Deduplicates by method, host, path and parameter set.",
      "Copy checklist writes a grouped markdown task list to the clipboard and shows it below the table.",
    ],
    limits: [
      "Relative paths are accepted but grouped under (relative).",
      "It reads a list. It does not crawl, resolve or request anything.",
      "Heat is a naming heuristic, not a finding.",
    ],
  },
];

export const bySlug = (slug: string) => tools.find((t) => t.slug === slug);
