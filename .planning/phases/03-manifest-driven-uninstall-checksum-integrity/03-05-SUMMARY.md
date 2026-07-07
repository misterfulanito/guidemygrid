---
phase: 03-manifest-driven-uninstall-checksum-integrity
plan: 05
subsystem: photoshop-bridge
tags: [uxp, photoshop-bridge, jest, ts-jest, regression-fix, gap-closure]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity
    provides: "Phase 3 UAT (03-UAT.md) diagnosed the on-mount document-detection gap this plan fixes"
provides:
  - "getActiveDocument() no longer rejects the whole document-detection call when the selection check fails on initial mount"
  - "Regression test locking in the resilience so this UXP modal-scope timing bug cannot silently return"
affects: [panel-bootstrap, useDocument-hook, uat-retest]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-fatal sub-check pattern: wrap a secondary/enrichment async call (hasActiveSelection) in its own try/catch inside a primary detection method, degrading only that field instead of rejecting the whole call — mirrors the existing getGuidesVisible() fallback pattern"
    - "Jest virtual mock for UXP host modules (photoshop) with a module-scoped mutable getter (mockActiveDocument) to control state across tests without re-importing"

key-files:
  created:
    - src/__tests__/photoshopBridge.getActiveDocument.test.ts
  modified:
    - src/services/photoshopBridge.ts

key-decisions:
  - "Fix confined to getActiveDocument() only — getSelectionBounds(), hasActiveSelection(), and useDocument.ts left unchanged, per plan's explicit scope boundary"
  - "Selection-check failure is logged via console.error('[GMG] ...') rather than silently swallowed, so a genuine (non-timing) failure remains diagnosable"

patterns-established:
  - "Pattern: guard a secondary enrichment call inside a detection method with its own try/catch so a host-timing race degrades one field, not the whole result"

requirements-completed: [GAP-03-DOC-DETECT]

coverage:
  - id: D1
    description: "getActiveDocument() resolves a non-null DocumentInfo with hasSelection:false when the selection check throws (e.g. executeAsModal not yet granted on mount)"
    requirement: "GAP-03-DOC-DETECT"
    verification:
      - kind: unit
        ref: "src/__tests__/photoshopBridge.getActiveDocument.test.ts#resolves a non-null document with hasSelection:false when getSelectionBounds() rejects (modal-scope timing failure)"
        status: pass
    human_judgment: false
  - id: D2
    description: "getActiveDocument() still returns hasSelection:true when the selection check succeeds (control case, unchanged behavior)"
    requirement: "GAP-03-DOC-DETECT"
    verification:
      - kind: unit
        ref: "src/__tests__/photoshopBridge.getActiveDocument.test.ts#returns hasSelection:true when getSelectionBounds() resolves to bounds"
        status: pass
    human_judgment: false
  - id: D3
    description: "getActiveDocument() still returns null when there is no active document (control case, unchanged behavior)"
    requirement: "GAP-03-DOC-DETECT"
    verification:
      - kind: unit
        ref: "src/__tests__/photoshopBridge.getActiveDocument.test.ts#returns null when there is no active document"
        status: pass
    human_judgment: false
  - id: D4
    description: "With a document open, the panel shows the document and enables margin fields / Add Guides on mount, without requiring a marquee or select-all first"
    verification: []
    human_judgment: true
    rationale: "Requires a live Photoshop UXP host to observe modal-scope timing on real panel mount — deferred to UAT re-test per plan's verification section, not reproducible in the Jest/Node unit-test environment"

# Metrics
duration: 4min
completed: 2026-07-07
status: complete
---

# Phase 3 Plan 5: Harden Document Detection Against Selection-Check Timing Summary

**Fixed a UXP modal-scope timing bug where `getActiveDocument()` rejected entirely (nulling out the whole document) whenever the selection check ran before Photoshop granted modal scope on initial panel mount — now the selection check is isolated in its own try/catch so only `hasSelection` degrades to `false`, locked in by a new Jest regression suite.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-07T17:00:00Z
- **Completed:** 2026-07-07T17:04:00Z
- **Tasks:** 1 (TDD: RED → GREEN)
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Isolated `hasActiveSelection()` inside `getActiveDocument()` behind its own try/catch, defaulting `hasSelection` to `false` on failure instead of letting the exception bubble up and null the whole document
- Added a regression test suite (3 cases) that mocks the UXP `photoshop` module virtually and drives `getSelectionBounds()` via a spy to prove the resilience, the with-selection control case, and the no-document control case
- Confirmed the fix does not touch `getSelectionBounds()`, `hasActiveSelection()`, or `useDocument.ts` — scope stayed exactly as specified in the plan

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 (RED): failing regression test** - `bf9ad50` (test) — proved the bug: Test 1 rejected against the un-fixed code
2. **Task 1 (GREEN): hardened getActiveDocument()** - `9101c12` (fix) — all 3 tests pass after the fix

**Plan metadata:** (this commit) `docs(03-05): complete...`

## Files Created/Modified
- `src/__tests__/photoshopBridge.getActiveDocument.test.ts` - New Jest suite; virtual-mocks the `photoshop` UXP module and spies on `getSelectionBounds()` to drive the three cases (reject / resolve-with-bounds / no-document)
- `src/services/photoshopBridge.ts` - `getActiveDocument()` now wraps `this.hasActiveSelection()` in a local try/catch, defaulting `hasSelection` to `false` and logging via `console.error('[GMG] ...')` on failure

## Decisions Made
- Confined the fix strictly to `getActiveDocument()` as directed by the plan — no refactor of `getSelectionBounds()`/`hasActiveSelection()`/`useDocument.ts`, keeping this a targeted bug fix
- Logged (not silently swallowed) the selection-check failure so a genuine non-timing failure stays diagnosable in the console, matching the existing `getGuidesVisible()` fallback pattern

## Deviations from Plan

None — plan executed exactly as written. TDD RED/GREEN gate sequence confirmed in git log (`bf9ad50` test commit precedes `9101c12` fix commit); no REFACTOR commit was needed since the minimal fix required no follow-up cleanup.

## TDD Gate Compliance

RED gate: `bf9ad50` (`test(03-05): add failing regression test...`) — confirmed Test 1 failed against pre-fix code.
GREEN gate: `9101c12` (`fix(03-05): harden getActiveDocument...`) — confirmed all 3 tests pass after the fix.
REFACTOR gate: not applicable — no follow-up cleanup was needed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Automated regression coverage now guards this bug from recurring
- D4 (live on-mount panel behavior) is deferred to human UAT re-test in Photoshop, per the plan's own verification section — this is expected, not a gap in this plan's scope
- Phase 3 gap closure (GAP-03-DOC-DETECT) is complete pending that UAT re-confirmation

---
*Phase: 03-manifest-driven-uninstall-checksum-integrity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: src/services/photoshopBridge.ts
- FOUND: src/__tests__/photoshopBridge.getActiveDocument.test.ts
- FOUND: bf9ad50 (test commit)
- FOUND: 9101c12 (fix commit)
