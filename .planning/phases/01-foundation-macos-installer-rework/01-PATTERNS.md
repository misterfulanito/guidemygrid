# Phase 1: Foundation & macOS Installer Rework - Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 9 (new/moved/modified)
**Analogs found:** 8 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `distribution/photoshop/macos/build-installer.js` | build-script/config | file-I/O (orchestrates external tools) | `scripts/build-mac-pkg.js` (from `origin/main`) | exact — same role (Node build orchestrator shelling to a native macOS packaging tool), same data flow (copy `dist/` → stage → invoke CLI tool → write to `releases/`) |
| `distribution/photoshop/macos/installer.applescript` | script/utility (native installer logic) | event-driven (dialogs) + file-I/O (copy + manifest write) | `scripts/pkg-resources/postinstall` (from `origin/main`) | role-match — same responsibility (copy plugin into `PluginsStorage/PHSP/...`) but different implementation surface (AppleScript `.app`, not a root postinstall shell script). Use as the "what to copy / where to copy" reference, not as a structural template (it must NOT be copied verbatim — its root-trusting `$PATH` pattern is exactly what MAC-04 replaces). |
| `distribution/photoshop/windows/` (relocated, unmodified) | config/placeholder | file-I/O | `scripts/install.sh`, `scripts/install.bat`, `scripts/install.ps1`, `scripts/uninstall.bat`, `scripts/uninstall.ps1` (from `origin/main`) | exact — literal relocation, no logic changes this phase |
| `release/version.js` (renamed from `scripts/sync-version.js`) | utility/config | transform (reads `package.json` → writes `manifest.json` + `src/version.ts`) | `scripts/sync-version.js` (already exists on current branch, verbatim) | exact — direct rename, no logic change needed |
| `release/github-release.js` (renamed from `scripts/gh-release.js`) | utility/service | request-response (shells to `gh` CLI) | `scripts/gh-release.js` (from `origin/main`) | exact — direct rename, no logic change needed this phase |
| `distribution/README.md` | config/doc | — | none (net-new doc) | no analog needed — plain descriptive README |
| `distribution/photoshop/macos/README.md` | config/doc | — | none (net-new doc) | no analog needed |
| `distribution/photoshop/windows/README.md` | config/doc | — | none (net-new doc) | no analog needed |
| `distribution/photoshop/macos/__tests__/installer-static.test.ts` | test | static/grep validation | `src/__tests__/gridGenerator.sideGuide.test.ts` (existing Jest pattern) | role-match — same test framework/conventions (Jest, `__tests__/` colocated dir), different subject (grep-based static assertion vs. pure-function unit test) |
| `distribution/photoshop/macos/__tests__/manifest.test.ts` | test | integration (sandboxed `$HOME`, file assertions) | `src/__tests__/gridGenerator.sideGuide.test.ts` (existing Jest pattern) | role-match — same framework conventions; no existing integration/fixture-based test to copy fixture-setup style from (flagged below) |

## Pattern Assignments

### `distribution/photoshop/macos/build-installer.js` (build-script, file-I/O)

**Analog:** `scripts/build-mac-pkg.js` (read from `origin/main` — this file does not yet exist on the working branch; it lands via the FOUND-01 merge, then gets replaced/rewritten this same phase)

**Imports pattern** (whole-file, ~13 lines):
```javascript
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const distDir = path.join(root, 'dist');
const outDir  = path.join(root, 'releases');
```
Note: for the new file's location (`distribution/photoshop/macos/build-installer.js`, two levels deeper than `scripts/`), `path.resolve(__dirname, '..', '..', '..')` is needed to reach repo root — adjust the relative depth, do not copy `..` verbatim.

**Core "stage dist/, shell out to native tool, clean up" pattern** (lines ~24-70 of the analog):
```javascript
const JUNK = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db']);
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (JUNK.has(entry) || entry.startsWith('.')) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Clean up leftovers from any previous failed run
[tmpPayload, tmpScripts].forEach(p => {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
});
if (fs.existsSync(output)) fs.unlinkSync(output);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ... stage payload ...

execSync(
  ['pkgbuild', `--root "${tmpPayload}"`, /* ... */].join(' '),
  { stdio: 'inherit', cwd: root }
);

// ── Cleanup ───────────────────────────────────────────────────────────────────
fs.rmSync(tmpPayload, { recursive: true });
fs.rmSync(tmpScripts, { recursive: true });

console.log(`✅  macOS PKG: releases/GuideMyGrid-v${version}.pkg`);
```
**Adapt, don't copy verbatim:** replace the `pkgbuild` invocation with the `osacompile` → `codesign --sign -` → `create-dmg` chain per RESEARCH.md's Standard Stack. Keep: the junk-file filtering, the pre-run cleanup of temp dirs, the `console.log('✅ ...')` success-message convention, and the "read version from `package.json`" pattern (matches `release/version.js`'s convention too).

**Naming/comment convention to copy:**
```javascript
/**
 * build-installer.js
 * Builds a macOS installer .app + .dmg for GuideMyGrid — unprivileged, no root.
 * ...
 */
```
Matches the JSDoc-style file-header convention used in every `scripts/*.js` file (see `sync-version.js`, `gh-release.js`, `package.js` below).

---

### `distribution/photoshop/macos/installer.applescript` (script, event-driven + file-I/O)

**Analog (for "what to copy where"):** `scripts/pkg-resources/postinstall` (read from `origin/main`)

**Destination-path pattern to preserve** (this is the one piece of business logic that MUST carry over unchanged):
```bash
UXP_BASE="$USER_HOME/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP"
# ...
for PS_DIR in "$UXP_BASE"/*/; do
  [ -d "$PS_DIR" ] || continue
  PLUGIN_DIR="${PS_DIR}Plugin/$PLUGIN_ID"
  mkdir -p "$PLUGIN_DIR"
  cp -r "$PLUGIN_SRC/." "$PLUGIN_DIR/"
  find "$PLUGIN_DIR" -name ".DS_Store" -delete 2>/dev/null || true
done
```

**Pattern to explicitly NOT copy (this is the bug this phase fixes — MAC-04):** every command above (`mkdir`, `cp`, `find`, `chown`, `stat`, `dscl`, `awk`) is called by bare name, trusting `$PATH`. In the new AppleScript, every `do shell script` call must use absolute paths per RESEARCH.md's Code Examples:
```applescript
-- RIGHT (absolute path, no PATH trust):
do shell script "/bin/cp -r " & quoted form of srcPath & " " & quoted form of destPath
```

**New dialog/guard pattern (from RESEARCH.md's Code Examples — no in-repo analog exists for AppleScript dialogs, this is genuinely new code this phase introduces):**
```applescript
set confirmed to display dialog "Install GuideMyGrid?" ¬
  with title "Install GuideMyGrid" ¬
  buttons {"Cancel", "Install"} default button "Install"

if button returned of confirmed is "Cancel" then
  return
end if

repeat
  set psRunning to (do shell script "/usr/bin/pgrep -i photoshop || true") is not ""
  if not psRunning then exit repeat
  display alert "Please quit Photoshop first" message ¬
    "GuideMyGrid can't install while Photoshop is open. Quit Photoshop, then click OK to continue." ¬
    buttons {"Cancel", "OK"} default button "OK"
end repeat

-- ... copy + manifest write ...

display dialog "Installed! Open Photoshop" with title "GuideMyGrid" buttons {"OK"} default button "OK"
```

**D-06 note:** No in-repo analog exists for "reuse existing icon/color tokens in a native OS dialog" — AppleScript `display dialog`/`display alert` has very limited chrome (icon parameter only accepts `note`/`caution`/`stop`/a file path to an `.icns`). If an app icon is needed for the `.app` bundle itself (Finder icon, not dialog chrome), export the existing icon asset referenced in `src/styles/tokens.css`'s color tokens / any exported PNG/SVG asset in the `ui-icons` epic work and convert to `.icns` — do not design a new one. Flag this as a manual-conversion step in the plan, not a copyable code pattern.

---

### `release/version.js` (utility, transform)

**Analog:** `scripts/sync-version.js` (verbatim, already present on current branch)

**Full pattern — copy exactly, only the file path changes:**
```javascript
/**
 * sync-version.js
 * Reads version from package.json and writes it to manifest.json + src/version.ts.
 * Runs automatically before every build (prebuild hook).
 */

const fs   = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const pkg      = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version  = pkg.version;

// ── manifest.json ────────────────────────────────────────────────────────────
const manifestPath = path.join(root, 'manifest.json');
const manifest     = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version   = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// ── src/version.ts ───────────────────────────────────────────────────────────
const versionTsPath = path.join(root, 'src', 'version.ts');
fs.writeFileSync(versionTsPath, `export const VERSION = '${version}';\n`);

console.log(`✅  Version synced → ${version}`);
```
**Action:** `git mv scripts/sync-version.js release/version.js`, update the header comment to `release/version.js`, add the disambiguation comment RESEARCH.md recommends (Pitfall 5): `// This is the release-automation-scripts directory. Built binary artifacts live in releases/ (plural) — do not confuse the two.` Update `package.json`'s `prebuild` script path reference.

---

### `release/github-release.js` (utility/service, request-response)

**Analog:** `scripts/gh-release.js` (from `origin/main`)

**Full pattern — copy exactly, only the file path + header comment change:**
```javascript
/**
 * gh-release.js
 * Commits the new release files and creates a GitHub Release instantly
 * using the local `gh` CLI — no CI wait.
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const tag     = `v${version}`;

const files = [ /* ...releases/*.ext paths, filtered by fs.existsSync... */ ].filter(f => fs.existsSync(f));

execSync(`git commit -m "chore: release v${version}"`, { stdio: 'inherit', cwd: root });
execSync('git push', { stdio: 'inherit', cwd: root });
execSync('git push --tags', { stdio: 'inherit', cwd: root });
execSync(
  `gh release create ${tag} ${files.map(f => `"${f}"`).join(' ')} --title "GuideMyGrid v${version}" --generate-notes`,
  { stdio: 'inherit', cwd: root }
);
```
**Action:** After merge, `git mv scripts/gh-release.js release/github-release.js`, update the `files` array to include the new `.dmg` artifact path (`releases/GuideMyGrid-v${version}.dmg`) instead of `.pkg`, add the `release/` vs `releases/` disambiguation comment, update `package.json`'s `publish:*` scripts to the new path.

---

### `distribution/photoshop/macos/__tests__/installer-static.test.ts` (test, static/grep)

**Analog:** `src/__tests__/gridGenerator.sideGuide.test.ts` (existing Jest convention — colocated `__tests__/`, `.test.ts` suffix, `describe`/`it` structure)

No existing test in the codebase does grep/shell-based static assertions; this is genuinely new test *content* but should follow the existing Jest structural conventions (import from `child_process` inside a Jest `it` block, `expect(...).toBe('')` for empty grep output). Read the existing test file for the exact `describe`/`it` nesting style and assertion library conventions (plain Jest `expect`, no additional matchers library) before writing.

### `distribution/photoshop/macos/__tests__/manifest.test.ts` (test, integration)

**No close analog** — the existing Jest suite is 100% pure-function unit tests against in-memory data (`gridGenerator`). There is no existing "sandbox a fake `$HOME`, run a script, assert on written files" integration test pattern in this codebase to copy. Use Node's built-in `fs.mkdtempSync(path.join(os.tmpdir(), ...))` for sandbox setup/teardown (`afterEach` cleanup) — this is standard Jest+Node practice, not a project-specific pattern, so no in-repo excerpt applies.

---

## Shared Patterns

### File-header comment convention
**Source:** every `scripts/*.js` file (`sync-version.js`, `gh-release.js`, `package.js`, `build-mac-pkg.js`)
**Apply to:** all new/renamed files under `distribution/` and `release/`
```javascript
/**
 * <filename>
 * <one-line purpose>
 * <optional: when/how it's invoked>
 */
```

### Node build-script skeleton (root resolution, package.json read, `execSync` shell-out)
**Source:** `scripts/build-mac-pkg.js`, `scripts/package.js`, `release/version.js` (post-rename)
**Apply to:** `distribution/photoshop/macos/build-installer.js`
```javascript
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, /* adjust '..' depth per file location */);
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
```

### Success-message logging convention
**Source:** all `scripts/*.js` files
**Apply to:** `distribution/photoshop/macos/build-installer.js`
```javascript
console.log(`✅  <artifact label>: <relative path>`);
```
No error-logging convention exists in these build scripts today (they rely on `execSync`'s default throw-on-nonzero-exit + `stdio: 'inherit'` to surface native tool errors directly) — preserve that behavior rather than adding custom error handling.

### Absolute-path-only shell invocation (MAC-04 — the core new constraint this phase enforces)
**Source:** RESEARCH.md Code Examples (no compliant in-repo analog exists yet — `scripts/pkg-resources/postinstall` is the counter-example being fixed)
**Apply to:** `distribution/photoshop/macos/installer.applescript` — every single `do shell script` call
```applescript
do shell script "/bin/cp -r " & quoted form of srcPath & " " & quoted form of destPath
```
Validated by the static test: `grep -n 'do shell script' distribution/photoshop/macos/installer.applescript | grep -vE '"/'` must return nothing.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `distribution/photoshop/macos/installer.applescript`'s dialog/guard logic (D-02–D-05, MAC-03) | script | event-driven | No existing AppleScript or native-dialog code exists anywhere in this codebase — this is genuinely new UX surface. Use RESEARCH.md's Code Examples section directly as the template (already vetted against project constraints), not a codebase analog. |
| `distribution/photoshop/macos/__tests__/manifest.test.ts` fixture/sandbox setup | test | integration | No existing integration-style test with temp-directory sandboxing exists in this codebase; use standard Node/Jest `fs.mkdtempSync` conventions, not a project-specific pattern. |

## Metadata

**Analog search scope:** `origin/main` (git history, read via `git show`), current `epic/ui-icons` working tree (`scripts/`, `src/__tests__/`, `src/styles/tokens.css`), RESEARCH.md's own Code Examples section (used as fallback template where no in-repo analog exists)
**Files scanned:** `scripts/build-mac-pkg.js`, `scripts/pkg-resources/postinstall`, `scripts/sync-version.js`, `scripts/gh-release.js`, `scripts/package.js` (all read from `origin/main`), `scripts/sync-version.js` + `scripts/package.js` (current branch), `src/__tests__/gridGenerator.sideGuide.test.ts` (existing test convention), `src/styles/tokens.css` (color tokens, D-06)
**Pattern extraction date:** 2026-07-04
