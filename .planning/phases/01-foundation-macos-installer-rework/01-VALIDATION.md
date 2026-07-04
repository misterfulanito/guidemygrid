---
phase: 01
slug: foundation-macos-installer-rework
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest (existing, config inline in `package.json`) |
| **Config file** | none — `jest` key inline in `package.json` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` (single suite, no split today) |
| **Estimated runtime** | not yet measured — existing suite is small (single unit test file) |

**Gap this phase must address:** The existing Jest setup only covers TypeScript unit logic (`src/__tests__/gridGenerator.sideGuide.test.ts`); it has no precedent for testing shell/AppleScript installer behavior. This phase should NOT introduce a new test framework (e.g., bats-core) for a single phase's shell logic — instead, drive the build script and static-analyze/execute the compiled artifacts from Node's `child_process` inside a Jest test, keeping everything inside the existing Jest runner.

---

## Sampling Rate

- **After every task commit:** Run `npm test`, plus the static/grep checks below for any commit touching `distribution/photoshop/macos/`
- **After every plan wave:** Run full `npm test` + manual install-flow QA on the actual dev Mac (build → ad-hoc sign → DMG → run → observe zero password prompts)
- **Before `/gsd-verify-work`:** Full suite must be green, plus a manual end-to-end install test (double-click DMG → install → confirm zero elevation prompt → confirm manifest file exists → confirm quit-Photoshop block works with real Photoshop)
- **Max feedback latency:** not measured — existing suite runs in low single-digit seconds; treat any regression toward slow/watch-mode as a red flag

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | MAC-04 | — | Installer scripts use only absolute binary paths, no bare `$PATH`-trusting calls | static/grep | `grep -n 'do shell script' distribution/photoshop/macos/installer.applescript \| grep -vE '"/'` (should output nothing), wrapped in a Jest test asserting empty output | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | MAC-02 | — | Installer writes a manifest listing every created path | integration | Jest test: run `build-installer.js` in a sandboxed `$HOME`, execute the compiled `.app`'s copy+manifest routine against a fake `dist/`, assert `install-manifest.json` lists exactly the files copied | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | MAC-01 | — | Installer never elevates / never invokes `sudo`/`pkgbuild`/`installer` | static/grep | `grep -rn 'pkgbuild\|productbuild\|sudo' distribution/photoshop/macos/` (should only match historical comments, never actual build logic) | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | FOUND-01 | — | Merge completes with no unresolved conflicts | manual/CI | `git status` shows clean tree post-merge; `npm run build && npm test` pass | N/A — verified as part of the merge task itself | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task ID / Plan / Wave columns are TBD until the planner assigns tasks — update once PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] `distribution/photoshop/macos/__tests__/installer-static.test.ts` — grep-based static checks for MAC-04 (absolute paths) and MAC-01 (no `pkgbuild`/`sudo`)
- [ ] `distribution/photoshop/macos/__tests__/manifest.test.ts` — integration test for MAC-02 (manifest correctness) against a sandboxed fake `$HOME`
- [ ] No new framework install needed — reuses existing Jest/ts-jest

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Quit-Photoshop guard blocks install while Photoshop is running | MAC-03 | No reliable automated way to launch/quit real Photoshop in CI or a lightweight test | Launch Photoshop, run the installer, confirm it refuses to proceed and shows "Please quit Photoshop first"; quit Photoshop, confirm the installer proceeds |
| Zero-password end-to-end install | MAC-01, MAC-02 | Requires a real macOS session and a real double-click/Gatekeeper flow, not reproducible headlessly | Build → ad-hoc sign → DMG → double-click install on the actual dev Mac → confirm no admin/root password prompt at any point → confirm manifest file exists after install |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (target)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
