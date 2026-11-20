# Post-deploy checks against a live domain. Run after `npm run deploy` or after
# connecting the repo to Cloudflare Pages:
#   npm run verify:deploy -- -Domain https://bradawl.pages.dev
# Compatible with Windows PowerShell 5.1 (no -SkipHttpErrorCheck needed).
param(
  [Parameter(Mandatory = $true)][string]$Domain
)

$Domain = $Domain.TrimEnd("/")
$isHttps = $Domain -match "^https://"
$fail = 0

function Check($label, [bool]$ok, $detail) {
  if ($ok) { Write-Host ("PASS  {0,-36} {1}" -f $label, $detail) -ForegroundColor Green }
  else { Write-Host ("FAIL  {0,-36} {1}" -f $label, $detail) -ForegroundColor Red; $script:fail++ }
}

function Get-Url($path) {
  $u = $Domain + $path
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 20 -ErrorAction Stop
    $h = @{}
    foreach ($k in $r.Headers.Keys) { $h[$k.ToLower()] = ($r.Headers[$k] -join " ") }
    return [pscustomobject]@{ StatusCode = [int]$r.StatusCode; Headers = $h; Content = [string]$r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($null -eq $resp) { return $null }
    $code = [int]$resp.StatusCode
    $h = @{}
    foreach ($k in $resp.Headers.AllKeys) { $h[$k.ToLower()] = ($resp.Headers[$k] -join " ") }
    $body = ""
    try {
      $stream = $resp.GetResponseStream()
      if ($stream) { $body = (New-Object System.IO.StreamReader($stream)).ReadToEnd() }
    } catch {}
    return [pscustomobject]@{ StatusCode = $code; Headers = $h; Content = $body }
  }
}

# 1. routes
$routes = @("/", "/tools/har-sanitizer", "/tools/jwt-inspector", "/tools/csp-evaluator",
            "/tools/header-analyzer", "/tools/payload-bench", "/tools/endpoint-mapper")
foreach ($r in $routes) {
  $res = Get-Url $r
  Check "route $r" ($null -ne $res -and $res.StatusCode -eq 200) $(if ($res) { "HTTP $($res.StatusCode)" } else { "no response" })
}

# 2. real 404 for unknown paths
$nf = Get-Url "/definitely-not-a-route-42"
Check "unknown route returns 404" ($null -ne $nf -and $nf.StatusCode -eq 404) $(if ($nf) { "HTTP $($nf.StatusCode)" } else { "no response" })

# 3. static assets
$sec = Get-Url "/.well-known/security.txt"
Check "security.txt" ($null -ne $sec -and $sec.StatusCode -eq 200 -and $sec.Content -match "Contact:") $(if ($sec) { "HTTP $($sec.StatusCode)" } else { "no response" })
$sm = Get-Url "/sitemap.xml"
Check "sitemap.xml" ($null -ne $sm -and $sm.StatusCode -eq 200 -and $sm.Content -match "<urlset") $(if ($sm) { "HTTP $($sm.StatusCode)" } else { "no response" })
$rb = Get-Url "/robots.txt"
Check "robots.txt" ($null -ne $rb -and $rb.StatusCode -eq 200) $(if ($rb) { "HTTP $($rb.StatusCode)" } else { "no response" })
$og = Get-Url "/og.png"
Check "og.png" ($null -ne $og -and $og.StatusCode -eq 200) $(if ($og) { "HTTP $($og.StatusCode)" } else { "no response" })

# 4. security headers on the document
$doc = Get-Url "/"
if ($doc) {
  $h = $doc.Headers
  $need = [ordered]@{
    "x-frame-options"              = "DENY"
    "referrer-policy"              = "strict-origin-when-cross-origin"
    "permissions-policy"           = "camera=()"
    "cross-origin-opener-policy"   = "same-origin"
    "cross-origin-resource-policy" = "same-origin"
    "x-content-type-options"       = "nosniff"
    "content-security-policy"      = "frame-ancestors 'none'"
  }
  if ($isHttps) { $need["strict-transport-security"] = "max-age=" }
  foreach ($k in $need.Keys) {
    $val = [string]$h[$k]
    Check "header $k" ($val -match [regex]::Escape($need[$k])) $(if ($val) { $val.Substring(0, [Math]::Min(52, $val.Length)) } else { "missing" })
  }
} else {
  Check "document fetch" $false "no response"
}

# 5. immutable cache on hashed assets
if ($doc -and $doc.Content -match '/_astro/[A-Za-z0-9._-]+\.(css|js)') {
  $asset = $Matches[0]
  $a = Get-Url $asset
  $cc = if ($a) { [string]$a.Headers["cache-control"] } else { "" }
  Check "cache $asset" ($null -ne $a -and $a.StatusCode -eq 200 -and $cc -match "immutable") $cc
} else {
  Check "hashed asset discovery" $false "no /_astro asset referenced from /"
}

# 6. CSP meta tag: hashes present, no unsafe-inline styles, base-uri locked
if ($doc) {
  $meta = [regex]::Match($doc.Content, '(?i)<meta http-equiv="content-security-policy" content="([^"]+)"')
  Check "CSP meta present" $meta.Success "inline policy on the document"
  if ($meta.Success) {
    $policy = $meta.Groups[1].Value
    Check "CSP has script hash or nonce" ($policy -match "sha256-|nonce-") $policy.Substring(0, [Math]::Min(58, $policy.Length))
    Check "CSP style-src has no unsafe-inline" ($policy -notmatch "style-src[^;]*'unsafe-inline'") "checked"
    Check "CSP locks base-uri" ($policy -match "base-uri 'none'") "base-uri 'none'"
  }
}

Write-Host ""
if ($fail -eq 0) { Write-Host "ALL CHECKS PASSED" -ForegroundColor Green; exit 0 }
Write-Host "$fail CHECK(S) FAILED" -ForegroundColor Red
exit 1
