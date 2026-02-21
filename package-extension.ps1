param(
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $root "manifest.json"

if (-not (Test-Path $manifestPath)) {
  throw "manifest.json not found in $root"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

if (-not $version) {
  throw "Could not read version from manifest.json"
}

$outputPath = Join-Path $root $OutputDir
if (-not (Test-Path $outputPath)) {
  New-Item -Path $outputPath -ItemType Directory | Out-Null
}

$zipName = "chrome-hover-preview-v$version.zip"
$zipPath = Join-Path $outputPath $zipName

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

$staging = Join-Path $root ".package-temp"
if (Test-Path $staging) {
  Remove-Item $staging -Recurse -Force
}
New-Item -Path $staging -ItemType Directory | Out-Null

$excludeNames = @(
  "dist",
  ".git",
  ".package-temp"
)

$excludeExtensions = @(
  ".md",
  ".ps1"
)

Get-ChildItem -Path $root -Force | Where-Object {
  $item = $_

  if ($excludeNames -contains $item.Name) {
    return $false
  }

  if (-not $item.PSIsContainer -and ($excludeExtensions -contains $item.Extension.ToLowerInvariant())) {
    return $false
  }

  return $true
} | ForEach-Object {
  $destination = Join-Path $staging $_.Name
  if ($_.PSIsContainer) {
    Copy-Item -Path $_.FullName -Destination $destination -Recurse -Force
  } else {
    Copy-Item -Path $_.FullName -Destination $destination -Force
  }
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created package: $zipPath"
