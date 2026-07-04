# GuideMyGrid — Direct Installer (Windows)
# Copies the plugin files directly into Photoshop's plugin folder.
# No Creative Cloud required.
#
# Usage: right-click install.bat → Run as administrator
#        or: powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"

$PLUGIN_ID  = "com.guidemygrid.plugin"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$DIST_DIR   = Join-Path $SCRIPT_DIR "dist"
$UXP_BASE   = Join-Path $env:APPDATA "Adobe\UXP\PluginsStorage\PHSP"

Write-Host "GuideMyGrid -- Direct Installer (Windows)"
Write-Host "------------------------------------------"

if (-not (Test-Path (Join-Path $DIST_DIR "manifest.json"))) {
  Write-Host ""
  Write-Host "ERROR: Plugin files not found."
  Write-Host "  Make sure the 'dist' folder is in the same directory as this script."
  exit 1
}

if (-not (Test-Path $UXP_BASE)) {
  Write-Host ""
  Write-Host "ERROR: Photoshop UXP directory not found."
  Write-Host "  Expected: $UXP_BASE"
  Write-Host ""
  Write-Host "  -> Make sure Photoshop is installed and has been opened at least once."
  exit 1
}

$INSTALLED = 0

Get-ChildItem -Path $UXP_BASE -Directory | ForEach-Object {
  $PLUGIN_DIR = Join-Path $_.FullName "Plugin\$PLUGIN_ID"
  New-Item -ItemType Directory -Force -Path $PLUGIN_DIR | Out-Null
  Copy-Item -Path (Join-Path $DIST_DIR "*") -Destination $PLUGIN_DIR -Recurse -Force
  Get-ChildItem -Path $PLUGIN_DIR -Filter "Thumbs.db" -Recurse -ErrorAction SilentlyContinue |
    Remove-Item -Force
  Write-Host "OK  Installed -> Photoshop version $($_.Name)"
  $INSTALLED++
}

if ($INSTALLED -eq 0) {
  Write-Host ""
  Write-Host "ERROR: No Photoshop version directories found inside:"
  Write-Host "  $UXP_BASE"
  Write-Host ""
  Write-Host "  -> Open Photoshop once, close it, then run this installer again."
  exit 1
}

Write-Host ""
Write-Host "Done! Restart Photoshop to activate GuideMyGrid."
Write-Host "  Window -> Plugins -> GuideMyGrid"
