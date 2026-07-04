---
phase: 01-foundation-macos-installer-rework
plan: 02
subsystem: infra
tags: [build-scripts, directory-restructure, packaging, macos, windows]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework/01-01
    provides: Consolidated epic/ui-icons branch with origin/main's installer work merged in, green build/test
provides:
  - "distribution/photoshop/{macos,windows}/ and release/ directory structure (FOUND-02)"
  - "release/version.js and release/github-release.js (renamed, host-agnostic, package.json wired to new paths)"
  - "Windows installer scripts relocated unmodified to distribution/photoshop/windows/"
  - "Three READMEs encoding the split's intent and the release/ vs releases/ disambiguation"
affects: [01-03-macos-installer-rebuild, 01-04-macos-installer-rebuild-cont, phase-2-windows-installer-rework]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "git mv (not copy+delete) to preserve file history when relocating scripts across directories"
    - "release/ vs releases/ disambiguation comment mandated at the top of every release/*.js file and in every distribution/ README"

key-files:
  created:
    - distribution/README.md
    - distribution/photoshop/macos/README.md
    - distribution/photoshop/windows/README.md
  modified:
    - package.json
    - scripts/package.js
  # git mv (rename, not create/delete)
  # release/version.js (from scripts/sync-version.js)
  # release/github-release.js (from scripts/gh-release.js)
  # distribution/photoshop/windows/{install.sh,install.bat,install.ps1,uninstall.bat,uninstall.ps1} (from scripts/)

key-decisions:
  - "release/ receives only version.js and github-release.js this plan — checksums.js (Phase 3) and gumroad-sync.js (Phase 4) are not stubbed, per RESEARCH.md's anti-pattern guidance against scaffolding unused files"
  - "Legacy macOS .pkg scripts (build-mac-pkg.js, build-mac-uninstaller.js, pkg-resources/) stay in scripts/ untouched — superseded by Plans 03-04, not this plan"
  - "scripts/package.js's Windows-script copy step was updated to reference the new distribution/photoshop/windows/ path (Rule 3 auto-fix — the relocation in Task 2 would otherwise have silently broken `npm run package`)"

patterns-established:
  - "release/*.js file-header disambiguation comment: 'This is the release-automation-scripts directory. Built binary artifacts live in releases/ (plural) — do not confuse the two.'"

requirements-completed: [FOUND-02]

coverage:
  - id: D1
    description: "distribution/photoshop/{macos,windows}/ and release/ directory structure created"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "test -d distribution/photoshop/macos && test -d distribution/photoshop/windows && test -d release — all pass"
        status: pass
    human_judgment: false
  - id: D2
    description: "Host-agnostic scripts (version.js, github-release.js) relocated via git mv with updated headers; package.json prebuild/publish:* wired to new paths; node release/version.js and npm run build both succeed"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "node release/version.js (succeeds, syncs src/version.ts) && npm run build (webpack 5.105.4 compiled successfully) && git grep for stale scripts/sync-version.js|scripts/gh-release.js in package.json returns nothing"
        status: pass
    human_judgment: false
  - id: D3
    description: "Existing Windows installer scripts relocated unmodified into distribution/photoshop/windows/; legacy macOS .pkg scripts left untouched in scripts/"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "git mv preserves history/content; ls distribution/photoshop/windows/ shows all 5 expected files; scripts/build-mac-pkg.js, scripts/build-mac-uninstaller.js, scripts/pkg-resources/ confirmed still present in scripts/"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three READMEs added encoding the split's intent, including release/ vs releases/ disambiguation and the Phase-2 boundary for Windows"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "test -f for all three READMEs passes; grep -l 'Phase 2' distribution/photoshop/windows/README.md matches; grep -l 'release/' matches in all three"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-04
status: complete
---

# Phase 1 Plan 2: Directory Restructure (distribution/ + release/) Summary

**Established the `distribution/photoshop/{macos,windows}/` + `release/` directory split (FOUND-02): relocated the two host-agnostic release scripts and five Windows installer scripts via `git mv`, added three READMEs, and repointed `package.json`/`package.js` at the new paths.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-04T22:09:00Z (immediately following Plan 01)
- **Completed:** 2026-07-04T22:21:31Z
- **Tasks:** 3
- **Files modified:** 11 (2 renamed + header-edited, 5 renamed unmodified, 1 package.json edit, 1 package.js edit, 3 new READMEs)

## Accomplishments

- Created `distribution/photoshop/macos/`, `distribution/photoshop/windows/`, and `release/` directories
- `git mv scripts/sync-version.js release/version.js` and `git mv scripts/gh-release.js release/github-release.js`, with updated file-header comments and a mandatory `release/` vs `releases/` disambiguation comment added to both
- Updated `package.json`'s `prebuild` and `publish:patch`/`minor`/`major` scripts to point at the new `release/` paths
- `git mv`'d the five existing Windows installer/uninstaller scripts (`install.sh`, `install.bat`, `install.ps1`, `uninstall.bat`, `uninstall.ps1`) into `distribution/photoshop/windows/` with zero logic changes
- Left the legacy macOS `.pkg` scripts (`scripts/build-mac-pkg.js`, `scripts/build-mac-uninstaller.js`, `scripts/pkg-resources/`) untouched in `scripts/`, per the plan's explicit scope guardrail (superseded by Plans 03-04)
- Added `distribution/README.md`, `distribution/photoshop/macos/README.md`, and `distribution/photoshop/windows/README.md`, each encoding the split's intent and the `release/` (scripts) vs `releases/` (binaries) disambiguation
- Verified `node release/version.js`, `npm run build`, and `npm test` all pass after every relocation

## Task Commits

1. **Task 1: Create the directory split and relocate host-agnostic release scripts** - `2430c8d` (feat)
2. **Task 2: Relocate the existing Windows installer scripts unmodified** - `9ef8f46` (feat)
3. **Task 3: Add the three READMEs encoding the split's intent** - `31897c7` (docs)

**Plan metadata:** commit pending (this SUMMARY + STATE.md + ROADMAP.md)

## Files Created/Modified

- `release/version.js` (renamed from `scripts/sync-version.js`) - version sync, unchanged logic, new header + disambiguation comment
- `release/github-release.js` (renamed from `scripts/gh-release.js`) - GitHub Release publisher, unchanged logic this plan, new header + disambiguation comment
- `package.json` - `prebuild` now `node release/version.js`; `publish:*` now reference `release/github-release.js`
- `distribution/photoshop/windows/{install.sh,install.bat,install.ps1,uninstall.bat,uninstall.ps1}` (renamed from `scripts/`) - byte-identical relocation, no logic changes
- `scripts/package.js` - updated the Windows-script copy step to read from `distribution/photoshop/windows/` instead of `scripts/` (see Deviations)
- `distribution/README.md` - explains the one-subfolder-per-host-app split and the `release/`/`releases/` distinction
- `distribution/photoshop/macos/README.md` - explains the PluginsStorage/PHSP target path and unprivileged `.app`/`.dmg` approach
- `distribution/photoshop/windows/README.md` - explains the Phase 2 boundary and that these scripts were relocated as-is

## Decisions Made

- Kept `release/` scoped to only `version.js` and `github-release.js` this plan — did not stub `checksums.js` (Phase 3) or `gumroad-sync.js` (Phase 4), per RESEARCH.md's explicit guidance against adding untested dead code for future phases
- Left the legacy macOS `.pkg` scripts in `scripts/` untouched, confirming the plan's guardrail that Plans 03-04 own their removal/replacement, not this plan
- Used `git mv` (not copy+delete) throughout to preserve file history across the relocations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed scripts/package.js's stale reference to the relocated Windows scripts**
- **Found during:** Task 2 (relocating Windows installer scripts)
- **Issue:** `scripts/package.js` copies `install.sh`/`install.bat`/`install.ps1`/`uninstall.bat`/`uninstall.ps1` from `path.join(root, 'scripts', s)` when building the installer zip (`npm run package` → used by `release:*`/`publish:*`). Moving those five files out of `scripts/` in Task 2 would have silently broken this copy step (file-not-found) the next time a release is packaged, even though the plan's own Task 2 verification (`ls`/`test !-f`) wouldn't have caught it since it doesn't exercise `package.js`.
- **Fix:** Updated `scripts/package.js`'s copy loop to read from `distribution/photoshop/windows/` instead of `scripts/`.
- **Files modified:** `scripts/package.js`
- **Verification:** `grep -rn` for any remaining `scripts/install\|scripts/uninstall` references across `scripts/`, `package.json`, `.github/` returned nothing; `npm run build` and `npm test` both pass post-fix.
- **Committed in:** `9ef8f46` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to keep `npm run package` functional after the relocation this plan performs; no scope creep — `scripts/package.js` itself is not modified beyond the one path reference this plan's own file move required.

## Issues Encountered

None beyond the deviation above. All three tasks' automated verification commands passed on first attempt; `npm run build` and `npm test` (12/12) stayed green throughout.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `distribution/photoshop/{macos,windows}/` + `release/` split required by FOUND-02 now exists, fully wired into `package.json`/`package.js`, with a green build and test suite.
- `distribution/photoshop/macos/` is empty except its README — ready for Plans 03-04 to build `build-installer.js` and `installer.applescript` there, replacing `scripts/build-mac-pkg.js`.
- `distribution/photoshop/windows/` holds the still-flawed (root-model, no manifest) Windows scripts relocated as-is — ready for Phase 2 (WIN-01..05) to rework in place without needing a fresh relocation step.
- No blockers.

---
*Phase: 01-foundation-macos-installer-rework*
*Completed: 2026-07-04*

## Self-Check: PASSED

All created files (distribution/README.md, distribution/photoshop/macos/README.md, distribution/photoshop/windows/README.md, release/version.js, release/github-release.js, this SUMMARY.md) confirmed present on disk. All task commit hashes (2430c8d, 9ef8f46, 31897c7, 707cc13) confirmed present in git log.
