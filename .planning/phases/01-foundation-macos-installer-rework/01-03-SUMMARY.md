---
phase: 01-foundation-macos-installer-rework
plan: 03
subsystem: infra
tags: [shell, jest, ts-jest, macos, installer, security]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework/01-02
    provides: "distribution/photoshop/{macos,windows}/ and release/ directory structure (FOUND-02)"
provides:
  - "distribution/photoshop/macos/install-payload.sh — non-interactive, unprivileged copy+manifest core (MAC-01, MAC-02, MAC-04)"
  - "install-manifest.json schema: {installedAt, pluginId, version, paths[]} — flat absolute-path list, consumed by Phase 3's uninstaller"
  - "Jest harness (tsconfig.jest.json + package.json jest.transform) that compiles/runs tests under distribution/"
  - "installer-static.test.ts — reusable static gate that automatically covers Plan 04's installer.applescript once it exists"
affects: [01-04-macos-installer-app-wrapper, phase-3-uninstaller, phase-2-windows-installer-rework]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Env-var-driven sandboxing for shell-script integration tests (GMG_INSTALL_BASE / GMG_MANIFEST_PATH override the real $HOME paths so Jest can test install-payload.sh without touching the developer's actual Photoshop plugin storage)"
    - "Absolute-binary-path + explicit clean PATH=/usr/bin:/bin convention for every unprivileged installer shell script"
    - "Static grep-style Jest tests (installer-static.test.ts) as a permanent regression gate for security invariants (no elevation tokens, no PATH trust) rather than a one-time manual review"

key-files:
  created:
    - tsconfig.jest.json
    - distribution/photoshop/macos/install-payload.sh
    - distribution/photoshop/macos/__tests__/manifest.test.ts
    - distribution/photoshop/macos/__tests__/installer-static.test.ts
  modified:
    - package.json

key-decisions:
  - "installer-static.test.ts's MAC-01 token scan (pkgbuild/productbuild/sudo) is scoped to .sh/.applescript files only, not all files under distribution/photoshop/macos/ — Plan 02's README.md legitimately references these tokens in prose (\"no sudo, no pkgbuild\") to describe what this rework replaces; scanning documentation would produce false positives unrelated to actual installer behavior"
  - "Manifest written to a dedicated $HOME/Library/Application Support/GuideMyGrid/ location, not inside the plugin tree, per Security V12 (avoids the UXP runtime reading install metadata as plugin content)"
  - "chmod go-w (not a full 700/644 reset) applied to every created path — sufficient to satisfy 'non-world-writable', matches the plan's own suggested approach"

patterns-established:
  - "install-payload.sh interface: `install-payload.sh <source_dir> <version>` + env GMG_INSTALL_BASE / GMG_MANIFEST_PATH — Plan 04's installer.applescript calls this via an absolute-path shell invocation"

requirements-completed: [MAC-01, MAC-02, MAC-04]

coverage:
  - id: D1
    description: "install-payload.sh copies a source plugin dir into every existing PluginsStorage/PHSP version dir at user level, no elevation (MAC-01)"
    requirement: "MAC-01"
    verification:
      - kind: integration
        ref: "distribution/photoshop/macos/__tests__/manifest.test.ts#copies into ALL existing version subdirs, not just one"
        status: pass
      - kind: unit
        ref: "distribution/photoshop/macos/__tests__/installer-static.test.ts#MAC-01: no package-installer or privilege-escalation tokens in installer logic under distribution/photoshop/macos (excluding __tests__)"
        status: pass
    human_judgment: false
  - id: D2
    description: "install-payload.sh writes an install-time manifest (installedAt/pluginId/version/paths) listing exactly the paths it created, each verified to exist on disk (MAC-02)"
    requirement: "MAC-02"
    verification:
      - kind: integration
        ref: "distribution/photoshop/macos/__tests__/manifest.test.ts#copies source into the version dir and writes a manifest listing every created path"
        status: pass
    human_judgment: false
  - id: D3
    description: "install-payload.sh uses an explicit clean PATH=/usr/bin:/bin and only absolute binary paths, never sources shell rc files (MAC-04)"
    requirement: "MAC-04"
    verification:
      - kind: unit
        ref: "distribution/photoshop/macos/__tests__/installer-static.test.ts#MAC-04: every .sh script sets an explicit clean PATH and never sources shell rc files"
        status: pass
    human_judgment: false
  - id: D4
    description: "Negative paths (missing source dir, relative install base, no version subdir under base) all exit non-zero"
    verification:
      - kind: integration
        ref: "distribution/photoshop/macos/__tests__/manifest.test.ts#exits non-zero when the source dir is missing"
        status: pass
      - kind: integration
        ref: "distribution/photoshop/macos/__tests__/manifest.test.ts#exits non-zero when GMG_INSTALL_BASE is a relative path"
        status: pass
      - kind: integration
        ref: "distribution/photoshop/macos/__tests__/manifest.test.ts#exits non-zero when no version subdir exists under the base"
        status: pass
    human_judgment: false
  - id: D5
    description: "Jest harness (tsconfig.jest.json + package.json jest.transform) compiles and runs tests under distribution/ alongside the existing src/ suite"
    verification:
      - kind: other
        ref: "npm test (full suite) — 3 suites, 20 tests, all pass"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-04
status: complete
---

# Phase 1 Plan 3: macOS Installer Core (install-payload.sh) Summary

**Unprivileged shell routine that copies GuideMyGrid into every Photoshop UXP PluginsStorage version dir and writes a stable install-manifest.json, proven by a new Jest harness that compiles shell/static tests living under `distribution/`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-04T22:19:00Z (approx, immediately following Plan 02)
- **Completed:** 2026-07-04T22:31:14Z
- **Tasks:** 2
- **Files modified:** 5 (2 new test files, 1 new shell script, 1 new tsconfig, 1 package.json edit)

## Accomplishments

- Added `tsconfig.jest.json` (extends root `tsconfig.json`, `rootDir: "."`, includes `distribution/**/*`) and wired `package.json`'s `jest.transform` to it, so ts-jest can compile `.test.ts` files living outside `src/`
- Created `distribution/photoshop/macos/__tests__/manifest.test.ts` — a sandboxed integration test (temp `$GMG_INSTALL_BASE`/`$GMG_MANIFEST_PATH`, never touches the real `$HOME`) that verifies the copy + manifest behavior, including negative paths (missing source, relative base, no version subdir)
- Created `distribution/photoshop/macos/__tests__/installer-static.test.ts` — a static/grep-style gate for MAC-01 (no elevation tokens) and MAC-04 (absolute paths, explicit clean PATH, no rc sourcing) that will automatically cover Plan 04's `installer.applescript` once it exists
- Implemented `distribution/photoshop/macos/install-payload.sh`: copies a source plugin dir into `<base>/<ver>/Plugin/com.guidemygrid.plugin/` for every existing version subdir, sets `PATH=/usr/bin:/bin` explicitly, invokes every binary by absolute path, validates inputs (source exists, base absolute/no `..`, at least one version dir), applies `chmod go-w` to every created path, and writes a flat JSON manifest (`installedAt`, `pluginId`, `version`, `paths[]`)
- Full `npm test` (3 suites, 20 tests), `npm run type-check`, and `npm run build` all pass

## Task Commits

1. **Task 1: Add the Jest harness and the two failing validation scaffolds (Nyquist Wave 0)** - `5b73b46` (test)
2. **Task 2: Implement install-payload.sh (unprivileged copy + manifest, absolute paths)** - `a235a14` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE.md + ROADMAP.md)

## Files Created/Modified

- `tsconfig.jest.json` - ts-jest override config allowing test compilation under `distribution/`
- `package.json` - added `jest.transform` mapping `ts-jest` to `tsconfig.jest.json`
- `distribution/photoshop/macos/__tests__/manifest.test.ts` - sandboxed integration test for MAC-02 + negative-path exit codes
- `distribution/photoshop/macos/__tests__/installer-static.test.ts` - static gate for MAC-01/MAC-04
- `distribution/photoshop/macos/install-payload.sh` - the non-interactive copy+manifest core (MAC-01, MAC-02, MAC-04)

## Decisions Made

- Scoped `installer-static.test.ts`'s forbidden-token scan (`pkgbuild`/`productbuild`/`sudo`) to `.sh`/`.applescript` files only, excluding documentation — see Deviations below
- Manifest written to `$HOME/Library/Application Support/GuideMyGrid/install-manifest.json` (not inside the plugin tree), per RESEARCH.md's Security V12 guidance
- Used `chmod go-w` (remove group+other write) rather than a full permission reset, matching the plan's suggested approach for "non-world-writable"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scoped the MAC-01 static token scan to executable installer files, not all files**
- **Found during:** Task 1 (writing `installer-static.test.ts`)
- **Issue:** The plan's literal wording ("a recursive search ... over `distribution/photoshop/macos/` ... produces EMPTY output") would scan every file in the directory, including `distribution/photoshop/macos/README.md`. That README (added in Plan 02) legitimately contains the words "pkgbuild" and "sudo" in prose describing what this rework replaces ("No sudo, no pkgbuild, no admin password prompt — that's the entire point of this rework"). Running the test as literally specified produced a false-positive failure against a file that is not part of this plan's scope and contains no actual installer logic.
- **Fix:** Restricted the MAC-01 token-scan test to files ending in `.sh` or `.applescript` (the only files that can contain executable installer logic), while keeping the recursive-scan structure and the `__tests__/` exclusion intact. This preserves MAC-01's actual security intent (installer *behavior* never invokes these tools) without flagging documentation.
- **Files modified:** `distribution/photoshop/macos/__tests__/installer-static.test.ts`
- **Verification:** Test passes both before (Task 1, no `.sh`/`.applescript` files existed yet) and after (Task 2, `install-payload.sh` exists and contains none of the forbidden tokens) `install-payload.sh` was added.
- **Committed in:** `5b73b46` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/false-positive fix)
**Impact on plan:** Necessary to make the static gate correctly reflect MAC-01's intent (no elevation in installer logic) rather than accidentally failing on unrelated documentation prose. No scope creep — the fix only narrowed the test's file selection, no behavior of `install-payload.sh` itself was changed as a result.

## Issues Encountered

None beyond the deviation above. Both tasks' automated verification commands passed after the fix; `npm test`, `npm run type-check`, and `npm run build` all stayed green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `install-payload.sh`'s interface (`install-payload.sh <source_dir> <version>` + `GMG_INSTALL_BASE`/`GMG_MANIFEST_PATH` env vars + manifest shape) is stable and ready for Plan 04's `installer.applescript` to call via an absolute-path shell invocation.
- The manifest format (`installedAt`, `pluginId`, `version`, `paths[]`) is ready for Phase 3's uninstaller to consume directly.
- `installer-static.test.ts` will automatically extend its `.applescript` coverage the moment Plan 04 adds `installer.applescript` — no test changes needed for that plan.
- No blockers. The interactive `.app` wrapper, the confirmation/Photoshop-running dialogs, and the real end-to-end no-password manual verification remain Plan 04's scope, as designed.

---
*Phase: 01-foundation-macos-installer-rework*
*Completed: 2026-07-04*

## Self-Check: PASSED

All created files (tsconfig.jest.json, distribution/photoshop/macos/install-payload.sh, distribution/photoshop/macos/__tests__/manifest.test.ts, distribution/photoshop/macos/__tests__/installer-static.test.ts, this SUMMARY.md) confirmed present on disk. Both task commit hashes (5b73b46, a235a14) confirmed present in git log.
