---
phase: 03-manifest-driven-uninstall-checksum-integrity
plan: 01
subsystem: infra
tags: [jest, tdd, uninstaller-retirement, macos, ccx, package-scripts, readme]

# Dependency graph
requires:
  - phase: 02-manifest-driven-uninstall-checksum-integrity
    provides: Windows installer retirement pattern (installer-retirement.test.ts) mirrored here for macOS
provides:
  - Deletion of the last root-requiring macOS uninstaller code path (build-mac-uninstaller.js, pkg-resources/uninstall-preinstall)
  - Cleaned scripts/package.js with no darwin-gated uninstaller invocation or staging
  - Jest regression test guarding against silent reintroduction of the retired uninstaller
  - README "Uninstalling" section documenting the CC Desktop Manage Plugins path
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Mirror installer-retirement.test.ts pattern for new retirement guards (it.each over retired paths + a package.js content assertion)"]

key-files:
  created:
    - src/__tests__/macos-installer-retirement.test.ts
    - .planning/phases/03-manifest-driven-uninstall-checksum-integrity/deferred-items.md
  modified:
    - scripts/package.js
    - README.md
  deleted:
    - scripts/build-mac-uninstaller.js
    - scripts/pkg-resources/uninstall-preinstall

key-decisions:
  - "INTEG-01 satisfied by deletion + documentation + regression guard, not new tracking code — CC Desktop already owns install/uninstall end-to-end"
  - "Logged a pre-existing, out-of-scope bug (git add on gitignored .ccx crashes package.js after successful build) to deferred-items.md instead of fixing inline — it predates this plan's changes (confirmed via git show HEAD before Task 2)"

requirements-completed: [INTEG-01]

coverage:
  - id: D1
    description: "Legacy root-requiring macOS uninstaller (build-mac-uninstaller.js + pkg-resources/uninstall-preinstall) deleted from the repo"
    requirement: INTEG-01
    verification:
      - kind: unit
        ref: "src/__tests__/macos-installer-retirement.test.ts#build-mac-uninstaller.js should not exist (retired per D-01)"
        status: pass
      - kind: unit
        ref: "src/__tests__/macos-installer-retirement.test.ts#pkg-resources/uninstall-preinstall should not exist (retired per D-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/package.js no longer invokes or stages the legacy macOS uninstaller"
    requirement: INTEG-01
    verification:
      - kind: unit
        ref: "src/__tests__/macos-installer-retirement.test.ts#scripts/package.js should not reference the legacy mac-uninstaller build script"
        status: pass
    human_judgment: false
  - id: D3
    description: "README documents Creative Cloud Desktop's Manage Plugins panel as the uninstall mechanism, with no separate uninstaller app"
    requirement: INTEG-01
    verification:
      - kind: other
        ref: "grep -qi 'Uninstalling' README.md && grep -qi 'Manage Plugins' README.md"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-07
status: complete
---

# Phase 03 Plan 01: macOS Uninstaller Retirement Summary

**Deleted the last root-requiring macOS uninstaller code path, guarded its return with a Jest regression test, and documented the real Creative Cloud Desktop uninstall path in the README.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-07T14:56:00Z
- **Completed:** 2026-07-07T15:04:00Z
- **Tasks:** 3
- **Files modified:** 5 (2 deleted, 2 modified, 1 created test + 1 created deferred-items log)

## Accomplishments
- Deleted `scripts/build-mac-uninstaller.js` and `scripts/pkg-resources/uninstall-preinstall` — the last `pkgbuild --install-location /` root-requiring code path in the project
- Removed the darwin-gated uninstaller invocation and its staging logic from `scripts/package.js`
- Added `src/__tests__/macos-installer-retirement.test.ts` mirroring Phase 2's `installer-retirement.test.ts` pattern, following RED → GREEN (files/content assertions failed pre-deletion, pass post-deletion)
- Documented the Creative Cloud Desktop "Manage Plugins" uninstall path in `README.md`'s new `## Uninstalling` section

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the macOS uninstaller-retirement regression test (RED)** - `9feaa77` (test)
2. **Task 2: Delete the legacy macOS uninstaller and remove its invocation from package.js (GREEN)** - `0120983` (feat)
3. **Task 3: Document uninstall via Creative Cloud Desktop in the README (D-03)** - `67a63a4` (docs)

**Plan metadata:** (pending — final docs commit follows this SUMMARY)

## Files Created/Modified
- `src/__tests__/macos-installer-retirement.test.ts` - Jest regression guard: asserts the two retired files are absent and unreferenced by `package.js`
- `scripts/package.js` - Removed the "Legacy macOS uninstaller" comment block, the darwin-gated `execSync('node scripts/build-mac-uninstaller.js', ...)` call, and the `uninstallerFile` staging variable
- `README.md` - Added `## Uninstalling` section after `## Installation`, documenting Creative Cloud Desktop's Manage Plugins panel
- `.planning/phases/03-manifest-driven-uninstall-checksum-integrity/deferred-items.md` - Logged an out-of-scope pre-existing bug found during verification (see Deviations)
- `scripts/build-mac-uninstaller.js` (deleted) - Legacy root-requiring `pkgbuild` uninstaller builder
- `scripts/pkg-resources/uninstall-preinstall` (deleted) - Preinstall script for the legacy `.pkg` uninstaller

## Decisions Made
- INTEG-01 is satisfied purely by deletion + documentation + a regression test — no new manifest-driven uninstall tracking code is needed, since Creative Cloud Desktop already owns the full install/uninstall lifecycle (established Phase 1/2, D-01/D-02).
- No legacy-cleanup path was built (D-04, per plan) — the user confirmed no real end user carries orphaned pre-`.ccx` install artifacts.

## Deviations from Plan

### Auto-fixed Issues

None — no Rule 1/2/3 auto-fixes were required. Plan executed exactly as written for all three tasks.

### Out-of-Scope Discovery (logged, not fixed)

**1. [Scope boundary] `scripts/package.js`'s final `git add` step fails on the gitignored `.ccx` output**
- **Found during:** Task 2 verification (`node scripts/package.js` end-to-end run)
- **Issue:** After a successful `npm run package:ccx` build, the script's staging step (`git add releases/GuideMyGrid-v<version>.ccx`) fails because `releases/` and `*.ccx` are both gitignored, crashing the script with a non-zero `execSync` error.
- **Why not fixed:** Confirmed via `git show HEAD:scripts/package.js` (the commit immediately after Task 1, before Task 2 touched the file) that this `git add`-on-gitignored-file behavior pre-dates this plan — Task 2's scope was removing the uninstaller invocation/staging, not the pre-existing plain `git add`. Per the SCOPE BOUNDARY rule, this is logged to `deferred-items.md` rather than fixed inline.
- **Impact on Task 2's acceptance criteria:** Task 2's criterion ("`node scripts/package.js` still produces the `.ccx` without error") refers to the delegated `npm run package:ccx` step, which is unchanged and succeeds — the `.ccx` file is produced correctly. The unrelated staging-step crash happens after the artifact already exists.

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope item logged to `deferred-items.md`.
**Impact on plan:** None — plan executed exactly as written. The logged item is pre-existing and unrelated to this plan's changes.

## Issues Encountered
None beyond the out-of-scope discovery above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The last root-requiring code path in the macOS release flow is gone; `INTEG-01` is complete for macOS.
- `scripts/package.js`'s pre-existing `git add`-on-gitignored-artifact bug is tracked in `deferred-items.md` for a future plan (likely whichever plan next touches the publish/staging flow — Phase 3's checksum work or Phase 4's distribution work).
- `pkg-resources/` is now an empty directory (git doesn't track it); no placeholder was added per plan instruction.

---
*Phase: 03-manifest-driven-uninstall-checksum-integrity*
*Completed: 2026-07-07*
