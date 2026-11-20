# Generates public/og.png (1200x630) — the link preview card.
# Run after changing the brand name or the tagline:
#   npm run og
Add-Type -AssemblyName System.Drawing

$W = 1200
$H = 630
$bg    = [System.Drawing.ColorTranslator]::FromHtml("#0b0b0c")
$text  = [System.Drawing.ColorTranslator]::FromHtml("#ecebe6")
$muted = [System.Drawing.ColorTranslator]::FromHtml("#94938c")
$dim   = [System.Drawing.ColorTranslator]::FromHtml("#85847d")
$line  = [System.Drawing.ColorTranslator]::FromHtml("#26262a")
$acc   = [System.Drawing.ColorTranslator]::FromHtml("#d7a153")

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear($bg)

$brushAcc   = New-Object System.Drawing.SolidBrush($acc)
$brushText  = New-Object System.Drawing.SolidBrush($text)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)
$brushDim   = New-Object System.Drawing.SolidBrush($dim)
$penLine    = New-Object System.Drawing.Pen($line, 1)

# top rule
$g.FillRectangle($brushAcc, 0, 0, $W, 3)

# mono family, bold where needed
$fBrand   = New-Object System.Drawing.Font("Consolas", 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fTag     = New-Object System.Drawing.Font("Consolas", 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fLabel   = New-Object System.Drawing.Font("Consolas", 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fNum     = New-Object System.Drawing.Font("Consolas", 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fSmall   = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fStrip   = New-Object System.Drawing.Font("Consolas", 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

# eyebrow
$g.DrawString("BRADAWL.DEV  /  CLIENT-SIDE TOOLKIT", $fLabel, $brushMuted, 72, 84)

# wordmark: amber mark + name
$g.FillRectangle($brushAcc, 72, 232, 13, 13)
$g.DrawString("bradawl", $fBrand, $brushText, 96, 200)

# tagline
$g.DrawString("six security utilities. nothing leaves the tab.", $fTag, $brushMuted, 72, 330)

# separator
$g.DrawLine($penLine, 72, 424, 1128, 424)

# stats
$stats = @(
  @("0", "requests after load", 72),
  @("0", "cookies or trackers", 372),
  @("0", "accounts required", 672)
)
foreach ($s in $stats) {
  $g.DrawString($s[0], $fNum, $brushAcc, $s[2], 462)
  $g.DrawString($s[1], $fLabel, $brushMuted, $s[2], 506)
}

# tool strip
$strip = "01 har sanitizer   02 jwt inspector   03 csp evaluator   04 header analyzer   05 payload bench   06 endpoint mapper"
$g.DrawString($strip, $fStrip, $brushDim, 72, 572)

$g.Dispose()
$out = Join-Path $PSScriptRoot "..\public\og.png"
$resolved = [System.IO.Path]::GetFullPath($out)
$bmp.Save($resolved, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "wrote $resolved ($((Get-Item $resolved).Length) bytes)"
