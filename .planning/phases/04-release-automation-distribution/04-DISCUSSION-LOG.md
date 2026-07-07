# Phase 4: Release Automation & Distribution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 4-Release Automation & Distribution
**Areas discussed:** Network permission tradeoff, When updates get checked, Gumroad ↔ GitHub sync, Gumroad page setup & ownership

---

## Network Permission Tradeoff

| Option | Description | Selected |
|--------|-------------|----------|
| Bring back the password prompt | Full automatic update checking; install/update asks for password again | |
| Try to avoid the password prompt | Research whether the network call can work without triggering CC Desktop's install-time prompt; fall back if not possible | ✓ (no response after 60s — proceeded with recommended default, flagged tentative) |
| Skip automatic checking for now | Stay password-free; no in-app update notification | |

**User's choice:** No response within 60s. Proceeded with "Try to avoid the password prompt" as the recommended default, explicitly flagged to the user as tentative and open to correction.
**Notes:** This is the single most consequential decision in this phase — directly trades off against the milestone's core value (no admin password). Framed for research to validate technical feasibility before locking into manifest.json changes.

---

## Fallback if password-prompt avoidance fails

| Option | Description | Selected |
|--------|-------------|----------|
| Accept the prompt | Bring back real automatic update checking, accept password prompt reintroduction | ✓ |
| Skip it, stay password-free | Keep no-password install; update checker stays disconnected | |

**User's choice:** Accept the prompt.
**Notes:** User explicitly answered this one (not a timeout) — confirms the sequencing: try avoidance first (per above), but if that's a dead end, ship the working update checker even at the cost of the password prompt returning.

---

## When updates get checked

| Option | Description | Selected |
|--------|-------------|----------|
| Every time you open the panel | Automatic, invisible, matches original UpdateBanner design | ✓ |
| Manual button only | No automatic network calls; user clicks "check for updates" | |
| Once per day at most | Automatic but throttled to 24h | |

**User's choice:** Every time you open the panel.
**Notes:** User explicitly answered. Matches the original disconnected design's intent (per `CONCERNS.md`'s suggested fix approach).

---

## Gumroad ↔ GitHub Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Point Gumroad at GitHub's "latest release" URL | Set once, never needs updating; satisfies DIST-03's no-version-drift goal | ✓ (no response after 60s — proceeded with recommended default, flagged tentative) |
| Manually re-paste the link each release | Simple but easy to forget | |
| Script it via Gumroad API | Needs research to confirm feasibility first | |

**User's choice:** No response within 60s. Proceeded with the "latest release" redirect link as the recommended default, flagged tentative.
**Notes:** Chosen specifically because it eliminates the sync problem rather than automating around it. Needs verification during planning/research that Gumroad's link field accepts an external redirect URL (not just direct uploads) — unconfirmed per STATE.md.

---

## Gumroad Page Setup & Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| You create it, Claude gives you the copy | Same division of labor as Phase 1's Adobe portal registration | ✓ (no response after 60s — proceeded with recommended default, flagged tentative) |
| You handle the whole thing yourself | User writes and sets up the Gumroad page entirely independently | |

**User's choice:** No response within 60s. Proceeded with "You create it, Claude gives you the copy" as the recommended default, flagged tentative.
**Notes:** Two consecutive timeouts at this point in the session — discussion was wrapped up and written to CONTEXT.md rather than continuing to block on further AskUserQuestion calls, per the same precedent set in Phase 2's discussion (D-03/D-05: proceed with recommended option after repeated non-response, flag clearly for later correction).

---

## Claude's Discretion

- Exact wording/structure of the Gumroad page copy Claude drafts.
- Whether the "every panel open" update check needs a client-side debounce for rapid open/close cycles.
- Exact placement of `checkForUpdates()` wiring within `App.tsx`/hooks/`uiStore`.

## Deferred Ideas

- Whether D-02 (avoid the password prompt) actually works technically — not deferred scope, but an open question research must resolve before planning locks in a manifest.json change.
- Gumroad email announcements for new releases (DISTV2-01) — already correctly scoped to v2, not re-litigated.
- Scripted Gumroad API sync — considered, not chosen; becomes the fallback only if the "latest release" redirect link turns out unsupported by Gumroad's product page.
- `2026-07-06-build-ccx-zip-cli-not-cross-platform.md` todo — reviewed via automated phase-matching (score 0.6), not folded in; low relevance to this phase's actual scope (Windows CI packaging tooling, not GitHub/Gumroad/update-checker work).
