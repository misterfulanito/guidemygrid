---
phase: 02
slug: windows-installer-rework
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest (existing, `package.json`'s inline `jest` config) |
| **Config file** | none — `jest` key inline in `package.json` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` (single small suite; no separate "full" tier exists yet) |
| **Estimated runtime** | not yet measured — existing suite is small; this phase adds one new test file |

**Gap this phase must address:** No CI test job exists yet in this repository — the only workflow (`.github/workflows/release.yml`) is a disabled, `workflow_dispatch`-only publish fallback, not a test job. This phase's `windows-latest` GitHub Actions job is the first real automated CI verification job in the repo, and it validates the built `.ccx` artifact (not live installer behavior, which Creative Cloud Desktop can't expose headlessly).

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` (same command; no separate CI-only suite distinct from unit tests) — plus confirm `windows-ccx-verify.yml` triggers correctly on push/PR once added
- **Before `/gsd-verify-work`:** `npm test` green, plus the new `windows-ccx-verify.yml` workflow green on the phase's final commit
- **Max feedback latency:** not measured — existing suite runs in low single-digit seconds; treat any regression toward slow/watch-mode as a red flag

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | WIN-01 | — | Built `.ccx`'s `manifest.json` has no `requiredPermissions` block (no-elevation guarantee) | unit (static) + CI | `npx jest installer-retirement` / `windows-ccx-verify.yml` CI job | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | WIN-05 (rescoped) | — | `.ccx` unpacks as a valid zip with expected `dist/` structure on a real Windows runner; retired scripts absent from built artifact | CI (artifact-level) | `.github/workflows/windows-ccx-verify.yml` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | (regression) | — | Retired script files do not reappear in `distribution/photoshop/windows/` | unit (static) | `npx jest installer-retirement` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | (regression) | — | `scripts/package.js` no longer references any of the 5 deleted files | unit (static) | `npx jest installer-retirement` | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | TBD | WIN-02 / WIN-03 / WIN-04 | — | N/A — superseded per D-02/D-05; no custom install/uninstall code exists to test | n/a (superseded) | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task ID / Plan / Wave columns are TBD until the planner assigns tasks — update once PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] `src/__tests__/installer-retirement.test.ts` — retired-file-absence + manifest-safety regression guards (optional but recommended; no existing file covers this)
- [ ] `.github/workflows/windows-ccx-verify.yml` — the rescoped WIN-05 CI job (does not exist yet)
- [ ] No shared fixtures/conftest-equivalent needed — self-contained file-existence and JSON-content checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real install/uninstall via Creative Cloud Desktop shows no UAC/elevation prompt, plugin appears in Photoshop, and uninstall removes all files | WIN-01, WIN-05 (real-device portion) | Creative Cloud Desktop requires an interactive GUI + authenticated Adobe login; cannot be scripted headlessly in CI (D-06) | Deferred pre-ship per D-06 — borrow a Windows device, rent a short-lived cloud Windows VM, or ship on Mac-parity evidence and watch early user reports. **Not required for this phase's completion.** |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
