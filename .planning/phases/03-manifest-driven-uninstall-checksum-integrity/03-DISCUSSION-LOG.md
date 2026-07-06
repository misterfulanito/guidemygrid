# Phase 3: Manifest-Driven Uninstall & Checksum Integrity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 3-Manifest-Driven Uninstall & Checksum Integrity
**Areas discussed:** Uninstall ownership, Checksum publishing, Install/uninstall regression check, Security review scope

---

## Uninstall ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Retire it | Matches Windows precedent (D-05); legacy pkg contradicts "no root/admin" goal | ✓ |
| Keep it as belt-and-suspenders | Ship alongside CC Desktop's uninstall as optional manual fallback | |

**User's choice:** Retire it
**Notes:** None additional.

| Option | Description | Selected |
|--------|-------------|----------|
| No custom manifest needed | CC Desktop's own registry is sufficient, same conclusion as MAC-02/WIN-02 | ✓ |
| Still track something ourselves | Build a lightweight record anyway for diagnostics | |

**User's choice:** No custom manifest needed

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, document it clearly | Prevents user confusion about how to uninstall | ✓ |
| Not this phase's concern | Leave for Phase 5 (DOCS-02) | |

**User's choice:** Yes, document it clearly

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — worth a small one-time check | Even a handful of orphaned-file users would violate the trust goal | |
| No — out of scope, low download numbers | Mirrors Phase 2's Windows precedent | |
| Not sure — check real numbers first | Pull GitHub download counts before deciding | |
| **(free-text)** User: "No needed it. I was the only user so far" | Confirmed no real end users exist with orphaned pre-`.ccx` installs | ✓ |

**User's choice:** Free-text — "No needed it. I was the only user so far"
**Notes:** Resolved without needing to check actual download data (unlike Phase 2's Windows equivalent), because the user has been the only installer of GuideMyGrid to date.

---

## Checksum publishing

| Option | Description | Selected |
|--------|-------------|----------|
| release/checksums.js | Matches existing release/version.js + github-release.js pattern | ✓ |
| Inline in scripts/package.js | Add directly to existing packaging script | |

**User's choice:** release/checksums.js

| Option | Description | Selected |
|--------|-------------|----------|
| Single SHA256SUMS.txt | One file listing all artifacts + hashes, standard verify convention | ✓ |
| Per-file .sha256 sidecar | One hash file per artifact | |

**User's choice:** Single SHA256SUMS.txt

| Option | Description | Selected |
|--------|-------------|----------|
| New VERIFY.md, linked from README | Dedicated doc, keeps README focused | ✓ |
| Section inside README | Everything in one place | |
| Claude decides based on Phase 5 planning | Defer placement call | |

**User's choice:** New VERIFY.md, linked from README

| Option | Description | Selected |
|--------|-------------|----------|
| Fully automated | Computed + uploaded to GitHub Release automatically as part of npm run publish | ✓ |
| Manual, developer pastes into release notes | Script just prints the hash | |

**User's choice:** Fully automated

---

## Install/uninstall regression check

| Option | Description | Selected |
|--------|-------------|----------|
| Build-artifact regression check | Same pattern as windows-ccx-verify.yml — confirm no requiredPermissions, no retired scripts, valid manifest | ✓ |
| Something broader | Open-ended alternative | |

**User's choice:** Build-artifact regression check

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add a macos-latest job | Symmetric CI coverage for both platforms | ✓ |
| No, keep Windows-only | Leave macOS CI out of scope | |

**User's choice:** Yes, add a macos-latest job

| Option | Description | Selected |
|--------|-------------|----------|
| Yes | Mirrors Phase 2's D-03 regression-guard pattern | ✓ |
| No, not needed | Skip this guard | |

**User's choice:** Yes

| Option | Description | Selected |
|--------|-------------|----------|
| Defer it | Mirrors Phase 2's Windows device-verification precedent (D-06) | ✓ |
| Do a real check this phase | Manually verify install→uninstall on the real Mac now | |

**User's choice:** Defer it

---

## Security review scope

| Option | Description | Selected |
|--------|-------------|----------|
| All remaining release/build scripts | build-ccx.js, package.js, version.js, github-release.js, checksums.js | ✓ |
| Something narrower | Open-ended alternative | |

**User's choice:** All remaining release/build scripts

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include CI workflows | Confirm least-privilege on release.yml, windows-ccx-verify.yml, new macOS job | ✓ |
| No, scripts only | Keep review scoped to local Node scripts | |

**User's choice:** Yes, include CI workflows

| Option | Description | Selected |
|--------|-------------|----------|
| Both | Automated regression tests + a written review summary | ✓ |
| Automated tests only | Skip written summary | |
| Written review only | No new test assertions | |

**User's choice:** Both

---

## Claude's Discretion

- Exact placement of the "uninstall via Creative Cloud Desktop" documentation note — README section vs. elsewhere.
- Whether the macOS CI job is a new file (`macos-ccx-verify.yml`) or a job added within an existing workflow.
- Exact written-review format for the security review summary (inline in a phase doc vs. a dedicated file).

## Deferred Ideas

- Real device-level uninstall verification (CC Desktop leaves zero residue on an actual machine) — revisit before shipping.
- Windows CI packaging bug (`build-ccx.js`'s `zip` CLI dependency) — pre-existing, tracked separately, not folded into this phase.
