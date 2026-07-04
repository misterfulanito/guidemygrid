#!/bin/sh
# distribution/photoshop/macos/install-payload.sh
# Non-interactive copy+manifest core of the macOS installer (MAC-01, MAC-02, MAC-04).
# Copies a source plugin dir into every existing Photoshop UXP PluginsStorage
# version subdir at user level (no elevation) and writes an install-time
# manifest listing every path it created. Called by installer.applescript
# (Plan 04) via an absolute-path shell invocation.
#
# Usage: install-payload.sh <source_plugin_dir> <version>
# Env:   GMG_INSTALL_BASE   (default: $HOME/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP)
#        GMG_MANIFEST_PATH  (default: $HOME/Library/Application Support/GuideMyGrid/install-manifest.json)

set -eu

# Explicit clean PATH — never trust the inherited environment (MAC-04).
PATH=/usr/bin:/bin
export PATH

PLUGIN_ID="com.guidemygrid.plugin"

SRC_DIR="${1:-}"
VERSION="${2:-}"

if [ -z "$SRC_DIR" ] || [ ! -d "$SRC_DIR" ]; then
  echo "install-payload: source plugin directory not found: $SRC_DIR" >&2
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "install-payload: version argument (arg2) is required" >&2
  exit 1
fi

BASE="${GMG_INSTALL_BASE:-$HOME/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP}"
MANIFEST_PATH="${GMG_MANIFEST_PATH:-$HOME/Library/Application Support/GuideMyGrid/install-manifest.json}"

case "$BASE" in
  /*) ;;
  *)
    echo "install-payload: install base must be an absolute path: $BASE" >&2
    exit 1
    ;;
esac

case "$BASE" in
  *..*)
    echo "install-payload: install base must not contain '..': $BASE" >&2
    exit 1
    ;;
esac

FOUND_VERSION_DIR=0
for v in "$BASE"/*/; do
  [ -d "$v" ] || continue
  FOUND_VERSION_DIR=1
  break
done

if [ "$FOUND_VERSION_DIR" -eq 0 ]; then
  echo "install-payload: no Photoshop plugin storage version directory found under $BASE" >&2
  exit 1
fi

PATHS_FILE=$(/usr/bin/mktemp)
UNIQUE_PATHS_FILE=$(/usr/bin/mktemp)
cleanup() {
  /bin/rm -f "$PATHS_FILE" "$UNIQUE_PATHS_FILE"
}
trap cleanup EXIT

for v in "$BASE"/*/; do
  [ -d "$v" ] || continue
  PLUGIN_DIR="${v}Plugin/$PLUGIN_ID"

  /bin/mkdir -p "$PLUGIN_DIR"
  /bin/cp -r "$SRC_DIR/." "$PLUGIN_DIR/"
  /usr/bin/find "$PLUGIN_DIR" -name ".DS_Store" -delete 2>/dev/null || true

  # Non-world-writable permissions on every created path.
  /usr/bin/find "$PLUGIN_DIR" -exec /bin/chmod go-w {} +

  # Record every path created/copied under this version's plugin dir.
  /usr/bin/find "$PLUGIN_DIR" >> "$PATHS_FILE"
done

# Write the manifest into its own dedicated app-support location, outside the
# plugin tree the UXP runtime scans (Security V12).
MANIFEST_DIR=$(/usr/bin/dirname "$MANIFEST_PATH")
/bin/mkdir -p "$MANIFEST_DIR"
/bin/chmod go-w "$MANIFEST_DIR"
echo "$MANIFEST_DIR" >> "$PATHS_FILE"

/usr/bin/sort -u "$PATHS_FILE" > "$UNIQUE_PATHS_FILE"

INSTALLED_AT=$(/bin/date -u +"%Y-%m-%dT%H:%M:%SZ")

PATHS_JSON="["
FIRST=1
while IFS= read -r p; do
  [ -z "$p" ] && continue
  ESCAPED=$(printf '%s' "$p" | /usr/bin/sed 's/\\/\\\\/g; s/"/\\"/g')
  if [ "$FIRST" -eq 1 ]; then
    PATHS_JSON="${PATHS_JSON}\"${ESCAPED}\""
    FIRST=0
  else
    PATHS_JSON="${PATHS_JSON},\"${ESCAPED}\""
  fi
done < "$UNIQUE_PATHS_FILE"
PATHS_JSON="${PATHS_JSON}]"

{
  printf '{\n'
  printf '  "installedAt": "%s",\n' "$INSTALLED_AT"
  printf '  "pluginId": "%s",\n' "$PLUGIN_ID"
  printf '  "version": "%s",\n' "$VERSION"
  printf '  "paths": %s\n' "$PATHS_JSON"
  printf '}\n'
} > "$MANIFEST_PATH"

/bin/chmod go-w "$MANIFEST_PATH"

echo "$MANIFEST_PATH"
