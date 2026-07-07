# Phase 4: Release Automation & Distribution - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Get releases flowing consistently from a local build to GitHub to Gumroad, and reconnect the currently-dead in-app update checker (`checkForUpdates()`/`UpdateBanner`) so it actually notifies users of new versions — without silently reintroducing the admin-password install prompt that Phases 1–3 worked to eliminate. This phase does NOT build a Gumroad listing itself (that's a manual, user-owned step, same pattern as the Adobe portal registration in Phase 1) — it decides how the pieces connect and drafts what the user needs to do it. Checksum/signature verification of the update itself is out of scope (v2 — SECV2-01/02).

</domain>

<decisions>
## Implementation Decisions

### Network Permission Tradeoff (UPD-03 — the central decision this phase)
- **D-01:** Reconnecting `checkForUpdates()` requires `manifest.json` to declare `requiredPermissions.network` again. Phase 1 empirically confirmed (A/B test) that declaring this permission reintroduces Creative Cloud Desktop's admin-password prompt on install/update for this non-Marketplace plugin — directly working against this milestone's core value ("no admin/root access ever").
- **D-02 (directional, not fully confirmed — timed out on first ask, proceeded with recommended default):** Try to find a way to make the update check work **without** reintroducing the password prompt first. Research/planning should investigate whether this is actually possible (e.g., does UXP enforce the permission at runtime only, or does CC Desktop's installer statically scan the manifest regardless of whether the code path is ever exercised?) before assuming it's a dead end.
- **D-03 (confirmed fallback):** If research proves there is no way around it, the user wants to **accept the password prompt** and ship a fully working, automatic update checker rather than stay password-free with no in-app notification. This fallback is locked in — do not re-ask, just report which path research landed on.
- **D-04 (confirmed):** Update checks should fire automatically every time the plugin panel is opened (matches the original `UpdateBanner`/`checkForUpdates()` design intent) — not a manual "check for updates" button, not a 24-hour throttle. Simplicity over API-call minimization; GitHub's public rate limit (60 req/hr unauthenticated) is not a real constraint at this plugin's scale.

### Gumroad ↔ GitHub Sync (DIST-02, DIST-03)
- **D-05 (tentative — timed out, proceeded with recommended default):** Point the Gumroad listing's download link at GitHub's "latest release" redirect URL (`github.com/misterfulanito/guidemygrid/releases/latest`) rather than a specific versioned file. This means the link never needs to be touched again on future releases and directly satisfies DIST-03's "no version drift" goal. Verify during planning/research that Gumroad's product-page link field actually accepts an external redirect URL like this (not just direct file uploads) — flagged as unconfirmed in STATE.md's Blockers/Concerns.
- Scripted Gumroad API sync was explicitly offered as a third option but not chosen — the "latest release" redirect approach makes scripting unnecessary in the first place (no per-release update needed at all).

### Gumroad Page Setup & Ownership (DIST-02)
- **D-06 (tentative — timed out, proceeded with recommended default):** The user creates and owns the actual Gumroad listing (account, page, screenshots, price = $0) — same division of labor as Phase 1's Adobe Developer Distribution portal registration, which Claude could not do on the user's behalf. Claude's job is to draft the page copy/description/feature list and give the user clear, plain-language, step-by-step instructions for pasting it into Gumroad's page builder and wiring up the "latest release" link (D-05).

### User Guidance Note
- The user explicitly said this is their first time setting up something like this (Gumroad distribution + release automation) and asked to be guided through it — carry the same "concrete consequences over technical jargon" communication style used successfully in Phases 1–3 into this phase's planning and execution communications too.

### Claude's Discretion
- Exact wording/structure of the Gumroad page copy Claude drafts for D-06.
- Whether the "every panel open" update check (D-04) needs any client-side debounce to avoid redundant calls if the user rapidly closes/reopens the panel — implementation detail, not a vision decision.
- Where exactly in `App.tsx`/hooks the `checkForUpdates()` wiring lives (matches `CONCERNS.md`'s suggested fix approach: `App.tsx` `useEffect` + `uiStore` state + conditional `UpdateBanner` render) — implementation detail.

### Reviewed Todos (not folded)
- **`2026-07-06-build-ccx-zip-cli-not-cross-platform.md`** ("Fix build-ccx.js zip CLI dependency, fails on Windows CI") — matched this phase at score 0.6 (keywords: build, distribution, dist) via automated todo matching, but not folded in. This is Windows CI packaging-tooling debt from Phase 2/3, unrelated to this phase's actual scope (GitHub↔Gumroad sync, update checker reconnection). Does not block real end users. Left as a standalone pending todo — revisit whenever `build-ccx.js` is next touched, or explicitly if a future phase needs Windows CI packaging to be green.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The Network Permission Finding (the evidence D-01/D-02/D-03 rest on)
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` — the empirical A/B test proving `requiredPermissions.network` triggers Creative Cloud Desktop's admin-password prompt on install for this non-Marketplace plugin
- `.planning/PROJECT.md` — Key Decisions table, "Keep manifest.json free of requiredPermissions... until actually needed" row, explicitly flags Phase 4 as where this must be re-evaluated consciously
- `.planning/REQUIREMENTS.md` — UPD-03 entry, which spells out the same three-option framing (accept prompt / find alternative / reconsider scope) independently arrived at during this discussion
- `manifest.json` (repo root) — current state has no `requiredPermissions` block; this is the file D-01/D-02/D-03's outcome will modify

### Existing Update Checker Code (already built, just disconnected)
- `src/services/updateChecker.ts` — `checkForUpdates()`, `validateRelease()`, `isSafeUrl()` — fully functional, GitHub-API-only, domain-allowlisted, semver-validated; UPD-01/UPD-02 already satisfied by this existing code, just needs wiring up (not rewriting)
- `src/components/shared/UpdateBanner.tsx` — exists, exported, but never imported anywhere (confirmed via grep — not in `App.tsx` or any other component)
- `.planning/codebase/CONCERNS.md` — "Dead Code Components" and "Orphaned Service Function" sections confirm both are disconnected; "Fix approach" suggestion (wire up in `App.tsx` via `useEffect`, manage state in `uiStore`, conditionally render `UpdateBanner`) is a reasonable starting point for planning, not yet decided/locked

### Release Automation (existing, to extend)
- `release/version.js`, `release/github-release.js`, `release/checksums.js` — existing host-agnostic release scripts (Phases 1 & 3); any Gumroad-sync automation should match this pattern if scripting is ever revisited
- `package.json` — `publish:patch/minor/major` scripts — the existing release pipeline this phase's Gumroad-link work needs to fit into (or stay entirely decoupled from, per D-05's "set once, never touch again" approach)

### Project-Level
- `.planning/PROJECT.md` — full milestone context, constraints, Key Decisions table
- `.planning/REQUIREMENTS.md` — UPD-01 through UPD-03, DIST-01 through DIST-03 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 4 goal & success criteria
- `.planning/STATE.md` — Blockers/Concerns section flags both the update-checker-is-dead-code risk and the unconfirmed Gumroad API capability

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/updateChecker.ts` — fully working, do not rewrite; only needs a caller
- `src/components/shared/UpdateBanner.tsx` — fully built component, needs only to be imported and conditionally rendered
- `src/store/uiStore.ts` — existing Zustand UI-state store; natural home for update-info state per `CONCERNS.md`'s suggested fix approach

### Established Patterns
- Update checker already follows this project's error-handling convention: silent `null` return + `console.error('[GMG] ...')` on failure (never blocks the UI) — matches `ARCHITECTURE.md`'s documented "network failures silent" tier
- `release/*.js` scripts are zero-dependency, host-agnostic Node scripts invoked from `package.json` — any new release-automation code should match this style, not introduce a new dependency unless genuinely needed

### Integration Points
- `src/App.tsx` — root shell component; currently does NOT import `UpdateBanner` or call `checkForUpdates()` — this is where the wiring needs to happen (useEffect on mount, per D-04's "every panel open" decision)
- `manifest.json` (repo root) — the file that gets modified if D-01/D-02 research concludes the password prompt must return

</code_context>

<specifics>
## Specific Ideas

- The user wants the "every time you open the panel" update-check behavior specifically because it matches how the feature was originally designed (automatic, invisible, no button to remember to click).
- Gumroad's "latest release" redirect link idea (D-05) was chosen specifically to make the sync problem disappear rather than to solve it with automation — set up once, never touched again, no scripting risk.

</specifics>

<deferred>
## Deferred Ideas

- **Whether the network-permission-avoidance research (D-02) actually pans out** — this is not deferred scope, it's an open technical question this phase's research step must answer before planning locks in the manifest.json change. Flagging here so downstream agents don't miss that D-02/D-03 together describe a *sequence* (try avoidance first, fall back to accepting the prompt), not two independent options.
- **Gumroad email announcements for new releases** (DISTV2-01) — already correctly scoped to v2 in REQUIREMENTS.md, not re-litigated here.
- **Scripted Gumroad API sync** — considered and explicitly not chosen in favor of D-05's "latest release" redirect link; if Gumroad's link field turns out NOT to support external redirects (unconfirmed), this becomes the fallback and should come back to the user as a real decision, not a silent default.

### Reviewed Todos (not folded)
See `2026-07-06-build-ccx-zip-cli-not-cross-platform.md` note under `<decisions>` above — reviewed, not folded, low relevance to this phase's actual scope.

</deferred>

---

*Phase: 4-Release Automation & Distribution*
*Context gathered: 2026-07-07*
