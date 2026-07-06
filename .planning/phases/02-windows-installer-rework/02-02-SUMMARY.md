---
phase: 02-windows-installer-rework
plan: 02
subsystem: infra
tags: [docs, github-actions, ci, ccx, windows]

# Dependency graph
requires:
  - phase: 02-windows-installer-rework
    plan: 01
    provides: "Deleted retired Windows raw-copy scripts, fixed scripts/package.js, a clean tree with no dangling references to the retired scripts"
provides:
  - "distribution/photoshop/windows/README.md rewritten to the three-section retirement pattern, parity with macOS confirmed"
  - "distribution/README.md's stale 'Windows has no Creative Cloud dependency' claim corrected to state .ccx + Creative Cloud Desktop parity"
  - ".github/workflows/windows-ccx-verify.yml — first real CI verification job in the repo, builds/packages/inspects the .ccx on windows-latest"
affects: [03-macos-windows-integrity, 05-docs-security-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GitHub Actions job on windows-latest using pwsh + .NET System.IO.Compression.ZipFile to extract a non-.zip-extension archive (Expand-Archive rejects .ccx by extension)"
    - "CI-side artifact-regression assertions (no requiredPermissions, no retired scripts) as the CI-side twin of a Jest static regression guard"

key-files:
  created:
    - .github/workflows/windows-ccx-verify.yml
  modified:
    - distribution/photoshop/windows/README.md
    - distribution/README.md

key-decisions:
  - "WIN-05 rescoped per RESEARCH.md/CONTEXT.md D-06: CI cannot drive Creative Cloud Desktop's GUI/Adobe-login headlessly, so the CI job verifies artifact regressions (manifest permissions, retired scripts) rather than a literal end-to-end install/uninstall; real device verification stays deferred to before ship"
  - "windows-ccx-verify.yml carries no top-level permissions: block (least privilege — build-and-assert only, unlike release.yml's contents: write)"
  - "windows/README.md's 'Why this directory still exists' section states parity is confirmed (D-01) rather than repeating the now-resolved 'flagged for re-verification' framing from Phase 1 — this phase IS that re-verification"

requirements-completed: [WIN-05]

coverage:
  - id: D1
    description: "distribution/photoshop/windows/README.md rewritten to the three-section retirement pattern (what used to be here / actual mechanism / why directory still exists), no 'pending rework' framing remains"
    requirement: "WIN-05"
    verification:
      - kind: other
        ref: "grep checks: 'no longer contains any installer logic', 'build-ccx.js' present; 'not yet reworked' absent"
        status: pass
    human_judgment: false
  - id: D2
    description: "distribution/README.md states Windows/macOS parity via .ccx + Creative Cloud Desktop, drops the stale 'no Creative Cloud dependency' claim; release/-vs-releases/ disambiguation section untouched"
    requirement: "WIN-05"
    verification:
      - kind: other
        ref: "grep checks: 'identical', 'confirmed in Phase 2', 'releases/' present; manual diff confirms lines 21-38 (What does NOT live here + release/releases disambiguation) unchanged"
        status: pass
    human_judgment: false
  - id: D3
    description: ".github/workflows/windows-ccx-verify.yml exists, named 'Windows CCX Verification', runs on windows-latest, no permissions: block, extracts via System.IO.Compression.ZipFile, asserts no requiredPermissions and no retired scripts"
    requirement: "WIN-05"
    verification:
      - kind: other
        ref: "grep checks for runs-on: windows-latest, job name, ZipFile, requiredPermissions, package:ccx, install.bat, absence of permissions:; node -e require('js-yaml').load(...) confirms valid YAML"
        status: pass
    human_judgment: false
  - id: D4
    description: "Workflow observed running green on windows-latest (the real-Windows-environment portion of WIN-05)"
    verification: []
    human_judgment: true
    rationale: "Requires a push/PR-triggered GitHub Actions run on the actual GitHub remote, which has not happened yet in this session (local git commits only, no push performed). This is a pending observation, not a failure — see Next Phase Readiness."

duration: 4min
completed: 2026-07-06
status: complete
---

# Phase 2 Plan 2: Windows Installer Doc Corrections + CI Verification Summary

**Rewrote both distribution READMEs to state confirmed Windows/macOS `.ccx` + Creative Cloud Desktop parity (no more "pending rework" framing) and added the repo's first real CI job — a `windows-latest` GitHub Actions workflow that builds, packages, and inspects the `.ccx` artifact for the WIN-01/D-01 no-elevation property and D-03's script retirement.**

## Performance

- **Duration:** ~4 min
- **Completed:** 2026-07-06
- **Tasks:** 2 (both `type="auto"`, no checkpoints)
- **Files modified:** 3 (2 rewritten, 1 created)

## Accomplishments

- Rewrote `distribution/photoshop/windows/README.md` to mirror `distribution/photoshop/macos/README.md`'s three-section retirement structure: "What used to be here" (the 5 retired scripts and the `%APPDATA%\Adobe\UXP\PluginsStorage\...` path they raw-copied into), "The actual install mechanism" (`.ccx` via `distribution/photoshop/build-ccx.js`, one directory up), "Why this directory still exists" (kept only for hypothetical future Windows-specific need; states Windows parity is confirmed per D-01 rather than repeating the now-resolved "flagged for re-verification" line from Phase 1)
- Replaced `distribution/README.md`'s stale claim ("Windows retains its own script-based install path today... because Windows has no equivalent Creative Cloud Desktop dependency") with the parity statement from PATTERNS.md: Windows uses the identical `.ccx` + Creative Cloud Desktop mechanism as macOS, confirmed in Phase 2; the `release/`-vs-`releases/` disambiguation section and the "What does NOT live here" section were left byte-for-byte untouched
- Created `.github/workflows/windows-ccx-verify.yml` reproducing RESEARCH.md's `## CI Job Design (WIN-05 Rescoped)` YAML verbatim: named "Windows CCX Verification", triggers on push (main, epic/ui-icons), pull_request, and workflow_dispatch; no top-level `permissions:` block; runs on `windows-latest`; steps are checkout@v4 → setup-node@v4 (node 20, npm cache) → `npm ci` → `npm run build` → `npm run package:ccx` → a `pwsh` step that extracts the `.ccx` via `[System.IO.Compression.ZipFile]::ExtractToDirectory` (not `Expand-Archive`, which rejects the `.ccx` extension per RESEARCH Pitfall 2) and throws if `manifest.json` has a `requiredPermissions` key or if any of the five retired script filenames are found inside the extracted contents
- Confirmed the YAML parses correctly via `js-yaml` and confirmed `npm test` still passes (19/19, both suites) after the doc/CI changes — no source code was touched by this plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite windows/README.md, correct distribution/README.md's parity claim** - `4ab8311` (docs)
2. **Task 2: Add the windows-ccx-verify.yml CI job (rescoped WIN-05)** - `521f496` (feat)

## Files Created/Modified

- `distribution/photoshop/windows/README.md` - Rewritten from the Phase 1 placeholder ("relocated as-is, not yet reworked") to the three-section retirement pattern, confirming Windows/macOS `.ccx` parity
- `distribution/README.md` - Stale "Windows has no Creative Cloud dependency" sentence replaced with the confirmed parity statement; rest of file untouched
- `.github/workflows/windows-ccx-verify.yml` - New GitHub Actions workflow (job `verify-windows-ccx`), the repo's first real CI verification job (as opposed to `release.yml`'s disabled `workflow_dispatch`-only publish fallback)

## Decisions Made

- Followed RESEARCH.md's `## CI Job Design (WIN-05 Rescoped)` YAML block verbatim rather than adapting `release.yml`'s structure beyond the shared checkout/setup-node/npm-ci preamble, per PATTERNS.md's explicit instruction
- Omitted the "Naming reminder" section from the rewritten `windows/README.md` (optional per PATTERNS.md) in favor of folding the parity/CI confirmation into "Why this directory still exists" — judged more useful than repeating the `release/`-vs-`releases/` disambiguation a third time across the repo's docs
- No `permissions:` block on the new workflow (least privilege — this job only builds and asserts, it never writes to the repo or publishes releases, unlike `release.yml`'s `contents: write`)

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>` and `<verify>` blocks matched the actual codebase state (macOS README template, distribution/README.md's stale lines, RESEARCH.md's concrete YAML) exactly, so no auto-fixes (Rules 1-3) or architectural questions (Rule 4) arose.

## Issues Encountered

None. `python3`'s `yaml` module was unavailable for a syntax sanity-check; fell back to `js-yaml` (already present via a project dependency's node_modules) which confirmed the file parses as valid YAML with the expected top-level keys (`name`, `on`, `jobs`).

## User Setup Required

None for this plan's own scope. Note for later: the Windows CCX Verification workflow's actual green/red CI run has not yet been observed, because this plan's commits have not been pushed to the GitHub remote in this session — the workflow will run automatically on the next push to `epic/ui-icons` (or on a PR), per its `on:` triggers. No manual action is required beyond that normal push.

## Known Stubs

None. Both README rewrites are complete prose (no placeholder text), and the CI workflow is fully executable YAML — nothing in this plan's output requires future wiring.

## Threat Flags

None. All new surface (the CI job's file-system extraction and manifest parsing) was already scoped in this plan's own `<threat_model>` (T-02-04, T-02-05, T-02-06, T-02-SC) and no additional network endpoints, auth paths, or schema changes were introduced beyond what that threat model covers.

## Next Phase Readiness

- Both distribution READMEs now truthfully describe Windows/macOS `.ccx` + Creative Cloud Desktop parity — no doc anywhere in the repo still frames Windows as having a separate, pending, or script-driven install path
- `.github/workflows/windows-ccx-verify.yml` exists and is syntactically valid, but has not yet run on GitHub Actions in this session (no push performed) — its first green/red run will occur on the next push to `main` or `epic/ui-icons`, or on the next PR. Phase 3 (or whoever next pushes to these branches) should confirm it goes green as the concrete observed-CI-outcome verification step the plan's own `<verification>` section calls for
- Real end-to-end Windows install/uninstall verification via Creative Cloud Desktop (UAC prompt absence, correct install path, clean uninstall) remains explicitly deferred to D-06 — before ship, not before this phase — since CC Desktop requires an interactive GUI and authenticated Adobe login that cannot be driven headlessly in CI
- Phase 2 is now complete: both plans (02-01 retirement, 02-02 docs + CI) are done, WIN-01 through WIN-05 are all satisfied (WIN-05 via the rescoped CI job, pending its first observed green run)

---
*Phase: 02-windows-installer-rework*
*Completed: 2026-07-06*

## Self-Check: PASSED
- FOUND: distribution/photoshop/windows/README.md
- FOUND: distribution/README.md
- FOUND: .github/workflows/windows-ccx-verify.yml
- FOUND: commit 4ab8311 (docs - task 1)
- FOUND: commit 521f496 (feat - task 2)
