---
phase: 04-release-automation-distribution
plan: 03
subsystem: infra
tags: [gumroad, github-releases, distribution, checksum]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity
    provides: "release/checksums.js and releases/SHA256SUMS.txt (published SHA-256 for every release artifact)"
provides:
  - "Live free Gumroad listing (https://666551126816.gumroad.com/l/guidemygrid-psd) serving as the public download front-end (DIST-02)"
  - "gumroad-page-copy.md documenting the actual direct-upload delivery mechanism and its manual re-upload obligation"
affects: [phase-5-trust-and-documentation-polish, release-checklist]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gumroad Content tab used for direct file hosting with pasted checksum/install text, not a redirect-to-GitHub link (deviation from original D-05 plan)"

key-files:
  created: []
  modified:
    - .planning/phases/04-release-automation-distribution/gumroad-page-copy.md

key-decisions:
  - "D-05 pivoted from 'Gumroad redirects to github.com/.../releases/latest' to 'upload the .ccx directly to Gumroad' because Gumroad's current Content tab is a unified block editor with no visible redirect-after-purchase toggle — user made this call explicitly after being told the tradeoff"
  - "GitHub Releases remains the update checker's source of truth (DIST-01 core mechanism unchanged); Gumroad now also hosts a manually-maintained copy of the binary, which is a new, real drift risk not present in the original plan"

patterns-established:
  - "Checksum-in-description pattern: paste the release's exact SHA-256 (from releases/SHA256SUMS.txt) directly below the uploaded file on Gumroad so buyers can self-verify authenticity without relying on a GitHub round-trip"

requirements-completed: [DIST-02]

coverage:
  - id: D1
    description: "Gumroad page copy + step-by-step setup guide drafted for a first-time seller (Section A product copy, Section B setup steps)"
    requirement: "DIST-02"
    verification:
      - kind: manual_procedural
        ref: "gumroad-page-copy.md reviewed and used directly by the user to build the live listing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live Gumroad listing published, delivering the plugin file with a self-verifiable checksum"
    requirement: "DIST-02"
    verification:
      - kind: manual_procedural
        ref: "User downloaded GuideMyGrid-v0.1.0.ccx from https://666551126816.gumroad.com/l/guidemygrid-psd and ran `shasum -a 256` on it"
        status: pass
    human_judgment: true
    rationale: "Live third-party service verification (Gumroad account creation, publishing, and checksum comparison) can only be confirmed by the human who owns the Gumroad account (D-06)"
  - id: D3
    description: "GitHub Releases remains canonical file host / update-checker source of truth (DIST-01) — but Gumroad now also independently hosts a manually-synced copy of the binary, introducing a real version-drift risk not present in the original redirect-based plan"
    requirement: "DIST-01"
    verification: []
    human_judgment: true
    rationale: "This is a risk-acceptance judgment, not something a test can pass/fail — flagged here for future security/process review rather than auto-passed"

duration: ~10min (this continuation session; Task 1 was drafted in a prior session)
completed: 2026-07-08
status: complete
---

# Phase 4 Plan 3: Gumroad Distribution Front-End Summary

**Live free Gumroad listing hosting the plugin directly (with a self-verifiable SHA-256 checksum) after the originally-planned redirect-to-GitHub mechanism turned out to be unavailable in Gumroad's current UI.**

## Performance

- **Duration:** ~10 min (this continuation session, resuming after a checkpoint; Task 1 drafting happened in a prior session)
- **Completed:** 2026-07-08T18:06:09Z
- **Tasks:** 2/2 complete
- **Files modified:** 1 (`gumroad-page-copy.md`, Section B rewrite)

## Accomplishments

- Drafted `gumroad-page-copy.md` with ready-to-paste Gumroad product copy (Section A) and a step-by-step setup guide (Section B) — Task 1.
- User published a live, free Gumroad listing at https://666551126816.gumroad.com/l/guidemygrid-psd.
- Live human-verify checkpoint (Task 2) passed: the user downloaded the file from the live Gumroad listing and confirmed its SHA-256 checksum (`fa7d5ee6dc01bd8597edc6155bf36042ce8c6dc086d35fe18153b8a8ad139454`) exactly matches the value published in `releases/SHA256SUMS.txt` for `GuideMyGrid-v0.1.0.ccx` — confirming the live download is authentic and untampered.
- Rewrote `gumroad-page-copy.md` Section B to describe the actual direct-upload delivery flow used, replacing the original (unimplementable) redirect-based instructions, with a dated note explaining the pivot.

## Task Commits

Each task was committed atomically:

1. **Task 1: Draft the Gumroad page copy + step-by-step setup guide** - `99ab4f2` (docs) — original session
2. **Task 2: Verify the live Gumroad listing** - human-verify checkpoint; live verification performed by the user (Gumroad account creation/publish/checksum comparison are outside repo, D-06). Follow-up doc rewrite committed as `05d79f2` (docs) in this continuation session.

**Plan metadata:** committed at end of this continuation (see final commit hash in git log for this plan's docs update)

## Files Created/Modified

- `.planning/phases/04-release-automation-distribution/gumroad-page-copy.md` - Section A (product page copy) unchanged; Section B (setup instructions) rewritten to describe the direct-upload flow actually used, with a dated deviation note and the live listing URL

## Decisions Made

- **D-05 pivoted at execution time, by explicit user decision:** the original plan assumed Gumroad's "Redirect to a URL after purchase" (Content tab → toggle off beta editor) would let the listing point at `github.com/misterfulanito/guidemygrid/releases/latest` and never host a duplicate binary. Live in Gumroad's current product editor, the Content tab is now a single unified block editor with no visible toggle or redirect-after-purchase option — this appears to be a UI redesign since 04-RESEARCH.md's investigation (which itself flagged this mechanism as "untested end-to-end by a human… confirmed only via documentation"). Rather than keep hunting for a relocated setting, the user explicitly chose to upload the `.ccx` directly to Gumroad's Content tab instead, pasting the file's SHA-256 checksum and install steps in the description immediately below it. This is treated as an authoritative, informed decision — not a fallback taken by default.
- GitHub Releases remains the update checker's (`checkForUpdates()`) sole API source of truth — that part of DIST-01 is unaffected. What changed is that Gumroad *also* now hosts a real copy of the binary.

## Deviations from Plan

### Architectural Deviation (Rule 4 — user-directed, not auto-applied)

**1. D-05 not implemented as planned: direct file upload used instead of a GitHub-Releases redirect**

- **Found during:** Task 2 (human-verify checkpoint)
- **What the plan called for:** Gumroad's Content tab → toggle off the beta content editor → "Redirect to a URL after purchase" → paste `https://github.com/misterfulanito/guidemygrid/releases/latest`, so GitHub Releases stays the sole file host and the Gumroad link can never drift out of sync (DIST-01/DIST-03).
- **What actually happened:** That redirect option could not be found in Gumroad's current Content tab UI (now a unified block editor). The user made an explicit, informed decision to upload `releases/GuideMyGrid-v0.1.0.ccx` directly to the Gumroad listing instead, with a pasted checksum + install-steps block immediately below the file.
- **Live verification performed:** User downloaded the file from the live Gumroad listing (https://666551126816.gumroad.com/l/guidemygrid-psd) to a local machine and ran `shasum -a 256` on it. Result: `fa7d5ee6dc01bd8597edc6155bf36042ce8c6dc086d35fe18153b8a8ad139454` — this is an **exact match** to the entry for `GuideMyGrid-v0.1.0.ccx` in `releases/SHA256SUMS.txt`. The live download is confirmed authentic and current.
- **New real risk introduced (not present in the original plan):** DIST-01 ("GitHub Releases remains the canonical file host") and DIST-03 ("no duplicate binary hosting / no version drift between channels") are **no longer fully satisfied** by this implementation. There is now a genuine second copy of the plugin binary (v0.1.0) hosted directly on Gumroad, with **no automatic sync mechanism**. Every future release will require a **manual re-upload** of the new `.ccx` file and updated checksum/version text to this same Gumroad Content tab — if that manual step is ever skipped or forgotten, the Gumroad copy will silently drift out of sync with the current GitHub Release (stale or, worse, a checksum mismatch that looks like tampering).
- **Threat model impact:** `04-03-PLAN.md`'s threat register rated T-04-06 ("Duplicate binary hosted on Gumroad drifting from GitHub") as **low severity**, explicitly because the plan assumed uploads to Gumroad were forbidden by design ("Instructions explicitly forbid uploading the binary to Gumroad"). **That assumption no longer holds for this implementation.** T-04-06 should be re-read as a live, ongoing operational risk (not a design-time non-issue) for as long as this direct-upload approach is in place. This SUMMARY does not edit `04-03-PLAN.md`'s frontmatter/threat table — plans are historical records of what was planned — but flags the updated risk here for phase verification and future security review.
- **Recommended follow-up (not built in this plan — flagged for the user/future phase):** Add "re-upload the current .ccx + checksum/version text to the Gumroad listing" as an explicit step in the project's release checklist/process documentation, so it isn't forgotten on the next release. This is a process/documentation gap, out of scope for this plan to close.
- **Files modified:** `.planning/phases/04-release-automation-distribution/gumroad-page-copy.md` (Section B rewritten with a dated note; Section A unchanged)
- **Committed in:** `05d79f2` (docs commit, this continuation session)

---

**Total deviations:** 1 architectural (user-directed, Rule 4 — not an auto-fix; explicit user decision after being told the tradeoff)
**Impact on plan:** DIST-02 (free Gumroad listing exists and is live) is fully satisfied. DIST-01/DIST-03 are **partially satisfied** — GitHub Releases is still the update checker's source of truth, but a second, manually-synced binary copy now exists on Gumroad, which the original plan was specifically designed to avoid. This is a real, ongoing operational risk, not a cosmetic scope change.

## Issues Encountered

None beyond the architectural deviation documented above — the checkpoint's live verification (checksum match) succeeded on the first attempt.

## User Setup Required

None further — the live Gumroad listing is already published and verified. See "Recommended follow-up" above for a non-blocking process suggestion (add manual re-upload to the release checklist) that is not built as part of this plan.

## Next Phase Readiness

- DIST-02 satisfied: a public, free Gumroad listing exists and correctly delivers the current, checksum-verified plugin build.
- DIST-01/DIST-03 carry forward as a **known, accepted deviation** rather than a blocker: GitHub Releases remains canonical for the update checker, but Gumroad now needs manual re-upload on every release. Phase 5 (Trust & Documentation Polish) or a future release-process update should consider formalizing this manual step so it isn't lost.
- No code changes in this plan; only the user-facing setup documentation was affected.

---
*Phase: 04-release-automation-distribution*
*Completed: 2026-07-08*

## Self-Check: PASSED

- FOUND: `.planning/phases/04-release-automation-distribution/gumroad-page-copy.md`
- FOUND: `.planning/phases/04-release-automation-distribution/04-03-SUMMARY.md`
- FOUND commit: `99ab4f2` (Task 1)
- FOUND commit: `05d79f2` (Task 2 follow-up doc rewrite)
