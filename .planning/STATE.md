---
gsd_state_version: 1.0
milestone: v1.6.1
milestone_name: milestone
current_phase: 01
current_phase_name: foundation-macos-installer-rework
status: executing
stopped_at: Replanned 01-03/01-04 after .ccx pivot; awaiting Developer Distribution portal ID
last_updated: "2026-07-06T18:40:00.000Z"
last_activity: 2026-07-06
last_activity_desc: Plans 01-03/01-04 rewritten for .ccx/Creative Cloud Desktop distribution; original 01-03/01-04 execution voided
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 4
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-04)

**Core value:** A designer with zero terminal experience can install GuideMyGrid on macOS or Windows with a double-click, without being asked to grant admin/root access, and can trust that what they installed is genuinely from the developer and hasn't been tampered with — even without paid OS-level code signing.
**Current focus:** Phase 01 — foundation-macos-installer-rework

## Current Position

Phase: 01 (foundation-macos-installer-rework) — EXECUTING
Plan: 3 of 4 (rewritten — original 01-03/01-04 execution voided, see Decisions)
Status: Ready to execute revised 01-03 (starts with a blocking human-action checkpoint: Developer Distribution portal ID registration)
Last activity: 2026-07-06 — Plans 01-03/01-04 rewritten for .ccx/Creative Cloud Desktop distribution

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: N/A
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: N/A
- Trend: N/A

*Updated after each plan completion*
| Phase 01 P01 | 20min | 3 tasks | 6 files |
| Phase 01 P02 | 12min | 3 tasks | 11 files |
| Phase 01 P03 | 12min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: FOUND-01 (merge origin/main) and FOUND-02 (directory split) folded into Phase 1 rather than a standalone foundation phase — both are direct prerequisites for the macOS installer rework and match the "Setup" role within that phase.
- Roadmap: UPD-01/02/03 (update checker preservation + reconnection) grouped with DIST-01/02/03 (GitHub/Gumroad distribution) into Phase 4 — reconnecting the update checker is tied to having real releases to detect, not to checksum verification (which stays out of scope until v2's signed-manifest work).
- Roadmap: WIN-05 (CI-based Windows installer/uninstaller verification via GitHub Actions `windows-latest`) added to Phase 2 alongside WIN-01..04 — the developer has no physical Windows machine, so this CI verification substitutes for manual testing and Phase 3's INTEG-03 filesystem-diff check reuses the same runner for its Windows half.
- [Phase 01]: D-01a: keep-v4 (manifestVersion 4, apiVersion 2, minVersion 22.0.0) — decided via orchestrator/user consultation before execution
- [Phase 01]: release/ scoped to only version.js and github-release.js this plan (FOUND-02) — checksums.js/gumroad-sync.js not stubbed until Phases 3/4 need them
- [Phase 01]: scripts/package.js's Windows-script copy step repointed to distribution/photoshop/windows/ (Rule 3 auto-fix for the Task 2 relocation)
- [Phase 01]: installer-static.test.ts MAC-01 token scan scoped to .sh/.applescript files only, excluding README prose
- [Phase 01, 2026-07-06]: **Major pivot** — manual QA on the original Plan 01-04 revealed raw file-copy into PluginsStorage never makes Photoshop list a plugin; the only working mechanism is a `.ccx` package installed via Creative Cloud Desktop (confirmed via official docs + direct inspection of a real competing product's `.ccx` + this project's own git history, which shipped this way before v1.6.x's `.pkg` installer). MAC-02/MAC-03 marked superseded in REQUIREMENTS.md (no longer implementable — CC Desktop owns the install sequence). D-01a (manifestVersion 4) unaffected. Plans 01-03/01-04 rewritten accordingly; original 01-03/01-04 SUMMARY.md files deleted (documented an approach that didn't work). Full detail in 01-RESEARCH.md's two addenda.

### Pending Todos

None yet.

### Blockers/Concerns

- Local `main` is 10 commits behind `origin/main`; current branch (`epic/ui-icons`) diverged before the installer work landed — Phase 1 must merge this before building on top of it (FOUND-01).
- The in-app update checker (`checkForUpdates()`/`UpdateBanner`) is currently disconnected dead code per the codebase's CONCERNS.md — Phase 4 planning should treat reconnecting it as real, non-trivial scope, not a trivial wire-up.
- Gumroad's API capability for scripted product-file updates is unconfirmed — Phase 4 planning should verify this directly before committing to an automation approach vs. a documented manual step.
- Revised Plan 01-03 requires a one-time manual step from the user: register a free Draft listing at Adobe's Developer Distribution portal to get a plugin ID (no Marketplace submission/review needed) — this cannot be automated, blocks Plan 01-03's Task 1.
- Phase 2 (Windows installer) likely faces the identical PluginsStorage/Creative-Cloud-Desktop-registry architecture — REQUIREMENTS.md flags WIN-01..03 for re-verification before assuming the raw-copy model works there either.
- `scripts/package.js`'s separate `-installer.zip` build step rests on the same disproven raw-copy assumption on both platforms — flagged out of scope for Phase 1 (macOS-only), worth a look whenever that script is next touched.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-04T22:33:19.922Z
Stopped at: Completed 01-03-PLAN.md
Resume file: None
