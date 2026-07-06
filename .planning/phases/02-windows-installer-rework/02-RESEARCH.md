# Phase 2: Windows Installer Rework - Research

**Researched:** 2026-07-06
**Domain:** Confirming Windows parity with the already-validated macOS `.ccx`/Creative Cloud Desktop install mechanism; retiring dead raw-copy installer scripts; designing a CI verification job for what CAN actually be automated (no headless CC Desktop)
**Confidence:** HIGH — this phase's central technical claim (Windows uses the identical `.ccx` mechanism as macOS) is not new research, it's Phase 1's own empirically-confirmed finding applied to a second OS; this session adds direct, hands-on verification of the actual `.ccx` artifact structure and concrete CI job mechanics on top of that foundation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Windows Install Mechanism**
- **D-01:** Windows uses the identical `.ccx` + Creative Cloud Desktop install mechanism as macOS (Phase 1's `distribution/photoshop/build-ccx.js`), **not** a custom unelevated installer built from scratch. This is treated as confirmed, not merely assumed — Phase 1's own finding is that CC Desktop's plugin-registration requirement (raw file-copy never registers a plugin; only CC Desktop's install agent does) is an architectural property of CC Desktop itself, not something specific to macOS. The codebase already documents the `.ccx` builder as OS-agnostic (`distribution/photoshop/macos/README.md`).
- **D-02:** WIN-02 (custom install-time manifest) and WIN-03 (custom "Photoshop is running" detection) are treated as superseded, mirroring Phase 1's MAC-02/MAC-03 outcome — Creative Cloud Desktop owns the install sequence and its own plugin registry end-to-end, leaving no hook for either custom behavior.

**Existing Script Retirement**
- **D-03:** Delete `distribution/photoshop/windows/install.bat`, `install.ps1`, `install.sh`, `uninstall.bat`, `uninstall.ps1` outright — same raw-copy model that failed on macOS, and leaving them in place risks a user finding and running a broken installer.

**Legacy Cleanup**
- **D-04:** No migration/cleanup work needed for old raw-copy Windows installs. Verified directly via `gh release view` on real release data: the `-installer.zip` bundle has 1 total download across all of v1.6.0–v1.6.2 — almost certainly the developer's own testing.

**Uninstall Ownership (WIN-04)**
- **D-05:** No custom Windows uninstaller. Rely on Creative Cloud Desktop's own "Manage Plugins" uninstall button, same pattern as macOS. WIN-04's "uninstaller registers under HKEY_CURRENT_USER" requirement is superseded.

**Windows Device Verification — Deferred ("Nice to Have")**
- **D-06:** Explicitly deferred — not a blocker for this phase's research, planning, or execution. Revisit before shipping, not before planning.

**CI Scope (WIN-05 rescoping)**
- A full "installer runs end-to-end, no UAC prompt, uninstaller cleans up" CI job — as WIN-05 is literally worded — is **not achievable as written**, because Creative Cloud Desktop requires a GUI and Adobe account login and cannot be scripted headlessly. This is a technical rescoping, not a vision decision — Claude's discretion applies.

### Claude's Discretion
- Exact implementation of the rescoped WIN-05 CI job. Suggested direction: confirm the `.ccx`/manifest structure is valid when unpacked on a Windows runner, confirm `manifest.json` carries no `requiredPermissions` that would trigger CC Desktop's elevation prompt, confirm the retired raw-copy scripts are actually absent from the built release artifact. Full end-to-end install/uninstall verification is out of reach for CI regardless — covered by D-06, not this job. **This research resolves this discretion area concretely — see `## CI Job Design (WIN-05 Rescoped)` below.**
- Whether/how README or in-package documentation should explain "double-click, then Creative Cloud will guide you" for Windows users — connects to DOCS-01/02 (Phase 5), not this phase's concern.

### Deferred Ideas (OUT OF SCOPE)
- **Windows device verification method** (nice-to-have, explicitly deferred) — revisit before this phase actually ships to real customers, not before planning/research/execution. See D-06.
- No scope-creep items surfaced during discussion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (as literally worded in REQUIREMENTS.md) | Disposition | Research Support |
|----|--------------------------------------------------------|-------------|-------------------|
| WIN-01 | Replace the bare `.bat` script with a proper unelevated installer (`RequestExecutionLevel user`) targeting `%APPDATA%\Adobe\UXP\PluginsStorage\...` only | **Satisfied via `.ccx`/CC Desktop mechanism (D-01), not literal wording.** No new installer script is built. CC Desktop installs at user level as long as `manifest.json` declares no `requiredPermissions` — confirmed directly this session (see `## Standard Stack`) that the current manifest already has no such block. | See `## What Actually Needs To Be Built` and `## Common Pitfalls` Pitfall 1 |
| WIN-02 | Installer writes an install-time manifest listing every file/folder it creates | **Superseded (D-02).** No custom install code exists to attach a manifest-writer to; CC Desktop owns and tracks its own install registry. | Mirrors Phase 1's MAC-02 supersession — see `01-RESEARCH.md`'s CRITICAL ADDENDUM |
| WIN-03 | Installer detects if Photoshop is running and asks the user to quit it first | **Superseded (D-02).** CC Desktop controls the install sequence; no hook exists for custom pre-install logic. | Mirrors Phase 1's MAC-03 supersession |
| WIN-04 | Uninstaller registers under `HKEY_CURRENT_USER` only — no admin required to uninstall | **Superseded (D-05).** No custom uninstaller is built; CC Desktop's "Manage Plugins" panel owns uninstall for both platforms. | See `## Architectural Responsibility Map` |
| WIN-05 | Installer and uninstaller are verified automatically via CI on a real Windows environment (GitHub Actions `windows-latest`), confirming no elevation prompt, correct install path, and clean uninstall | **Not achievable as literally worded — rescoped.** CC Desktop requires GUI + Adobe login; cannot run headlessly in CI. Rescoped `windows-latest` job validates: (a) `.ccx` unpacks as a valid zip with expected internal structure, (b) `manifest.json` has no `requiredPermissions`, (c) retired raw-copy scripts are absent from the built artifact. Real end-to-end install verification is deferred to D-06 (pre-ship, not pre-plan). | See `## CI Job Design (WIN-05 Rescoped)` — full YAML provided |
</phase_requirements>

## Summary

This phase is fundamentally a **verification-and-retirement** phase, not a build-from-scratch phase — Phase 1 already proved (empirically, on the real dev Mac) that Adobe's UXP plugin architecture routes 100% of non-Marketplace installs through Creative Cloud Desktop's own install agent (UPIA), and that raw file-copy into `PluginsStorage` never registers a plugin with Photoshop on any OS. That finding is an architectural property of Creative Cloud Desktop itself — not a macOS-specific quirk — so it applies to Windows without needing to be re-derived. This session's research adds three concrete, hands-on confirmations on top of that foundation: (1) direct inspection of the actual current `.ccx` build output (built fresh this session) confirms it is a standard zip archive with a `dist/` top-level folder and a `manifest.json` that already has **no** `requiredPermissions` block — meaning WIN-01's "no admin/UAC elevation" goal is already satisfied by the existing cross-platform `.ccx` builder, no new code needed; (2) direct code inspection of `scripts/package.js` surfaces a load-bearing dependency the CONTEXT.md decisions don't call out: that script's "Installer zip" build step explicitly copies `install.bat`/`install.ps1`/`install.sh`/`uninstall.bat`/`uninstall.ps1` from `distribution/photoshop/windows/` — deleting those files (D-03) without also removing this step in `scripts/package.js` will make `npm run package` **crash** with `ENOENT` on every future release; (3) a concrete, tested design for the rescoped WIN-05 CI job, including a real gotcha (`Expand-Archive` rejects non-`.zip` extensions, so a `.ccx` file must either be renamed or extracted via `.NET`'s `ZipFile` class instead).

No new external packages are needed this phase. No macOS-equivalent CI job exists yet to mirror structurally — Phase 1 relied on manual QA, not automated CI, so this phase's `windows-latest` job is the first real CI verification job in this repository (the existing `.github/workflows/release.yml` is a disabled, `workflow_dispatch`-only publish fallback, not a test job).

**Primary recommendation:** Treat this phase as five small, concrete deliverables: (1) delete the 5 retired Windows scripts, (2) fix `scripts/package.js` to remove the now-broken "-installer.zip" build step, (3) rewrite `distribution/photoshop/windows/README.md` mirroring the retirement pattern already established in `distribution/photoshop/macos/README.md`, (4) update `distribution/README.md`'s now-stale claim that "Windows has no equivalent Creative Cloud Desktop dependency," and (5) add a new `windows-latest` GitHub Actions workflow that builds the `.ccx`, extracts it via `.NET`'s `ZipFile` class, and asserts on manifest contents and file absence — plus an optional cross-platform Jest static-regression test mirroring Phase 1's now-deleted `installer-static.test.ts` pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Plugin packaging (`.ccx` build) | Build/Repo tooling (Node script) | — | Already exists, cross-platform, no OS-specific code (`distribution/photoshop/build-ccx.js`) |
| Plugin install (both platforms) | External service (Creative Cloud Desktop / UPIA) | — | Not this project's code at all — CC Desktop owns 100% of the install sequence, UI, and its own plugin registry |
| Plugin uninstall (both platforms) | External service (Creative Cloud Desktop / UPIA "Manage Plugins") | — | Same as above — no custom uninstaller exists or is being built (D-05) |
| CI verification of `.ccx` structure | Build/Repo tooling (GitHub Actions, `windows-latest` runner) | — | New this phase — validates the *artifact*, not the live install, since CC Desktop can't be driven headlessly |
| Plugin runtime (grid generation, UI panel) | UXP/Photoshop app (`src/`) | — | Completely unaffected by this phase |

## Standard Stack

### Core

No new external packages are required this phase. Everything needed already exists or ships with the target runners:

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|---------------|
| `distribution/photoshop/build-ccx.js` | existing, unmodified | Builds the `.ccx` artifact (standard zip, `dist/` top-level folder) | [VERIFIED: local — built fresh this session] Ran `node distribution/photoshop/build-ccx.js` directly; `file releases/GuideMyGrid-v0.1.0.ccx` confirms "Zip archive data, at least v2.0 to extract, compression method=deflate." `unzip -p releases/GuideMyGrid-v0.1.0.ccx dist/manifest.json` confirms the manifest at `dist/manifest.json` inside the zip has **no `requiredPermissions` key** — directly satisfying the "no elevation" property WIN-01 wants, using the mechanism that already exists. |
| `actions/checkout@v4`, `actions/setup-node@v4` | v4 (already pinned in `.github/workflows/release.yml`) | Standard GitHub Actions steps, already used in this repo's existing workflow | [VERIFIED: local — read directly from `.github/workflows/release.yml`] |
| PowerShell 7 (`pwsh`) + `.NET`'s `System.IO.Compression.ZipFile` | Preinstalled on GitHub's `windows-latest` runner image | Extracts the `.ccx` (a non-`.zip`-extension zip) reliably in the CI job | [CITED: github.com/actions/runner#1883 discussion] `Expand-Archive` validates the file **extension**, not just content, and rejects non-`.zip` names with "is not a supported archive file format." `[System.IO.Compression.ZipFile]::ExtractToDirectory()` is not extension-gated and is the more robust choice for a `.ccx` file. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.NET ZipFile` extraction in the CI job | Rename `.ccx` → `.zip` then `Expand-Archive` | Works, but adds an unnecessary rename step and a second failure mode (rename could silently no-op on a case-mismatched extension check). `.NET ZipFile` is a single reliable call with no extension dependency — prefer it. |
| A dedicated Node zip-inspection package (`adm-zip`, `unzipper`) for the CI assertions | PowerShell's built-in `.NET` `ZipFile` class | No new npm dependency, no legitimacy check needed, and the CI job is already running PowerShell natively on `windows-latest` — adding a Node package here would be scope creep for a one-shot artifact-structure check. |

**Installation:** None needed — everything is either already in the repo (`build-ccx.js`) or preinstalled on the CI runner (PowerShell, `.NET`).

## Package Legitimacy Audit

> No external packages are installed by this phase. `build-ccx.js` (existing, Phase 1) and the `windows-latest` GitHub Actions runner's preinstalled PowerShell/.NET tooling are the only mechanisms used. **Skip condition met — no audit table needed.**

**Packages removed due to [SLOP] verdict:** none — no packages evaluated, none needed.
**Packages flagged as suspicious [SUS]:** none.

## What Actually Needs To Be Built

Given D-01 through D-06, this phase's real scope is narrower than WIN-01..05's literal wording and is fully enumerable:

1. **Delete** `distribution/photoshop/windows/install.bat`, `install.ps1`, `install.sh`, `uninstall.bat`, `uninstall.ps1` (D-03).
2. **Fix `scripts/package.js`** — remove the "Installer zip (no Creative Cloud required)" build step (the block that copies the 5 files above into `.tmp-installer/` and zips them into `GuideMyGrid-v<version>-installer.zip`). Without this fix, step 1 breaks `npm run package` for every future release. See `## Common Pitfalls` Pitfall 1 for the exact failure mode and fix location.
3. **Rewrite `distribution/photoshop/windows/README.md`** to mirror the retirement pattern already established in `distribution/photoshop/macos/README.md` — explain what used to be here, why it didn't work, and point to the real mechanism (`build-ccx.js`, one directory up).
4. **Update `distribution/README.md`** — line 16-19 currently states "Windows retains its own script-based install path today... because Windows has no equivalent Creative Cloud Desktop dependency for this" — this claim is now disproven by this phase's own decisions and must be corrected to match the macOS-parity reality.
5. **Add a new GitHub Actions workflow** (e.g. `.github/workflows/windows-ccx-verify.yml`) implementing the rescoped WIN-05 CI job — see `## CI Job Design (WIN-05 Rescoped)` for the full YAML.
6. **Optional but recommended:** add a cross-platform Jest static-regression test (mirrors Phase 1's now-deleted `installer-static.test.ts` pattern per STATE.md's history) guarding against the 5 retired files silently reappearing and against `manifest.json` regaining a `requiredPermissions` block. See `## Code Examples`.

No new manifest changes, no new install/uninstall logic, no new npm dependencies. This is a deletion + one CI addition + two doc corrections + one packaging-script fix.

## CI Job Design (WIN-05 Rescoped)

### What CAN be automated (this phase builds this)

A `windows-latest` GitHub Actions job that:
1. Checks out the repo, installs Node dependencies, builds the plugin (`npm run build`), and packages the `.ccx` (`npm run package:ccx`) — reusing the **existing, unmodified** `build-ccx.js`, no Windows-specific packaging code needed (confirms D-01's premise that `.ccx` packaging is OS-agnostic, now proven by literally running the same script on a Windows runner).
2. Extracts the built `.ccx` using `.NET`'s `ZipFile` class (not `Expand-Archive` — see Pitfall below) and parses `dist/manifest.json` as JSON.
3. Asserts `manifest.json` has no `requiredPermissions` key — regression guard for the exact finding that caused Phase 1's admin-password prompt on macOS; this property is CC-Desktop-wide, not OS-specific, so the same regression risk applies on Windows.
4. Asserts none of the 5 retired raw-copy script filenames (`install.bat`, `install.ps1`, `install.sh`, `uninstall.bat`, `uninstall.ps1`) are present anywhere inside the extracted `.ccx` contents — confirms D-03's retirement actually took effect in the shipped artifact, not just in the source tree.

### What CANNOT be automated (stays deferred to D-06)

Creative Cloud Desktop cannot be installed, logged into, or driven through its install/uninstall UI from a headless CI runner — it requires an interactive GUI session and an authenticated Adobe account. This means the CI job **cannot** confirm:
- No UAC/elevation prompt actually appears during a real install
- The plugin actually appears in Photoshop's Plugins panel after install
- Uninstall via CC Desktop's "Manage Plugins" actually removes all files

These three are exactly what D-06 defers to a later manual/physical-device check before shipping — the CI job's job is to catch *regressions in the artifact* (a bad manifest, a stray retired script) between now and then, not to replace real device testing.

### Concrete YAML

```yaml
# Source: this session's direct verification (built and inspected the .ccx locally;
# Expand-Archive extension-check gotcha per github.com/actions/runner#1883 discussion)
# .github/workflows/windows-ccx-verify.yml
name: Windows CCX Verification

on:
  push:
    branches: [ main, epic/ui-icons ]
  pull_request:
  workflow_dispatch:

jobs:
  verify-windows-ccx:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build plugin
        run: npm run build

      - name: Package .ccx
        run: npm run package:ccx

      - name: Extract .ccx and validate contents
        shell: pwsh
        run: |
          $ccx = Get-ChildItem -Path "releases" -Filter "*.ccx" | Select-Object -First 1
          if (-not $ccx) { throw "No .ccx artifact found in releases/ after packaging" }

          $extractDir = "ccx-extracted"
          Add-Type -AssemblyName System.IO.Compression.FileSystem
          [System.IO.Compression.ZipFile]::ExtractToDirectory($ccx.FullName, $extractDir)

          $manifestPath = Join-Path $extractDir "dist/manifest.json"
          if (-not (Test-Path $manifestPath)) {
            throw "manifest.json not found at expected path dist/manifest.json inside the .ccx"
          }
          $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

          if ($manifest.PSObject.Properties.Name -contains "requiredPermissions") {
            throw "manifest.json declares requiredPermissions -- this triggers Creative Cloud Desktop's admin-password prompt on non-Marketplace installs (see 01-RESEARCH.md). Remove it unless this is an intentional, reviewed tradeoff (relevant to Phase 4's UPD-03)."
          }
          Write-Host "OK: manifest.json has no requiredPermissions block"

          $retiredNames = @("install.bat", "install.ps1", "install.sh", "uninstall.bat", "uninstall.ps1")
          foreach ($name in $retiredNames) {
            $found = Get-ChildItem -Path $extractDir -Recurse -Filter $name -ErrorAction SilentlyContinue
            if ($found) {
              throw "Retired raw-copy script '$name' found inside the built .ccx -- should have been deleted per Phase 2's D-03"
            }
          }
          Write-Host "OK: no retired raw-copy installer scripts found in the .ccx"
```

**Why `windows-latest` and not `ubuntu-latest` even though the checks above are OS-agnostic:** WIN-05 explicitly asks for verification "on a real Windows environment" — running on `windows-latest` demonstrates the `.ccx` build pipeline (`npm run build` + `npm run package:ccx`) itself works correctly on Windows (path separators, script execution, zip creation), not just that the assertions *could* run anywhere. This is the load-bearing part of "Windows parity," not the assertions themselves.

## Architecture Patterns

### System Architecture Diagram

```
[Build: npm run build]  (same script, same output, on any OS)
        │
        ▼
   dist/ (webpack output: manifest.json + JS/CSS/icons)
        │
        ▼
[distribution/photoshop/build-ccx.js]   ← UNCHANGED, already cross-platform (Phase 1)
        │
        ▼
   releases/GuideMyGrid-v<version>.ccx
        │
        ├──────────────────────────────┐
        ▼                              ▼
[Real user, any OS]           [CI: windows-latest runner]
   double-click .ccx              extract via .NET ZipFile
        │                              │
        ▼                              ▼
Creative Cloud Desktop           assert: no requiredPermissions
   (GUI, Adobe login,               assert: no retired scripts present
    NOT scriptable — D-06)             │
        │                              ▼
        ▼                       CI pass/fail (artifact regression guard only —
Plugin installed, user-level,   NOT a substitute for real device verification)
no admin prompt (as long as
manifest has no requiredPermissions)
```

### Recommended Project Structure (delta from current state)

```
guidemygrid/
├── .github/workflows/
│   ├── release.yml                        # UNCHANGED — disabled publish fallback
│   └── windows-ccx-verify.yml             # NEW this phase (rescoped WIN-05)
├── distribution/
│   ├── README.md                          # UPDATED — remove stale "Windows has no CC Desktop dependency" claim
│   └── photoshop/
│       ├── build-ccx.js                   # UNCHANGED
│       ├── macos/README.md                # UNCHANGED — already documents the retirement pattern to mirror
│       └── windows/
│           ├── README.md                  # REWRITTEN — mirrors macos/README.md's retirement pattern
│           # install.bat, install.ps1, install.sh, uninstall.bat, uninstall.ps1 — DELETED (D-03)
├── scripts/
│   └── package.js                         # MODIFIED — remove the "-installer.zip" build step (see Pitfall 1)
└── src/__tests__/
    └── installer-retirement.test.ts       # OPTIONAL NEW — cross-platform static regression guard
```

### Pattern: Retire in place, don't delete the directory

**What:** `distribution/photoshop/windows/` stays as a directory (README only, scripts deleted) — exactly like `distribution/photoshop/macos/` did after its own pivot.

**When to use:** Now. This is not a new pattern to invent — it's the one Phase 1 already established and documented for macOS. Reuse the exact same structure and tone for the Windows README.

**Example (structure to mirror, from the existing `macos/README.md`):**
```markdown
# distribution/photoshop/windows/

This directory no longer contains any installer logic.

## What used to be here
[explain install.bat/install.ps1/install.sh/uninstall.bat/uninstall.ps1, raw file-copy into
%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\<version>\..., and why it never worked]

## The actual install mechanism
[point to ../build-ccx.js, same .ccx as macOS]

## Why this directory still exists
[placeholder for any genuinely Windows-specific future need]
```

### Anti-Patterns to Avoid

- **Deleting the 5 retired scripts without touching `scripts/package.js`:** This is not a hypothetical risk — `scripts/package.js` currently contains `fs.copyFileSync(path.join(windowsScriptsDir, s), ...)` for each of the 5 files, executed unconditionally as part of `npm run package`. Deleting the source files without removing this step **will** throw `ENOENT` on the very next release build.
- **Building any new Windows-specific manifest, detection, or uninstaller code:** Explicitly superseded per D-02/D-05 — there is no hook in the CC Desktop install/uninstall flow for any of this, mirroring the exact same conclusion Phase 1 reached for macOS.
- **Trying to make WIN-05 "really" test end-to-end install/uninstall in CI:** Not possible — CC Desktop requires an interactive GUI and Adobe account login. Don't spend effort trying to script around this; it's a hard platform constraint, not a CI configuration problem to solve harder.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Windows-specific `.ccx`/plugin packaging | A separate Windows build script | The existing, unmodified `distribution/photoshop/build-ccx.js` | Already confirmed OS-agnostic by design (Phase 1) and now further confirmed by actually running it fresh this session — no Windows-specific logic needed anywhere in the packaging step. |
| Zip extraction/inspection in CI | A new npm package (`adm-zip`, `unzipper`, `jszip`) | PowerShell's built-in `.NET` `System.IO.Compression.ZipFile` class | Zero new dependency, already available on every `windows-latest` runner, avoids the `Expand-Archive` extension-check gotcha. |
| End-to-end install/uninstall verification | A workaround to script Creative Cloud Desktop headlessly (browser automation, image-based GUI scripting, etc.) | Accept the D-06 deferral — revisit with a real or short-lived cloud Windows VM closer to ship | CC Desktop's GUI+login requirement is a hard platform constraint, not a scriptability gap to engineer around. Attempting to automate this would be fragile, high-maintenance, and outside this phase's actual scope. |

**Key insight:** Every piece of this phase's actual work is retirement (delete dead code), correction (fix a script that will break, update stale docs), and one narrowly-scoped CI addition that reuses existing tooling. Resist any temptation to build new Windows-specific installer/uninstaller/manifest code — Phase 1's own empirical finding already forecloses that path.

## Runtime State Inventory

> Included because this phase deletes 5 script files that have existed in the repo (in `scripts/` then `distribution/photoshop/windows/`) since before this milestone — a retirement operation with the same runtime-state-audit obligations as a rename/refactor.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** The plugin has no database/datastore; installer scripts don't write any persistent state beyond copying files (confirmed by direct reading of `install.ps1`/`install.sh` this session — no registry writes, no config files). | None. |
| Live service config | **None.** No external service (n8n, Datadog, etc.) references these Windows scripts or this project's naming. | None. |
| OS-registered state | **Effectively none on real machines.** D-04 already confirmed via `gh release view` that the old Windows `-installer.zip` bundle containing these scripts has 1 total download across v1.6.0-v1.6.2 — near-certainly the developer's own testing, not a real customer install. No Windows registry keys are written by `install.ps1`/`uninstall.ps1` (confirmed by direct code reading — they only call `New-Item`/`Copy-Item`/`Remove-Item` against `%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\...`, no `New-ItemProperty`/registry cmdlets anywhere). | None — no registry cleanup needed even in the unlikely case someone did run the old installer. |
| Secrets/env vars | **None found.** No `.env`, no SOPS keys, no CI secrets referenced by these scripts. | None. |
| Build artifacts / installed packages | **Yes — this is the one real dependency.** `scripts/package.js` copies all 5 retired files into a temporary directory and zips them into `GuideMyGrid-v<version>-installer.zip` as part of `npm run package`. This is a **code edit**, not a data migration — the packaging script itself must stop referencing files that no longer exist. `release/github-release.js` already gracefully handles the resulting missing `-installer.zip` (uses `.filter(f => fs.existsSync(f))` before publishing) — confirmed by direct code reading this session — so no change is needed there. | **Code edit required:** remove the "Installer zip" build step in `scripts/package.js` (see Pitfall 1 below for the exact block). |

**Canonical question for this phase:** *After `distribution/photoshop/windows/install.{bat,ps1,sh}` and `uninstall.{bat,ps1}` are deleted, what still references them?* Answer: only `scripts/package.js` (must be edited) and two README files (`distribution/photoshop/windows/README.md`, `distribution/README.md` — both must be updated as part of this phase's doc-correction work, not left stale).

## Common Pitfalls

### Pitfall 1: Deleting the retired scripts breaks `npm run package` if `scripts/package.js` isn't also fixed
**What goes wrong:** `scripts/package.js` (confirmed by direct reading this session) contains this unconditional block as part of building `GuideMyGrid-v<version>-installer.zip`:
```javascript
const scripts = ['install.sh', 'install.bat', 'install.ps1', 'uninstall.bat', 'uninstall.ps1'];
const windowsScriptsDir = path.join(root, 'distribution', 'photoshop', 'windows');
for (const s of scripts) {
  fs.copyFileSync(path.join(windowsScriptsDir, s), path.join(tmpDir, s));
}
```
If D-03's deletion happens without also removing this block (and the surrounding "Installer zip" section), every future `npm run package` / `npm run release:*` / `npm run publish:*` will throw `ENOENT: no such file or directory` on the very first `fs.copyFileSync` call.
**Why it happens:** The retirement decision (D-03) is scoped narrowly to the 5 script files themselves in CONTEXT.md; the dependent packaging-script logic isn't mentioned there, so it's easy to delete the files and not notice the build breaks until the next release attempt.
**How to avoid:** Remove the entire "── 2. Installer zip (no Creative Cloud required) ──" section from `scripts/package.js` (roughly lines 44-62 as read this session) in the same commit/task that deletes the 5 script files. Also remove `installerFile`'s references earlier in the file (the `path.join`, the `fs.unlinkSync` guard, and its inclusion in `toStage`).
**Warning signs:** `npm run package` throwing `ENOENT` referencing `distribution/photoshop/windows/install.*`.
**Detection command:** `grep -n "windowsScriptsDir\|install.bat\|install.ps1\|install.sh\|uninstall.bat\|uninstall.ps1" scripts/package.js` should return nothing once this phase's fix lands.

### Pitfall 2: `Expand-Archive` rejects the `.ccx` extension in PowerShell
**What goes wrong:** [CITED, LOW-MEDIUM confidence — single community GitHub issue discussion, not official Microsoft documentation] PowerShell's `Expand-Archive` cmdlet validates the file's **extension**, not just its content, and throws `"is not a supported archive file format. .zip is the only supported archive file format."` when pointed at a `.ccx` file — even though the file is a perfectly valid zip (confirmed directly this session via `file releases/GuideMyGrid-v0.1.0.ccx` → "Zip archive data").
**Why it happens:** `Expand-Archive`'s implementation gates on file extension as a validation step, not purely on magic bytes/content sniffing.
**How to avoid:** Use `.NET`'s `[System.IO.Compression.ZipFile]::ExtractToDirectory()` directly (available in PowerShell via `Add-Type -AssemblyName System.IO.Compression.FileSystem` — already demonstrated in the `## CI Job Design` YAML above), which is not extension-gated. A rename-to-`.zip`-first workaround also works but adds an unnecessary step and a second point of failure.
**Warning signs:** A CI job design that pipes the `.ccx` file directly into `Expand-Archive` without testing on an actual `windows-latest` runner first.

### Pitfall 3: Stale documentation claiming Windows has "no Creative Cloud Desktop dependency"
**What goes wrong:** `distribution/README.md` (confirmed by direct reading this session, lines 16-19) currently states: "Windows retains its own script-based install path today (`windows/install.bat`/`install.ps1`), split out because Windows has no equivalent Creative Cloud Desktop dependency for this — though `REQUIREMENTS.md` flags this for re-verification in Phase 2." This phase's own decisions (D-01) directly disprove this claim — Windows uses the exact same CC Desktop dependency as macOS.
**Why it happens:** The doc was written speculatively during Phase 1, before Phase 2's re-verification (this phase) actually happened.
**How to avoid:** Update `distribution/README.md` as part of this phase's doc-correction work (see `## What Actually Needs To Be Built`, item 4) — don't leave it in its pre-verification state once the re-verification is done.
**Warning signs:** Any doc still describing Windows and macOS as having architecturally different install mechanisms after this phase completes.

### Pitfall 4: Assuming the raw-copy scripts' `%APPDATA%\...\Plugin\<id>\` path is where a CC-Desktop-installed plugin actually lives
**What goes wrong:** [CITED, LOW confidence — community forum posts, not independently verified against a real Windows machine] Community reports (Adobe user forums) describe CC-Desktop/UPIA-installed third-party UXP plugins on Windows living under `%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\<version>\External\<id>\` — a different subfolder name (`External`, not `Plugin`) than what the retired `install.ps1`/`install.sh` scripts targeted (`Plugin\<id>`). This is not confirmed hands-on (no physical Windows machine per D-06), but it is independently consistent with Phase 1's core finding: the raw-copy scripts' assumptions about the installed-plugin filesystem layout were never verified against how CC Desktop actually organizes things, on either OS.
**Why it happens:** The original Windows scripts were modeled on a guessed/assumed layout, not on directly observing a real CC-Desktop install (mirroring exactly how the macOS raw-copy scripts were also written from assumption, not observation, per Phase 1's addendum).
**How to avoid:** Not actionable for this phase (no custom Windows install code is being written — D-01/D-02), but worth noting as one more independent confirmation that D-03's outright deletion (rather than "fix and keep") is the right call — the scripts' internal path assumptions may have been wrong even on their own raw-copy terms, not just architecturally unable to register with Photoshop.
**Warning signs:** N/A — this pitfall is informational, reinforcing D-03, not a new implementation risk to guard against.

## Code Examples

### Cross-platform static regression test (optional, recommended)

```typescript
// Source: mirrors the pattern of Phase 1's now-deleted installer-static.test.ts
// (retired along with the AppleScript/DMG installer per 01-RESEARCH.md's revised plan, step 5)
// src/__tests__/installer-retirement.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('Windows installer retirement (Phase 2, D-03)', () => {
  const windowsDir = path.resolve(__dirname, '../../distribution/photoshop/windows');
  const retiredFiles = ['install.bat', 'install.ps1', 'install.sh', 'uninstall.bat', 'uninstall.ps1'];

  it.each(retiredFiles)('%s should not exist (retired per D-03)', (file) => {
    expect(fs.existsSync(path.join(windowsDir, file))).toBe(false);
  });

  it('scripts/package.js should not reference any retired Windows script', () => {
    const packageJs = fs.readFileSync(
      path.resolve(__dirname, '../../scripts/package.js'),
      'utf8'
    );
    for (const file of retiredFiles) {
      expect(packageJs).not.toContain(file);
    }
  });

  it('manifest.json should not declare requiredPermissions', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../manifest.json'), 'utf8')
    );
    expect(manifest.requiredPermissions).toBeUndefined();
  });
});
```

### Direct .ccx inspection commands used to verify claims this session

```bash
# Build the current .ccx fresh (uses the existing, unmodified build-ccx.js)
node distribution/photoshop/build-ccx.js

# Confirm it's a standard zip
file releases/GuideMyGrid-v0.1.0.ccx
# → "Zip archive data, at least v2.0 to extract, compression method=deflate"

# Confirm internal structure (dist/ top-level folder, matching macOS)
unzip -l releases/GuideMyGrid-v0.1.0.ccx

# Confirm manifest.json has no requiredPermissions block
unzip -p releases/GuideMyGrid-v0.1.0.ccx dist/manifest.json
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Bare `.bat`/`.ps1`/`.sh` raw-copy installer, unelevated on paper but never actually registers a plugin with Photoshop | `.ccx` + Creative Cloud Desktop, same mechanism as macOS | This phase (confirming Phase 1's finding applies to Windows too) | WIN-01's actual goal ("no admin/UAC elevation") is achieved via the existing `.ccx` mechanism, not a new installer; WIN-02/03/04 become inapplicable because there's no custom install/uninstall code left to attach them to |
| No CI verification of any installer artifact | `windows-latest` CI job validating `.ccx` structure + manifest safety + retired-file absence | This phase | First real automated CI test in this repository (the existing `release.yml` is a disabled publish-only fallback, not a test job) |

**Deprecated/outdated:**
- Raw file-copy into `PluginsStorage/.../Plugin/<id>/` for UXP plugin installation: superseded on both platforms by `.ccx`/CC-Desktop-driven install, per Phase 1's empirical finding (architecture-wide, not OS-specific).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Expand-Archive`'s extension-gating behavior (rejecting `.ccx`) applies consistently across the exact PowerShell/`.NET` version installed on GitHub's current `windows-latest` runner image | CI Job Design, Pitfall 2 | If wrong (i.e., `Expand-Archive` actually works fine on `.ccx` files on the current runner image), the `.NET ZipFile` approach still works correctly as a superset solution — low risk either way, since the recommended approach avoids the dependency on this claim being true. |
| A2 | CC-Desktop/UPIA-installed Windows UXP plugins live under a `PluginsStorage\PHSP\<ver>\External\<id>\` path (vs. the retired scripts' assumed `Plugin\<id>\`) | Common Pitfalls, Pitfall 4 | Purely informational — no code in this phase depends on this path being correct, since no custom Windows install code is being written. Risk is zero for this phase; would only matter if a future phase needed to inspect an installed plugin's files directly on Windows. |
| A3 | No Windows registry keys are written anywhere by the retired `install.ps1`/`uninstall.ps1` scripts (confirmed by direct code reading, not by running them on a real Windows machine) | Runtime State Inventory | If a registry write exists that wasn't caught by code reading, deleting these scripts without a registry-cleanup step could theoretically leave orphaned keys on a machine that ran the old installer — low real-world risk given D-04's near-zero download count, and no code fix would be actionable in this phase regardless (no physical Windows machine to test against, per D-06). |

**If this table is empty:** N/A — see rows above; none of these block planning, all are either self-mitigating (A1) or zero-risk for this phase's actual scope (A2, A3).

## Open Questions

1. **Should the new `windows-ccx-verify.yml` workflow also run on `macos-latest`/`ubuntu-latest` as a cross-check that the assertions themselves are OS-independent?**
   - What we know: The manifest/retired-file assertions are logically OS-agnostic (they inspect a zip's contents, not anything Windows-specific).
   - What's unclear: Whether adding a second OS to the matrix adds meaningful signal or just CI runtime cost, given `windows-latest` is the OS that actually matters for WIN-05's intent.
   - Recommendation: Keep the job Windows-only for this phase — it directly satisfies WIN-05's "real Windows environment" ask. Consider a matrix expansion only if a future phase's release process needs broader OS coverage for other reasons.

2. **Should `scripts/package.js`'s reference to `-installer.zip` in `release/github-release.js`'s file list be actively removed, or left as a harmless dead reference?**
   - What we know: `release/github-release.js` already uses `.filter(f => fs.existsSync(f))`, so a missing `-installer.zip` doesn't break anything — confirmed by direct code reading this session.
   - What's unclear: Whether leaving the reference in place (vs. actively removing the array entry) is confusing for a future reader who doesn't know the file will never exist again.
   - Recommendation: Leave as-is for this phase (it's harmless and self-documenting via the `.filter`), but flag as a minor cleanup opportunity if `release/github-release.js` is next touched for other reasons (e.g., Phase 3's checksum work).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| GitHub Actions `windows-latest` runner | New CI job (WIN-05 rescoped) | ✓ (GitHub-hosted, no local setup needed) | Current GitHub-hosted Windows Server image | — |
| PowerShell 7 (`pwsh`) + `.NET` `System.IO.Compression` | CI job's zip-extraction step | ✓ (preinstalled on `windows-latest` runner images) | Preinstalled | — |
| Node.js 20 + npm | CI job's build/package steps | ✓ (already used identically in `.github/workflows/release.yml`) | `20` (pinned, matches existing workflow) | — |
| Physical/cloud Windows machine for real install/uninstall QA | D-06 (deferred) | ✗ (no physical Windows machine; not needed for this phase) | — | Explicitly deferred per D-06 — not a blocker for planning or execution of this phase |

**Missing dependencies with no fallback:** None blocking this phase — the one missing dependency (a real Windows machine for install QA) is explicitly deferred by the user (D-06), not required for this phase's actual deliverables.

**Missing dependencies with fallback:** Real Windows device verification → deferred to pre-ship, per D-06 (see `## Open Questions` in `02-CONTEXT.md` for candidate options: borrowed device, short-lived cloud VM, or ship-on-Mac-parity-evidence).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest (existing, `package.json`'s `jest` config) |
| Config file | Inline in `package.json` (`"jest": {...}`) — `testEnvironment: node`, `testMatch: **/__tests__/**/*.test.ts(x)` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single small suite; no separate "full" tier exists yet) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WIN-01 | `.ccx` artifact's manifest has no `requiredPermissions` (no-elevation guarantee) | unit (static) + CI | `npx jest installer-retirement` / `windows-ccx-verify.yml` CI job | ❌ Wave 0 — both new this phase |
| WIN-02/WIN-03 | N/A — superseded, no behavior to test | manual-only (documentation) | — | n/a (no code exists to test) |
| WIN-04 | N/A — superseded, no behavior to test | manual-only (documentation) | — | n/a (no code exists to test) |
| WIN-05 | Rescoped: `.ccx` structure valid on `windows-latest`, retired scripts absent from built artifact | CI (integration-adjacent, artifact-level) | `.github/workflows/windows-ccx-verify.yml` | ❌ Wave 0 — new this phase |
| (regression) | Retired script files do not reappear in `distribution/photoshop/windows/` | unit (static) | `npx jest installer-retirement` | ❌ Wave 0 — new this phase |
| (regression) | `scripts/package.js` does not reference deleted files | unit (static) | `npx jest installer-retirement` | ❌ Wave 0 — new this phase |

### Sampling Rate

- **Per task commit:** `npm test` (fast — single small suite, seconds)
- **Per wave merge:** `npm test` (same command; no separate CI-only suite distinct from unit tests except the new GitHub Actions workflow, which runs on push/PR automatically)
- **Phase gate:** `npm test` green + the new `windows-ccx-verify.yml` workflow green on the phase's final commit, before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/installer-retirement.test.ts` — covers the retired-file-absence and manifest-safety regression guards (optional but recommended; no existing file covers this)
- [ ] `.github/workflows/windows-ccx-verify.yml` — the actual rescoped WIN-05 CI job (does not exist yet — confirmed via direct `ls`/`grep` of `.github/workflows/`, which contains only the disabled `release.yml`)
- [ ] No shared fixtures/conftest-equivalent needed — this phase's tests are self-contained file-existence and JSON-content checks

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | This phase has no auth surface — CC Desktop owns all install-time authentication (Adobe login), entirely outside this project's code |
| V3 Session Management | No | No session state introduced by this phase |
| V4 Access Control | No | No access-control logic introduced; CC Desktop's own permission model is out of this project's control |
| V5 Input Validation | Marginal — yes | The new CI job parses `manifest.json` as JSON (`ConvertFrom-Json`) — standard, safe parsing, no untrusted external input beyond the repo's own build artifact |
| V6 Cryptography | No | No cryptographic operations in this phase's scope (checksums are Phase 3's INTEG-02, not this phase) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Manifest declaring elevated `requiredPermissions` silently reintroducing an admin-password prompt (a UX regression, not a classic security vuln, but directly relevant to this milestone's "no elevation" trust goal) | Tampering (of trust expectations, not data) | The new CI job's assertion (`manifest.PSObject.Properties.Name -contains "requiredPermissions"` → fail) — this is the concrete mitigation this phase adds |
| A retired raw-copy script silently reappearing in a future commit (regression to a known-broken, disproven mechanism) | Tampering / Repudiation of the D-03 decision | The new CI job's + optional Jest test's absence-assertions for the 5 retired filenames |
| Path-hijacking via bare command names in shell scripts (MAC-04-equivalent concern) | Tampering | Not applicable this phase — no new shell/PowerShell scripts are being written that execute external commands by bare name; the retired scripts (which had this exact risk pattern, per Phase 1's Pitfall 2 finding for the macOS side) are being deleted, not patched |

## Sources

### Primary (HIGH confidence)
- Direct local build and inspection of `releases/GuideMyGrid-v0.1.0.ccx` this session (`node distribution/photoshop/build-ccx.js`, `file`, `unzip -l`, `unzip -p ... manifest.json`) — confirms zip format, `dist/` top-level structure, and absence of `requiredPermissions` in the current manifest
- Direct reading of `scripts/package.js`, `release/github-release.js`, `distribution/photoshop/windows/{install,uninstall}.*`, `distribution/photoshop/macos/README.md`, `distribution/README.md`, `.github/workflows/release.yml`, `manifest.json`, `package.json` — all read in full this session
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md`'s CRITICAL ADDENDUM and its two follow-ups — the empirical foundation this entire phase's D-01 rests on (raw file-copy never registers with Photoshop; `.ccx`/CC Desktop is the only working non-Marketplace mechanism; `requiredPermissions` ties directly to the admin-password prompt)
- `git log`/`gh release view` data cited in `02-CONTEXT.md` (D-04) — real download-count evidence, not assumed

### Secondary (MEDIUM confidence)
- [Distribution Options — Adobe UXP docs](https://developer.adobe.com/photoshop/uxp/2022/guides/distribution/distribution-options/) — `.ccx` direct-distribution mechanism, admin-prompt tied to declared access level
- [Fix issues with installing XD plugins — Adobe Help](https://helpx.adobe.com/creative-cloud/kb/troubleshoot-common-addon-installation-issues.html) — cited already in Phase 1's research for the same `requiredPermissions`/admin-prompt relationship

### Tertiary (LOW confidence — flagged for validation, not treated as authoritative)
- [actions/runner#1883](https://github.com/actions/runner/issues/1883) — `Expand-Archive`'s extension-gating behavior; single community issue discussion, not official Microsoft documentation. Mitigated in this research's recommendation by using `.NET ZipFile` instead, which sidesteps the question entirely.
- Adobe Community forum posts on Windows `PluginsStorage\...\External\<id>\` path structure — informational only (Pitfall 4), not load-bearing for any code this phase writes

## Metadata

**Confidence breakdown:**
- Standard stack (no new packages, reuse `build-ccx.js`): HIGH — directly verified by building and inspecting the artifact this session
- CI job design: MEDIUM-HIGH — YAML mechanics are standard GitHub Actions patterns (HIGH), the `Expand-Archive` extension-gating claim specifically is MEDIUM (single community source, mitigated by using the more robust `.NET` approach regardless of whether the claim is fully accurate)
- Windows path/registry claims (Pitfall 4): LOW — informational only, not load-bearing for any code this phase writes, explicitly flagged as such

**Research date:** 2026-07-06
**Valid until:** 30 days (stable domain — no fast-moving dependencies; re-verify only if Adobe changes UXP's manifest schema or CC Desktop's install-agent behavior, or if GitHub changes `windows-latest`'s default PowerShell/.NET version in a way that affects `Expand-Archive`/`ZipFile` behavior)
