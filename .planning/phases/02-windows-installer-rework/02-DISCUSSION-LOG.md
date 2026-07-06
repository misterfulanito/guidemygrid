# Phase 2: Windows Installer Rework - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 2-Windows Installer Rework
**Areas discussed:** Windows install mechanism pivot, Windows verification strategy, existing script retirement, legacy install cleanup, uninstall ownership, CI scope

---

## Windows Install Mechanism Pivot

| Option | Description | Selected |
|--------|-------------|----------|
| Assume the same `.ccx`/CC Desktop pivot applies | Discuss the phase as: verify Phase 1's `.ccx` installs cleanly on Windows via CC Desktop, retire raw-copy scripts, figure out what genuinely Windows-specific work (if any) remains | ✓ (no reply — proceeded on strong evidence) |
| Keep discussing the original raw-copy plan | Discuss WIN-01..05 as literally written, let research disprove it later like Phase 1 did | |
| Walk through the tradeoff first | Explain scope/effort differences before deciding | |

**User's choice:** No reply after 60s. Proceeded with the recommended option given very strong supporting evidence: Phase 1's own finding states CC Desktop's plugin-registration requirement is architectural (not macOS-specific), and the codebase's own `distribution/photoshop/macos/README.md` already documents the `.ccx` builder as OS-agnostic.
**Notes:** Flagged clearly to the user as a "correct me if wrong" assumption. No correction followed.

---

## Windows Verification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Test it yourself somehow | Borrow a friend's/coworker's Windows PC, or rent a cheap cloud Windows VM for an hour, to confirm the install works before public release | |
| Ship on faith, watch for bug reports | Skip real-device testing; rely on Mac-parity evidence; fix fast if early users report problems | |
| Explain options first | Walk through concretely what each option would involve | |

**User's choice:** "Let's put this as a Nice to have. Let's continue working on the rest of the process." — explicitly deferred, not selecting an option now.
**Notes:** Captured as D-06 in CONTEXT.md (deferred, not blocking). Revisit before actually shipping the Windows release, not before planning.

---

## Existing Raw-Copy Script Retirement / Uninstall Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Delete the old broken installer files | Remove `install.bat/.ps1` and `uninstall.bat/.ps1` outright, same as macOS | ✓ (no reply — proceeded on recommendation) |
| Let Creative Cloud handle uninstalling too | No custom Windows uninstaller; rely on CC Desktop's "Manage Plugins" uninstall, same as macOS | ✓ (no reply — proceeded on recommendation) |

**User's choice:** No reply after 60s (second consecutive timeout in the session). Proceeded with both recommended options — both are low-risk, direct mirrors of the already-validated macOS Phase 1 outcome.
**Notes:** Flagged in CONTEXT.md (D-03, D-05) as easy to revisit if wrong.

---

## Legacy Install Cleanup

**Resolved via direct data check, not a user question.** Ran `gh release view` against real GitHub release data: the `-installer.zip` bundle containing the old raw-copy Windows installer has 1 total download across v1.6.0–v1.6.2 — almost certainly the developer's own testing. Concluded no migration/cleanup story is needed (D-04 in CONTEXT.md). Shared this finding with the user directly as reassurance rather than posing it as an open question.

---

## Claude's Discretion

- Exact implementation of the rescoped WIN-05 CI job (Creative Cloud Desktop can't be driven headlessly in CI, so the original "full install/uninstall E2E on windows-latest" wording isn't achievable as written; suggested direction is structural/static checks instead — see CONTEXT.md).
- Whether/how README or in-package documentation explains the Windows install flow — connects to Phase 5's DOCS-01/02, noted but not solved here.

## Deferred Ideas

- Windows device verification method (D-06) — explicitly deferred by the user as a "nice to have," to be revisited before the Windows release actually ships.
