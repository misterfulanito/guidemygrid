---
phase: 03-manifest-driven-uninstall-checksum-integrity
plan: 03
subsystem: infra
tags: [github-actions, ci, macos, ccx, unzip, manifest, regression-guard]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity (plan 01)
    provides: deletion of the legacy macOS uninstaller scripts (build-mac-uninstaller.js, uninstall-preinstall) this plan's CI guard now protects against regressing
  - phase: 02 (windows-installer)
    provides: windows-ccx-verify.yml — the structural template this plan mirrors for macOS
provides:
  - .github/workflows/macos-ccx-verify.yml — a macos-latest CI job that builds the .ccx, extracts it, and fails the build if requiredPermissions or any of seven retired installer/uninstaller scripts are present
affects: [phase-4-distribution, release-process]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CI build-artifact regression check (build -> extract -> assert absent/present -> exit 1 with descriptive message)"]

key-files:
  created: [.github/workflows/macos-ccx-verify.yml]
  modified: []

key-decisions:
  - "Mirrored windows-ccx-verify.yml almost exactly per D-10, using unzip + node -e instead of PowerShell's native zip/JSON handling to avoid a jq dependency the project doesn't otherwise use"
  - "Retired-names list extended to seven entries (five Windows raw-copy scripts + build-mac-uninstaller.js + uninstall-preinstall) per D-11, giving the macOS job coverage of both phases' retirements"
  - "No permissions: block on the job, matching the Windows job's own omission (least privilege, build-and-assert only, per D-14)"

patterns-established:
  - "macOS CI build-artifact regression check: set -euo pipefail, unzip -q into ccx-extracted, node -e process.exit(...) for JSON assertions, find + grep -q for retired-script detection, exit 1 with a descriptive message per failure path"

requirements-completed: [INTEG-03]

coverage:
  - id: D1
    description: "New .github/workflows/macos-ccx-verify.yml runs on macos-latest, builds the .ccx via npm run package:ccx, and asserts dist/manifest.json inside it has no requiredPermissions block"
    requirement: "INTEG-03"
    verification:
      - kind: unit
        ref: "inline node -e assertion script (run manually against the created YAML): checks runs-on: macos-latest, requiredPermissions assertion present, no permissions: block"
        status: pass
    human_judgment: true
    rationale: "The CI job itself only proves it is green when GitHub Actions actually runs it on a push/PR to this branch — that requires the workflow to execute on GitHub's runners, which is outside this local execution session. The static assertion above confirms the YAML structure is correct; a human/CI observer must confirm the job goes green on the phase's final commit per the plan's <verification> section."
  - id: D2
    description: "Retired-names loop in the extract-and-validate step includes all seven retired installer/uninstaller scripts (five Windows raw-copy scripts plus build-mac-uninstaller.js and uninstall-preinstall) and fails the build if any are found inside the extracted .ccx"
    requirement: "INTEG-03"
    verification:
      - kind: unit
        ref: "inline node -e assertion script: checks build-mac-uninstaller.js present in retired list"
        status: pass
      - kind: other
        ref: "find . -name build-mac-uninstaller.js -o -name uninstall-preinstall (excluding node_modules) — confirmed zero matches in the repo, consistent with Plan 03-01's deletions"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-07-07
status: complete
---

# Phase 3 Plan 3: macOS .ccx Build-Artifact Regression CI Job Summary

**New `macos-latest` GitHub Actions job (`macos-ccx-verify.yml`) that builds the .ccx via the real packaging script, extracts it with `unzip`, and fails the build if `requiredPermissions` reappears in the manifest or any of seven retired installer/uninstaller scripts leak into the artifact.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-07T15:02:15Z
- **Completed:** 2026-07-07T15:08:00Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- macOS now has a build-artifact regression check with coverage parity to the existing Windows job (D-09/D-10), rescoping INTEG-03's original "filesystem-diff" ask into an automatable proxy since Creative Cloud Desktop cannot be driven headlessly in CI
- The check fails before release if `requiredPermissions` re-appears in `dist/manifest.json` inside the built `.ccx`, or if any of the seven retired installer/uninstaller scripts (five Windows raw-copy scripts + this phase's two retired macOS uninstaller scripts) leak into the artifact
- The workflow carries no `permissions:` block, matching the Windows job's least-privilege convention (D-14)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the macos-latest .ccx build-artifact regression CI job** - `9719000` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `.github/workflows/macos-ccx-verify.yml` - New `macos-latest` job mirroring `windows-ccx-verify.yml`: checkout → setup-node@v4 (node 20) → npm ci → npm run build → npm run package:ccx → extract-and-validate step using `unzip -q` + `node -e` to assert no `requiredPermissions` and no retired scripts

## Decisions Made
- Mirrored `windows-ccx-verify.yml` almost exactly (same triggers, same boilerplate steps through `npm run package:ccx`) per D-10, diverging only in the extraction/assertion step where macOS uses `unzip` + `node -e` instead of PowerShell's `System.IO.Compression.ZipFile` + `ConvertFrom-Json`, avoiding a `jq` dependency the project doesn't otherwise use
- Extended the retired-names list beyond the five Windows raw-copy scripts to include `build-mac-uninstaller.js` and `uninstall-preinstall` per D-11, since this phase (Plan 03-01) retired those two macOS uninstaller scripts
- Omitted a `permissions:` block entirely, matching the Windows job's own omission — this is a build-and-assert-only job that needs no write scope (D-14 least privilege)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Confirmed via `find` that `build-mac-uninstaller.js` and `uninstall-preinstall` are already absent from the working tree (deleted by Plan 03-01, which ran immediately before this plan in Wave 1), so the new CI guard's retired-script assertions have nothing currently in the repo that would trip them — they exist purely as a regression guard against future re-introduction.

## User Setup Required

None - no external service configuration required. The new workflow runs automatically on the next push/PR to `main` or `epic/ui-icons`; no dashboard configuration needed.

## Next Phase Readiness
- Both `windows-ccx-verify.yml` and `macos-ccx-verify.yml` now exist with matching build-artifact regression coverage; the phase-level verification note ("both jobs green on the phase's final commit") requires an actual push/PR to observe — flagged as human-judgment coverage above since this local execution session cannot trigger a live GitHub Actions run.
- No blockers for the remaining phase work (Plan 03-02's checksum/VERIFY.md work, if not already complete, and the phase-level security review).

---
*Phase: 03-manifest-driven-uninstall-checksum-integrity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: .github/workflows/macos-ccx-verify.yml
- FOUND: .planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-03-SUMMARY.md
- FOUND: 9719000 (task commit)
