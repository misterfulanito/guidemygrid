---
phase: 04-release-automation-distribution
plan: 02
subsystem: ui
tags: [react, zustand, uxp, typescript, jest]

# Dependency graph
requires:
  - phase: 04-release-automation-distribution
    provides: "Plan 01's manifest.json requiredPermissions.network re-add (D-01/D-03) and updateChecker.ts test coverage"
provides:
  - "Live in-app update notification: App.tsx checks GitHub Releases on every panel open and renders a dismissible banner when a newer version exists"
  - "uiStore updateInfo state (get/set/dismiss) as the wiring point between the update checker and the UI"
  - "Static regression guards proving the update-checker wiring exists and that UpdateBanner remains manual-download-only (UPD-02)"
affects: [04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mount useEffect with a cancellation-guard flag (cancelled/return cleanup), mirroring useDocument.ts's async-in-useEffect shape"
    - "Zustand flat-replace setter + dismiss pair for wholesale-replaced state (updateInfo), matching setError's existing shape"
    - "Static source-scan regression tests (fs.readFileSync + toContain/not.toContain) mirroring installer-retirement.test.ts, used here to guard live wiring instead of file existence"

key-files:
  created:
    - src/__tests__/uiStore.updateInfo.test.ts
    - src/__tests__/App.updateWiring.test.ts
    - src/__tests__/updateBanner.download.test.ts
  modified:
    - src/types/store.types.ts
    - src/store/uiStore.ts
    - src/App.tsx

key-decisions:
  - "No try/catch added around checkForUpdates().then() in App.tsx — checkForUpdates() already resolves null on any failure (silent-null convention); adding a second error-handling layer would deviate from the established pattern."
  - "UpdateBanner.tsx left completely untouched (verified via empty git diff) — its shell.openExternal manual-download behavior (UPD-02) is the exact surface being regression-guarded, not modified."

requirements-completed: [UPD-02, UPD-03]

coverage:
  - id: D1
    description: "uiStore holds update-notification state (updateInfo/setUpdateInfo/dismissUpdate) with a type-checked, behaviorally-tested lifecycle"
    requirement: "UPD-03"
    verification:
      - kind: unit
        ref: "src/__tests__/uiStore.updateInfo.test.ts#uiStore update state (UPD-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "App.tsx checks for updates on mount (no throttle) and conditionally renders UpdateBanner when an update is available"
    requirement: "UPD-03"
    verification:
      - kind: unit
        ref: "src/__tests__/App.updateWiring.test.ts#App update-checker wiring (UPD-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "UpdateBanner's manual-download-only behavior (shell.openExternal, no filesystem-write/auto-install surface) is regression-guarded and the component itself is unmodified"
    requirement: "UPD-02"
    verification:
      - kind: unit
        ref: "src/__tests__/updateBanner.download.test.ts#UpdateBanner manual-download flow (UPD-02)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-08
status: complete
---

# Phase 4 Plan 02: Reconnect In-App Update Checker Summary

**Wired the previously dead `checkForUpdates()`/`<UpdateBanner>` pair into `App.tsx` via a new `uiStore.updateInfo` field, turning the orphaned update-notification code into a live feature that fires on every panel open.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-08T14:46:00Z (approx, from first commit timestamp)
- **Completed:** 2026-07-08T14:49:09Z
- **Tasks:** 2
- **Files modified:** 3 modified, 3 created

## Accomplishments
- `uiStore`/`UIStore` type extended with `updateInfo`, `setUpdateInfo`, `dismissUpdate` — flat-replace setter shape matching the existing `setError` convention
- `App.tsx` now imports `checkForUpdates` and `UpdateBanner`, runs the check in a mount `useEffect` (cancellation-guarded, empty deps — fires every panel open per D-04, no throttle), and conditionally renders `<UpdateBanner>` when `updateInfo` is truthy
- Three new test files: a behavioral test for the store lifecycle, and two static-source-scan regression guards protecting the wiring itself and the UPD-02 manual-download-only behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Add updateInfo state to uiStore + UIStore type, with behavioral test** - `dfcbfa5` (feat)
2. **Task 2: Wire checkForUpdates + UpdateBanner into App.tsx, with wiring + UPD-02 regression guards** - `562865a` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/types/store.types.ts` - Imports `UpdateInfo` from `services/updateChecker`; extends `UIStore` with `updateInfo`/`setUpdateInfo`/`dismissUpdate`
- `src/store/uiStore.ts` - Adds `updateInfo: null` initial state and the two flat-replace setters
- `src/App.tsx` - Adds imports, mount `useEffect` calling `checkForUpdates()`, and conditional `<UpdateBanner>` render after the `DocumentHintBanner` block
- `src/__tests__/uiStore.updateInfo.test.ts` - Behavioral test: initial null, set, dismiss
- `src/__tests__/App.updateWiring.test.ts` - Static scan asserting App.tsx imports/calls/renders the update-checker wiring
- `src/__tests__/updateBanner.download.test.ts` - Static scan asserting UpdateBanner.tsx contains `openExternal` and no filesystem-write/install surface

## Decisions Made
- No try/catch added around `checkForUpdates().then()` — the function already swallows all errors internally and resolves `null`; a second error-handling layer would deviate from the project's established silent-null convention (`updateChecker.ts` lines 45-70).
- `UpdateBanner.tsx` left completely untouched — confirmed via `git diff` returning empty — so its `shell.openExternal` manual-download behavior (UPD-02) is preserved exactly as-is.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The update checker is now a live, tested feature end-to-end (UPD-03 complete); UPD-02's manual-download-only behavior is preserved and regression-guarded.
- Full test suite green (13 suites / 56 tests) and `tsc --noEmit` clean after both tasks.
- Ready for Plan 03/04 (Gumroad distribution front-end and release sync automation), which are independent of this plan's scope.

---
*Phase: 04-release-automation-distribution*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created/modified files verified present on disk; both task commits (`dfcbfa5`, `562865a`) verified present in git log.
