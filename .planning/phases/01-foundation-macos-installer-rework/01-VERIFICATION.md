---
phase: 01-foundation-macos-installer-rework
verified: 2026-07-06T18:56:51Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Phase 1: Foundation & macOS Installer Rework Verification Report

**Phase Goal:** The codebase is synced and reorganized for host-specific packaging, and a designer can install GuideMyGrid on macOS at user level without ever being asked for an admin/root password
**Verified:** 2026-07-06T18:56:51Z
**Status:** passed
**Re-verification:** No — initial verification

**Note on process:** This phase went through a documented mid-execution pivot. Plans 03-04 were originally executed around a raw file-copy `.app`/`.dmg` installer; manual QA on the real dev Mac proved that approach could never make Photoshop list the plugin (Creative Cloud Desktop's install agent, UPIA, is the only thing that populates Photoshop's Plugins panel). Both plans were rewritten and re-executed around a `.ccx` + Creative Cloud Desktop model. This verification checks both the supersession's legitimacy and the final `.ccx` implementation's actual state — not the retired approach.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `epic/ui-icons` contains origin/main's installer work through v1.6.2, merged with no unresolved conflicts | ✓ VERIFIED | `git log --oneline` shows `62c3d47` (merge commit) and origin/main's `271fa88 chore: release v1.6.2` on current branch history; `git tag` includes v1.6.0/v1.6.1/v1.6.2; working tree is clean |
| 2 | Merged branch builds and passes tests | ✓ VERIFIED | Ran `npm run build` (webpack 5.105.4 compiled successfully) and `npm test` (12/12 passing) directly — both green on the current tree |
| 3 | `distribution/photoshop/{macos,windows}/` and `release/` directory split exists (FOUND-02) | ✓ VERIFIED | `distribution/README.md`, `distribution/photoshop/{macos,windows}/README.md` all present; `release/version.js`, `release/github-release.js` exist with correct disambiguation-comment header; Windows scripts (`install.{sh,bat,ps1}`, `uninstall.{bat,ps1}`) present under `distribution/photoshop/windows/` |
| 4 | `release/version.js` still runs as prebuild hook and syncs version into manifest.json + src/version.ts | ✓ VERIFIED | `package.json`'s `prebuild` → `node release/version.js`; ran it directly — it correctly reads package.json's version and writes manifest.json + src/version.ts |
| 5 | manifest.json's `host` is a bare object (not an array), and `id` is the portal-issued value, not `com.guidemygrid.plugin` | ✓ VERIFIED | Read `manifest.json` directly: `"host": {"app":"PS","minVersion":"22.0.0","apiVersion":2}` (object) and `"id": "53e308e0"` (opaque hex, portal-issued per SUMMARY 01-03) |
| 6 | No file under `distribution/photoshop/macos/` still implements the disproven raw-copy/native-dialog installer | ✓ VERIFIED | `distribution/photoshop/macos/` contains only `README.md` (plus one leftover empty `__tests__/` directory, no files inside it); `install-payload.sh`, `installer.applescript`, `build-installer.js`, and both retired test files confirmed absent; `create-dmg` and `build:mac-installer` confirmed absent from package.json/package-lock.json |
| 7 | MAC-02/MAC-03 supersession is real and justified, not an excuse to skip requirements | ✓ VERIFIED | `01-RESEARCH.md`'s CRITICAL ADDENDUM + two follow-ups document HIGH-confidence, multiply-corroborated evidence (official Adobe docs, direct empirical testing on the real dev Mac showing an empty CC Desktop "Manage Plugins" registry and a silently-reverted manually-edited manifest, and inspection of a real shipping competitor's `.ccx`, GuideGuide). `01-CONTEXT.md` records D-02/D-03/D-04/D-05 as explicitly superseded with rationale, while D-01/D-01a/D-06 are explicitly noted as unaffected. `REQUIREMENTS.md` mirrors the same supersession language for MAC-02/MAC-03. This is a well-evidenced technical finding, not a scope-reduction excuse |
| 8 | A designer can install GuideMyGrid on macOS at user level with zero admin/root password prompt (MAC-01), and the fix for an admin-password trigger (`requiredPermissions.network`) is actually reflected in the current manifest, not just claimed | ✓ VERIFIED | Real, human-performed end-to-end QA on the physical dev Mac (`checkpoint:human-verify` gate in 01-04-PLAN.md, approved — recorded in 01-04-SUMMARY.md with observed CC Desktop dialog text, "Installed" status in Manage Plugins, and a working panel). Cross-checked against the actual codebase: `manifest.json` currently has **no `requiredPermissions` block at all** (confirmed by direct read) — matching the claimed fix exactly, not merely asserted in the SUMMARY. Also independently rebuilt the `.ccx` (`node distribution/photoshop/build-ccx.js`) and confirmed via `unzip -l` that it nests `dist/manifest.json` correctly (not `manifest.json` at the zip root) |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `manifest.json` | Object-shaped `host`, portal-issued `id`, `manifestVersion` 4, no `requiredPermissions` | ✓ VERIFIED | Confirmed by direct read — all fields match |
| `distribution/photoshop/build-ccx.js` | Zips `dist/` into `releases/GuideMyGrid-v<version>.ccx` with a top-level `dist/` folder | ✓ VERIFIED | Read the script; independently executed it — produced a `.ccx` whose zip listing shows `dist/manifest.json`, `dist/index.html`, etc. (9 entries, all nested under `dist/`) |
| `release/version.js` (renamed from `scripts/sync-version.js`) | Header updated, disambiguation comment present, logic unchanged | ✓ VERIFIED | Present, correct header, ran successfully |
| `release/github-release.js` (renamed from `scripts/gh-release.js`) | No `.dmg` reference; `.ccx`/`-installer.zip`/`-uninstaller.pkg` retained | ✓ VERIFIED | Read file — `files` array has no `.dmg` entry |
| `distribution/README.md`, `distribution/photoshop/macos/README.md`, `distribution/photoshop/windows/README.md` | Describe the split intent and the actual `.ccx`/CC-Desktop mechanism (not the retired `.app`/`.dmg`) | ✓ VERIFIED | Read all three — macos/README.md explicitly documents the retirement and points at `build-ccx.js`; windows/README.md untouched Phase-2 boundary intact |
| `distribution/photoshop/windows/{install.bat,install.ps1,install.sh,uninstall.bat,uninstall.ps1}` | Relocated unmodified from `scripts/` | ✓ VERIFIED | All 5 files present at expected path |
| Deleted: `install-payload.sh`, `installer.applescript`, `build-installer.js`, `__tests__/manifest.test.ts`, `__tests__/installer-static.test.ts`, `tsconfig.jest.json` | Must not exist | ✓ VERIFIED | Confirmed absent via `test ! -e` for each path |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `package.json` `prebuild` | `release/version.js` | npm script | ✓ WIRED | `"prebuild": "node release/version.js"` confirmed; ran it, `src/version.ts`/`manifest.json` version updated correctly |
| `package.json` `publish:*` | `release/github-release.js` | npm script | ✓ WIRED | All three `publish:patch/minor/major` scripts confirmed pointing at `release/github-release.js` |
| `scripts/package.js` CCX step | `distribution/photoshop/build-ccx.js` | `npm run package:ccx` delegation | ✓ WIRED | Old inline `zip -r "${ccxFile}" .` logic replaced with `execSync('npm run package:ccx', ...)`; confirmed no stale inline zip pattern remains |
| `manifest.json`'s corrected `id`/`host` | `distribution/photoshop/build-ccx.js`'s packaged output | staged into `.ccx` | ✓ WIRED | Rebuilt `.ccx` independently and confirmed `dist/manifest.json` inside it reflects the corrected id/host |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build succeeds | `npm run build` | webpack 5.105.4 compiled successfully | ✓ PASS |
| Tests pass | `npm test` | 12/12 tests passing | ✓ PASS |
| `.ccx` packaging produces correct zip structure | `node distribution/photoshop/build-ccx.js && unzip -l releases/GuideMyGrid-v0.1.0.ccx` | `dist/manifest.json`, `dist/index.html`, `dist/styles.css`, `dist/index.js`, `dist/icons/*` all nested under top-level `dist/` — 9 entries | ✓ PASS |
| Real macOS install (double-click → CC Desktop → Plugins menu → panel) | manual, `checkpoint:human-verify` in 01-04-PLAN.md | Approved by user during phase execution; CC Desktop "Manage Plugins" showed "Installed" v0.1.0; panel opened and rendered Grid/Margins/Columns/Rows controls; zero admin/root prompt after `requiredPermissions.network` removal | ✓ PASS (human-verified, already completed during execution — not a pending item) |

Full workspace test suite was run once (`npm test`); build run once (`npm run build`); `.ccx` build script run once directly — no repeated re-runs.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|------------|--------------|--------|----------|
| FOUND-01 | 01-01 | Merge origin/main's installer work into current branch | ✓ SATISFIED | Merge commit `62c3d47` present; v1.6.2 tag/commit on branch history; clean tree; build/test green |
| FOUND-02 | 01-02 | `distribution/photoshop/{macos,windows}` + `release/` split | ✓ SATISFIED | Directory structure, relocated scripts, and READMEs all confirmed present and wired |
| MAC-01 | 01-03, 01-04 | Replace root-requiring `.pkg` installer with user-level install | ✓ SATISFIED (via documented supersession + real QA) | `.ccx`/CC-Desktop mechanism confirmed working end-to-end on the real dev Mac with zero admin/root prompt after the `requiredPermissions.network` fix, which is reflected in the current manifest.json |
| MAC-02 | 01-03 | Installer writes install-time manifest | ✓ SATISFIED (superseded, legitimately) | CC Desktop owns its own install/uninstall registry for `.ccx`-distributed plugins; no install code remains to attach a custom manifest to; flagged for Phase 3 (INTEG-01) reconsideration in REQUIREMENTS.md |
| MAC-03 | 01-03 | Hard block if Photoshop is running during install | ✓ SATISFIED (superseded, legitimately) | CC Desktop controls the entire install sequence; no hook exists for our code to intercept it; no real-world precedent (GuideGuide) enforces this either |
| MAC-04 | 01-03 | Installer scripts use absolute paths, never trust `$PATH` | ✓ SATISFIED (n/a to new mechanism) | No shell execution remains in the install path itself (`build-ccx.js` only invokes `zip`/`npm run build` via `execSync`, matching the existing project convention used elsewhere); REQUIREMENTS.md documents this as "n/a to the .ccx packaging script itself... preserved as a general good-practice note" |

No orphaned requirements: the traceability table in REQUIREMENTS.md lists exactly FOUND-01, FOUND-02, MAC-01, MAC-02, MAC-03, MAC-04 for Phase 1, matching what the four plans declared.

### Anti-Patterns Found

None. Grepped all phase-modified files (`manifest.json`, `package.json`, `distribution/photoshop/build-ccx.js`, `scripts/package.js`, `release/version.js`, `release/github-release.js`, all three READMEs) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"coming soon"/"not yet implemented" — zero matches.

One minor, non-blocking cosmetic note: `distribution/photoshop/macos/__tests__/` is now an empty directory (git doesn't track empty dirs, so this isn't in version control, but it exists on the local filesystem as a leftover from the deleted test files). Not a gap — no files remain inside it, and it will be naturally reused or ignored by Phase 2/3 work.

### Human Verification Required

None. The one truth that would normally require human verification (real-world install behavior through Adobe's closed-source install agent) was already exercised as a `checkpoint:human-verify` phase gate during execution (01-04-PLAN.md Task 2), approved by the user, with concrete evidence recorded (observed CC Desktop dialog text, "Installed" status in Manage Plugins, working panel). This verification pass cross-checked that evidence against the current codebase state (manifest.json's `requiredPermissions` removal) and found it consistent — no further human action needed to close this phase.

### Gaps Summary

No gaps. All 6 requirement IDs (FOUND-01, FOUND-02, MAC-01, MAC-02, MAC-03, MAC-04) are accounted for and satisfied — either through direct implementation (FOUND-01, FOUND-02, MAC-01) or through a well-evidenced, explicitly-recorded supersession (MAC-02, MAC-03) that is not a scope-reduction excuse but a genuine architectural finding (Creative Cloud Desktop owns the entire `.ccx` install sequence, leaving no hook for custom install-manifest tracking or a Photoshop-running block). The admin-password root cause (`requiredPermissions.network`) was found, fixed, and the fix is verifiably present in the current `manifest.json` — not just claimed in a SUMMARY. Build, tests, and an independently-reproduced `.ccx` packaging run all pass on the current tree.

---

*Verified: 2026-07-06T18:56:51Z*
*Verifier: Claude (gsd-verifier)*
