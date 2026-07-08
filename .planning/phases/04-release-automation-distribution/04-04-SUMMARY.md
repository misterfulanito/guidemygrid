---
phase: 04-release-automation-distribution
plan: 04
subsystem: verification
tags: [live-verification, uxp-manifest, update-checker, creative-cloud-desktop, human-verify]

# Dependency graph
requires:
  - phase: 04-release-automation-distribution
    provides: "Plan 01's restored manifest.json requiredPermissions.network + updateChecker.ts test coverage; Plan 02's live App.tsx/UpdateBanner wiring"
provides:
  - "Live, human-confirmed end-to-end proof that the reconnected update checker (UPD-03) actually fires against api.github.com on a real macOS Photoshop install, not just in unit tests"
  - "Live confirmation of UPD-02's manual browser-download path (Download button opens the system browser to the correct GitHub release page)"
  - "A genuine, unresolved contradiction of research Assumption A2 (04-RESEARCH.md): the admin-password prompt did NOT appear on this live install, disagreeing with Phase 1's original A/B test finding — flagged for Phase 5, not resolved here"
affects: [phase-5-trust-and-documentation-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Task 1's checkpoint result is accepted as-is with no further engineering action — this is a verification-only plan (files_modified: [] per plan frontmatter); no source changes result from this plan"
  - "The admin-prompt contradiction is recorded as genuinely unresolved (two trials, two outcomes) rather than papered over in either direction — Phase 5 must not assert unconditionally that the prompt will or won't appear in user-facing docs"

requirements-completed: []

coverage:
  - id: D1
    description: "checkForUpdates() fires live on panel open against api.github.com with no console error, on a real macOS Photoshop + Creative Cloud Desktop install"
    requirement: "UPD-03"
    verification:
      - kind: manual
        ref: "User-reported live checkpoint: panel showed footer v0.1.0 with a blue 'New version available: 1.6.2' banner; no console error reported at any point"
        status: pass
    human_judgment: true
    rationale: "Creative Cloud Desktop cannot be driven headlessly; only a human performing a real install/panel-open can exercise this path"
  - id: D2
    description: "Clicking Download in the UpdateBanner opens the system browser to the GitHub release page (manual, non-silent download path)"
    requirement: "UPD-02"
    verification:
      - kind: manual
        ref: "User confirmed: 'it takes me to the Github. It's OK' after clicking Download"
        status: pass
    human_judgment: true
    rationale: "Requires a live shell.openExternal() call inside real Photoshop/UXP; cannot be exercised by Jest"
  - id: D3
    description: "Admin-password prompt behavior on install with requiredPermissions.network declared (D-03 accepted tradeoff / research Assumption A2)"
    requirement: "UPD-01"
    verification:
      - kind: manual
        ref: "User confirmed no admin-password prompt appeared, and confirmed no unrelated recent admin-password entry (ruling out the credential-caching confound A2 itself flagged)"
        status: contradicted
    human_judgment: true
    rationale: "This is a genuine, unresolved contradiction between two live trials (Phase 1's original A/B test vs. this checkpoint) — not a pass/fail verification, and not resolved by this plan. See 'Live Verification Results' below."

duration: 1min
completed: 2026-07-08
status: complete
---

# Phase 4 Plan 04: Live macOS Install + Panel-Open Update-Check Verification Summary

**Live, human-performed checkpoint on a real macOS Photoshop + Creative Cloud Desktop install confirms the reconnected update checker (UPD-03) and manual browser-download flow (UPD-02) both work end-to-end — but the expected admin-password prompt (D-03) did not appear, directly contradicting Phase 1's original A/B test finding rather than confirming it.**

## Performance

- **Duration:** ~1 min (checkpoint consolidation; the live test itself was performed by the user outside this session, across several messages)
- **Completed:** 2026-07-08
- **Tasks:** 1/1 complete (the plan's only task, a blocking `checkpoint:human-verify`)
- **Files modified:** 0 (verification-only plan, per plan frontmatter `files_modified: []`)

## Accomplishments

- Confirmed live, for the first time since the update checker was reconnected (Plans 01–02), that `checkForUpdates()` actually fires on a real macOS Photoshop panel-open and successfully reaches `api.github.com` with no console error.
- Confirmed live that the `UpdateBanner`'s Download button opens the system browser to the correct GitHub page (UPD-02's manual, non-silent download path), not an in-app download.
- Surfaced a genuine, unresolved contradiction of research Assumption A2: the admin-password prompt Phase 1's original A/B test found to be triggered by `requiredPermissions.network` did not appear on this live install.

## Task Commits

This plan has one task, a blocking `checkpoint:human-verify` with no code changes — there is no per-task code commit. The live verification was performed by the user directly (Creative Cloud Desktop cannot be driven headlessly), consolidated and documented in this session.

**Plan metadata:** (this commit)

## Live Verification Results

### 1. Update-check + banner (UPD-02, UPD-03): CONFIRMED WORKING

The user installed the built `.ccx` via Creative Cloud Desktop and opened the GuideMyGrid panel. The panel showed footer "GuideMyGrid v0.1.0" with a blue "New version available: 1.6.2" banner at the top, a working Download button, and a dismiss (×) button — reviewed directly via screenshot. Clicking Download opened the browser to GitHub, confirmed by the user directly ("it takes me to the Github. It's OK"). No console error was reported at any point.

This is a live, first-time confirmation that:
- **UPD-03** — the reconnected update checker fires on panel mount and completes a real network round-trip to `api.github.com`, not just in Jest's mocked-fetch tests (Plan 01).
- **UPD-02** — the manual "click Download → open system browser" flow (Plan 02's wiring, `UpdateBanner.tsx`'s untouched `shell.openExternal()` call) works from a real UXP host.

**Note on the "1.6.2" version shown:** at the time of this specific checkpoint test, GitHub's latest release was still v1.6.2 (an old pre-rework release) — this was *before* this session's separate v2.0.0 GitHub release work (see "Related but Out-of-Scope Work" below). The comparison logic itself worked correctly (0.1.0 < 1.6.2 by semver, correctly triggering the banner). This is a live confirmation of the comparison/fetch logic behaving as designed, not a defect.

### 2. Admin-password prompt (D-03 / Research Assumption A2): NOT OBSERVED — a confirmed contradiction, not a confound

**This is the most important, and most honestly reported, result of this plan.**

`04-RESEARCH.md`'s Assumption A2 stated: *"Re-declaring `requiredPermissions.network.domains: ["https://api.github.com"]` will reproduce the exact same admin-password prompt behavior observed in Phase 1's A/B test... should be re-verified with a live install during this phase's execution, not assumed purely from Phase 1's historical test."* That re-verification happened in this checkpoint, and the result disagrees with the original test.

Despite `manifest.json` correctly declaring `requiredPermissions.network.domains: ["https://api.github.com"]` (confirmed committed in Plan 01, and functionally in effect — the live network call to `api.github.com` plainly succeeded, per the banner appearing), **no admin-password prompt appeared during this install.**

The user explicitly confirmed they had **not** entered their macOS admin password for anything else recently, ruling out the "credential caching window" confound that A2 itself flagged as the main risk to a clean re-test. This was not a tainted trial — it is a clean, second data point that disagrees with the first.

**Do not spin this as either "prompt confirmed" or "prompt never happens."** Two live trials — Phase 1's original A/B test (`01-RESEARCH.md`) and this checkpoint — now disagree with each other. This is treated as genuinely unresolved, not resolved in either direction:

- It is *possible* (stated as a possibility, not a certainty) that Creative Cloud Desktop's consent behavior for this permission type has changed since Phase 1's original test — Adobe controls and auto-updates CC Desktop, and `04-RESEARCH.md`'s own A2 caveat anticipated exactly this. If true, that would be good news for this project's "no admin/root access" core value.
- But a single trial cannot confirm that on its own. It is equally possible something else about this specific install/session differed from Phase 1's test in a way not yet identified.

**Recommended follow-up (flagged for Phase 5, not resolved here):** Phase 5 (Trust & Documentation Polish) should **not** write install documentation that confidently asserts "you will see an admin-password prompt" given this contradictory evidence. Recommend either:
- A controlled re-test before finalizing that documentation: full uninstall via Creative Cloud Desktop's Manage Plugins, `sudo -k` immediately before reinstall (to guarantee no credential-cache confound), fresh install of the current build; or
- Phrasing the docs conditionally ("you may be asked for your admin password") rather than asserting either outcome as certain.

Windows admin-prompt parity remains explicitly out of scope for this checkpoint (Research Open Question 2 in `04-RESEARCH.md`) — not addressed by either trial.

### 3. No further defects reported

No other defects were reported during this live verification. The user asked to be consulted before closing this plan and, having seen no issues, moved on to a separate, larger piece of work.

## Related but Out-of-Scope Work

While live-testing surfaced the "v1.6.2 still latest" state above, the user separately cut a v2.0.0 GitHub release and marked the 12 old pre-rework releases as deprecated — a direct consequence of live-testing surfacing a real versioning bug (the old v1.6.2 release was semver-"newer" than the new v0.1.0 baseline). This work is **not** part of plan 04-04's scope; it is being tracked separately by the orchestrator and is not re-described in detail here.

## Deviations from Plan

None auto-fixed — this plan is a single `checkpoint:human-verify` task with no code to modify. The one deviation worth flagging is not a Rule 1-4 code deviation but an evidentiary one:

### Research Assumption Contradicted (not an auto-fixable deviation — documented for Phase 5)

**1. Research Assumption A2 (admin-password prompt reproduction) contradicted by live re-test**
- **Found during:** Task 1 (the plan's only checkpoint)
- **What research assumed:** Re-declaring the scoped network permission would reproduce Phase 1's admin-password prompt.
- **What actually happened:** No prompt appeared on this live install, with the credential-caching confound explicitly ruled out by the user.
- **Resolution:** Not resolved — flagged as a genuinely open, unresolved question for Phase 5's documentation work (DOCS-01/DOCS-03), per the "Recommended follow-up" above.
- **Files modified:** None (no code change results from this — it is a documentation-planning flag, not a bug).

## Issues Encountered

None beyond the research-assumption contradiction documented above.

## User Setup Required

None further. The live macOS install, panel-open verification, and Download-button test are already complete, performed directly by the user.

## Next Phase Readiness

- UPD-01/UPD-02/UPD-03 are now live-verified end-to-end on a real macOS install, not just unit-tested (Plans 01–02) — this closes the phase's one item that automated tests structurally cannot cover.
- Phase 4 (Release Automation & Distribution) is now 4/4 plans complete.
- Phase 5 (Trust & Documentation Polish) must treat the admin-password prompt as an **open, contradictory question** — not confidently document either "you will see a password prompt" or "no password prompt occurs" without a controlled re-test first.

---
*Phase: 04-release-automation-distribution*
*Completed: 2026-07-08*

## Self-Check: PASSED

This plan produced no created/modified source files and no task-level code commits (verification-only, `files_modified: []` per plan frontmatter) — self-check confirms this SUMMARY.md exists on disk and the final metadata commit (recorded below) is present in git log.
