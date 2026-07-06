---
phase: 3
slug: manifest-driven-uninstall-checksum-integrity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.0.0 + ts-jest 29.0.0 (existing, confirmed in `package.json`) |
| **Config file** | Inline in `package.json` (`"jest"` key) — `testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"]` |
| **Quick run command** | `npx jest src/__tests__/macos-installer-retirement.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (existing suite; not independently timed this session) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest src/__tests__/macos-installer-retirement.test.ts` (and any new checksum-format test as it's added)
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green, plus both `windows-ccx-verify.yml` and `macos-ccx-verify.yml` green on the phase's final commit
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

*Plans not yet created — rows below are mapped at requirement level from research. The planner should refine Task ID / Plan / Wave columns when PLAN.md files are written.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | INTEG-01 | — | Legacy macOS uninstaller files absent from repo; `package.js` doesn't reference them | unit (Jest) | `npx jest src/__tests__/macos-installer-retirement.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INTEG-02 | T-3-V6 | `release/checksums.js` produces a correctly-formatted `SHA256SUMS.txt` that `shasum -a 256 -c` accepts | unit (Jest) + manual | Jest: assert two-space format + correct digest for a known fixture; manual: run `shasum -a 256 -c` against a real generated file | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INTEG-03 | — | Built `.ccx` has no `requiredPermissions`, no retired scripts, well-formed `manifest.json`, on both OSes | integration (CI) | `windows-ccx-verify.yml` (exists) / new `macos-ccx-verify.yml` (D-10) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | INTEG-04 | T-3-PATH / T-3-CI | Release/build scripts and CI workflows reviewed for absolute-path/PATH-trust issues | unit (Jest) + manual review doc | Jest: pattern-match `execSync` calls for bare command names; manual: written summary per D-15 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/macos-installer-retirement.test.ts` — covers INTEG-01/D-11 (mirrors existing `installer-retirement.test.ts`)
- [ ] `src/__tests__/checksums.test.ts` (or similar) — covers INTEG-02, asserting `release/checksums.js`'s output format (two-space separator, correct relative filenames, correct digest against a known fixture)
- [ ] `.github/workflows/macos-ccx-verify.yml` — covers INTEG-03/D-10, the macOS half of the build-artifact regression guard
- [ ] A lightweight pattern-based test or manual grep step asserting no *new* bare command names were introduced in `release/checksums.js` itself (INTEG-04/D-15)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `SHA256SUMS.txt` verifies against a real generated release artifact | INTEG-02 | Confirms end-to-end correctness of the actual publish flow, not just unit-tested formatting | Run `npm run publish:patch` (or a dry-run equivalent), then `shasum -a 256 -c SHA256SUMS.txt` against the produced artifacts and confirm OK |
| Security review summary confirms scope checked and rationale for risk level | INTEG-04 | Judgment-based write-up (D-15), not a boolean automatable check | Write short review doc per D-15 covering `build-ccx.js`, `package.js`, `version.js`, `github-release.js`, `checksums.js`, and CI workflow files |
| Real device-level uninstall leaves zero residue | INTEG-01 (deferred, D-12) | Requires an actual macOS/Windows machine; mirrors Phase 2's deferred Windows device-verification precedent | Deferred — revisit before shipping, not before planning (per CONTEXT.md D-12) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
