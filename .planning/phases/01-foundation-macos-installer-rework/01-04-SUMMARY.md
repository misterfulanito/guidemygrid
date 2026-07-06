---
phase: 01-foundation-macos-installer-rework
plan: 04
subsystem: infra
tags: [uxp, ccx, creative-cloud-desktop, packaging, github-releases]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework (Plan 03)
    provides: Corrected manifest.json (host object, portal-issued id 53e308e0, manifestVersion 4); disproven raw-copy installer code retired
provides:
  - distribution/photoshop/build-ccx.js (cross-platform .ccx packaging script, correct zip structure)
  - package:ccx npm script
  - scripts/package.js delegating to package:ccx instead of its own wrong inline zip
  - release/github-release.js no longer referencing the retired .dmg artifact
affects: [01-foundation-macos-installer-rework (phase gate / verify-work), Phase 5 (docs — observed CC Desktop warning wording still pending)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ".ccx packaging lives directly under distribution/photoshop/ (not macos/ or windows/) because the mechanism is identical on both platforms"
    - ".ccx zip structure must nest a top-level dist/ folder (dist/manifest.json), not flatten dist/'s contents at the zip root — confirmed by direct inspection of a real shipping competitor's .ccx"

key-files:
  created:
    - distribution/photoshop/build-ccx.js
  modified:
    - package.json
    - scripts/package.js
    - release/github-release.js

key-decisions:
  - "build-ccx.js stages dist/ into a temp dir under a dist/ subfolder name before zipping, so the zip's own top-level entry is dist/ — matches the confirmed real-world .ccx structure exactly"
  - "scripts/package.js's old structurally-wrong inline zip (zipped dist/'s contents directly at the zip root) fully replaced by a delegated call to `npm run package:ccx`, not patched in place"
  - "Standard zip deflate compression used (not -Z store) — research found no evidence CC Desktop requires a specific compression method; flagged as a quick sanity check if Task 2's manual QA ever surfaces an install problem traceable to it"

patterns-established:
  - "Pattern: any future host-app .ccx packaging (Illustrator, Figma) should reuse distribution/photoshop/build-ccx.js's staging approach rather than re-implementing zip logic per host"

requirements-completed: []
# NOTE: MAC-01 and MAC-04 are claimed complete by this plan's frontmatter, but MAC-01's
# core truth ("zero admin/root prompt... plugin appears in Photoshop's Plugins menu")
# is only verifiable via Task 2's human-verify checkpoint, which has NOT yet been
# performed. Deliberately left empty here — do not mark MAC-01/MAC-04 complete in
# REQUIREMENTS.md until Task 2 is approved. The continuation agent (post-checkpoint)
# should populate this list and run `requirements mark-complete` only after approval.

coverage:
  - id: D1
    description: "distribution/photoshop/build-ccx.js zips dist/ into releases/GuideMyGrid-v<version>.ccx with a top-level dist/ folder inside the zip (dist/manifest.json), not files at the zip root"
    requirement: "MAC-01"
    verification:
      - kind: unit
        ref: "unzip -l releases/GuideMyGrid-v0.1.0.ccx | grep -c dist/manifest.json (Task 1 automated verify) — returned 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "package:ccx npm script added; scripts/package.js delegates to it instead of its own wrong inline zip; release/github-release.js no longer references .dmg"
    verification:
      - kind: unit
        ref: "grep -q '\"package:ccx\"' package.json; ! grep -q '\\.dmg' release/github-release.js; ! grep -q 'zip -r \"${ccxFile}\" \\.' scripts/package.js (Task 1 automated verify) — all passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Double-clicking the built .ccx launches Creative Cloud Desktop and installs the plugin with zero admin/root prompt; the plugin appears in Photoshop's Plugins menu and CC Desktop's Manage Plugins registry, and the panel opens and works"
    requirement: "MAC-01"
    verification: []
    human_judgment: true
    rationale: "Task 2 is a blocking checkpoint:human-verify gate performed on the physical dev Mac — the entire install path runs through Adobe's closed-source Creative Cloud Desktop install agent (UPIA), which cannot be exercised or observed by an automated test. This is the single most important truth this plan exists to prove, and it has NOT yet been verified as of this SUMMARY's creation."

# Metrics
duration: in-progress (Task 1 only)
completed: 2026-07-06
status: blocked
---

# Phase 1 Plan 04: .ccx packaging pipeline + Creative Cloud Desktop install QA Summary (PARTIAL — Task 2 checkpoint pending)

**distribution/photoshop/build-ccx.js built and wired into scripts/package.js and release/github-release.js, producing a correctly-structured .ccx (top-level dist/ folder) — but the actual Creative Cloud Desktop install has NOT yet been manually verified (Task 2 is a blocking human-verify checkpoint, not yet performed).**

**This SUMMARY is intentionally partial.** Task 1 (the packaging pipeline) is complete and committed. Task 2 (manual end-to-end install QA on the dev Mac) is a `checkpoint:human-verify` phase gate that requires a human to physically double-click the built `.ccx`, observe Creative Cloud Desktop's real install dialog, and confirm the plugin appears in Photoshop's Plugins menu — none of which can be performed or simulated by this executor. Do not treat this plan, or Phase 1, as complete until Task 2 is explicitly approved.

## Performance

- **Duration:** Task 1 only — approx. 10 min to this point
- **Completed:** 2026-07-06 (Task 1 only; Task 2 pending)
- **Tasks:** 1 of 2 (Task 2 is a blocking checkpoint returned to the orchestrator)
- **Files modified:** 4 (1 created: `distribution/photoshop/build-ccx.js`; 3 modified: `package.json`, `scripts/package.js`, `release/github-release.js`)

## Accomplishments
- `distribution/photoshop/build-ccx.js` created: stages `dist/`'s contents under a `dist/` subfolder name in a temp directory, then zips that staged `dist/` folder (not its contents) into `releases/GuideMyGrid-v<version>.ccx` — verified via `unzip -l` to contain `dist/manifest.json` as a zip entry, not `manifest.json` at the root
- `package:ccx` npm script added, pointing at the new script
- `scripts/package.js`'s previous inline `.ccx` zip logic (`execSync('cd "${distDir}" && zip -r "${ccxFile}" . ${EXCLUDE}')`, which incorrectly flattened `dist/`'s contents at the zip root) replaced with a single delegated `execSync('npm run package:ccx', ...)` call
- `release/github-release.js`'s `files` array no longer references the retired `GuideMyGrid-v${version}.dmg` path
- Ran `npm run build && node distribution/photoshop/build-ccx.js` end-to-end: produced `releases/GuideMyGrid-v0.1.0.ccx` (64,607 bytes) with the correct nested `dist/` structure
- `npm test` (12/12 existing unit tests) still passes — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build distribution/photoshop/build-ccx.js and wire it into scripts/package.js and release/github-release.js** - `9b0d6e8` (feat)
2. **Task 2: End-to-end Creative Cloud Desktop install QA (phase gate)** - **NOT YET PERFORMED** — blocking `checkpoint:human-verify`, returned to orchestrator for manual QA on the physical dev Mac

**Plan metadata:** this commit (docs: partial plan summary, checkpoint pending)

## Files Created/Modified
- `distribution/photoshop/build-ccx.js` - new Node script; ensures `dist/` exists (builds it if missing), stages it under a `dist/` subfolder name, zips that staged folder into `releases/GuideMyGrid-v<version>.ccx`, cleans up the temp dir
- `package.json` - added `"package:ccx": "node distribution/photoshop/build-ccx.js"` script
- `scripts/package.js` - CCX step now delegates to `npm run package:ccx`; `ccxFile` path constant, pre-run cleanup, and `toStage` array entry all left unchanged per plan instructions
- `release/github-release.js` - removed the dead `GuideMyGrid-v${version}.dmg` line from the `files` array; `.ccx`, `-installer.zip`, and `-uninstaller.pkg` lines left untouched

## Decisions Made
- **Staging via a temp directory (`.tmp-ccx`) rather than an in-place rename trick** — matches the existing `copyDir`-based staging convention already used elsewhere in `scripts/package.js` for the `-installer.zip` step, keeping the codebase's approach to "stage then zip" consistent across both artifacts.
- **`scripts/package.js`'s duplicate `console.log('✅ CCX: ...')` line left in place after the delegated call** — `build-ccx.js` already prints its own success line; the plan didn't ask for this line's removal, and the duplicate output is harmless (both scripts describe the same successful outcome).
- **`distDir`/`EXCLUDE` variables in `scripts/package.js` left untouched** — still required by the separate `-installer.zip` step (Task 2's SCOPE NOTE explicitly keeps that step out of this plan's scope).

## Deviations from Plan

None - Task 1 executed exactly as written. No Rule 1-4 deviations encountered.

## Issues Encountered

None for Task 1. Task 2 could not be performed by this executor by design (it is a `checkpoint:human-verify gate="blocking"` task requiring physical interaction with Creative Cloud Desktop and Photoshop on the dev Mac) — this is expected plan structure, not an issue.

## User Setup Required

**Manual QA required before this plan (and Phase 1) can be marked complete.** See the checkpoint report returned alongside this SUMMARY for the exact steps:
1. Run `npm run package:ccx` (or `npm run package`) to produce the current `.ccx` (already done once this session — `releases/GuideMyGrid-v0.1.0.ccx` exists, but re-running is harmless and recommended for a completely fresh QA pass).
2. Double-click the `.ccx` in Finder.
3. Confirm Creative Cloud Desktop launches and shows an "unverified third-party developer" (or similarly worded) warning — record the exact wording for Phase 5 documentation.
4. Proceed through the warning and confirm the install completes with ZERO admin/root password prompt.
5. Open Photoshop and confirm GuideMyGrid appears under Plugins → GuideMyGrid.
6. Click it and confirm the panel opens and functions.
7. Open Creative Cloud Desktop's own "Manage Plugins" screen and confirm GuideMyGrid shows up there too.
8. Report back: "approved" + the observed warning wording, or describe exactly what happened instead.

## Next Phase Readiness

**Not ready — blocked on Task 2's human verification.** Once approved:
- `requirements-completed` should be updated to `[MAC-01, MAC-04]` and `requirements mark-complete` run
- `status: blocked` in this SUMMARY's frontmatter should be updated to `status: complete`
- STATE.md/ROADMAP.md plan-advance updates (currently deferred) should run
- The observed CC Desktop warning wording should be recorded here for Phase 5's documentation rework (DOCS-02, now reversed per `01-RESEARCH.md`'s follow-up addendum — the `.ccx` flow is being reinstated, not removed)

If Task 2 instead reveals a failure specifically traceable to `manifestVersion: 4` (not the already-applied `host`/`id` fix), that is new evidence for a possible v5 escalation per D-01a's fallback discipline — it should be surfaced as a new finding, not silently patched in a continuation of this plan.

---
*Phase: 01-foundation-macos-installer-rework*
*Status: PARTIAL — Task 1 complete, Task 2 (blocking human-verify checkpoint) pending*
