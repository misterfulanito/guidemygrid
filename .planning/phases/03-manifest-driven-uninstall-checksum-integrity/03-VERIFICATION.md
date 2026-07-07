---
phase: 03-manifest-driven-uninstall-checksum-integrity
verified: 2026-07-07T18:20:00Z
status: passed
score: 13/13 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 10/11
  gaps_closed:
    - "macOS build-artifact regression check (INTEG-03) now has a live green GitHub Actions run — verified: 'OK: manifest.json has no requiredPermissions block' and 'OK: no retired installer/uninstaller scripts found in the .ccx' both printed by the real macos-latest runner, not just traced statically"
    - "UAT-reported document-detection regression (GAP-03-DOC-DETECT, surfaced during Test 2 of 03-UAT.md) fixed via 03-05: getActiveDocument() no longer nulls out document presence when the selection check fails on initial mount"
  gaps_remaining: []
  regressions: []
---

# Phase 3: Manifest-Driven Uninstall & Checksum Integrity Verification Report

**Phase Goal:** Rework install/uninstall trust story — retire the last vestige of custom macOS uninstall code (INTEG-01), publish verifiable SHA256 checksums for release artifacts (INTEG-02), add a macOS build-artifact regression guard mirroring the existing Windows one (INTEG-03), and complete a security review of everything that runs during packaging/publishing/CI, locked in as both a regression test and written summary (INTEG-04). A gap-closure plan (03-05) additionally fixes a UAT-discovered document-detection regression (GAP-03-DOC-DETECT).

**Verified:** 2026-07-07T18:20:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (prior verification was `human_needed`, 10/11, pending a live macOS CI run and the UAT-reported document-detection bug)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The root-requiring legacy `.pkg` uninstaller no longer exists in the repo (INTEG-01) | ✓ VERIFIED | `scripts/build-mac-uninstaller.js` and `scripts/pkg-resources/uninstall-preinstall` confirmed absent on disk; `pkg-resources/` directory itself no longer exists |
| 2 | README documents Creative Cloud Desktop's Manage Plugins panel as the uninstall mechanism, with no separate uninstaller app (INTEG-01, D-03) | ✓ VERIFIED | `README.md:79-88` — `## Uninstalling` section names "Manage Plugins", states no separate uninstaller app; no mention of manifest/script/admin |
| 3 | The retired uninstaller cannot silently reappear — a regression test guards it (INTEG-01, D-11) | ✓ VERIFIED | `src/__tests__/macos-installer-retirement.test.ts` exists, ran green as part of full suite (31/31 pass) |
| 4 | `scripts/package.js` no longer invokes or stages the legacy macOS uninstaller | ✓ VERIFIED | Read `scripts/package.js` in full — no darwin-gated `execSync`, no `uninstallerFile` variable; `grep -rn "build-mac-uninstaller\|pkgbuild\|install-location"` across `scripts/ release/ distribution/ .github/` returns nothing |
| 5 | Every published release has a `SHA256SUMS.txt` generated automatically alongside the `.ccx`, with no manual step (INTEG-02) | ✓ VERIFIED | `release/checksums.js` exports `hashFile`/`formatChecksumLine`, wired via `execSync('node release/checksums.js', ...)` in `scripts/package.js`; behaviorally confirmed by prior `npm run package` + `shasum -a 256 -c` run (`OK`) |
| 6 | A non-technical user can copy-paste one command per OS to verify a downloaded release's integrity (INTEG-02, D-08) | ✓ VERIFIED | `VERIFY.md` — plain-language numbered steps for macOS (`shasum -a 256 -c`), Windows primary (`certutil -hashfile`) and alternative (`Get-FileHash`); honest integrity-not-authenticity framing; `README.md:70` links to it |
| 7 | `release/github-release.js` includes `SHA256SUMS.txt` in the GitHub Release upload file list | ✓ VERIFIED | `release/github-release.js:21-24` — `files` array lists exactly the `.ccx` and `SHA256SUMS.txt`, existence-filtered; no retired artifact entries remain |
| 8 | macOS has a build-artifact regression check with coverage parity to the existing Windows job (INTEG-03) | ✓ VERIFIED | `.github/workflows/macos-ccx-verify.yml` exists and now has a **live green run**: `gh run list --workflow=macos-ccx-verify.yml` shows run `28881074839` (`verify-macos-ccx`, push, epic/ui-icons) completed **success** in 1m46s |
| 9 | A built `.ccx` that declares `requiredPermissions` or contains a retired installer/uninstaller script fails CI before it can ship | ✓ VERIFIED | Pulled the live job log (`gh run view --job=85669136684 --log`) for the "Extract .ccx and validate contents" step — it printed `OK: manifest.json has no requiredPermissions block` and `OK: no retired installer/uninstaller scripts found in the .ccx`, i.e. the assertion logic actually executed against a real built `.ccx` on `macos-latest` and passed, not just traced statically |
| 10 | A written security review confirms all remaining release/build scripts (D-13) and CI workflows (D-14) were checked for PATH/env-trust issues, with differentiated severity, and concludes INTEG-04 is satisfied | ✓ VERIFIED | `03-SECURITY-REVIEW.md` covers all 5 scripts and all 3 workflows with runner/privilege/finding/severity/disposition per row; ends with explicit "INTEG-04 is satisfied" |
| 11 | The highest-value, lowest-cost hardening (a zip-availability preflight in `build-ccx.js`) is in place and regression-guarded, and `release.yml` no longer references retired artifacts | ✓ VERIFIED | `distribution/photoshop/build-ccx.js:68-76` — `command -v zip` preflight; `.github/workflows/release.yml` `files:` list contains only `releases/GuideMyGrid-v*.ccx`; `src/__tests__/release-script-safety.test.ts` passes (2/2) |
| 12 | The panel reports an open document as present immediately on mount, even before UXP grants modal scope — a failed selection check no longer nulls out document presence (GAP-03-DOC-DETECT, fixes UAT Test 2 finding) | ✓ VERIFIED | `src/services/photoshopBridge.ts:14-36` — `getActiveDocument()` wraps `this.hasActiveSelection()` in its own try/catch, defaulting `hasSelection` to `false` and logging via `console.error('[GMG] ...')` rather than letting the rejection bubble up and null the document. Behavioral test run directly: `npx jest photoshopBridge.getActiveDocument` — 3/3 pass, including the resilience case that mocks `getSelectionBounds()` rejecting and asserts a non-null `DocumentInfo` with `hasSelection:false` is still returned |
| 13 | A Jest regression test locks in the document-detection resilience so this bug cannot silently return | ✓ VERIFIED | `src/__tests__/photoshopBridge.getActiveDocument.test.ts` — 3 cases (reject → resilient, resolve → hasSelection:true, no-document → null), all pass; part of full suite run (31/31 total) |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/__tests__/macos-installer-retirement.test.ts` | Jest regression guard for retired macOS uninstaller | ✓ VERIFIED | Exists, passes |
| `README.md` (Uninstalling section) | Documents CC Desktop uninstall path | ✓ VERIFIED | Section present, correct content |
| `release/checksums.js` | Exports `hashFile`/`formatChecksumLine`, generates `SHA256SUMS.txt` | ✓ VERIFIED | Substantive, wired into `package.js` |
| `src/__tests__/checksums.test.ts` | Format/behavior test for checksums.js | ✓ VERIFIED | Exists, passes |
| `VERIFY.md` | Plain-language verification guide | ✓ VERIFIED | Substantive, both-OS coverage, linked from README |
| `.github/workflows/macos-ccx-verify.yml` | macOS build-artifact regression CI job | ✓ VERIFIED (live) | Valid YAML, correct assertions, **live run on GitHub Actions succeeded** (run 28881074839) |
| `src/__tests__/release-script-safety.test.ts` | Regression guard for INTEG-04 remediations | ✓ VERIFIED | Exists, passes (2/2) |
| `.planning/.../03-SECURITY-REVIEW.md` | Written INTEG-04 review | ✓ VERIFIED | Substantive, covers full scope, concludes satisfied |
| `src/services/photoshopBridge.ts` (getActiveDocument hardened) | Selection-check failure isolated, degrades hasSelection only | ✓ VERIFIED | Read in full; try/catch confirmed at lines 18-26 |
| `src/__tests__/photoshopBridge.getActiveDocument.test.ts` | Regression test for GAP-03-DOC-DETECT | ✓ VERIFIED | Exists, 3/3 pass, run directly by this verifier |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/package.js` | `release/checksums.js` | `execSync('node release/checksums.js', ...)` after `.ccx` build | ✓ WIRED | Confirmed by reading file |
| `scripts/package.js` | staging | `toStage = [ccxFile, path.join(outDir, 'SHA256SUMS.txt')]` | ✓ WIRED | Confirmed |
| `release/github-release.js` | GitHub Release upload | `files` array includes `.ccx` + `SHA256SUMS.txt` | ✓ WIRED | Confirmed |
| `README.md` | `VERIFY.md` | Markdown link near download step | ✓ WIRED | Confirmed (`README.md:70`) |
| `.github/workflows/macos-ccx-verify.yml` | `npm run package:ccx` → extract → assert | build-then-inspect pipeline | ✓ WIRED (live-confirmed) | Executed on real `macos-latest` runner, both assertions printed `OK` |
| `distribution/photoshop/build-ccx.js` | `zip` CLI | `command -v zip` preflight before `zip -r` | ✓ WIRED | Confirmed present |
| `useDocument.ts` refresh() | `getActiveDocument()` | Consumes hardened return value | ✓ WIRED | `getActiveDocument()` now resolves instead of rejecting on selection-check failure, so `refresh()`'s catch no longer nulls `document` for this failure mode — confirmed by reading both files and the passing regression test |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full Jest suite (all phase-relevant tests, including gap-closure) | `npx jest` | 6 suites, 31 tests, all pass | ✓ PASS |
| Gap-closure regression test in isolation | `npx jest photoshopBridge.getActiveDocument --runInBand` | 3/3 pass (including the intentionally-RED-then-fixed resilience case) | ✓ PASS |
| Type-check | `npx tsc --noEmit` | Clean, no errors | ✓ PASS |
| No debt markers in newly touched files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` on `photoshopBridge.ts` + new test file | No matches | ✓ PASS |
| macOS CI job — live execution (previously unexercised) | `gh run list --workflow=macos-ccx-verify.yml` + `gh run view --job=... --log` | Run `28881074839`: success; log shows both `OK:` assertion lines actually printed | ✓ PASS |
| Windows CI job — status check (not a phase 3 deliverable) | `gh run list --workflow=windows-ccx-verify.yml` | Still fails at "Package .ccx" step — pre-existing `zip` CLI absence on `windows-latest`, tracked as deferred WIN-05 in REQUIREMENTS.md; unrelated to Phase 3's changes | ℹ️ INFO (out of scope, pre-existing, already deferred) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or explicit probe declarations found in this phase's PLAN/SUMMARY files. Step 7c: SKIPPED (no probes declared or discovered).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| INTEG-01 | 03-01 | Uninstaller (both platforms) consumes install-time manifest and removes exactly those paths | ✓ SATISFIED | Rescoped per D-01/D-02 (CC Desktop owns install/uninstall) — satisfied by deletion + doc + regression test, consistent with REQUIREMENTS.md's own superseded note on MAC-02 |
| INTEG-02 | 03-02 | Published SHA256 checksum for every release artifact, plain-language verification steps | ✓ SATISFIED | `release/checksums.js` + `VERIFY.md`, behaviorally confirmed |
| INTEG-03 | 03-03 | Automated install→uninstall filesystem-diff regression check added to release process | ✓ SATISFIED | Rescoped per D-09 to a build-artifact regression check; **now live-CI confirmed**, not just statically correct |
| INTEG-04 | 03-04 | Security review of installer/uninstaller scripts for env/PATH trust issues | ✓ SATISFIED | `03-SECURITY-REVIEW.md` + regression test |
| GAP-03-DOC-DETECT | 03-05 | Fix UAT-reported document-detection regression (panel inert until a selection is made) | ✓ SATISFIED | `getActiveDocument()` hardened, regression test passes; this is a gap-closure requirement (not part of original v1 REQUIREMENTS.md scope, tracked via ROADMAP.md line 109 and the 03-05 plan's own frontmatter — expected pattern for UAT-discovered fixes, not an orphan) |

No orphaned requirements: REQUIREMENTS.md maps exactly INTEG-01..04 to Phase 3, and all four appear in the plans' `requirements` frontmatter fields, all marked "Complete" in the traceability table. GAP-03-DOC-DETECT is additionally tracked in ROADMAP.md and 03-05-PLAN.md/SUMMARY.md frontmatter, consistent with the project's gap-closure convention (UAT-sourced requirements aren't retrofitted into the original milestone's REQUIREMENTS.md list).

### Anti-Patterns Found

None. All phase-touched files (`scripts/package.js`, `release/checksums.js`, `release/github-release.js`, `distribution/photoshop/build-ccx.js`, `.github/workflows/macos-ccx-verify.yml`, `.github/workflows/release.yml`, `VERIFY.md`, `README.md`, `src/services/photoshopBridge.ts`, and the four test files) scanned for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches.

### Human Verification Required

None. The two items that previously required human verification are now resolved with direct evidence:

- **macOS CI live run**: previously unexercised (branch unpushed); now confirmed via `gh run list`/`gh run view --log` — the job ran on a real `macos-latest` runner and both assertions passed.
- **Document-detection UAT gap**: previously an open UAT finding (severity: major); now fixed by 03-05 with a passing regression test that reproduces the exact failure mode (mocked `getSelectionBounds()` rejection) and proves it no longer nulls document presence. Live in-Photoshop re-confirmation was deferred to UAT re-test per 03-05-PLAN.md's own verification section (D4 in 03-05-SUMMARY.md, `human_judgment: true`) — this is a reasonable deferral for a UXP-host-only behavior that cannot be driven from a Jest/Node environment, and the unit-level fix is directly verifiable and was verified.

The Windows CI failure (`windows-ccx-verify.yml`, "Package .ccx" step) remains failing on this branch, but this is the pre-existing, already-documented WIN-05 issue (`zip` CLI absent on `windows-latest`), explicitly marked deferred in REQUIREMENTS.md and confirmed via `git log` to predate all `03-*` commits. It is not a Phase 3 deliverable and does not block this phase's goal.

### Gaps Summary

No gaps. Both items that kept the prior verification at `human_needed` are now closed with direct evidence:

1. INTEG-03's macOS CI guard has a live, successful GitHub Actions run (`28881074839`) with both assertion lines (`OK: manifest.json has no requiredPermissions block`, `OK: no retired installer/uninstaller scripts found in the .ccx`) confirmed present in the real job log — no longer "present and wired, unexercised," now behaviorally proven.
2. The UAT-reported document-detection regression (major severity, blocking the panel until a dummy selection was made) is fixed via `03-05`, confined exactly to `getActiveDocument()` as scoped, with a regression test that reproduces the original failure mode and passes. Full suite (31/31) and type-check both clean.

Phase goal achieved: the legacy macOS uninstaller is retired and guarded, checksums are generated and independently verifiable, the macOS CI regression guard runs and passes for real, the security review is complete and conclusive, and the UAT-surfaced usability regression is fixed and locked in.

---

*Verified: 2026-07-07T18:20:00Z*
*Verifier: Claude (gsd-verifier)*
