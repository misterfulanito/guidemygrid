# Phase 1: Foundation & macOS Installer Rework - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase syncs the stale local repo with `origin/main`'s existing installer work, establishes the `distribution/photoshop/{macos,windows}` + `release/` directory split, and replaces the root-requiring `pkgbuild` `.pkg` installer with a user-level (no admin/root) macOS installer — including an install-time manifest, a quit-Photoshop guard, and absolute-path-only scripts. Windows installer work, checksums/uninstall, release automation, and documentation are later phases — not this one.

</domain>

<decisions>
## Implementation Decisions

### Branch Strategy
- **D-01:** Merge `origin/main` into the current `epic/ui-icons` branch (not a fresh branch off main). This preserves the 10 unmerged UI-icons commits already on this branch and adds the installer work from `origin/main`. This milestone's work continues on `epic/ui-icons`.

### Installer Feel
- **D-02:** Double-clicking the installer opens a small confirmation dialog — "Install GuideMyGrid?" with an Install button — rather than silently copying files with no feedback.
- **D-03:** The installer app itself is labeled "Install GuideMyGrid" (not just "GuideMyGrid") wherever its name is visible (Finder, any dialog title).

### Quit-Photoshop Guard
- **D-04:** Hard block, not a soft warning. If Photoshop is detected running during install or uninstall, the installer refuses to proceed and shows "Please quit Photoshop first" until the user closes it. This applies to both install and uninstall.

### Success Feedback
- **D-05:** After a successful install, show an "Installed! Open Photoshop" dialog — confirms success and tells the user exactly what to do next. Not a silent close.

### Visual Design / Branding
- **D-06:** Reuse the existing icon system, colors, and UI already built in the `ui-icons` epic. Do NOT design new visuals for the installer — no new icon, no new color scheme. Whatever installer chrome/branding is needed should draw from what already exists in the plugin.

### Superseded (2026-07-06, post-.ccx-pivot)
- **D-02, D-03, D-04, D-05 are no longer implementable.** Manual QA proved a raw file-copy installer never registers a plugin with Photoshop; the only working mechanism is a `.ccx` file installed through Creative Cloud Desktop. Creative Cloud Desktop owns 100% of a `.ccx`'s install UX — its own warning dialog, its own install sequence — leaving no hook for a custom confirmation dialog (D-02), custom app labeling shown during install (D-03), a custom Photoshop-running hard block (D-04), or a custom success dialog (D-05). None of these can be built as originally decided; see `01-RESEARCH.md`'s CRITICAL ADDENDUM and its follow-up for the full investigation, and `REQUIREMENTS.md`'s MAC-02/MAC-03 notes for the parallel requirements-level supersession.
- **D-01, D-01a, and D-06 are unaffected and still stand.** The branch-merge strategy (D-01), the manifestVersion-4 decision (D-01a), and the reuse-existing-visuals constraint (D-06) have no dependency on the retired installer UX and remain fully valid.

### Claude's Discretion
- Exact merge conflict resolution mechanics between `epic/ui-icons` and `origin/main` (the user approved the merge direction, not the mechanics).
- Directory structure implementation details within `distribution/photoshop/macos/` and `release/` (per ARCHITECTURE.md research — not re-litigated here).
- Exact wording of the "Please quit Photoshop first" and "Installed!" dialogs beyond the intent captured above.
- Technical choice of installer-building tool (`osacompile` + ad-hoc `codesign` + `create-dmg`, per STACK.md research) — this is an implementation detail, not something the user weighed in on.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (this milestone)
- `.planning/research/SUMMARY.md` — executive summary, recommended stack, phase rationale
- `.planning/research/STACK.md` — `osacompile`/`create-dmg`/ad-hoc signing specifics for the macOS installer
- `.planning/research/ARCHITECTURE.md` — `distribution/photoshop/{macos,windows}` + `release/` directory split rationale, anti-patterns to avoid
- `.planning/research/PITFALLS.md` — the `.pkg`/root-elevation exploit pattern (Pitfall 1), env/PATH trust issues (Pitfall 2) to avoid when writing the new installer scripts

### Project-Level
- `.planning/PROJECT.md` — full milestone context, constraints (no paid signing, free plugin, no Marketplace), Key Decisions table
- `.planning/REQUIREMENTS.md` — FOUND-01, FOUND-02, MAC-01 through MAC-04 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Existing Codebase State
- `.planning/codebase/CONCERNS.md` — confirms `checkForUpdates()`/`UpdateBanner` are dead code (relevant context, not this phase's fix — that's Phase 4)
- `.planning/codebase/ARCHITECTURE.md` — current `src/` structure (unaffected by this phase — installer work lives in new `distribution/`/`release/` dirs, not `src/`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing icon system and color tokens from the `ui-icons` epic (currently uncommitted-to-main work on this branch) — reuse directly in any installer-facing UI (confirmation dialog, success dialog), per D-06. Do not create new icons/colors.
- `src/version.ts` and `scripts/sync-version.js` — existing version-sync mechanism; the new `release/version.js` (per ARCHITECTURE.md) should generalize this rather than duplicate it.

### Established Patterns
- Current macOS installer lives in `scripts/build-mac-pkg.js` + `scripts/pkg-resources/postinstall` (root-requiring `pkgbuild` — the thing being replaced this phase).
- `manifest.json` stays at repo root — UXP tooling requires this; only the installer scripts that consume the built package move into `distribution/photoshop/macos/`.

### Integration Points
- New installer targets `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/...` — same destination as today, just via a user-level mechanism instead of a root-requiring `.pkg`.
- Install-time manifest (from MAC-02) is a new artifact this phase introduces — Phase 3's uninstaller will consume it, so its format should be simple and stable (e.g., a flat list of absolute paths).

</code_context>

<specifics>
## Specific Ideas

- Installer UX modeled as a small confirmation-dialog flow: "Install GuideMyGrid?" → Install → "Installed! Open Photoshop" — not a silent copy, not a full wizard.
- Visual chrome for any installer-facing dialogs must reuse existing GuideMyGrid icons/colors/UI — this is a hard constraint from the product designer who built that system, not a suggestion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within this phase's scope (branch sync, installer mechanics, macOS install/uninstall UX). Windows, checksums, release automation, and documentation are already scoped to their own later phases per ROADMAP.md.

</deferred>

---

*Phase: 1-Foundation & macOS Installer Rework*
*Context gathered: 2026-07-04*
