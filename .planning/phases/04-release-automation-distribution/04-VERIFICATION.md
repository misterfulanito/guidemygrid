---
phase: 04-release-automation-distribution
verified: 2026-07-08T19:08:50Z
status: passed
score: 5/5 must-haves verified (2 via accepted, documented deviation override)
behavior_unverified: 0
overrides_applied: 2
overrides:
  - must_have: "Success Criterion 4 (second half): the Gumroad listing's download link points to the current GitHub Release rather than a duplicate hosted binary"
    reason: "Live during execution, Gumroad's product editor no longer exposes a 'Redirect to a URL after purchase' toggle (Content tab is now a unified block editor) — a UI change since 04-RESEARCH.md's investigation. The user was told this tradeoff explicitly and made an informed decision to upload the .ccx directly to Gumroad instead, verified authentic via an exact SHA-256 checksum match against releases/SHA256SUMS.txt. Honestly documented (not silently misrepresented) in 04-03-SUMMARY.md's Deviations section and in REQUIREMENTS.md, where DIST-03 is explicitly marked 'Deviated' (unchecked, strikethrough) rather than complete."
    accepted_by: "misterfulanito (project owner, live decision during Phase 4 Plan 03 execution)"
    accepted_at: "2026-07-08T18:06:09Z"
  - must_have: "Success Criterion 5: GitHub Releases remains the definitive, versioned file host that BOTH the update checker AND the Gumroad listing reference"
    reason: "Same root deviation as above. The update-checker half holds (checkForUpdates() still calls only api.github.com, unchanged and tested) but the Gumroad half does not — Gumroad now hosts its own manually-synced copy of the binary with no automatic sync, a real version-drift risk the original design was meant to prevent. Honestly documented in 04-03-SUMMARY.md and REQUIREMENTS.md (DIST-01 marked 'Complete (caveat)', DIST-03 marked 'Deviated')."
    accepted_by: "misterfulanito (project owner, live decision during Phase 4 Plan 03 execution)"
    accepted_at: "2026-07-08T18:06:09Z"
re_verification: null
gaps: []
deferred: []
open_items_flagged_for_next_phase:
  - item: "Admin-password-prompt behavior on install with requiredPermissions.network declared (D-03 / Research Assumption A2) is genuinely contradicted, not resolved"
    detail: "Phase 1's original A/B test found declaring requiredPermissions.network triggers Creative Cloud Desktop's admin-password prompt. This phase's 04-04 live checkpoint re-tested it on a real macOS install with the credential-caching confound explicitly ruled out by the user, and NO prompt appeared — directly contradicting the original finding. Two live trials now disagree. Does not block any of this phase's 5 success criteria (criteria 1-3 were confirmed working independent of the prompt question), but must not be silently dropped: Phase 5 (Trust & Documentation Polish) must not assert unconditionally that the prompt will or won't appear in user-facing install docs. A controlled re-test (full uninstall, sudo -k, fresh install) is recommended before Phase 5 finalizes install documentation."
    source: "04-04-SUMMARY.md, REQUIREMENTS.md UPD-03 note"
---

# Phase 4: Release Automation & Distribution Verification Report

**Phase Goal:** Releases flow consistently from build to GitHub to Gumroad, and the in-app update checker reliably tells users when a new version is available
**Verified:** 2026-07-08T19:08:50Z
**Status:** passed (with 2 explicitly accepted, documented deviations — not a clean/unconditional pass on Success Criteria 4-5)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (mapped 1:1 to ROADMAP.md Success Criteria)

| # | Truth (ROADMAP Success Criterion) | Status | Evidence |
|---|---------|--------|----------|
| 1 | When a new GitHub Release is published, the in-app update banner detects it and prompts the user — the previously-dead `checkForUpdates()`/`UpdateBanner` code path now actually fires | ✓ VERIFIED | `src/App.tsx:34-42` mounts a `useEffect` calling `checkForUpdates()` and `setUpdateInfo` on a truthy `hasUpdate`; `src/App.tsx:89-91` conditionally renders `<UpdateBanner>`. Static regression guard `App.updateWiring.test.ts` (3 tests, passing) locks the wiring in place. **Live-verified** on real macOS Photoshop install per 04-04-SUMMARY.md: panel showed "New version available: 1.6.2" banner with no console error — the dead code path fired for real, not just in mocks. |
| 2 | The update checker still calls only `api.github.com`, with the existing response validation and domain allowlisting intact | ✓ VERIFIED | `git diff` shows `src/services/updateChecker.ts` was never modified in Plans 01/02 (test-only additions). `ALLOWED_URL`/`isSafeUrl`/`SEMVER_RE`/silent-null-on-catch logic all unchanged (confirmed by direct read). `updateChecker.test.ts` (6 tests, passing) exercises allowlist rejection, semver rejection, non-2xx, network failure, and off-domain-asset fallback. Live-verified: real round-trip to `api.github.com` succeeded with no console error (04-04). |
| 3 | Clicking "update available" still takes the user to a manual browser download — no silent or automatic install is introduced | ✓ VERIFIED | `src/components/shared/UpdateBanner.tsx` is byte-identical/untouched (git diff empty per 04-02-SUMMARY.md); `openRelease()` calls `require('uxp').shell.openExternal(info.downloadUrl)` only. `updateBanner.download.test.ts` (3 tests, passing) asserts `openExternal` present and `writeFile`/`require('fs')` absent. Live-verified: user confirmed clicking Download opened the system browser to the correct GitHub release page (04-04-SUMMARY.md: "it takes me to the Github. It's OK"). |
| 4 | A public Gumroad listing exists as the download page/front-end, **and** its download link points to the current GitHub Release rather than a duplicate hosted binary | ⚠ PASSED (override) — **first half TRUE, second half DEVIATED** | Public free Gumroad listing is live and verified: `https://666551126816.gumroad.com/l/guidemygrid-psd` (confirmed via `gumroad-page-copy.md` line 140 and REQUIREMENTS.md DIST-02 "Complete"). **However**, it does NOT link out to the GitHub Release — Gumroad's current product editor no longer exposes the "Redirect to a URL after purchase" option the original plan depended on. The user was told this explicitly and chose direct `.ccx` upload to Gumroad instead, verified authentic via an exact SHA-256 match (`fa7d5ee6...` matches `releases/SHA256SUMS.txt`). This is an honestly documented deviation (see override entry above), not a silent misrepresentation — `04-03-SUMMARY.md`'s Deviations section and `REQUIREMENTS.md`'s DIST-03 line ("Deviated", unchecked/strikethrough) both surface it plainly. |
| 5 | GitHub Releases remains the definitive, versioned file host that **both** the update checker **and** the Gumroad listing reference | ⚠ PASSED (override) — **update-checker half TRUE, Gumroad half DEVIATED** | `checkForUpdates()` still calls only `api.github.com` (unchanged, tested, live-verified) — this half holds. The Gumroad half does not: Gumroad now hosts its own manually-synced binary copy with no automatic sync, a real drift risk the original design intended to prevent. `REQUIREMENTS.md` records this precisely: DIST-01 "Complete (caveat — see note)", DIST-03 "Deviated". Same root cause and evidence as Truth 4. |

**Score:** 5/5 truths accounted for — 3 cleanly VERIFIED, 2 PASSED via explicit, pre-existing, honestly-documented user override (not silently marked as a clean pass; see Deviations Summary below).

### Deviations Summary (do not read as a clean pass)

Two of five ROADMAP success criteria (4 and 5) are **not fully met as literally worded**. This was a real-time, informed decision by the project owner during Plan 03's execution, not an oversight:

- **What changed:** Gumroad's "Redirect to a URL after purchase" mechanism, which the plan and D-05 depended on, no longer exists in Gumroad's current product editor UI (a platform change since `04-RESEARCH.md`'s investigation, which itself had flagged this as "untested end-to-end by a human"). The user pivoted to uploading the `.ccx` directly to Gumroad, with a pasted SHA-256 checksum for self-verification.
- **What this means going forward:** Gumroad now hosts a second, real copy of the plugin binary requiring **manual re-upload on every future release**. If that manual step is ever skipped, the Gumroad copy will silently drift out of sync with the current GitHub Release (stale version, or worse, a checksum that no longer matches and looks like tampering).
- **Was it honestly disclosed?** Yes. `04-03-SUMMARY.md` contains a full, unflinching "Architectural Deviation" writeup (including the specific T-04-06 threat-model re-rating this invalidates). `REQUIREMENTS.md` marks DIST-03 as `[ ] ~~DIST-03~~ — deviated` (struck through, not checked complete) and DIST-01 as "Complete (caveat)". `gumroad-page-copy.md` Section B carries a dated, explicit note explaining the pivot and the ongoing manual-sync obligation. Nothing here was silently misrepresented as fully working.
- **Recommended follow-up (not built in this phase, correctly deferred):** Add "re-upload .ccx + checksum + version text to Gumroad" as an explicit step in the release checklist/process docs so future releases don't forget it. This is process documentation, appropriately out of scope for a code phase.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `manifest.json` | `requiredPermissions.network.domains` = `["https://api.github.com"]` | ✓ VERIFIED | Confirmed present, single-domain, no wildcard. Version bumped to `2.0.0` (consistent with the ad-hoc v2.0.0 GitHub release cut during this phase — see below). |
| `src/services/updateChecker.ts` | Unchanged, allowlist/semver/silent-null intact | ✓ VERIFIED | Read directly — `ALLOWED_URL`, `isSafeUrl`, `SEMVER_RE`, try/catch-to-null all present and unmodified. |
| `src/App.tsx` | Mount effect calling `checkForUpdates()`, conditional `<UpdateBanner>` render | ✓ VERIFIED | Lines 34-42 (effect), 89-91 (render). No try/catch wrapping the `.then` (per plan's explicit "don't deviate from silent-null convention" instruction). |
| `src/store/uiStore.ts` / `src/types/store.types.ts` | `updateInfo`/`setUpdateInfo`/`dismissUpdate` (flat-replace, not shallow-merge) | ✓ VERIFIED | Confirmed exact flat-replace shape matching `setError` convention. |
| `src/components/shared/UpdateBanner.tsx` | Unchanged, `shell.openExternal` only | ✓ VERIFIED | Byte-for-byte unmodified per both plans' explicit "do not modify" instructions; confirmed by direct read. |
| `src/__tests__/updateChecker.test.ts` | 6+ tests covering allowlist/semver/silent-null/asset-fallback | ✓ VERIFIED | 6 tests present and passing (ran directly: `npx jest updateChecker.test.ts` → 6/6 green). |
| `src/__tests__/manifest-permissions.test.ts` | Regression guard on manifest scope | ✓ VERIFIED | 2 tests present and passing; asserts exact single-domain array, rejects wildcard. |
| `src/__tests__/App.updateWiring.test.ts` | Static wiring guard | ✓ VERIFIED | 3 tests present and passing. |
| `src/__tests__/updateBanner.download.test.ts` | Static UPD-02 guard | ✓ VERIFIED | 3 tests present and passing. |
| `src/__tests__/uiStore.updateInfo.test.ts` | Store lifecycle behavioral test | ✓ VERIFIED | 3 tests present and passing. |
| `gumroad-page-copy.md` | Page copy + setup guide, dated deviation note | ✓ VERIFIED | Exists, both sections present, dated 2026-07-08 deviation note accurately describes the direct-upload pivot and ongoing manual-sync obligation. Live listing URL included. |
| GitHub Release `v2.0.0` | Cut ad-hoc during phase execution to fix a real versioning bug | ✓ VERIFIED | `gh release list` confirms `v2.0.0` is the current "Latest" release (published 2026-07-08T18:39:28Z); all 12 pre-rework releases (`v1.0.0`–`v1.6.2`) are now marked "Pre-release" (GitHub's deprecation mechanism), not deleted — matching the SUMMARY's claim exactly. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `App.tsx` mount `useEffect` | `checkForUpdates()` | direct call, `.then` sets `updateInfo` | ✓ WIRED | Confirmed by read + passing static guard + live verification (04-04). |
| `uiStore.updateInfo` | `<UpdateBanner>` conditional render | `{updateInfo && <UpdateBanner .../>}` | ✓ WIRED | Confirmed line 89-91 of `App.tsx`. |
| `UpdateBanner.openRelease` | `uxp shell.openExternal` | direct require + call | ✓ WIRED | Confirmed live (04-04) — opens real browser, not in-app. |
| `manifest.json requiredPermissions.network` | Creative Cloud Desktop install-time consent | UXP manifest-driven permission declaration | ✓ WIRED (behavior contradictory, not wiring) | The declaration itself is correctly present and functionally effective — the live network call succeeded (banner appeared). Whether it visibly triggers an admin-password prompt is a genuinely unresolved, contradictory finding (see "Open Items Flagged for Next Phase" below) — this does not indicate broken wiring, only an open UX-behavior question. |
| Gumroad listing download link | GitHub Releases (`releases/latest`) | "Redirect to a URL after purchase" | ✗ NOT WIRED (accepted deviation) | Original design not implementable in current Gumroad UI; direct-upload substituted instead, with checksum self-verification. See override entries and Deviations Summary above. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `checkForUpdates()` unit suite passes | `npx jest src/__tests__/updateChecker.test.ts` | 6/6 passed | ✓ PASS |
| Manifest permission regression guard passes | `npx jest src/__tests__/manifest-permissions.test.ts` | 2/2 passed | ✓ PASS |
| App wiring regression guard passes | `npx jest src/__tests__/App.updateWiring.test.ts` | 3/3 passed | ✓ PASS |
| UpdateBanner UPD-02 regression guard passes | `npx jest src/__tests__/updateBanner.download.test.ts` | 3/3 passed | ✓ PASS |
| uiStore lifecycle test passes | `npx jest src/__tests__/uiStore.updateInfo.test.ts` | 3/3 passed | ✓ PASS |
| Full test suite green | `npm test` | 13 suites / 56 tests passed | ✓ PASS |
| GitHub Release `v2.0.0` is current "latest", pre-rework releases marked deprecated | `gh release list` | `v2.0.0` = Latest; `v1.0.0`-`v1.6.2` (12 releases) = Pre-release | ✓ PASS |
| Live end-to-end macOS install + panel-open update check | (human, real Photoshop + CC Desktop) | Banner appeared, no console error, Download opened browser correctly | ✓ PASS (human-performed, documented in 04-04-SUMMARY.md) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| UPD-01 | 04-01 | Preserve allowlisting/response validation, don't regress | ✓ SATISFIED | Code unchanged, tested, live-verified. |
| UPD-02 | 04-02, 04-04 | Preserve manual browser-download flow | ✓ SATISFIED | Banner unchanged, tested, live-verified. |
| UPD-03 | 04-01, 04-02, 04-04 | Reconnect the checker end-to-end | ✓ SATISFIED | Wired, tested, live-verified firing on real install. |
| DIST-01 | 04-01, 04-03 | GitHub Releases remains canonical host / update-checker source of truth | ⚠ SATISFIED WITH CAVEAT | Update-checker half true; Gumroad half compromised by the direct-upload deviation. `REQUIREMENTS.md` itself records "Complete (caveat)" — matches this verifier's independent reading of the code and docs. |
| DIST-02 | 04-03 | Free Gumroad listing as download front-end | ✓ SATISFIED | Live listing confirmed at the URL cited in both `gumroad-page-copy.md` and `REQUIREMENTS.md`. |
| DIST-03 | 04-03 | Gumroad links to GitHub Release, no duplicate binary | ✗ NOT SATISFIED AS SCOPED (documented deviation, accepted via override) | Direct-upload substituted; honestly disclosed, not silently dropped. `REQUIREMENTS.md` marks this "Deviated" (unchecked) — this verifier agrees with that self-assessment rather than upgrading it to "Complete." |

No orphaned requirements — all 6 requirement IDs (UPD-01/02/03, DIST-01/02/03) appear in plan frontmatter and are addressed in REQUIREMENTS.md's Phase 4 rows.

### Anti-Patterns Found

None. Scanned all files modified in this phase (`manifest.json`, `src/App.tsx`, `src/store/uiStore.ts`, `src/types/store.types.ts`, `src/services/updateChecker.ts` [unchanged], `src/components/shared/UpdateBanner.tsx` [unchanged], all 5 new test files) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers — zero matches. No stub returns, no empty handlers, no hardcoded-empty data flowing to render.

### Open Items Flagged for Next Phase (not a gap in this phase, per explicit scope)

**Admin-password-prompt behavior (D-03 / Research Assumption A2) — genuinely contradicted, not resolved.** Phase 1's original A/B test found that declaring `requiredPermissions.network` triggers Creative Cloud Desktop's admin-password prompt on install. This phase's live checkpoint (04-04) re-tested it with the credential-caching confound explicitly ruled out, and the prompt did NOT appear — a clean, second data point that disagrees with the first. This does not block any of the 5 success criteria verified above (criteria 1-3 were confirmed working independent of whether the prompt appears), and `04-04-SUMMARY.md`/`REQUIREMENTS.md` both flag it honestly as unresolved rather than asserting an outcome in either direction. Carrying forward: **Phase 5 must not write install documentation that unconditionally asserts "you will see a password prompt" or "you won't."** A controlled re-test (full uninstall via Manage Plugins, `sudo -k`, fresh install) is recommended before that documentation is finalized.

### Human Verification Required

None required for this verification pass. Both items that need real Photoshop/Creative Cloud Desktop (live install-time consent behavior, live panel-open update check, live Download-button browser-open) were already human-verified during Plan 04's blocking checkpoint, with results documented in `04-04-SUMMARY.md` and cross-checked against the code in this pass. The admin-password-prompt contradiction above is an *already-surfaced open question*, not a pending verification task for this report.

### Gaps Summary

No blocking gaps. Two of five ROADMAP success criteria (4 and 5) are met only partially, via an explicit, informed, user-approved deviation that was honestly and clearly documented throughout the executing session's artifacts (`04-03-SUMMARY.md`, `gumroad-page-copy.md`, `REQUIREMENTS.md`). This verifier independently confirmed:
1. The deviation actually happened as described (Gumroad hosts the `.ccx` directly, not a redirect).
2. It was not silently misrepresented — `REQUIREMENTS.md` marks DIST-03 unchecked/"Deviated" and DIST-01 "Complete (caveat)", not falsely marked fully complete.
3. The checksum-based self-verification claim is corroborated by the pasted value in `gumroad-page-copy.md` matching the SUMMARY's reported live checksum match.

Given the explicit instruction not to fail the phase outright for an honestly-disclosed, user-approved deviation, this report resolves status as `passed` with the deviation surfaced prominently above (via the `overrides` mechanism and the non-optional Deviations Summary section) rather than buried or omitted. A future release-process update should fold "re-upload .ccx + checksum to Gumroad" into the release checklist, per the recommendation already on record in `04-03-SUMMARY.md`.

---

_Verified: 2026-07-08T19:08:50Z_
_Verifier: Claude (gsd-verifier)_
