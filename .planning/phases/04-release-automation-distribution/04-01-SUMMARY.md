---
phase: 04-release-automation-distribution
plan: 01
subsystem: testing
tags: [jest, uxp-manifest, update-checker, security]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity
    provides: release/checksums.js checksum generation and Jest conventions to mirror
provides:
  - Jest coverage for checkForUpdates() (allowlist, semver validation, silent-null contract)
  - manifest.json requiredPermissions.network restored (scoped to api.github.com)
  - manifest-permissions.test.ts regression guard against scope creep
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "global.fetch = jest.fn() in beforeEach / jest.restoreAllMocks() in afterEach for network-mocked unit tests in testEnvironment: node"
    - "Static-JSON-assertion test pattern (JSON.parse(fs.readFileSync(...))) reused for manifest permission regression guard"

key-files:
  created:
    - src/__tests__/updateChecker.test.ts
    - src/__tests__/manifest-permissions.test.ts
  modified:
    - manifest.json
    - src/__tests__/installer-retirement.test.ts

key-decisions:
  - "D-01/D-03 executed: manifest.json now declares requiredPermissions.network.domains: [\"https://api.github.com\"], consciously accepting the return of Creative Cloud Desktop's install-time admin-password prompt in exchange for a working update checker"

patterns-established:
  - "Fetch-mocked unit tests for network-calling services: assign global.fetch = jest.fn() explicitly (Node's testEnvironment: node exposes a real global fetch that must be stubbed to avoid live network calls)"

requirements-completed: [UPD-01, UPD-03, DIST-01]

coverage:
  - id: D1
    description: "checkForUpdates() behavior (hasUpdate detection, domain allowlist rejection, semver rejection, non-2xx/network-failure silent-null, off-domain asset fallback) is regression-guarded by Jest tests"
    requirement: "UPD-01"
    verification:
      - kind: unit
        ref: "src/__tests__/updateChecker.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "GitHub API remains the only allowlisted domain the update checker will accept a release from"
    requirement: "DIST-01"
    verification:
      - kind: unit
        ref: "src/__tests__/updateChecker.test.ts#rejects a release whose html_url is outside the allowed domain (isSafeUrl)"
        status: pass
    human_judgment: false
  - id: D3
    description: "manifest.json declares requiredPermissions.network.domains scoped to exactly [\"https://api.github.com\"], with a regression guard against broadening to wildcard/extra domains"
    requirement: "UPD-03"
    verification:
      - kind: unit
        ref: "src/__tests__/manifest-permissions.test.ts"
        status: pass
    human_judgment: false

duration: 1min
completed: 2026-07-07
status: complete
---

# Phase 04 Plan 01: Update Checker Test Coverage & Manifest Permission Restoration Summary

**Added Jest coverage for the previously-untested `checkForUpdates()` allowlist/semver/silent-null contract, and consciously restored `manifest.json`'s scoped `requiredPermissions.network` block (D-01/D-03 accepted tradeoff).**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-07T21:34:28Z
- **Completed:** 2026-07-07T21:35:35Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `src/__tests__/updateChecker.test.ts` closes the zero-coverage gap on `checkForUpdates()`: 6 passing tests cover hasUpdate detection, off-domain `html_url` rejection (allowlist), non-semver `tag_name` rejection, non-2xx response handling, network-failure silent-null, and off-domain asset URL fallback to the validated `html_url`.
- `manifest.json` now declares `requiredPermissions.network.domains: ["https://api.github.com"]` — the exact scoped block that existed before Phase 1's `d07142d` removal — restoring the update checker's ability to make its network call.
- `src/__tests__/manifest-permissions.test.ts` is the new single source of truth guarding this scope: fails if the domains array is ever broadened to a wildcard or a second domain.
- The now-false "manifest.json should not declare requiredPermissions" assertion was removed from `installer-retirement.test.ts`, leaving its two still-valid Windows-retirement assertions intact.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fetch-mocked unit tests for checkForUpdates (UPD-01, DIST-01)** - `d38ac69` (test)
2. **Task 2: Restore scoped network permission in manifest.json + regression guard (UPD-03, D-01/D-03)** - `3fac9d5` (feat)

_This plan has no plan-metadata-only commit distinct from the task commits; the final docs commit below captures SUMMARY/STATE/ROADMAP._

## Files Created/Modified
- `src/__tests__/updateChecker.test.ts` - New Jest suite covering checkForUpdates()'s allowlist, semver validation, and silent-null-on-error behaviors (6 tests, checker itself untouched)
- `manifest.json` - Added `requiredPermissions.network.domains: ["https://api.github.com"]` (D-01/D-03 accepted tradeoff)
- `src/__tests__/manifest-permissions.test.ts` - New regression guard asserting the manifest's network permission scope stays exactly one domain
- `src/__tests__/installer-retirement.test.ts` - Removed the obsolete "no requiredPermissions" assertion (now false); fs/path imports and remaining two assertions unchanged

## Decisions Made
- Executed D-01/D-03 as locked in Phase 4 research/context: reintroducing `requiredPermissions.network` is an accepted, documented consequence (returns the CC Desktop admin-password prompt on install/update) in exchange for a working, testable update checker — not treated as a regression to engineer around (D-02 avoidance was already resolved as a dead end).
- Kept the domains array strictly to the single GitHub API origin per the plan's explicit scope boundary — broadening to a wildcard was never attempted.

## Deviations from Plan

None - plan executed exactly as written. `updateChecker.ts` source was not modified (confirmed via `git diff --stat src/services/updateChecker.ts` showing no output), matching the plan's explicit "test-only task, don't regress this" instruction for Task 1.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Live verification of the restored admin-password prompt on a real macOS install with Creative Cloud Desktop is a manual step noted in Phase 4 research as an open item for whoever executes/verifies the later wiring plans in this phase, not required to close out this plan.)

## Next Phase Readiness

- `checkForUpdates()`'s security-relevant logic is now regression-guarded, and the manifest's network permission is restored and scope-locked — both prerequisites plan 04-02 (wiring `checkForUpdates()`/`UpdateBanner` into `App.tsx`) depends on.
- Full test suite green: 10 suites, 47 tests passing (`npm test`).
- No blockers for subsequent plans in this phase.

---
*Phase: 04-release-automation-distribution*
*Completed: 2026-07-07*

## Self-Check: PASSED

All created files verified on disk; both task commits (`d38ac69`, `3fac9d5`) verified present in git log.
