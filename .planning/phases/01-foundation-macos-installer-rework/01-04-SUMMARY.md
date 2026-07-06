---
phase: 01-foundation-macos-installer-rework
plan: 04
subsystem: infra
tags: [uxp, ccx, creative-cloud-desktop, packaging, github-releases, manifest-permissions]

# Dependency graph
requires:
  - phase: 01-foundation-macos-installer-rework (Plan 03)
    provides: Corrected manifest.json (host object, portal-issued id 53e308e0, manifestVersion 4); disproven raw-copy installer code retired
provides:
  - distribution/photoshop/build-ccx.js (cross-platform .ccx packaging script, correct zip structure)
  - package:ccx npm script
  - scripts/package.js delegating to package:ccx instead of its own wrong inline zip
  - release/github-release.js no longer referencing the retired .dmg artifact
  - Verified, working end-to-end macOS install path: .ccx -> Creative Cloud Desktop -> Photoshop Plugins menu, zero admin/root prompt
  - manifest.json with requiredPermissions.network removed (root cause of an admin-password prompt found during QA)
affects: [01-foundation-macos-installer-rework (phase gate / verify-work), Phase 4 (UPD-03 — reconnecting the update checker must consciously decide whether to re-add requiredPermissions.network), Phase 5 (docs — CC Desktop dialog wording now recorded below)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ".ccx packaging lives directly under distribution/photoshop/ (not macos/ or windows/) because the mechanism is identical on both platforms"
    - ".ccx zip structure must nest a top-level dist/ folder (dist/manifest.json), not flatten dist/'s contents at the zip root — confirmed by direct inspection of a real shipping competitor's .ccx"
    - "manifest.json's requiredPermissions block is what triggers Creative Cloud Desktop's admin-password prompt on a non-Marketplace .ccx install, not an unconditional property of all such installs — confirmed via live A/B test (with vs. without requiredPermissions.network, full uninstall/reinstall cycle each time)"

key-files:
  created:
    - distribution/photoshop/build-ccx.js
  modified:
    - package.json
    - scripts/package.js
    - release/github-release.js
    - manifest.json
    - .planning/REQUIREMENTS.md
    - .planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md

key-decisions:
  - "build-ccx.js stages dist/ into a temp dir under a dist/ subfolder name before zipping, so the zip's own top-level entry is dist/ — matches the confirmed real-world .ccx structure exactly"
  - "scripts/package.js's old structurally-wrong inline zip (zipped dist/'s contents directly at the zip root) fully replaced by a delegated call to `npm run package:ccx`, not patched in place"
  - "Standard zip deflate compression used (not -Z store) — research found no evidence CC Desktop requires a specific compression method; this held up in the real install QA below, so no follow-up sanity check is needed"
  - "manifest.json's requiredPermissions.network block removed entirely after the live A/B test proved it was the direct cause of the admin-password prompt — safe for now because the update checker it was for isn't wired up yet (Phase 4's UPD-03); re-adding it later is a conscious Phase 4 decision, not a silent default"

patterns-established:
  - "Pattern: any future host-app .ccx packaging (Illustrator, Figma) should reuse distribution/photoshop/build-ccx.js's staging approach rather than re-implementing zip logic per host"
  - "Pattern: before requesting any manifest.json requiredPermissions entry, weigh it against the admin-password prompt it will very likely reintroduce for non-Marketplace .ccx installs"

requirements-completed: [MAC-01, MAC-04]

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
    description: "Double-clicking the built .ccx launches Creative Cloud Desktop and installs the plugin; the plugin appears in Photoshop's Plugins menu and CC Desktop's Manage Plugins registry (shows 'Installed', version 0.1.0), and the panel opens and works (Grid/Margins/Columns/Rows controls, footer reads 'GuideMyGrid v0.1.0')"
    requirement: "MAC-01"
    verification:
      - kind: manual_procedural
        ref: "Task 2 checkpoint:human-verify, performed on the physical dev Mac — user confirmed 'approved' with observed dialog wording recorded below"
        status: pass
    human_judgment: true
    rationale: "The entire install path runs through Adobe's closed-source Creative Cloud Desktop install agent (UPIA), which cannot be exercised or observed by an automated test. Verified by direct human observation on the real dev Mac — see manual QA outcome below."
  - id: D4
    description: "Zero admin/root password prompt on install (MAC-01's core requirement) — root-caused and fixed after the first install attempt DID prompt for the admin password: removing manifest.json's requiredPermissions.network block (declared for the not-yet-wired-up update checker) eliminated the prompt, confirmed via a full uninstall/reinstall A/B cycle"
    requirement: "MAC-01"
    verification:
      - kind: manual_procedural
        ref: "Live A/B test on the dev Mac: install with requiredPermissions.network present (prompted for admin password) vs. removed (zero prompt), full uninstall via Manage Plugins + fresh reinstall between the two — commit d07142d"
        status: pass
    human_judgment: true
    rationale: "Admin-password prompting is controlled entirely by Creative Cloud Desktop's closed-source install agent based on the manifest's declared permissions; only a live install/uninstall cycle on real hardware can confirm the prompt's presence or absence."

# Metrics
duration: 25min
completed: 2026-07-06
status: complete
---

# Phase 1 Plan 04: .ccx packaging pipeline + Creative Cloud Desktop install QA Summary

**Built the corrected `.ccx` packaging pipeline and proved it end-to-end on the real dev Mac — plugin installs via Creative Cloud Desktop with zero admin/root prompt (after removing an admin-triggering `requiredPermissions.network` manifest entry) and actually appears working in Photoshop's Plugins menu for the first time this phase.**

## Performance

- **Duration:** ~25 min (Task 1: ~10 min; Task 2 manual QA + A/B fix cycle: ~15 min)
- **Completed:** 2026-07-06
- **Tasks:** 2 of 2 (Task 1 automated; Task 2 a `checkpoint:human-verify` phase gate, now approved)
- **Files modified:** 7 (1 created: `distribution/photoshop/build-ccx.js`; 6 modified: `package.json`, `scripts/package.js`, `release/github-release.js`, `manifest.json`, `.planning/REQUIREMENTS.md`, `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md`)

## Accomplishments
- `distribution/photoshop/build-ccx.js` created: stages `dist/`'s contents under a `dist/` subfolder name in a temp directory, then zips that staged `dist/` folder (not its contents) into `releases/GuideMyGrid-v<version>.ccx` — verified via `unzip -l` to contain `dist/manifest.json` as a zip entry, not `manifest.json` at the root
- `package:ccx` npm script added, pointing at the new script
- `scripts/package.js`'s previous inline `.ccx` zip logic replaced with a single delegated `execSync('npm run package:ccx', ...)` call
- `release/github-release.js`'s `files` array no longer references the retired `GuideMyGrid-v${version}.dmg` path
- **Real end-to-end install QA performed and passed on the dev Mac**: the `.ccx` was double-clicked in Finder, Creative Cloud Desktop launched, showed its non-Marketplace/third-party-developer warning dialogs, and completed the install. Creative Cloud Desktop's "Manage Plugins" screen shows GuideMyGrid as **"Installed," version 0.1.0**. The panel opens and renders correctly in Photoshop (Grid/Margins/Columns/Rows controls visible, footer reads "GuideMyGrid v0.1.0"). **This is the first time in this phase the plugin was actually observed working end-to-end via Photoshop's real Plugins menu** — the outcome the original Plans 03/04 never reached.
- **Admin-password finding and fix**: the first install attempt prompted for the Mac's administrator password — a direct MAC-01 concern. Investigation found Creative Cloud Desktop's own pre-install warning dialog explicitly states admin password may be required for third-party plugins, and a live A/B test confirmed this is conditional on `manifest.json`'s `requiredPermissions` block, not unconditional for all non-Marketplace installs. The manifest declared `requiredPermissions.network` (for the currently-disconnected update checker, dead code until Phase 4's UPD-03). Removing that block entirely, rebuilding the `.ccx`, and performing a full uninstall (via Manage Plugins) + fresh reinstall resulted in the exact same install flow completing with **zero admin/root password prompt** — confirmed on this pass, with the plugin still installing correctly and the panel still working. Committed separately as `d07142d`.
- `npm test` (12/12 existing unit tests) still passes — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build distribution/photoshop/build-ccx.js and wire it into scripts/package.js and release/github-release.js** - `9b0d6e8` (feat)
2. **Task 2: End-to-end Creative Cloud Desktop install QA (phase gate)** - manual QA performed by the user on the dev Mac; the admin-password finding and its fix are captured in `d07142d` (fix)

**Plan metadata:** this commit (docs: finalize plan after successful install verification)

## Files Created/Modified
- `distribution/photoshop/build-ccx.js` - new Node script; ensures `dist/` exists (builds it if missing), stages it under a `dist/` subfolder name, zips that staged folder into `releases/GuideMyGrid-v<version>.ccx`, cleans up the temp dir
- `package.json` - added `"package:ccx": "node distribution/photoshop/build-ccx.js"` script
- `scripts/package.js` - CCX step now delegates to `npm run package:ccx`; `ccxFile` path constant, pre-run cleanup, and `toStage` array entry all left unchanged per plan instructions
- `release/github-release.js` - removed the dead `GuideMyGrid-v${version}.dmg` line from the `files` array; `.ccx`, `-installer.zip`, and `-uninstaller.pkg` lines left untouched
- `manifest.json` - `requiredPermissions.network` removed after the live A/B test proved it caused the admin-password prompt on install (`d07142d`)
- `.planning/REQUIREMENTS.md` - MAC-01 note updated with the "verified end-to-end, with one nuance" language and the requiredPermissions finding; UPD-03 flagged with the same finding for Phase 4 planning (`d07142d`)
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` - "Second follow-up" addendum added documenting the successful install QA and the admin-password root-cause investigation (`d07142d`)

## Decisions Made
- **Staging via a temp directory (`.tmp-ccx`) rather than an in-place rename trick** — matches the existing `copyDir`-based staging convention already used elsewhere in `scripts/package.js` for the `-installer.zip` step, keeping the codebase's approach to "stage then zip" consistent across both artifacts.
- **`scripts/package.js`'s duplicate `console.log('✅ CCX: ...')` line left in place after the delegated call** — `build-ccx.js` already prints its own success line; the plan didn't ask for this line's removal, and the duplicate output is harmless.
- **`distDir`/`EXCLUDE` variables in `scripts/package.js` left untouched** — still required by the separate `-installer.zip` step (out of this plan's scope per the plan's SCOPE NOTE).
- **`manifest.json`'s `requiredPermissions.network` removed outright, not conditionally gated** — the update checker it was declared for is currently disconnected dead code (Phase 4's UPD-03), so removing it now is harmless; the tradeoff of re-adding it later (and likely reintroducing the admin prompt) is explicitly deferred to Phase 4 planning, not decided here.
- **Standard zip deflate compression (not `-Z store`) confirmed sufficient** — the real install QA succeeded with deflate compression, so no compression-method change or follow-up investigation is needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `manifest.json`'s `requiredPermissions.network` block after it was found to trigger an admin-password prompt on install**
- **Found during:** Task 2 (end-to-end Creative Cloud Desktop install QA)
- **Issue:** The first real install prompted for the Mac's administrator password, directly contradicting MAC-01 ("no admin/root password"). Creative Cloud Desktop's own warning dialog stated this may occur for third-party plugins requesting elevated access.
- **Fix:** Live A/B test — removed `manifest.json`'s `requiredPermissions.network` block, rebuilt `dist/` and the `.ccx`, then had the user fully uninstall the prior install via Creative Cloud Desktop's Manage Plugins and reinstall the new `.ccx` fresh. The exact same install flow (non-Marketplace confirm, third-party-developer warning) completed with zero admin/root password prompt this time; the plugin still installed correctly, still appeared in Manage Plugins, and the panel still opened and worked.
- **Files modified:** `manifest.json`, `.planning/REQUIREMENTS.md` (MAC-01/UPD-03 notes), `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` (Second follow-up addendum)
- **Verification:** Full uninstall/reinstall cycle on the physical dev Mac, observed directly by the user — zero admin/root prompt, install still succeeds, panel still works.
- **Committed in:** `d07142d` (fix)

---

**Total deviations:** 1 auto-fixed (1 bug — a Rule 1 correctness fix directly required to satisfy MAC-01's "zero admin/root prompt" truth)
**Impact on plan:** Necessary correctness fix, not scope creep — without it, MAC-01 would not actually be satisfied despite the .ccx packaging itself being correct. The network permission removed was for dead code (the update checker isn't wired up until Phase 4), so nothing currently functional was lost.

## Issues Encountered

None beyond the deviation above, which was root-caused and resolved within this plan's execution.

## Creative Cloud Desktop Dialog Text (recorded for Phase 5 documentation)

Two distinct dialogs were observed during the install flow. Both should be referenced by Phase 5's DOCS-01/DOCS-02 work when documenting "why this warning appears":

**Dialog 1 — "Install a non-marketplace plugin":**
> "This plugin will only be available locally and will replace any version of the plugin you may already have installed. Only install plugins from trusted developers and sources."

**Dialog 2 — third-party developer / permissions warning:**
> "This plugin has been developed by a third-party developer and you may be asked to enter your administrator password to complete the installation. Be sure to only install plugins from developers you trust, as plugins may [be] able to: Read and write to files on your device / Make and receive network requests / Access any devices present on your computer. Adobe's privacy policy and terms of use are not applicable to this plugin. Please refer to the terms of service provided by this plugin's developer."

## User Setup Required

None further — the one-time manual QA step (Task 2) has been completed and approved. No ongoing manual setup is required for this plan's deliverables.

## Next Phase Readiness

Phase 1 is now fully complete (4/4 plans). Ready for Phase 2 (Windows Installer Rework) planning, with two carried-forward findings to start from:
- **Phase 2 planning note:** REQUIREMENTS.md's WIN-01..03 note already flags that Windows UXP plugins likely face the same PluginsStorage/Creative-Cloud-Desktop-registry architecture this phase disproved for macOS's raw-copy model — re-verify before assuming a `.bat`-based unelevated installer works as literally written.
- **Phase 4 planning note (UPD-03):** re-adding `requiredPermissions.network` to reconnect the update checker will very likely reintroduce the admin-password prompt on install/update. This is a conscious tradeoff Phase 4 must decide on (accept the one-time prompt, find an alternative mechanism, or defer reconnection) — not something to silently reintroduce. Full detail in `01-RESEARCH.md`'s "Second follow-up" addendum.
- **Phase 5 planning note:** both observed Creative Cloud Desktop dialog texts are recorded above, ready to be referenced directly by DOCS-01/DOCS-02.

No blockers remain for Phase 2.

---
*Phase: 01-foundation-macos-installer-rework*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: distribution/photoshop/build-ccx.js
- FOUND: package.json
- FOUND: scripts/package.js
- FOUND: release/github-release.js
- FOUND: manifest.json
- FOUND: .planning/REQUIREMENTS.md
- FOUND commit: 9b0d6e8 (feat(01-04): build distribution/photoshop/build-ccx.js and wire into package/release scripts)
- FOUND commit: d07142d (fix(01-04): remove requiredPermissions.network to avoid admin password prompt)
- CONFIRMED: manifest.json no longer contains a `requiredPermissions` block
