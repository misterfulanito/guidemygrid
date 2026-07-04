---
phase: 01-foundation-macos-installer-rework
plan: 01
subsystem: infra
tags: [git-merge, manifest-json, uxp, webpack, gitignore, release-automation]

# Dependency graph
requires: []
provides:
  - Consolidated epic/ui-icons branch containing origin/main's installer work through v1.6.2
  - Resolved manifest.json (manifestVersion 4, apiVersion 2, minVersion 22.0.0) per D-01a
  - package.json with publish:patch/minor/major scripts wired to scripts/gh-release.js
  - Regenerated src/version.ts and in-sync package.json version (1.6.2)
  - Untracked releases/* binary artifacts (working-tree files preserved, no history rewrite)
affects: [01-02-directory-restructure, 01-03-macos-installer-rebuild, 01-04-macos-installer-rebuild-cont]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "git rm --cached (not git rm / history rewrite) to stop tracking already-committed binaries while preserving working-tree files and shared history"

key-files:
  created: []
  modified:
    - manifest.json
    - package.json
    - src/version.ts
    - webpack.config.js
    - .gitignore
    - package-lock.json

key-decisions:
  - "D-01a: keep-v4 (manifestVersion 4, apiVersion 2, minVersion 22.0.0) — decided via orchestrator/user consultation before execution"

patterns-established:
  - "epic/ui-icons .gitignore convention (ignore built release artifacts) is the canonical convention going forward, not origin/main's tracked-binaries convention"

requirements-completed: [FOUND-01]

coverage:
  - id: D1
    description: "Merge origin/main into epic/ui-icons with all 5 known conflicts resolved and zero unresolved conflict markers"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "git diff --check && test -z \"$(git ls-files -u)\" — clean, no unmerged paths"
        status: pass
    human_judgment: false
  - id: D2
    description: "manifest.json resolved per D-01a (keep-v4): manifestVersion 4, apiVersion 2, minVersion 22.0.0"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "manifest.json inspected post-merge: manifestVersion=4, host.apiVersion=2, host.minVersion=22.0.0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Merged branch builds and passes existing test suite (npm run build && npm test)"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "npm run build (webpack 5.105.4 compiled successfully)"
        status: pass
      - kind: unit
        ref: "src/__tests__/gridGenerator.sideGuide.test.ts — 12/12 tests pass"
        status: pass
    human_judgment: false
  - id: D4
    description: "releases/* binaries untracked via git rm --cached, no history rewrite"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "git ls-files releases/ returns empty; files remain on disk untracked"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-04
status: complete
---

# Phase 1 Plan 1: Merge origin/main Installer Work Summary

**Merged origin/main's v1.6.1-1.6.2 installer work into epic/ui-icons with manifest.json kept at v4/apiVersion 2/minVersion 22.0.0 (D-01a=keep-v4), verified with a green build and test run.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-04T22:02:37Z
- **Completed:** 2026-07-04T22:09:00Z
- **Tasks:** 3 (1 pre-resolved checkpoint, 2 auto)
- **Files modified:** 6 conflict-resolution files + ~19 non-conflicting additions (installer scripts, workflow, releases/* binaries later untracked)

## Accomplishments

- Merged `origin/main` into `epic/ui-icons` (`git merge origin/main`), bringing in the release commits through `v1.6.2` (5f002c6, 30831ed, 271fa88, 55b993a, 99f0e79, fbab9bc, fdb95ee, b725e4f, 6e6c136, 1647832) with zero unresolved conflicts
- Resolved `manifest.json` per **D-01a = keep-v4**: reverted git's auto-merge (which had taken origin/main's v5/apiVersion-dropped/minVersion-23.0.0 side) back to `manifestVersion: 4`, `host.apiVersion: 2`, `host.minVersion: "22.0.0"`, while keeping `version: "1.6.2"` (kept in sync automatically by the existing `prebuild` → `scripts/sync-version.js` hook)
- Confirmed `package.json` merged cleanly with origin/main's `publish:patch`/`publish:minor`/`publish:major` scripts intact and `version: "1.6.2"`
- Confirmed `src/version.ts` (`1.6.2`) and `webpack.config.js` (`.DS_Store` ignore hygiene fix on the icons `CopyWebpackPlugin` pattern) merged cleanly from origin/main's side
- Reverted `.gitignore`'s auto-merge (which had taken origin/main's tracked-binaries convention) back to the `epic/ui-icons` convention: ignore `releases/`, `*.ccx`, keep `!.planning/**/*.md`
- Untracked all 9 `releases/*.pkg`/`.ccx`/`.zip` binary artifacts via `git rm --cached` (working-tree files preserved, no history rewrite) in a separate follow-up commit
- Verified the merged branch builds (`npm install && npm run build`) and passes the existing test suite (`npm test`, 12/12 tests) with the D-01a resolution in place — no evidence surfaced requiring D-01a to be reopened

## Task Commits

1. **Task 1: Decide manifest.json schema/minVersion resolution (D-01a)** — pre-resolved via orchestrator/user consultation before this execution; no commit (decision-only, recorded below)
2. **Task 2: Merge origin/main into epic/ui-icons and resolve the five conflicts** — `62c3d47` (feat) + `5d4e618` (chore, releases/* untrack cleanup)
3. **Task 3: Verify the merged branch builds and tests pass** — no commit (verification-only; `npm install` produced no `package-lock.json` diff, `src/version.ts` already matched post-prebuild)

**Plan metadata:** commit pending (this SUMMARY + STATE.md + ROADMAP.md)

## Files Created/Modified

- `manifest.json` — resolved to manifestVersion 4 / apiVersion 2 / minVersion 22.0.0 (D-01a=keep-v4), version 1.6.2
- `package.json` — added publish:patch/minor/major scripts, version bumped to 1.6.2
- `src/version.ts` — regenerated to `export const VERSION = '1.6.2'`
- `webpack.config.js` — added `globOptions: { ignore: ['**/.DS_Store'] }` to icons copy pattern
- `.gitignore` — kept epic/ui-icons convention (releases/, *.ccx, !.planning/**/*.md ignored)
- `package-lock.json` — merged dependency lockfile updates from origin/main
- `.github/workflows/release.yml` — non-conflicting addition (disabled/fallback CI, workflow_dispatch only)
- `scripts/build-mac-pkg.js`, `scripts/build-mac-uninstaller.js`, `scripts/gh-release.js`, `scripts/install.{sh,bat,ps1}`, `scripts/uninstall.{bat,ps1}`, `scripts/pkg-resources/{postinstall,uninstall-preinstall}`, `scripts/package.js` — non-conflicting additions/modifications from origin/main (root-elevating `.pkg` flow, temporarily reintroduced — see Deviations/Threat Flags below)
- `releases/*.pkg`, `*.ccx`, `*-installer.zip`, `*-uninstaller.pkg` (9 files) — added by the merge, then untracked via `git rm --cached` in the follow-up commit (files remain on disk, no longer tracked)

## Decisions Made

- **D-01a: keep-v4** (manifestVersion 4, apiVersion 2, minVersion 22.0.0) — decided via orchestrator/user consultation before execution, not re-opened during execution. Rationale: origin/main's v5 bump existed solely to satisfy Adobe's own Developer Distribution program, but this milestone explicitly excludes Adobe Marketplace/Exchange distribution — so the reason for that bump doesn't apply here. Keeping v4 preserves Photoshop 2022 support. Task 3's build/test run (the bounded risk-check specified in the plan) succeeded cleanly with v4 in place, so no evidence emerged to reopen this decision.
- Kept the `epic/ui-icons` `.gitignore` convention over origin/main's tracked-binaries convention, matching the milestone's stated principle that GitHub Releases (not git) is the canonical file host for release artifacts.
- Untracked `releases/*` via `git rm --cached` rather than `git rm` (working-tree deletion) or a history rewrite — lower-risk option that avoids rewriting shared history while still stopping future tracking.

## Deviations from Plan

None — plan executed exactly as written. Git's automatic 3-way merge resolved all 5 known-conflict files without producing textual conflict markers (each file's changes were non-overlapping at the line level), but the auto-merged content for `manifest.json` and `.gitignore` took origin/main's side wholesale rather than the plan's specified resolution — this was expected and corrected manually per the plan's explicit per-file instructions (Task 2's `<action>` block), not treated as a deviation since the plan anticipated exactly this reconciliation step.

**Important note (not a deviation, called out per plan's own instruction):** This merge temporarily reintroduces the root-elevating `pkgbuild` `.pkg` installer flow (`scripts/build-mac-pkg.js`, `scripts/pkg-resources/postinstall`) and the `$PATH`-trusting `postinstall`/`uninstall-preinstall` scripts into the working tree. This is expected and intentional per the plan's objective — these files are superseded within this same phase by Plans 03-04's unprivileged `.app`-based installer rework. **The branch must NOT be released in this intermediate state.**

## Issues Encountered

None. `npm install` completed cleanly (1 new package, no `package-lock.json` diff from the committed merge state — the lockfile from origin/main was already current). `npm run build` and `npm test` both passed on the first attempt with the D-01a=keep-v4 resolution in place.

## Threat Flags

| Flag | File | Description |
|------|------|--------------|
| threat_flag: elevation-of-privilege (expected, tracked in plan's own threat_model as T-01-01) | `scripts/build-mac-pkg.js`, `scripts/pkg-resources/postinstall` | Root-elevating `.pkg` installer flow reintroduced by this merge; superseded by Plans 03-04 in this same phase, branch not released in this state. |
| threat_flag: tampering (expected, tracked in plan's own threat_model as T-01-02) | `scripts/pkg-resources/postinstall`, `scripts/pkg-resources/uninstall-preinstall` | Bare `$PATH`-trusting command names (PATH hijacking surface); not consumed by any new build path this plan, replaced by absolute-path installer in Plans 03-04. |

Both flags were already anticipated and dispositioned as `mitigate` in the plan's own `<threat_model>` — no new/undocumented surface was introduced beyond what the plan explicitly called out.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `epic/ui-icons` is now a single consolidated branch containing all prior UI-icons work plus origin/main's installer work through v1.6.2, buildable and green.
- Plan 02 (directory restructure: `distribution/photoshop/{macos,windows}` + `release/`) can proceed directly on this merged tree.
- Plans 03-04 (macOS installer rebuild) will replace the temporarily-reintroduced root-elevating `.pkg` flow — this is expected, not a regression to fix in this plan.
- No blockers. D-01a is settled for this phase; the plan's own guidance to revisit it only applies if a later build step fails specifically due to the v4 schema, which did not happen.

---
*Phase: 01-foundation-macos-installer-rework*
*Completed: 2026-07-04*

## Self-Check: PASSED

All modified files (manifest.json, package.json, src/version.ts, webpack.config.js, .gitignore, this SUMMARY.md) confirmed present on disk. All commit hashes (62c3d47, 5d4e618, f62a76a) confirmed present in git log.
