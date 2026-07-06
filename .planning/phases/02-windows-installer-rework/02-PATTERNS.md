# Phase 2: Windows Installer Rework - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|----------------|
| `distribution/photoshop/windows/install.bat`, `install.ps1`, `install.sh`, `uninstall.bat`, `uninstall.ps1` (DELETE) | script | file-I/O | n/a (deletion) | n/a |
| `scripts/package.js` (MODIFY) | utility/build-script | file-I/O | itself — surgical edit, no external analog needed | exact |
| `distribution/photoshop/windows/README.md` (REWRITE) | config/docs | transform | `distribution/photoshop/macos/README.md` | exact |
| `distribution/README.md` (MODIFY) | config/docs | transform | itself — in-place correction, structure unchanged | exact |
| `.github/workflows/windows-ccx-verify.yml` (NEW) | config (CI) | batch/event-driven | `.github/workflows/release.yml` | role-match |
| `src/__tests__/installer-retirement.test.ts` (OPTIONAL NEW) | test | transform (static assertions) | `src/__tests__/gridGenerator.sideGuide.test.ts` | role-match |

## Pattern Assignments

### `distribution/photoshop/windows/README.md` (docs, transform)

**Analog:** `distribution/photoshop/macos/README.md` (full file, 49 lines — already read in full, small enough for one pass)

This is a **structural template to mirror almost verbatim**, swapping macOS-specific details for Windows ones. Copy the exact section skeleton:

```markdown
# distribution/photoshop/windows/

This directory no longer contains any installer logic.

## What used to be here

[list the 5 retired files: install.bat, install.ps1, install.sh,
uninstall.bat, uninstall.ps1 — raw file-copy into
%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\<version>\Plugin\<id>\]

Manual QA (mirroring Phase 1's macOS finding, an architectural property
of Creative Cloud Desktop itself, not OS-specific) confirms a raw file
copy into PluginsStorage does not make Photoshop list the plugin.
Photoshop's Plugins panel only shows what Creative Cloud Desktop's own
install agent (UPIA) has registered.

## The actual install mechanism

GuideMyGrid is installed via the same `.ccx` file mechanism as macOS —
built by `distribution/photoshop/build-ccx.js`, one directory level up,
not inside `windows/`, because `.ccx` packaging is identical across
platforms.

## Why this directory still exists

Kept only in case something genuinely Windows-specific is needed later.
```

**Key differences from the macOS analog to apply:**
- Path in "What used to be here": `%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\<version>\Plugin\<id>\` (Windows), not `~/Library/Application Support/...` (macOS)
- Drop the "Naming reminder" section (macOS-specific historical disambiguation note) unless it's judged generically useful — optional, not required
- The "Why this directory still exists" section should NOT repeat the now-resolved "REQUIREMENTS.md flags re-verification" line verbatim (that re-verification is what this phase *is*) — state instead that Windows parity is now confirmed (D-01) and the directory is kept only for hypothetical future OS-specific need

---

### `distribution/README.md` (docs, transform)

**Analog:** itself (lines 12-19, already read in full — 37-line file, single pass)

**Current stale text to replace** (lines 16-19):
```markdown
Windows retains its own script-based install path today
(`windows/install.bat`/`install.ps1`), split out because Windows has no
equivalent Creative Cloud Desktop dependency for this — though
`REQUIREMENTS.md` flags this for re-verification in Phase 2.
```

**Replace with** (matches the parity language already used in lines 12-15 for macOS):
```markdown
Windows uses the identical `.ccx` + Creative Cloud Desktop mechanism as
macOS (confirmed in Phase 2) — there is no OS-specific installer script
directory anymore; `distribution/photoshop/windows/` is kept only as a
placeholder for any genuinely Windows-specific future need.
```

Keep the rest of the file (the `release/` vs `releases/` disambiguation section, lines 21-37) completely untouched — it is unrelated to this phase's scope.

---

### `scripts/package.js` (build-script, file-I/O)

**Analog:** itself — this is a targeted deletion within an existing file, not a new-file pattern to borrow from elsewhere.

**Exact lines to remove** (confirmed by direct read, lines 55-75):
```javascript
// ── 2. Installer zip (no Creative Cloud required) ────────────────────────────
const tmpDir = path.join(root, '.tmp-installer');
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

copyDir(distDir, path.join(tmpDir, 'dist'));

const scripts = ['install.sh', 'install.bat', 'install.ps1', 'uninstall.bat', 'uninstall.ps1'];
const windowsScriptsDir = path.join(root, 'distribution', 'photoshop', 'windows');
for (const s of scripts) {
  fs.copyFileSync(path.join(windowsScriptsDir, s), path.join(tmpDir, s));
}

// Preserve executable bit on the shell script
try { fs.chmodSync(path.join(tmpDir, 'install.sh'), 0o755); } catch (_) {}

execSync(`cd "${tmpDir}" && zip -r "${installerFile}" . ${EXCLUDE}`, { stdio: 'inherit' });
fs.rmSync(tmpDir, { recursive: true });
console.log(`✅  Installer: releases/GuideMyGrid-v${version}-installer.zip`);

console.log('\n→  .ccx            — install via Creative Cloud (double-click)');
console.log('→  -installer.zip  — install directly, no Creative Cloud needed\n');
```

**Also remove/adjust related references** elsewhere in the same file:
- Line 5 (top comment): remove the `2. GuideMyGrid-vX.Y.Z-installer.zip` line from the file's header doc-comment (lines 3-6)
- Line 21: `const installerFile = path.join(outDir, ...)` — this declaration is still referenced by `toStage` (line 88) and the `if (fs.existsSync(installerFile))` guard (line 44); per Pitfall 1 in RESEARCH.md, decide whether to keep `installerFile` as a dead/unused variable or remove it entirely from `toStage`'s array too — RESEARCH.md's Pitfall 1 explicitly calls out `toStage`'s inclusion of `installerFile` as needing removal
- Line 44: `if (fs.existsSync(installerFile)) fs.unlinkSync(installerFile);` — remove since the file is never created anymore
- Line 88: `const toStage = [ccxFile, installerFile];` → `const toStage = [ccxFile];`

**Do NOT touch:** the CCX build step (lines 48-53), the mac-uninstaller step (lines 77-85), or the final `git add` staging call structure beyond the `toStage` array content.

**Cross-file consequence (per RESEARCH.md Runtime State Inventory):** `.github/workflows/release.yml` line 34-35 references `releases/GuideMyGrid-v*-installer.zip` in its `files:` glob with `fail_on_unmatched_files: false` already set — this workflow does NOT need to change since it already tolerates the missing glob match gracefully. Confirmed no edit needed there.

---

### `.github/workflows/windows-ccx-verify.yml` (CI config, batch/event-driven)

**Analog:** `.github/workflows/release.yml` (full file, 37 lines — already read in full)

**Imports/setup pattern to copy** (lines 16-25 of release.yml):
```yaml
runs-on: ubuntu-latest   # → change to windows-latest for the new job

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci
```

**Core pattern (build step) to copy the convention of** (release.yml line 27-28 pattern: named step + simple `run:` npm script invocation):
```yaml
- name: Build & package
  run: npm run package
```
Note RESEARCH.md's concrete recommended YAML differs slightly (splits into separate `npm run build` + `npm run package:ccx` steps rather than one `npm run package` call) — this is intentional per RESEARCH.md's own CI Job Design section (avoids invoking the now-removed installer-zip step and isolates the ccx-specific build). Follow RESEARCH.md's own full YAML block verbatim (`## CI Job Design (WIN-05 Rescoped)`) rather than this repo's existing `release.yml` structure beyond the checkout/setup-node/npm-ci preamble shown above.

**Trigger pattern:** `release.yml` uses `on: workflow_dispatch:` only (manual, disabled-by-default fallback). The new workflow should use `on: push` / `pull_request` / `workflow_dispatch` as specified in RESEARCH.md's YAML (this is a verification/test job, not a publish job, so it needs automatic triggers — a deliberate divergence from the `release.yml` analog, not an oversight).

**Permissions block:** `release.yml` declares `permissions: contents: write` (needed because it publishes releases). The new verification-only job needs no such permission — omit the `permissions:` block entirely (principle of least privilege; this job only builds and asserts, never writes to the repo or releases).

---

### `src/__tests__/installer-retirement.test.ts` (OPTIONAL, test, static transform)

**Analog:** `src/__tests__/gridGenerator.sideGuide.test.ts` (full file read — Jest/ts-jest conventions)

**Imports pattern** (line 1):
```typescript
import { generateSideGuide } from '../services/gridGenerator';
```
For the new file, imports are Node built-ins instead of a service module:
```typescript
import * as fs from 'fs';
import * as path from 'path';
```

**Structure pattern to copy** (describe/test nesting, `toEqual`/`toBe` assertion style, lines 3-24):
```typescript
describe('generateSideGuide — canvas (no selection)', () => {
  const params = { containerWidth: 1920, containerHeight: 1080, offsetX: 0, offsetY: 0 };

  test('left → x=0, vertical', () => {
    expect(generateSideGuide('left', params)).toEqual({ position: 0, orientation: 'vertical' });
  });
  ...
});
```
This repo's Jest convention: flat `describe` blocks grouping related assertions, one `test`/`it` per concrete case, `expect(...).toEqual(...)` for object equality and `.toBe(...)` for primitives. RESEARCH.md's `## Code Examples` section already provides the exact target file content using `it.each(...)` for the retired-file list — this is a reasonable, idiomatic extension of the existing pattern (parameterized case list) and should be used as written in RESEARCH.md, since no existing test in this repo uses `it.each` yet but it's the correct idiomatic Jest choice for iterating over the 5 retired filenames.

**No error-handling or auth pattern applies** — these are pure static file-existence/content assertions, no async operations, no try/catch needed (matches the existing analog's synchronous style).

---

## Shared Patterns

### Retirement/README doc pattern
**Source:** `distribution/photoshop/macos/README.md` (Phase 1)
**Apply to:** `distribution/photoshop/windows/README.md`
Three-section skeleton: "What used to be here" (what was deleted and why it never worked) → "The actual install mechanism" (point to `build-ccx.js`) → "Why this directory still exists" (placeholder rationale). Established once for macOS in Phase 1; reuse verbatim structure, swap only OS-specific paths and any not-yet-resolved caveats.

### GitHub Actions workflow conventions
**Source:** `.github/workflows/release.yml`
**Apply to:** `.github/workflows/windows-ccx-verify.yml`
Preamble steps (`actions/checkout@v4`, `actions/setup-node@v4` with `node-version: '20'`, `cache: 'npm'`, then `npm ci`) are this repo's standard first four steps for any workflow touching Node. Reuse verbatim; diverge only in `runs-on`, triggers, permissions, and the job-specific steps that follow.

### Static regression test conventions
**Source:** `src/__tests__/gridGenerator.sideGuide.test.ts`
**Apply to:** `src/__tests__/installer-retirement.test.ts`
Flat `describe`/`test` nesting, synchronous `expect(...).toBe/toEqual(...)` assertions, no mocking, no setup/teardown hooks needed for simple cases. Test file naming: `<subject>.test.ts` directly under `src/__tests__/` (no further subdirectory nesting observed in this repo).

## No Analog Found

None — all 6 files/file-groups in this phase's scope have a usable analog (either an existing file to mirror structurally, or the same file being surgically edited).

## Metadata

**Analog search scope:** `distribution/`, `.github/workflows/`, `scripts/`, `src/__tests__/` (repo root: `/Users/hurisb/Projects/guidemygrid`)
**Files scanned:** 6 (macos/README.md, distribution/README.md, release.yml, package.js, gridGenerator.sideGuide.test.ts, plus the phase's own CONTEXT.md/RESEARCH.md for the file list)
**Pattern extraction date:** 2026-07-06
