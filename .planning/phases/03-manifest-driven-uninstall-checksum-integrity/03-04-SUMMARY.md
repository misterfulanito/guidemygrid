---
phase: 03-manifest-driven-uninstall-checksum-integrity
plan: 04
subsystem: infra
tags: [security-review, ci, path-trust, jest, release-scripts]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity (plan 01)
    provides: retirement of the last root-requiring macOS uninstaller, giving this plan a stable "no custom installer/uninstaller left" scope to review
  - phase: 03-manifest-driven-uninstall-checksum-integrity (plan 02)
    provides: release/checksums.js — new script added to this plan's review scope
  - phase: 03-manifest-driven-uninstall-checksum-integrity (plan 03)
    provides: .github/workflows/macos-ccx-verify.yml — new CI workflow added to this plan's review scope
provides:
  - A zip-availability preflight in distribution/photoshop/build-ccx.js (highest-value, lowest-cost D-13 hardening)
  - release.yml with the retired installer.zip artifact reference removed
  - src/__tests__/release-script-safety.test.ts regression-guarding both fixes
  - 03-SECURITY-REVIEW.md — the written INTEG-04 review with differentiated severity across all five in-scope scripts and three in-scope CI workflows
affects: [phase-4-distribution]

# Tech tracking
tech-stack:
  added: []
  patterns: ["command -v <tool> preflight before an execSync shell-out, throwing a clear actionable error on absence, mirrored from the plan's Pitfall 4 research guidance"]

key-files:
  created:
    - src/__tests__/release-script-safety.test.ts
    - .planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-SECURITY-REVIEW.md
  modified:
    - distribution/photoshop/build-ccx.js
    - .github/workflows/release.yml

key-decisions:
  - "Applied differentiated severity per D-15/Pitfall 4: bare git/gh/npm command names in dev-machine/CI-only scripts are accepted low risk, not treated as equivalent to the retired installer's remote root-elevated PATH-hijack bug"
  - "Only the zip preflight in build-ccx.js was mitigated (highest-value, already a known cross-platform pain point); all other bare command names documented as accepted risk in 03-SECURITY-REVIEW.md rather than blanket absolute-pathed"
  - "release/version.js and release/checksums.js recorded as 'no finding' — neither has any execSync/shell-out surface at all"

requirements-completed: [INTEG-04]

coverage:
  - id: D1
    description: "distribution/photoshop/build-ccx.js runs a zip-availability preflight before the zip -r call and throws a clear error if zip is unavailable"
    requirement: INTEG-04
    verification:
      - kind: unit
        ref: "src/__tests__/release-script-safety.test.ts#build-ccx.js has a zip-availability preflight before the zip -r call"
        status: pass
      - kind: other
        ref: "npm run package:ccx (end-to-end run) succeeded and produced releases/GuideMyGrid-v0.1.0.ccx"
        status: pass
    human_judgment: false
  - id: D2
    description: ".github/workflows/release.yml's files: list no longer references the retired installer-zip artifact"
    requirement: INTEG-04
    verification:
      - kind: unit
        ref: "src/__tests__/release-script-safety.test.ts#release.yml no longer references the retired installer-zip artifact"
        status: pass
    human_judgment: false
  - id: D3
    description: "A written security review (03-SECURITY-REVIEW.md) covers all five in-scope scripts and three in-scope CI workflows with differentiated severity, documents the two remediations, least-privilege CI posture, and the integrity-not-authenticity limitation, and concludes INTEG-04 is satisfied"
    requirement: INTEG-04
    verification:
      - kind: other
        ref: "test -f .planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-SECURITY-REVIEW.md"
        status: pass
    human_judgment: true
    rationale: "Whether the written review's severity framing and coverage depth are 'honest' and sufficiently complete is a qualitative judgment call the plan itself flags for end-of-phase human sign-off (human_verify_mode: end-of-phase), not something a grep/existence check alone can certify."

duration: 8min
completed: 2026-07-07
status: complete
---

# Phase 03 Plan 04: Release Script Security Review Summary

**Zip-availability preflight in build-ccx.js, dead installer.zip reference removed from release.yml, both regression-guarded by a new Jest test, and a written INTEG-04 security review covering all five in-scope release/build scripts and three in-scope CI workflows with differentiated severity.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-07T15:39:00Z
- **Completed:** 2026-07-07T15:47:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 modified, 2 created)

## Accomplishments
- Added a `command -v zip` preflight to `distribution/photoshop/build-ccx.js` immediately before its `zip -r` `execSync` call — the highest-value, lowest-cost hardening identified in `03-RESEARCH.md` (Pitfall 4 / Open Question 2), since `zip` availability is already a known cross-platform pain point
- Removed the retired `releases/GuideMyGrid-v*-installer.zip` entry from `.github/workflows/release.yml`'s `files:` list, leaving `permissions: contents: write` unchanged
- Created `src/__tests__/release-script-safety.test.ts` asserting both fixes are present, following the `installer-retirement.test.ts` fs-assertion style
- Wrote `03-SECURITY-REVIEW.md`, the D-15 written review, covering all five in-scope release/build scripts (`build-ccx.js`, `scripts/package.js`, `release/version.js`, `release/github-release.js`, `release/checksums.js`) and all three in-scope CI workflows (`release.yml`, `windows-ccx-verify.yml`, `macos-ccx-verify.yml`), with differentiated severity, the two remediations, least-privilege CI confirmation, the checksums integrity-not-authenticity limitation, and an explicit "INTEG-04 satisfied" conclusion

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply the two concrete remediations (zip preflight + dead-reference cleanup)** - `a68773e` (feat)
2. **Task 2: Lock findings into a regression test and write the security review summary (D-15)** - `bfaca92` (test)

**Plan metadata:** (pending — final docs commit follows this SUMMARY)

## Files Created/Modified
- `distribution/photoshop/build-ccx.js` - Added a `command -v zip` preflight (try/catch around `execSync('command -v zip', { stdio: 'ignore' })`) before the existing `zip -r` invocation, throwing a clear error naming `zip` and pointing at the pending cross-platform-packaging todo if it's unavailable
- `.github/workflows/release.yml` - Removed the `releases/GuideMyGrid-v*-installer.zip` line from the `files:` list; `permissions: contents: write` unchanged
- `src/__tests__/release-script-safety.test.ts` (new) - Two assertions: `build-ccx.js` contains the `command -v zip` guard; `release.yml` no longer contains `installer.zip` and still lists the `.ccx` glob
- `.planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-SECURITY-REVIEW.md` (new) - Written INTEG-04 review: per-script/per-workflow table (who runs it, privileges, PATH/env-trust findings, severity, disposition), the differentiated-severity framing, the two remediations, accepted low-risk items, and the "INTEG-04 satisfied" conclusion

## Decisions Made
- Applied differentiated severity exactly as `03-RESEARCH.md`'s Pitfall 4 and D-15 direct: bare `git`/`gh`/`npm` command names across the remaining release scripts are accepted low risk (dev-machine/CI-only execution context, no root elevation, no attacker-planted PATH), not treated as equivalent to the retired installer's remote root-elevated PATH-hijack bug.
- Mitigated only the one concrete item the plan specified (`zip` preflight in `build-ccx.js`) — the highest-value target since it's already a known cross-platform pain point — rather than blanket absolute-pathing every `execSync` call, matching the plan's explicit scope ("applies exactly one concrete, cheap hardening").
- Recorded `release/version.js` and `release/checksums.js` as having no shell-out surface at all (pure filesystem read/write via Node built-ins), so they carry no PATH-trust finding — only `release/checksums.js`'s integrity-not-authenticity scope limitation is worth documenting, and it already was in Plan 03-02's `VERIFY.md`.

## Deviations from Plan

None - plan executed exactly as written. Both tasks completed with no auto-fixes required.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 03 (manifest-driven-uninstall-checksum-integrity) is now fully complete: INTEG-01 (macOS uninstaller retirement, Plan 01), INTEG-02 (checksum integrity, Plan 02), INTEG-03 (macOS CI build-artifact regression guard, Plan 03), and INTEG-04 (release-script security review, this plan) are all satisfied.
- `03-SECURITY-REVIEW.md`'s severity framing and coverage depth are flagged for end-of-phase human sign-off per `human_verify_mode: end-of-phase` (config.json) — a qualitative judgment call, not a blocker for phase completion.
- No new blockers introduced. Pre-existing deferred item (`scripts/package.js`'s `git add`-on-gitignored-artifact bug, logged in Plan 03-01's `deferred-items.md`) remains unchanged and out of this plan's scope.
- Phase 4 (distribution) can proceed on top of a fully reviewed, hardened release/CI pipeline.

---
*Phase: 03-manifest-driven-uninstall-checksum-integrity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: distribution/photoshop/build-ccx.js
- FOUND: .github/workflows/release.yml
- FOUND: src/__tests__/release-script-safety.test.ts
- FOUND: .planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-SECURITY-REVIEW.md
- FOUND commits: a68773e, bfaca92
