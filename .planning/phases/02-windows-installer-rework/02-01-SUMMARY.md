---
phase: 02-windows-installer-rework
plan: 01
subsystem: infra
tags: [jest, ts-jest, packaging, uxp, ccx, node]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework
    provides: "The .ccx/build-ccx.js packaging mechanism, the D-01 finding that raw file-copy never registers a UXP plugin with Photoshop on any OS, and the manifest.json requiredPermissions/admin-prompt finding"
provides:
  - "distribution/photoshop/windows/ with the five disproven raw-copy install/uninstall scripts deleted"
  - "scripts/package.js building only the .ccx artifact, no longer copying the retired scripts"
  - "src/__tests__/installer-retirement.test.ts — cross-platform Jest regression guard for D-03 retirement + WIN-01/D-01 no-elevation property"
affects: [02-02, 03-macos-windows-integrity, 05-docs-security-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "it.each parameterization for retired-filename lists in Jest (first use of it.each in this repo)"
    - "Static Jest regression tests for architectural retirements (mirrors Phase 1's now-deleted installer-static.test.ts pattern)"

key-files:
  created:
    - src/__tests__/installer-retirement.test.ts
  modified:
    - scripts/package.js

key-decisions:
  - "Deleted the five retired Windows raw-copy scripts outright (D-03) — no migration/replacement needed, D-04 confirmed near-zero real-world usage"
  - "Removed scripts/package.js's entire '-installer.zip' build step in the same change as the script deletions, per RESEARCH Pitfall 1, to prevent a future ENOENT crash on npm run package"
  - "Removed now-orphaned helpers (copyDir, JUNK, shouldSkip, EXCLUDE, distDir) after confirming via grep they had zero remaining callers post-section-2 removal"
  - "Left .github/workflows/release.yml's dangling '-installer.zip' glob reference untouched — already tolerant via fail_on_unmatched_files: false, per RESEARCH Open Question 2"

patterns-established:
  - "Retirement regression test pattern: assert absence of deleted files + absence of references in dependent build scripts + a permanent invariant (manifest.json no requiredPermissions), all in one describe block"

requirements-completed: [WIN-01, WIN-02, WIN-03, WIN-04]

coverage:
  - id: D1
    description: "Five retired Windows raw-copy install/uninstall scripts deleted from distribution/photoshop/windows/"
    requirement: "WIN-01"
    verification:
      - kind: unit
        ref: "src/__tests__/installer-retirement.test.ts#install.bat/install.ps1/install.sh/uninstall.bat/uninstall.ps1 should not exist (retired per D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/package.js no longer copies the retired scripts or builds -installer.zip; npm run package can no longer ENOENT on the deleted files"
    requirement: "WIN-01"
    verification:
      - kind: unit
        ref: "src/__tests__/installer-retirement.test.ts#scripts/package.js should not reference any retired Windows script"
        status: pass
      - kind: other
        ref: "node --check scripts/package.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "manifest.json has no requiredPermissions block (WIN-01/D-01 no-elevation guarantee), guarded as a permanent regression test"
    requirement: "WIN-01"
    verification:
      - kind: unit
        ref: "src/__tests__/installer-retirement.test.ts#manifest.json should not declare requiredPermissions"
        status: pass
    human_judgment: false
  - id: D4
    description: "WIN-02/WIN-03/WIN-04 (custom install-time manifest, Photoshop-running detection, HKEY_CURRENT_USER uninstaller) realized as superseded — no custom install/uninstall code exists to attach any of them to, since Creative Cloud Desktop owns the full install/uninstall sequence"
    verification: []
    human_judgment: true
    rationale: "Supersession is an architectural/documentation conclusion (D-02/D-05 from CONTEXT.md), not a testable code behavior — REQUIREMENTS.md's disposition update and this SUMMARY are the record; no automated check can prove a 'requirement doesn't apply' claim"

duration: 6min
completed: 2026-07-06
status: complete
---

# Phase 2 Plan 1: Windows Installer Retirement Summary

**Deleted the five disproven Windows raw-copy install/uninstall scripts, fixed the packaging script's now-broken dependency on them, and added a Jest regression guard that keeps both the retirement and the WIN-01 no-elevation manifest property locked in place.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-06T21:55:02Z
- **Completed:** 2026-07-06T21:57:56Z
- **Tasks:** 2 (TDD: RED then GREEN)
- **Files modified:** 7 (1 created, 1 modified, 5 deleted)

## Accomplishments
- Added `src/__tests__/installer-retirement.test.ts`, confirmed RED (6 of 7 assertions failing — only the manifest.json check passed, as expected since the retired scripts still existed)
- Deleted `distribution/photoshop/windows/{install,uninstall}.{bat,ps1,sh}` (5 files, D-03) — the raw-copy mechanism manual QA already proved never registers a plugin with Photoshop, on either OS
- Removed `scripts/package.js`'s entire "Installer zip" build step (`.tmp-installer` staging, the 5-file copy loop, the zip `execSync`, the `installerFile` constant/unlink guard/`toStage` entry, the now-orphaned `copyDir`/`JUNK`/`shouldSkip`/`EXCLUDE`/`distDir` helpers, and the header doc-comment's `-installer.zip` line) — confirmed via `node --check` and a `grep` for the retired filenames/`windowsScriptsDir`/`installerFile` returning nothing
- Confirmed the full suite goes GREEN: `npx jest installer-retirement` (7/7 pass) and `npm test` (19/19 pass across both suites)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the installer-retirement regression test (RED)** - `990a41d` (test)
2. **Task 2: Delete the five retired scripts, fix scripts/package.js (GREEN)** - `6eb4177` (feat)

**Plan metadata:** (this commit, docs) — recorded below in Next Phase Readiness

_TDD gate sequence confirmed: `test(...)` commit (990a41d) precedes the `feat(...)` commit (6eb4177) that turns the suite green — RED → GREEN satisfied._

## Files Created/Modified
- `src/__tests__/installer-retirement.test.ts` - New Jest regression guard: retired-file absence (it.each over 5 filenames), scripts/package.js text-cleanliness check, manifest.json no-requiredPermissions check
- `scripts/package.js` - Removed the "-installer.zip" build step and its now-orphaned helpers; now builds and stages only the `.ccx` (plus the optional macOS `-uninstaller.pkg`)
- `distribution/photoshop/windows/install.bat` - Deleted (D-03)
- `distribution/photoshop/windows/install.ps1` - Deleted (D-03)
- `distribution/photoshop/windows/install.sh` - Deleted (D-03)
- `distribution/photoshop/windows/uninstall.bat` - Deleted (D-03)
- `distribution/photoshop/windows/uninstall.ps1` - Deleted (D-03)

## Decisions Made
- Followed CONTEXT.md's D-03/D-04/D-05 decisions verbatim: outright deletion (no migration, no replacement code)
- Removed the orphaned `copyDir`/`JUNK`/`shouldSkip`/`EXCLUDE`/`distDir` helpers from `scripts/package.js` after confirming via grep they had zero remaining callers — kept the file lean rather than leaving dead code, matching the plan's explicit instruction
- Left `.github/workflows/release.yml`'s dangling `-installer.zip` glob and `release/github-release.js`'s `fs.existsSync` filter untouched, per RESEARCH's Open Question 2 resolution — both already tolerate the artifact never existing again

## Deviations from Plan

None - plan executed exactly as written. Both tasks' `<action>` and `<verify>` blocks matched the actual codebase state exactly (scripts/package.js's structure matched RESEARCH.md's and PATTERNS.md's line-level description precisely), so no auto-fixes (Rules 1-3) or architectural questions (Rule 4) arose.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `distribution/photoshop/windows/` now contains only `README.md` (still describing the retired scripts — Plan 02 rewrites it per RESEARCH's `## What Actually Needs To Be Built` item 3)
- `distribution/README.md`'s stale "Windows has no Creative Cloud dependency" claim is still present — Plan 02's scope to correct
- The new `windows-latest` CI job (`windows-ccx-verify.yml`, rescoped WIN-05) has not been added yet — Plan 02's scope
- Tree is fully green (`npm test` 19/19, `node --check scripts/package.js` clean) — Plan 02 builds on a known-clean base with no dangling references to the retired scripts anywhere in `scripts/package.js`

---
*Phase: 02-windows-installer-rework*
*Completed: 2026-07-06*

## Self-Check: PASSED
- FOUND: src/__tests__/installer-retirement.test.ts
- FOUND: install.bat deleted (distribution/photoshop/windows/install.bat absent)
- FOUND: commit 990a41d (test - RED)
- FOUND: commit 6eb4177 (feat - GREEN)
