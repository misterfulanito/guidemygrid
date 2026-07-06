---
phase: 01-foundation-macos-installer-rework
plan: 04
subsystem: infra
tags: [applescript, osacompile, codesign, create-dmg, macos, installer]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework/01-03
    provides: "install-payload.sh — non-interactive, unprivileged copy+manifest core (MAC-01, MAC-02, MAC-04), interface: install-payload.sh <source_dir> <version> + GMG_INSTALL_BASE/GMG_MANIFEST_PATH env vars"
provides:
  - "distribution/photoshop/macos/installer.applescript — D-02/D-03/D-05 dialogs, MAC-03/D-04 hard Photoshop block, absolute-path-only hand-off to install-payload.sh"
  - "distribution/photoshop/macos/build-installer.js — osacompile + icon (D-06) + ad-hoc codesign + create-dmg build orchestrator, replaces scripts/build-mac-pkg.js"
  - "npm run build:mac-installer — produces releases/GuideMyGrid-v<version>.dmg containing an unprivileged 'Install GuideMyGrid.app'"
affects: [phase-3-uninstaller, phase-5-documentation]

# Tech tracking
tech-stack:
  added: ["create-dmg@8.1.0 (devDependency)"]
  patterns:
    - "AppleScript source with a __VERSION__ placeholder, substituted by the Node build script immediately before osacompile compiles it — keeps the checked-in .applescript file static/reviewable while the compiled .app always carries the real plugin version"
    - "osacompile's default applet.icns is overwritten in place (Contents/Resources/applet.icns) to reuse an existing PNG icon via sips (multi-size iconset) + iconutil, rather than hand-building an Info.plist icon reference"

key-files:
  created:
    - distribution/photoshop/macos/installer.applescript
    - distribution/photoshop/macos/build-installer.js
  modified:
    - package.json
    - package-lock.json
    - scripts/package.js
    - release/github-release.js
  deleted:
    - scripts/build-mac-pkg.js
    - scripts/pkg-resources/postinstall

key-decisions:
  - "installer.applescript's inline comments deliberately avoid the literal phrases 'do shell script' and the tokens pkgbuild/productbuild/sudo — installer-static.test.ts's MAC-01/MAC-04 grep gates scan the whole file, including comments, so even documentary prose mentioning those tokens would fail the static gate"
  - "Version is injected into the AppleScript source via a __VERSION__ placeholder replaced by build-installer.js before osacompile runs, rather than reading package.json at AppleScript runtime (AppleScript has no JSON parsing built in)"
  - "The app's Finder icon is set by overwriting osacompile's default Contents/Resources/applet.icns with an .icns built from icons/icon-96.png via sips (5 base sizes + @2x) + iconutil — no new icon asset designed (D-06)"
  - "create-dmg invoked with --no-version-in-filename so its output name is deterministic (App Name.dmg), then renamed to the project's GuideMyGrid-v<version>.dmg convention — avoids depending on create-dmg's own version-detection from the app bundle's Info.plist"
  - "scripts/package.js's macOS packaging step now calls npm run build:mac-installer; scripts/build-mac-uninstaller.js is left untouched — the legacy pkgbuild-based uninstaller remains root-requiring and manifest-blind until Phase 3's INTEG-01, which is documented technical debt surfaced by the plan itself, not a Phase 1 regression"

patterns-established:
  - "Node build-orchestrator scripts under distribution/photoshop/macos/ resolve repo root via path.resolve(__dirname, '..', '..', '..') (three levels up) rather than the one-level-up convention used by scripts/*.js"

requirements-completed: [MAC-01, MAC-03, MAC-04]

coverage:
  - id: D1
    description: "installer.applescript implements the confirm dialog (D-02/D-03), the hard Photoshop-running block (MAC-03/D-04), and hands off to install-payload.sh via a single absolute-path shell invocation only (MAC-04) — no other shell calls, no pkgbuild/productbuild/sudo tokens anywhere in the file"
    requirement: "MAC-04"
    verification:
      - kind: unit
        ref: "distribution/photoshop/macos/__tests__/installer-static.test.ts#MAC-04: every .applescript \"do shell script\" call uses an absolute path"
        status: pass
      - kind: unit
        ref: "distribution/photoshop/macos/__tests__/installer-static.test.ts#MAC-01: no package-installer or privilege-escalation tokens in installer logic under distribution/photoshop/macos (excluding __tests__)"
        status: pass
      - kind: other
        ref: "osacompile -o test-compile.app distribution/photoshop/macos/installer.applescript (manual syntax-compile check this session)"
        status: pass
    human_judgment: false
  - id: D2
    description: "build-installer.js compiles the .app via osacompile, embeds dist/ and install-payload.sh into Contents/Resources, sets the bundle icon from icons/icon-96.png, ad-hoc signs, and wraps in a DMG via create-dmg --no-code-sign, producing releases/GuideMyGrid-v<version>.dmg"
    requirement: "MAC-01"
    verification:
      - kind: other
        ref: "npm run build:mac-installer (this session) — produced releases/GuideMyGrid-v1.6.2.dmg; hdiutil attach confirmed the mounted app bundle contains Contents/Resources/install-payload.sh, Contents/Resources/plugin/ (icons, index.html, index.js, manifest.json, styles.css matching dist/), and a replaced Contents/Resources/applet.icns"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 20 tests across 3 suites, includes installer-static.test.ts and manifest.test.ts) — all pass after build-installer.js and installer.applescript were added"
        status: pass
    human_judgment: false
  - id: D3
    description: "End-to-end manual install QA on the dev Mac: zero admin/root password prompt at any point (MAC-01), the confirm/success dialogs render correctly with the GuideMyGrid icon (D-02/D-03/D-05/D-06), the hard Photoshop-running block actually stops install against a real running Photoshop and the process-match string is confirmed for the installed Photoshop version (MAC-03/D-04), the manifest lands at the documented path (MAC-02), and the real Gatekeeper dialog wording/flow for this ad-hoc-signed, quarantined app is recorded for Phase 5"
    verification: []
    human_judgment: true
    rationale: "No physical macOS session with a real Photoshop install, a real double-click, or real Gatekeeper quarantine handling is available to this automated executor. This is Plan 04's Task 3 — an explicit blocking checkpoint (gate=\"blocking\") requiring a human to perform the double-click, observe actual OS dialogs, and test the guard against genuinely running Photoshop. It has NOT been performed. This plan is paused at that checkpoint, not complete."

# Metrics
duration: ~25min (Tasks 1-2 only; Task 3 not started)
completed: 2026-07-06
status: blocked
---

# Phase 1 Plan 4: macOS Installer App Wrapper Summary

**Unprivileged osacompile-built "Install GuideMyGrid.app" + DMG that wraps Plan 03's install-payload.sh core with confirm/success dialogs and a hard Photoshop-running block — built and automatically verified, but the phase-gating manual double-click QA (Task 3) has not yet been performed.**

**THIS PLAN IS NOT COMPLETE.** Tasks 1 and 2 (both `type="auto"`) are done and committed. Task 3 is a `type="checkpoint:human-verify" gate="blocking"` manual QA step that requires a human to physically double-click the built app on the dev Mac, observe real macOS dialogs (Gatekeeper, password-prompt absence), and test the Photoshop-running block against a genuinely running Photoshop instance. No automated agent can perform this. See "CHECKPOINT REACHED" in the executor's return message for the full manual QA script and what response is awaited.

## Performance

- **Duration:** ~25 min (Tasks 1-2)
- **Started:** 2026-07-06T15:05:00Z (approx)
- **Completed (Tasks 1-2 only):** 2026-07-06T15:33:00Z
- **Tasks:** 2 of 3 (Task 3 pending human action)
- **Files modified:** 7 (2 created, 4 modified, 2 deleted)

## Accomplishments

- `installer.applescript`: confirm dialog "Install GuideMyGrid?" (D-02/D-03), a hard-block `repeat` loop against `pgrep -i photoshop` that shows "Please quit Photoshop first" until Photoshop is closed (MAC-03/D-04), a single absolute-path `do shell script "/bin/sh " & quoted form of payloadPath & ...` hand-off to Plan 03's `install-payload.sh` (MAC-01/MAC-04), and a success dialog "Installed! Open Photoshop" (D-05)
- `build-installer.js`: substitutes the real plugin version into a `__VERSION__` placeholder before `osacompile` compiles the app, embeds `dist/` at `Contents/Resources/plugin/` and `install-payload.sh` at `Contents/Resources/`, converts `icons/icon-96.png` into a full `.icns` iconset via `sips`+`iconutil` and overwrites `osacompile`'s default `applet.icns` with it (D-06 — reuse only), ad-hoc signs with `codesign --sign -`, and wraps the result in a DMG via `create-dmg --no-code-sign`
- Legacy `.pkg` installer path fully retired: `scripts/build-mac-pkg.js` and `scripts/pkg-resources/postinstall` deleted; `scripts/package.js`'s macOS packaging step now calls `npm run build:mac-installer`; `scripts/build-mac-uninstaller.js` and `scripts/pkg-resources/uninstall-preinstall` deliberately left untouched (Phase 3 debt, per the plan's own scope note)
- `release/github-release.js`'s release-file list now references `releases/GuideMyGrid-v<version>.dmg` instead of the old `.pkg` path
- Verified end-to-end this session: `npm run build:mac-installer` produces `releases/GuideMyGrid-v1.6.2.dmg`; mounting it and inspecting the app bundle confirmed `Contents/Resources/install-payload.sh` and a correctly populated `Contents/Resources/plugin/` (icons, index.html, index.js, manifest.json, styles.css); `installer-static.test.ts` (MAC-04 absolute-path gate, MAC-01 no-elevation-token gate) and the full `npm test` suite (20 tests, 3 suites) pass; `npm run type-check` is clean

## Task Commits

1. **Task 1: Write installer.applescript (dialogs, hard Photoshop block, absolute-path payload call)** - `3541b72` (feat)
2. **Task 2: Write build-installer.js and wire package.json; retire the legacy .pkg build** - `15d6627` (feat), plus a companion commit `ca11109` (feat) that staged `package.json`, `package-lock.json`, `scripts/package.js`, and `release/github-release.js` — these were built as part of Task 2 but a `git add` pathspec-ordering issue (a stale path in the same `git add` invocation caused the whole staging call to fail atomically) kept them out of the first commit; caught and corrected via `git status` before finishing the task.
3. **Task 3: End-to-end manual install QA on the dev Mac (phase gate)** — NOT STARTED. This is a blocking `checkpoint:human-verify` task; see "Next Phase Readiness" below for what's required.

**Plan metadata:** not yet committed — pending Task 3 resolution (this SUMMARY documents work-in-progress, not phase completion).

## Files Created/Modified

- `distribution/photoshop/macos/installer.applescript` - AppleScript source: confirm dialog, Photoshop hard block, absolute-path payload hand-off, success dialog
- `distribution/photoshop/macos/build-installer.js` - Node build orchestrator: osacompile → embed payload/plugin → icon → ad-hoc sign → create-dmg
- `package.json` - added `build:mac-installer` script; `create-dmg` devDependency
- `package-lock.json` - lockfile update from `npm install --save-dev create-dmg`
- `scripts/package.js` - macOS packaging step now calls `npm run build:mac-installer`; `toStage` array now looks for the `.dmg` instead of the old `.pkg`
- `release/github-release.js` - release-file list now references the `.dmg` artifact
- `scripts/build-mac-pkg.js` (deleted) - legacy root-requiring `pkgbuild` installer build, fully superseded
- `scripts/pkg-resources/postinstall` (deleted) - legacy root-running postinstall script, fully superseded

## Decisions Made

- Installer version is injected into the compiled AppleScript via a `__VERSION__` placeholder substituted by the Node build script, not read from `package.json` at AppleScript runtime (AppleScript has no built-in JSON parsing, and reading a companion file would add an extra shell round-trip for no benefit)
- App icon set by overwriting osacompile's default `Contents/Resources/applet.icns` in place — the simplest way to make Info.plist's existing `CFBundleIconFile` reference resolve to the reused GuideMyGrid icon without hand-editing Info.plist
- `create-dmg --no-version-in-filename` used, then the output renamed to the project's own `GuideMyGrid-v<version>.dmg` convention, to avoid depending on create-dmg's own (unverified) version-string detection from an AppleScript-compiled app's Info.plist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the literal phrase "do shell script" and the tokens pkgbuild/productbuild/sudo from installer.applescript's own comments**
- **Found during:** Task 1 (writing installer.applescript)
- **Issue:** The first draft's file-header comments used the literal phrase "`do shell script`" and the words "pkgbuild", "productbuild", and "sudo" to describe what the file does and does not do. `installer-static.test.ts`'s MAC-04 test scans every line containing the substring "do shell script" and requires it to match the absolute-path pattern — a comment merely mentioning the phrase without a following `"/`  path fails that check. Separately, MAC-01's token scan greps the entire file content (not just executable lines) for `pkgbuild`/`productbuild`/`sudo` — using those words even in prose comments trips the gate, exactly as the task's explicit instruction warned ("Do NOT write the tokens ... anywhere in this file (including comments)").
- **Fix:** Reworded the file-header comments to describe the same intent without using the trigger phrase or tokens (e.g., "never invokes any privileged package-installer tooling" instead of naming pkgbuild/productbuild/sudo; "Every shell invocation below begins with an absolute path" instead of naming "do shell script").
- **Files modified:** `distribution/photoshop/macos/installer.applescript`
- **Verification:** `npx jest distribution/photoshop/macos/__tests__/installer-static.test.ts` passes (3/3); `grep -n 'pkgbuild\|productbuild\|sudo'` on the file returns nothing.
- **Committed in:** `3541b72` (Task 1 commit — caught before the initial commit, so no separate fix commit was needed)

**2. [Rule 3 - Blocking] Corrected a `git add` staging failure that silently left four Task 2 files unstaged**
- **Found during:** Task 2 (committing build-installer.js and its supporting file changes)
- **Issue:** A single `git add <path1> <path2> ... <pathN>` invocation included two paths that had already been staged for deletion via an earlier `git rm` (`scripts/build-mac-pkg.js`, `scripts/pkg-resources/postinstall`). `git add` treated those as unmatched pathspecs and aborted the entire invocation, silently leaving `package.json`, `package-lock.json`, `release/github-release.js`, and `scripts/package.js` unstaged — none of them ended up in the first Task 2 commit (`15d6627`) despite being part of the same logical change.
- **Fix:** Verified via `git status --short` immediately after the commit, found the four files still showing as modified-but-unstaged, staged them explicitly, and created a companion commit (`ca11109`) to complete Task 2's file set.
- **Files modified:** none beyond the ones already listed (this was a staging/commit-sequencing fix, not a code fix)
- **Verification:** `git log --oneline` and `git show --stat` on both commits confirm all seven Task 2 files (2 created via commit 1, plus the deletions; 4 modified via commit 2) are present in history; `git status --short` post-commit shows no Task 2 files remaining unstaged.
- **Committed in:** `ca11109`

---

**Total deviations:** 2 auto-fixed (1 bug/false-positive prevention, 1 blocking staging-sequence fix)
**Impact on plan:** Neither changed any installer behavior — the first is a comment-wording fix to satisfy the static security gates that were already correctly scoped; the second is a git bookkeeping correction. No scope creep.

## Issues Encountered

None beyond the two deviations documented above. Both automated verification commands (`npm run build:mac-installer`, `npx jest installer-static.test.ts`) passed on every run this session.

## User Setup Required

None — no external service configuration required. `create-dmg` is an npm devDependency with no dashboard or credentials, as anticipated in the plan's `user_setup` field.

## Next Phase Readiness

**This plan is NOT ready to close.** Task 3 — a blocking `checkpoint:human-verify` — has not been performed. Per its `<how-to-verify>` steps, a human on the physical dev Mac must:

1. Run `npm run build:mac-installer` (already proven to succeed in this session — an equivalent DMG is already sitting at `releases/GuideMyGrid-v1.6.2.dmg`), then simulate download quarantine on the built app (AirDrop to self, or set the `com.apple.quarantine` xattr) so Gatekeeper behaves as it would for a real user.
2. Open the DMG and double-click "Install GuideMyGrid.app". Record the **exact** Gatekeeper dialog wording and whether right-click→Open works or System Settings → Privacy & Security → "Open Anyway" is the only path (informs Phase 5 docs). Confirm the app is labeled "Install GuideMyGrid" (D-03).
3. Confirm the "Install GuideMyGrid?" dialog appears (D-02) and shows the GuideMyGrid icon (D-06).
4. **CRITICAL (MAC-01):** Complete the install and confirm you are **never** prompted for an admin/root password at any point.
5. Confirm plugin files landed under `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/<ver>/Plugin/com.guidemygrid.plugin/` and that `~/Library/Application Support/GuideMyGrid/install-manifest.json` exists and lists them (MAC-02).
6. Confirm the "Installed! Open Photoshop" success dialog appears (D-05).
7. **MAC-03/D-04 hard block:** with Photoshop actually OPEN, run the installer again and confirm it refuses to proceed, showing "Please quit Photoshop first" until Photoshop is quit. Verify `/usr/bin/pgrep -i photoshop` matches the real installed Photoshop process.
8. Open Photoshop and confirm the GuideMyGrid panel loads from the installed files.

Resume signal: type "approved" (with the observed Gatekeeper dialog wording for Phase 5), or describe any password prompt, missing dialog, or failed Photoshop block encountered.

Once Task 3 passes, the plan's STATE.md/ROADMAP.md updates and final metadata commit still need to happen — those were deliberately deferred, not skipped, pending the phase gate.

---
*Phase: 01-foundation-macos-installer-rework*
*Completed: pending Task 3 (Tasks 1-2 completed 2026-07-06)*

## Self-Check: PASSED

- `distribution/photoshop/macos/installer.applescript` — FOUND on disk
- `distribution/photoshop/macos/build-installer.js` — FOUND on disk
- `scripts/build-mac-pkg.js` — MISSING (confirmed deleted, as intended)
- `scripts/pkg-resources/postinstall` — MISSING (confirmed deleted, as intended)
- Commit `3541b72` — FOUND in `git log --oneline --all`
- Commit `15d6627` — FOUND in `git log --oneline --all`
- Commit `ca11109` — FOUND in `git log --oneline --all`
- `releases/GuideMyGrid-v1.6.2.dmg` — FOUND on disk (build artifact, gitignored, not committed — expected)
