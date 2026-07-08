# Phase 5: Trust & Documentation Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 5-Trust & Documentation Polish
**Areas discussed:** Warning content, Screenshots, Explainer location, Release notes

---

## Which Warning(s) Get Documented

| Option | Description | Selected |
|--------|-------------|----------|
| CC Desktop's dialog only, hedge on the password prompt | Document CC Desktop's "couldn't verify developer" notice as the main warning; skip OS-level Gatekeeper/SmartScreen steps from the old ROADMAP wording; hedge on the admin-password prompt | ✓ (default) |
| Cover both CC Desktop's dialog AND OS-level Gatekeeper/SmartScreen | Keep literal ROADMAP wording — document both CC Desktop's notice and separate OS-level right-click/Run-anyway steps | |
| Investigate first, then decide | Flag as open research question before locking scope | |

**User's choice:** No response — AskUserQuestion timed out after 60s (user away from keyboard). Proceeded with the recommended option per this project's established timeout precedent (Phase 2 D-03/D-05, Phase 4 D-02/D-05/D-06).
**Notes:** Flagged tentative in CONTEXT.md (D-01, D-02) — the user should confirm or correct before planning locks this in.

---

## Screenshots

| Option | Description | Selected |
|--------|-------------|----------|
| Real macOS screenshots now, Windows deferred | Live macOS install screenshots; Windows placeholder/deferred (no test device) | ✓ (default) |
| Text-only walkthrough for both platforms | No screenshots yet on either platform | |
| Block on getting screenshots for both platforms | Requires solving the Windows device-access gap now | |

**User's choice:** No response — timed out. Proceeded with recommended default.
**Notes:** Flagged tentative in CONTEXT.md (D-03).

---

## Explainer Location

| Option | Description | Selected |
|--------|-------------|----------|
| A dedicated doc bundled with the release (e.g. WARNING.md) | New file matching VERIFY.md's pattern, linked from README and Gumroad | ✓ (default) |
| Fold it into the existing README, no new file | Add as a new README section instead | |
| Claude's discretion — decide during planning | Don't lock now | |

**User's choice:** No response — timed out. Proceeded with recommended default.
**Notes:** Flagged tentative in CONTEXT.md (D-04).

---

## Release Notes Reminder

| Option | Description | Selected |
|--------|-------------|----------|
| Automate it — prepend fixed boilerplate in github-release.js | Modify the release script so every future release gets the reminder automatically | ✓ (default) |
| Manual — add it to a release checklist | Document text, paste in by hand each release, no script changes | |

**User's choice:** No response — timed out. Proceeded with recommended default.
**Notes:** Flagged tentative in CONTEXT.md (D-05).

---

## Claude's Discretion

- Exact wording/structure of WARNING.md's content and the release-notes boilerplate paragraph.
- Whether WARNING.md's content is duplicated inline in README or purely linked.

## Deferred Ideas

- Whether `.ccx`-via-CC-Desktop triggers a separate OS-level Gatekeeper/SmartScreen warning — open research question, not scope creep.
- Windows screenshots for WARNING.md — deferred pending device access.
- A controlled re-test of the admin-password-prompt behavior — not this phase's job, but would resolve D-02's hedged language.
- Todo `2026-07-06-build-ccx-zip-cli-not-cross-platform.md` — reviewed, not folded (Windows CI packaging debt, unrelated to documentation scope).
