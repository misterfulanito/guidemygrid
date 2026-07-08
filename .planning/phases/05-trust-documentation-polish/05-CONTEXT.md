# Phase 5: Trust & Documentation Polish - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Document the actual, finished install/uninstall/update experience clearly enough that a non-technical designer isn't alarmed by the warnings this unsigned, non-Marketplace plugin triggers — without over-promising safety it can't prove, and without silently asserting facts (like whether Creative Cloud Desktop's admin-password prompt appears) that Phase 4 left genuinely unresolved. This phase is pure documentation/copy work — no new installer code, no new release-automation mechanism beyond wiring existing scripts to emit the right text.

**Correction to ROADMAP.md wording:** Phase 5's success criterion #2 in ROADMAP.md says the README should have "no remaining references to the obsolete Creative Cloud Desktop `.ccx` process" — this is stale. It was written before Phase 1's pivot (2026-07-06) confirmed `.ccx`-via-CC-Desktop as the actual, permanent install mechanism (not something being replaced). REQUIREMENTS.md's DOCS-02 entry already corrected this ("reversed 2026-07-06" — documenting *that* flow, not removing it). Treat REQUIREMENTS.md as authoritative over the stale ROADMAP wording; do not remove CC Desktop references from README.

</domain>

<decisions>
## Implementation Decisions

**Process note:** The user was unavailable when these four gray areas were presented (AskUserQuestion timed out after 60s with no response). Per this project's established pattern for timeouts (Phase 2 D-03/D-05, Phase 4 D-02/D-05/D-06), proceeded with the recommended option for each rather than blocking. All four are flagged **tentative** below — easy to revisit, flag if any is wrong.

### Which Warning(s) Get Documented (DOCS-01 core question)
- **D-01 (tentative — timed out, proceeded with recommended default):** Document Creative Cloud Desktop's "couldn't verify developer" notice as the primary warning — this is the one already confirmed real (referenced in the Phase 4 Gumroad copy and grounded in Phase 1's `.ccx` research). Do NOT assume the original ROADMAP wording's macOS right-click→Open / Windows More info→Run anyway flow applies — those are OS-level Gatekeeper/SmartScreen steps for a standalone `.app`/`.exe`, and there's no confirmed evidence the `.ccx`-via-CC-Desktop install path triggers a *separate* OS-level warning on top of CC Desktop's own dialog. Research should verify this rather than assume either way before the explainer is finalized.
- **D-02 (tentative, same basis as D-01):** For the admin-password-prompt question left genuinely unresolved by Phase 4 (see PROJECT.md UPD-03 note — two live trials disagree), use hedged language in user-facing docs ("you may see a one-time password prompt during install") rather than asserting it will or won't happen. Do not let documentation resolve this ambiguity by fiat.

### Screenshots (DOCS-01)
- **D-03 (tentative — timed out, proceeded with recommended default):** Get real macOS screenshots from an actual install (same pattern as Phase 4's live macOS checkpoint — the user has a real Mac to test on). Windows screenshots stay deferred/placeholder, consistent with Phase 2/3's precedent of deferring Windows device verification until a real machine is available (see 02-CONTEXT.md D-06, 03-CONTEXT.md D-12). Do not block this phase on solving the Windows device-access gap.

### Explainer Location (DOCS-01 — "inside the installer package" reinterpreted)
- **D-04 (tentative — timed out, proceeded with recommended default):** ROADMAP.md's literal wording ("inside the installer package") doesn't map cleanly onto the current architecture — Creative Cloud Desktop owns the actual install UI now (established Phase 1), so there's no custom installer screen to inject content into, the same category of literal-wording mismatch Phase 2/3 already resolved for their own requirements. Resolve it by adding a new dedicated doc (e.g. `WARNING.md`) bundled alongside `SHA256SUMS.txt` in the GitHub Release assets and repo root — same pattern `VERIFY.md` already established in Phase 3 — linked from README and from the Gumroad listing (fulfilling the "fuller install documentation coming" placeholder already sitting in `gumroad-page-copy.md` from Phase 4).

### Release Notes Reminder (DOCS-03)
- **D-05 (tentative — timed out, proceeded with recommended default):** Automate the "you'll see this warning again" reminder by modifying `release/github-release.js` to prepend a fixed boilerplate paragraph before GitHub's `--generate-notes` auto-generated commit list, so every future release gets it automatically with zero manual steps — matches this project's existing zero-dependency release-script style (`release/version.js`, `release/checksums.js`).

### Claude's Discretion
- Exact wording/structure of the `WARNING.md` explainer content (D-04) and the release-notes boilerplate paragraph (D-05) — implementation detail, follow the "concrete consequences over technical jargon" communication style already validated in Phases 1-4.
- Whether `WARNING.md`'s content is duplicated inline in README or purely linked — whichever reads more naturally once drafted.

### Reviewed Todos (not folded)
- **`2026-07-06-build-ccx-zip-cli-not-cross-platform.md`** ("Fix build-ccx.js zip CLI dependency, fails on Windows CI") — matched this phase at score 0.6 (keywords: ccx, windows, distribution, package) via automated todo matching, same todo reviewed-not-folded in Phase 4's context. Windows CI packaging tooling debt, unrelated to this phase's documentation scope. Left as a standalone pending todo.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The Unresolved Admin-Password-Prompt Finding (grounds D-02)
- `.planning/PROJECT.md` — UPD-03 Validated entry: "Unresolved, flagged for Phase 5: whether this reintroduces CC Desktop's admin-password prompt is genuinely contradictory across two live trials... do not let Phase 5 documentation assert either outcome as settled."
- `.planning/phases/04-release-automation-distribution/04-04-SUMMARY.md` — full detail on the contradictory live-checkpoint result and the recommended controlled re-test
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` — the original A/B test that first found the password-prompt behavior (Phase 1), which Phase 4's live checkpoint then contradicted

### The Stale ROADMAP Wording (grounds the domain-boundary correction)
- `.planning/ROADMAP.md` — Phase 5 section, success criterion #2 (the stale "obsolete Creative Cloud Desktop" wording)
- `.planning/REQUIREMENTS.md` — DOCS-02 entry, "reversed 2026-07-06" note that already corrects this

### Existing Documentation to Extend (not rewrite from scratch)
- `README.md` — Installation and Uninstalling sections already accurately document the `.ccx`/CC-Desktop flow (written during Phase 1/3); DOCS-02 is largely satisfied already — audit and extend, don't rewrite
- `VERIFY.md` — Phase 3's plain-language checksum-verification doc; `WARNING.md` (D-04) should match its tone, structure, and per-OS section pattern
- `.planning/phases/04-release-automation-distribution/gumroad-page-copy.md` — contains the exact placeholder text this phase needs to fulfill: "a fuller explanation of exactly why that notice appears... is coming with the plugin's full install documentation"

### Release Automation to Extend (DOCS-03)
- `release/github-release.js` — current release-notes mechanism (100% `gh release create --generate-notes`, no custom text); this is the file D-05 modifies
- `release/version.js`, `release/checksums.js` — sibling scripts establishing this project's zero-dependency Node script style, to match

### Project-Level
- `.planning/PROJECT.md` — full milestone context, constraints, Key Decisions table
- `.planning/REQUIREMENTS.md` — DOCS-01 through DOCS-03 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 5 goal & success criteria (success criterion #2 needs the reinterpretation noted above)
- `.planning/STATE.md` — Blockers/Concerns and Accumulated Context sections

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` Installation/Uninstalling sections — already written, accurate, and in the right tone; extend with a link to the new `WARNING.md` rather than duplicating its content inline
- `VERIFY.md` — direct structural template for `WARNING.md`: per-OS sections, plain-language numbered steps, a "something doesn't match?" style closing section

### Established Patterns
- Trust/security documentation in this project follows a consistent voice: "here's what this proves, here's what it doesn't" framing (see `VERIFY.md`'s opening callout) — `WARNING.md` should open the same way ("here's why this warning appears, here's what it does and doesn't mean")
- Release scripts (`release/*.js`) are zero-dependency Node scripts using built-ins only (`fs`, `path`, `child_process`) — D-05's `github-release.js` change should stay within that constraint, no new npm dependency for templating

### Integration Points
- `release/github-release.js`'s `gh release create ... --generate-notes` call is where D-05's boilerplate paragraph needs to be prepended — likely via a `--notes-file` swap (write boilerplate + fetch generated notes into a temp file) since `--generate-notes` and custom `--notes` text can't currently both be passed in one `gh` invocation
- `gumroad-page-copy.md`'s Section A description already has a placeholder sentence pointing at "fuller install documentation" — D-04's `WARNING.md` should be linked from an updated version of that placeholder once written (Gumroad listing itself needs a manual copy-paste update by the user, same division of labor as Phase 4)

</code_context>

<specifics>
## Specific Ideas

- No specific visual/copy examples were provided this session (discussion timed out before the user could add them) — all four decisions above are Claude's recommended defaults, not user-originated preferences. Flag prominently during planning/execution that these are the areas most likely to need a course-correct once the user reviews.

</specifics>

<deferred>
## Deferred Ideas

- **Resolving whether `.ccx`-via-CC-Desktop triggers a separate OS-level Gatekeeper/SmartScreen warning on top of CC Desktop's own dialog** — not deferred scope, but an open research question the phase researcher must answer before the explainer's warning list is finalized (see D-01). Not the same as a scope-creep deferral; flagging here so downstream agents don't miss that D-01 is provisional pending that research.
- **Windows screenshots for `WARNING.md`** — deferred per D-03, consistent with Phase 2/3's Windows device-access precedent. Revisit once a real Windows test opportunity exists.
- **A controlled re-test of the admin-password-prompt behavior** (recommended in `04-04-SUMMARY.md`) — not this phase's job to run, but its outcome would resolve D-02's hedged language into a firm statement. Not blocking Phase 5.

### Reviewed Todos (not folded)
See `2026-07-06-build-ccx-zip-cli-not-cross-platform.md` note under `<decisions>` above — reviewed, not folded, unrelated to this phase's documentation scope.

</deferred>

---

*Phase: 5-Trust & Documentation Polish*
*Context gathered: 2026-07-08*
