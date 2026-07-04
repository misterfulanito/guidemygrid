#!/usr/bin/env bash
# GuideMyGrid — Direct Installer (macOS)
# Copies the plugin files directly into Photoshop's plugin folder.
# No Creative Cloud required.
#
# Usage: bash install.sh  (or double-click in Finder after granting permission)

set -euo pipefail

PLUGIN_ID="com.guidemygrid.plugin"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
UXP_BASE="$HOME/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP"

echo "GuideMyGrid — Direct Installer (macOS)"
echo "───────────────────────────────────────"

if [ ! -f "$DIST_DIR/manifest.json" ]; then
  echo ""
  echo "❌  Plugin files not found."
  echo "    Make sure the 'dist' folder is in the same directory as this script."
  exit 1
fi

if [ ! -d "$UXP_BASE" ]; then
  echo ""
  echo "❌  Photoshop UXP directory not found."
  echo "    Expected: $UXP_BASE"
  echo ""
  echo "    → Make sure Photoshop is installed and has been opened at least once."
  exit 1
fi

INSTALLED=0

for PS_DIR in "$UXP_BASE"/*/; do
  [ -d "$PS_DIR" ] || continue

  PLUGIN_DIR="${PS_DIR}Plugin/$PLUGIN_ID"
  mkdir -p "$PLUGIN_DIR"
  cp -r "$DIST_DIR/." "$PLUGIN_DIR/"
  find "$PLUGIN_DIR" -name ".DS_Store" -delete 2>/dev/null || true

  PS_VERSION=$(basename "$PS_DIR")
  echo "✅  Installed → Photoshop version $PS_VERSION"
  INSTALLED=$((INSTALLED + 1))
done

if [ $INSTALLED -eq 0 ]; then
  echo ""
  echo "❌  No Photoshop version directories found inside:"
  echo "    $UXP_BASE"
  echo ""
  echo "    → Open Photoshop once, close it, then run this installer again."
  exit 1
fi

echo ""
echo "✅  Done! Restart Photoshop to activate GuideMyGrid."
echo "    Window → Plugins → GuideMyGrid"
