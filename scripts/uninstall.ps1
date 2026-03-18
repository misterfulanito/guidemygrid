# GuideMyGrid — Uninstaller (Windows)
# Removes the plugin from all Photoshop versions found.
# Double-click uninstall.bat to run this.

$ErrorActionPreference = "Stop"

$PLUGIN_ID = "com.guidemygrid.plugin"
$UXP_BASE  = Join-Path $env:APPDATA "Adobe\UXP\PluginsStorage\PHSP"

Write-Host "GuideMyGrid -- Uninstaller (Windows)"
Write-Host "--------------------------------------"

if (-not (Test-Path $UXP_BASE)) {
  Write-Host "GuideMyGrid is not installed (Photoshop UXP directory not found)."
  exit 0
}

$REMOVED = 0

Get-ChildItem -Path $UXP_BASE -Directory | ForEach-Object {
  $PLUGIN_DIR = Join-Path $_.FullName "Plugin\$PLUGIN_ID"
  if (Test-Path $PLUGIN_DIR) {
    Remove-Item -Path $PLUGIN_DIR -Recurse -Force
    Write-Host "OK  Removed from Photoshop version $($_.Name)"
    $REMOVED++
  }
}

if ($REMOVED -eq 0) {
  Write-Host "GuideMyGrid was not found in any Photoshop installation."
} else {
  Write-Host ""
  Write-Host "Done! Restart Photoshop to complete the uninstall."
}
