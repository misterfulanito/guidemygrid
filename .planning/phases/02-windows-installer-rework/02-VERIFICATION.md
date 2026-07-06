---
phase: 02-windows-installer-rework
verified: 2026-07-06T22:20:22Z
status: passed
score: 5/6 must-haves verified
behavior_unverified: 1
overrides_applied: 1
human_verification:
  - test: "Push the current branch (epic/ui-icons, currently 77 commits ahead of origin) to GitHub and observe the 'Windows CCX Verification' Actions run (.github/workflows/windows-ccx-verify.yml) on a real windows-latest runner"
    expected: "The job completes green: `npm run build` and `npm run package:ccx` succeed on Windows, the pwsh step extracts the .ccx via System.IO.Compression.ZipFile, finds no requiredPermissions in manifest.json, and finds none of the five retired script filenames inside the artifact"
    why_human: "This is the rescoped WIN-05 CI job's actual execution on real Windows infrastructure — the only substitute the plan itself designed for the developer having no physical Windows machine (D-06). The workflow file is syntactically valid and correctly wired locally, but GitHub's API confirms it has never registered or run on this repo (only 'Release' is a registered workflow on the default branch), and the local branch has not been pushed. No amount of static/grep inspection can substitute for this — it is precisely the runtime evidence the plan's own <verification> block calls for (\"Observed on push: the Windows CCX Verification workflow runs green on windows-latest\") and which 02-02-SUMMARY.md itself flags as still pending."
    outcome: "Branch pushed 2026-07-06T22:45Z. Run 28828410247 executed on windows-latest and FAILED at the 'Package .ccx' step ('zip' CLI not found on Windows — distribution/photoshop/build-ccx.js:68 shells out to it). Developer reviewed the failure and explicitly deferred the fix (see 02-UAT.md Gaps, .planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md) — accepted as non-blocking because real Windows end users never run build-ccx.js themselves (they only install the prebuilt .ccx via Creative Cloud Desktop). Status advanced to passed on developer override, not because the CI run went green."
---

# Phase 2: Windows Installer Rework Verification Report

**Phase Goal:** A designer can install GuideMyGrid on Windows at user level without any admin/UAC elevation, following the same manifest-based pattern established on macOS — re-interpreted per ROADMAP.md's 2026-07-06 note (Windows shares the identical `.ccx` + Creative Cloud Desktop mechanism as macOS; success criteria #2–#5 are superseded rather than literally satisfied; #6 is rescoped to artifact-regression CI rather than a live install/uninstall run).
**Verified:** 2026-07-06T22:20:22Z
**Status:** passed (developer override — see human_verification outcome above and 02-UAT.md)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Derived from ROADMAP.md's Phase 2 entry (goal + success criteria + the 2026-07-06 re-interpretation note), 02-CONTEXT.md's D-01–D-06 decisions, and the two plans' `must_haves`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | WIN-01 (no-elevation install) is satisfied via the pre-existing cross-platform `.ccx` builder, not a custom installer — `manifest.json` carries no `requiredPermissions` block, and this is locked by an automated regression test | ✓ VERIFIED | `grep -n requiredPermissions manifest.json` → no match; `npx jest installer-retirement` → 7/7 pass; `npm test` → 19/19 pass |
| 2 | The five raw-copy Windows scripts (`install.bat/.ps1/.sh`, `uninstall.bat/.ps1`) are retired (D-03), and `scripts/package.js` has no dangling reference to them (RESEARCH Pitfall 1) | ✓ VERIFIED | `ls distribution/photoshop/windows/` shows only `README.md`; `grep -n -E "install\.(bat|ps1|sh)|uninstall\.(bat|ps1)|windowsScriptsDir|installerFile" scripts/package.js` → no match; `node --check scripts/package.js` → exits 0 |
| 3 | WIN-02/WIN-03/WIN-04 (custom install-time manifest, "Photoshop running" detection, HKCU-registered uninstaller) are correctly realized as superseded — no dead/contradicting custom install or uninstall code was introduced to satisfy them literally | ✓ VERIFIED | No new install/uninstall scripts exist anywhere in `distribution/photoshop/windows/`; REQUIREMENTS.md and 02-CONTEXT.md (D-02, D-05) record the architectural conclusion consistently; `scripts/package.js` only builds/stages the `.ccx` (and macOS's legacy uninstaller, untouched by this phase) |
| 4 | Distribution documentation truthfully states Windows/macOS `.ccx` + Creative Cloud Desktop parity, with no remaining claim that Windows has a separate installer path or no Creative Cloud dependency | ✓ VERIFIED | `distribution/photoshop/windows/README.md` (read in full) states "no longer contains any installer logic," names `build-ccx.js`, confirms parity per D-01; `distribution/README.md` (read in full) states "Windows uses the identical `.ccx` + Creative Cloud Desktop mechanism as macOS (confirmed in Phase 2)" and no longer claims a separate installer path; no "pending rework" / "not yet reworked" text remains in either file |
| 5 | A `windows-latest` GitHub Actions workflow exists that builds, packages, and inspects the `.ccx` for the WIN-01 no-elevation property and D-03's script retirement, using `.NET`'s `ZipFile` (not `Expand-Archive`, RESEARCH Pitfall 2) | ✓ VERIFIED | `.github/workflows/windows-ccx-verify.yml` read in full: named "Windows CCX Verification," `runs-on: windows-latest`, triggers on push (main, epic/ui-icons)/pull_request/workflow_dispatch, no top-level `permissions:` block, steps run checkout→setup-node→`npm ci`→`npm run build`→`npm run package:ccx`→pwsh step using `[System.IO.Compression.ZipFile]::ExtractToDirectory`, asserting no `requiredPermissions` and none of the five retired filenames present |
| 6 | The rescoped WIN-05 CI job has actually been observed running green on a real `windows-latest` runner — the "real Windows environment" substitute the plan and D-06 rely on, since the developer has no physical Windows machine | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Workflow file is present, syntactically valid, and correctly wired to triggers — but `gh api repos/misterfulanito/guidemygrid/actions/workflows` shows only one registered workflow ("Release") on the default branch; `windows-ccx-verify.yml` has never run. `git rev-list --count HEAD ^origin/epic/ui-icons` = 77 (current branch is 77 commits ahead of its remote, unpushed). No push has occurred, so GitHub Actions has never executed this job. This exact gap is self-flagged in 02-02-SUMMARY.md ("has not yet run on GitHub Actions in this session... Phase 3... should confirm it goes green") — present code, unexercised runtime behavior. See Human Verification. |

**Score:** 5/6 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/__tests__/installer-retirement.test.ts` | Cross-platform Jest regression guard for D-03 retirement + WIN-01/D-01 no-elevation property | ✓ VERIFIED | Exists, discovered by Jest, 7/7 assertions pass (retired-file absence x5, package.js text-cleanliness, manifest no-requiredPermissions) |
| `scripts/package.js` | Only builds/stages the `.ccx` (plus optional macOS `-uninstaller.pkg`); no installer-zip step, no retired-file references | ✓ VERIFIED | Read in full — section 2 "Installer zip" and `installerFile`/`copyDir`/`JUNK`/`shouldSkip`/`EXCLUDE`/`distDir` all absent; `node --check` passes |
| `distribution/photoshop/windows/install.bat, install.ps1, install.sh, uninstall.bat, uninstall.ps1` | Deleted (D-03) | ✓ VERIFIED | `ls distribution/photoshop/windows/` shows only `README.md` |
| `distribution/photoshop/windows/README.md` | Rewritten to three-section retirement pattern | ✓ VERIFIED | Read in full — matches macOS retirement template, no "pending rework" framing |
| `distribution/README.md` | Parity claim corrected; unrelated sections untouched | ✓ VERIFIED | Read in full — parity statement present; "What does NOT live here" and `release/`-vs-`releases/` sections intact |
| `.github/workflows/windows-ccx-verify.yml` | First real CI verification job, `windows-latest`, ZipFile extraction, artifact assertions | ✓ VERIFIED (static) | Read in full — matches PLAN's required structure exactly. Execution status: see Truth #6 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/package.js` | `distribution/photoshop/build-ccx.js` | `execSync('npm run package:ccx', ...)` | WIRED | Confirmed present in `scripts/package.js`; this is the load-bearing dependency RESEARCH Pitfall 1 warned about, now clean of the retired-script copy step |
| `installer-retirement.test.ts` | `distribution/photoshop/windows/`, `scripts/package.js`, `manifest.json` | `fs.existsSync` / text-content assertions via `path.resolve` | WIRED | Test passes; confirmed via `npx jest installer-retirement` (7/7) |
| `windows-ccx-verify.yml` | `npm run package:ccx` → built `.ccx` in `releases/` | pwsh extraction + manifest/content assertions | WIRED (statically) — UNEXECUTED (runtime) | YAML correctly references the same `package:ccx` script exercised locally by Plan 01/02's own test runs; actual GitHub Actions execution not yet observed (see Truth #6) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WIN-01 | 02-01 | Replace `.bat` with unelevated installer targeting `%APPDATA%\...` only | ✓ SATISFIED (re-interpreted) | Satisfied via pre-existing `.ccx` + Creative Cloud Desktop mechanism (D-01); no `requiredPermissions`, guarded by regression test |
| WIN-02 | 02-01 | Install-time manifest listing every file/folder created | ✓ SATISFIED (superseded) | D-02: no hook exists for custom manifest writing since CC Desktop owns the install sequence; no contradicting code found |
| WIN-03 | 02-01 | Detect running Photoshop, ask user to quit | ✓ SATISFIED (superseded) | D-02: same rationale as WIN-02; CC Desktop controls the install sequence, not custom code |
| WIN-04 | 02-01 | Uninstaller registers under `HKEY_CURRENT_USER` only | ✓ SATISFIED (superseded) | D-05: no custom uninstaller exists to register anything; CC Desktop's "Manage Plugins" owns uninstall |
| WIN-05 | 02-02 | CI verifies installer/uninstaller on real Windows, confirms no elevation, correct path, clean uninstall | ⚠️ PARTIALLY SATISFIED (rescoped, unexecuted) | Rescoped per D-06/CONTEXT.md to artifact-regression checks (manifest + retired-script absence) run on `windows-latest`; workflow file is correct and complete, but has never actually executed on GitHub Actions (unpushed branch, workflow not registered remotely) |

No orphaned requirements: REQUIREMENTS.md maps only WIN-01 through WIN-05 to Phase 2, and both plans' `requirements:` frontmatter fields collectively cover all five (02-01: WIN-01–04; 02-02: WIN-05).

### Anti-Patterns Found

None. Scanned all phase-modified files (`scripts/package.js`, `src/__tests__/installer-retirement.test.ts`, `distribution/photoshop/windows/README.md`, `distribution/README.md`, `.github/workflows/windows-ccx-verify.yml`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` and stub patterns. Only match was the word "placeholder" in `distribution/README.md` line 19, used in its ordinary English sense ("kept only as a placeholder for any genuinely Windows-specific future need") describing the directory's documented purpose, not a code stub or debt marker — not a finding.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Retired scripts absent + package.js clean + manifest guard | `npx jest installer-retirement` | 7/7 pass | ✓ PASS |
| Full existing suite still green | `npm test` | 19/19 pass (2 suites) | ✓ PASS |
| `scripts/package.js` still parses after edits | `node --check scripts/package.js` | exit 0 | ✓ PASS |
| CI workflow actually executes on real Windows infra | (would require push + GitHub Actions run) | Not run — workflow unregistered on remote, branch 77 commits ahead unpushed | ? SKIP — routed to Human Verification |

### Probe Execution

No probes declared or found under `scripts/*/tests/probe-*.sh`, and neither PLAN nor SUMMARY references any `probe-*.sh` file for this phase. Step 7c: SKIPPED (no probes declared for this phase).

### Human Verification Required

### 1. Windows CCX Verification workflow actually runs green on real Windows infrastructure

**Test:** Push the current branch (`epic/ui-icons`) to GitHub (or open the relevant PR) so `.github/workflows/windows-ccx-verify.yml` registers and runs on a `windows-latest` runner, then check the Actions run result.
**Expected:** The job succeeds — `npm run build`, `npm run package:ccx`, and the pwsh extraction/assertion step all pass, confirming (a) the OS-agnostic `.ccx` build pipeline actually works when executed on real Windows (not just macOS, which is all that's been exercised so far in this milestone), and (b) the manifest carries no `requiredPermissions` and the built artifact contains none of the five retired scripts.
**Why human:** This requires pushing to the remote and observing a live GitHub Actions run — an action and an external-service outcome outside a static verifier's scope. It is not a code defect: the workflow file itself is complete, syntactically valid (confirmed via `js-yaml` per 02-02-SUMMARY.md and structurally re-confirmed here), and correctly targets `windows-latest`. But per `gh api .../actions/workflows`, this workflow has never been registered or run on the repo, and the local branch is 77 commits ahead of its remote counterpart — so zero real-Windows execution evidence exists yet for this milestone. The plan's own `<verification>` block explicitly calls for "Observed on push: the Windows CCX Verification workflow runs green on windows-latest" as a distinct verification step, and 02-02-SUMMARY.md itself documents this as still pending.

### Gaps Summary

No blocking gaps. All code-level artifacts, wiring, tests, and documentation for Phase 2's re-interpreted success criteria are correctly in place and pass every check that can be performed statically (5 of 6 truths fully VERIFIED). The sole open item is that the rescoped WIN-05 CI job — the developer's designed substitute for not having a physical Windows machine — has never actually been executed on GitHub's real Windows infrastructure, because the branch containing it has not yet been pushed to the remote. This is a pending observation the plan and its own SUMMARY explicitly anticipated and flagged for a subsequent push, not a defect in the delivered work. Recommend pushing `epic/ui-icons` (or opening the PR) and confirming the "Windows CCX Verification" run is green before treating WIN-05 as fully closed, since it is currently the only planned mechanism providing any real-Windows evidence for this entire milestone.

---

_Verified: 2026-07-06T22:20:22Z_
_Verifier: Claude (gsd-verifier)_
