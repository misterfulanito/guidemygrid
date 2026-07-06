# Phase 3: Manifest-Driven Uninstall & Checksum Integrity - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Give users a zero-residue way to uninstall GuideMyGrid on either platform, and let them independently verify a downloaded release hasn't been tampered with via published SHA256 checksums. This phase's real scope is narrower than ROADMAP.md's literal "manifest-driven uninstall" wording suggests: Phase 1 (macOS) and Phase 2 (Windows, D-05) already established that Creative Cloud Desktop owns install AND uninstall end-to-end for the `.ccx`-distributed plugin — there is no custom installer/uninstaller code left to attach a manifest to. This phase's uninstall work is retirement + documentation + a build-artifact regression guard, not new installer-style code. Checksum publishing (INTEG-02) is genuinely new work, unaffected by the CC Desktop finding.

</domain>

<decisions>
## Implementation Decisions

### Uninstall Ownership (INTEG-01 rescoping)
- **D-01:** Retire the legacy macOS uninstaller outright — `scripts/build-mac-uninstaller.js` and `scripts/pkg-resources/uninstall-preinstall` are deleted, along with their invocation in `scripts/package.js` (currently gated behind a comment: "kept until Phase 3's manifest-driven rework"). This mirrors Phase 2's Windows decision (D-05: no custom uninstaller, rely on CC Desktop's "Manage Plugins"). Rationale: CC Desktop already owns uninstall for both platforms; the legacy `.pkg` uninstaller uses `pkgbuild --install-location /`, which typically requires admin elevation — directly contradicting this milestone's "no root/admin" goal.
- **D-02:** No custom install-time manifest is needed. CC Desktop's own plugin registry is sufficient — same conclusion Phase 1/2 already reached for MAC-02/WIN-02 (both marked superseded). INTEG-01 is satisfied by "confirm CC Desktop's uninstall works + document it," not by building new tracking code.
- **D-03:** Document clearly (README or equivalent) that uninstalling GuideMyGrid means using Creative Cloud Desktop's "Manage Plugins" panel — there is no separate uninstaller app. Exact placement (README section vs. elsewhere) is Claude's discretion during planning; connects to Phase 5's DOCS-02 but a short note here prevents user confusion in the interim.
- **D-04:** No legacy-cleanup path for pre-Phase-1 raw-copy installs. The user confirmed they are the only person who has ever installed GuideMyGrid so far — there are no real end users with orphaned pre-`.ccx` files on disk. This removes what would otherwise be a real "breadcrumbs" concern.

### Checksum Publishing (INTEG-02)
- **D-05:** Create `release/checksums.js`, matching the existing `release/version.js` + `release/github-release.js` pattern (host-agnostic release automation). This is the script FOUND-02 deliberately left unstubbed for this phase.
- **D-06:** Output format is a single `SHA256SUMS.txt` listing all release artifacts and their hashes (standard `shasum -a 256 -c SHA256SUMS.txt` verification convention) — not per-file `.sha256` sidecars.
- **D-07:** Checksum generation is fully automated as part of `npm run publish:*` — `release/checksums.js` runs during the publish flow and `SHA256SUMS.txt` is uploaded to the GitHub Release alongside the `.ccx`, with no manual copy-paste step.
- **D-08:** Plain-language, copy-paste verification steps for both macOS and Windows live in a new `VERIFY.md`, linked from README — kept separate from README to stay focused, and easy to link from Gumroad later (Phase 4).

### Install/Uninstall Regression Check (INTEG-03 rescoping)
- **D-09:** Since CC Desktop cannot be driven headlessly in CI (confirmed Phase 2, D-06 — GUI + Adobe login required) and there's no custom install/uninstall code left after D-01/D-02, INTEG-03's "automated filesystem-diff check" is rescoped to a **build-artifact regression check** — the same category of check as the existing `windows-ccx-verify.yml`: confirm the built `.ccx` has no `requiredPermissions`, contains no retired installer/uninstaller scripts, and has a well-formed `manifest.json`. This is a real, automatable proxy for "nothing left behind" given the constraints — not a literal install-then-uninstall filesystem diff.
- **D-10:** Add a `macos-latest` CI job mirroring `windows-ccx-verify.yml`'s checks, giving both platforms the same build-artifact regression guard. Currently only Windows has this coverage despite macOS being the primary platform.
- **D-11:** The regression check (CI job and/or a Jest test, following the `installer-retirement.test.ts` pattern already used for the retired Windows scripts) must assert the legacy macOS uninstaller files (`build-mac-uninstaller.js`, `uninstall-preinstall`) are actually absent from the repo — prevents the retired root-requiring uninstaller from silently reappearing.
- **D-12:** Real device-level confirmation that CC Desktop's uninstall leaves zero residue on an actual machine is **deferred**, mirroring Phase 2's Windows device-verification precedent (D-06) — not blocking for this phase's planning or execution. Revisit before shipping, not before planning.

### Security Review Scope (INTEG-04 rescoping)
- **D-13:** Review scope covers all remaining release/build scripts: `distribution/photoshop/build-ccx.js`, `scripts/package.js`, `release/version.js`, `release/github-release.js`, and the new `release/checksums.js` — everything that runs during `npm run package`/`publish`. There is no custom installer/uninstaller script left on either platform to review (per D-01).
- **D-14:** The review also covers CI workflow files (`release.yml`, `windows-ccx-verify.yml`, the new macOS CI job from D-10) for permission scoping and secrets handling — these execute with GitHub-provided credentials (`contents: write`), worth confirming least-privilege there too, not just local scripts.
- **D-15:** Findings are captured as **both** automated regression tests (e.g., "no bare command names," "no relative-PATH-trusting exec calls," following the `installer-retirement.test.ts` pattern) **and** a short written review summary confirming what was checked and that INTEG-04 is satisfied.

### Claude's Discretion
- Exact placement of the "uninstall via Creative Cloud Desktop" documentation note (D-03) — README section vs. a dedicated spot; final call belongs to whichever reads more naturally once written, doesn't need to block on Phase 5.
- Whether the macOS CI job (D-10) is a new file (`macos-ccx-verify.yml`) or a job added within the existing workflow — implementation detail, not a vision decision.
- Exact written-review format for D-15 (inline in a phase doc vs. a dedicated `SECURITY.md`-style file) — follow whatever this project's existing conventions suggest during planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 & 2 Findings (the precedent this phase's rescoping rests on)
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` — "CRITICAL ADDENDUM" section explaining CC Desktop owns install AND uninstall for `.ccx`-distributed plugins; explicitly flags "this likely simplifies or eliminates Phase 3's planned INTEG-01 custom uninstaller"
- `.planning/phases/02-windows-installer-rework/02-CONTEXT.md` — D-05 (no custom Windows uninstaller, rely on CC Desktop) and D-06 (CI cannot drive CC Desktop headlessly) are the direct precedents this phase's D-01, D-02, D-09, D-12 extend to macOS
- `.planning/PROJECT.md` — Key Decisions table; also notes the deferred Windows CI `zip` CLI bug (unrelated to this phase's scope, low relevance)

### Existing Code to Reference or Retire
- `scripts/build-mac-uninstaller.js` — the legacy root-requiring `.pkg` uninstaller being retired (D-01)
- `scripts/pkg-resources/uninstall-preinstall` — its preinstall script, also retired (D-01)
- `scripts/package.js` (lines ~30-43) — currently invokes the legacy uninstaller behind a "kept until Phase 3" comment; needs the invocation removed
- `distribution/photoshop/build-ccx.js` — existing cross-platform `.ccx` builder, in scope for the security review (D-13)
- `release/version.js`, `release/github-release.js` — existing release automation this phase's `release/checksums.js` should match in style; also in scope for the security review (D-13)
- `.github/workflows/windows-ccx-verify.yml` — the CI pattern to mirror for the new macOS job (D-10) and to extend with the uninstaller-retirement assertion (D-11); also review target for D-14
- `.github/workflows/release.yml` — currently disabled fallback workflow (releases are published via local `npm run publish:patch`); in scope for D-14's CI review
- `src/__tests__/installer-retirement.test.ts` — the existing regression-test pattern (Phase 2, D-03) to follow for D-11's macOS-uninstaller-retirement assertion and D-15's script-safety assertions

### Project-Level
- `.planning/REQUIREMENTS.md` — INTEG-01 through INTEG-04 (this phase's requirements)
- `.planning/ROADMAP.md` — Phase 3 goal & success criteria (written under the old manifest-driven-uninstall assumption; success criterion #1 needs re-interpretation per D-01/D-02 above, not literal satisfaction)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `release/version.js`, `release/github-release.js` — pattern to follow for the new `release/checksums.js` (host-agnostic, invoked from `npm run publish:*`)
- `.github/workflows/windows-ccx-verify.yml` — CI pattern to mirror for the new macOS build-artifact regression job, and to extend for uninstaller-retirement checking
- `src/__tests__/installer-retirement.test.ts` — Jest test pattern to follow for asserting retired files are absent (D-11) and for the new safety assertions (D-15)

### Established Patterns
- `scripts/package.js` orchestrates the overall `npm run package` flow and stages release artifacts — this is where the legacy uninstaller invocation is removed and where `SHA256SUMS.txt` staging likely plugs in
- CI regression-guard pattern: build the artifact, extract it, assert specific things are absent/present — already proven working for Windows script retirement, directly reusable for macOS uninstaller retirement

### Integration Points
- `npm run publish:patch/minor/major` → `release/github-release.js` — this is where `release/checksums.js`'s output needs to plug in so `SHA256SUMS.txt` uploads alongside the `.ccx` automatically (D-07)
- GitHub Actions `windows-latest` runner already exists for Windows CI; `macos-latest` is the equivalent for the new macOS job (D-10) — same `actions/checkout` + `actions/setup-node` + `npm ci` boilerplate

</code_context>

<specifics>
## Specific Ideas

- The user confirmed they are the only person who has ever installed GuideMyGrid so far — this directly resolved the "legacy pre-Phase-1 orphaned files" question (D-04) without needing to pull real download numbers, unlike Phase 2's Windows legacy-cleanup decision which did require checking `gh release view` data.
- `SHA256SUMS.txt` was chosen specifically because it supports a single-command verification (`shasum -a 256 -c SHA256SUMS.txt`) — important given the user's non-technical audience needs the simplest possible copy-paste step.

</specifics>

<deferred>
## Deferred Ideas

- **Real device-level uninstall verification** (CC Desktop leaves zero residue on an actual machine) — deferred per D-12, mirrors Phase 2's Windows device-verification precedent (D-06). Revisit before shipping, not before planning.
- **Windows CI packaging bug** (`build-ccx.js`'s `zip` CLI dependency fails on `windows-latest`) — pre-existing, tracked in `.planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md`, low relevance to this phase's actual scope (checksums/uninstall, not cross-platform packaging tooling). Not folded into this phase's decisions.

No scope-creep items surfaced this session — discussion stayed within uninstall retirement, checksum publishing, and their supporting regression/security checks.

</deferred>

---

*Phase: 3-Manifest-Driven Uninstall & Checksum Integrity*
*Context gathered: 2026-07-06*
