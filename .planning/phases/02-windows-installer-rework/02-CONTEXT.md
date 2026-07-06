# Phase 2: Windows Installer Rework - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Get GuideMyGrid installable on Windows at user level (no admin/UAC elevation), by verifying and applying the same `.ccx`/Creative Cloud Desktop mechanism Phase 1 validated for macOS — not building a from-scratch raw-copy installer. The existing `install.bat/.ps1`, `uninstall.bat/.ps1` scripts assume the raw-copy model that failed on macOS and are retired. This phase's real scope is narrower than ROADMAP.md's literal WIN-01..05 wording suggests: confirm Windows parity with the already-solved macOS mechanism, retire dead code, and decide what (if anything) is genuinely Windows-specific work. Windows *device verification* (no physical machine available) is explicitly deferred — not blocking for planning/research/execution of this phase.

</domain>

<decisions>
## Implementation Decisions

### Windows Install Mechanism
- **D-01:** Windows uses the identical `.ccx` + Creative Cloud Desktop install mechanism as macOS (Phase 1's `distribution/photoshop/build-ccx.js`), **not** a custom unelevated installer built from scratch. This is treated as confirmed, not merely assumed — Phase 1's own finding is that CC Desktop's plugin-registration requirement (raw file-copy never registers a plugin; only CC Desktop's install agent does) is an architectural property of CC Desktop itself, not something specific to macOS. The codebase already documents the `.ccx` builder as OS-agnostic (`distribution/photoshop/macos/README.md`).
- **D-02:** WIN-02 (custom install-time manifest) and WIN-03 (custom "Photoshop is running" detection) are treated as superseded, mirroring Phase 1's MAC-02/MAC-03 outcome — Creative Cloud Desktop owns the install sequence and its own plugin registry end-to-end, leaving no hook for either custom behavior.

### Existing Script Retirement
- **D-03:** Delete `distribution/photoshop/windows/install.bat`, `install.ps1`, `install.sh`, `uninstall.bat`, `uninstall.ps1` outright — same raw-copy model that failed on macOS, and leaving them in place risks a user finding and running a broken installer. (User did not explicitly reply to the final confirmation prompt after two consecutive timeouts; proceeding with the recommended option, which mirrors the already-validated macOS precedent. Easy to revisit — flag if this is wrong.)

### Legacy Cleanup
- **D-04:** No migration/cleanup work needed for old raw-copy Windows installs. Verified directly via `gh release view` on real release data: the `-installer.zip` bundle (which contains the old Windows installer) has **1 total download across all of v1.6.0–v1.6.2** — almost certainly the developer's own testing, not a real customer. Treated as effectively unused; no leftover-file migration story required.

### Uninstall Ownership (WIN-04)
- **D-05:** No custom Windows uninstaller. Rely on Creative Cloud Desktop's own "Manage Plugins" uninstall button, same pattern as macOS. WIN-04's "uninstaller registers under HKEY_CURRENT_USER" requirement is superseded — there's no custom uninstaller left to register anything. (Same no-explicit-reply situation as D-03; proceeding with the recommended option.)

### Windows Device Verification — Deferred ("Nice to Have")
- **D-06:** Explicitly deferred by the user — **not a blocker** for this phase's research, planning, or execution. The open question — "how do we get real confidence the `.ccx` installs cleanly via Creative Cloud Desktop on Windows, given no physical Windows machine and CC Desktop can't be scripted headlessly (GUI + Adobe login required)" — should be revisited closer to when the Windows release actually ships, not resolved now. Candidate options surfaced but **not chosen**: borrow a friend's/coworker's Windows PC for a few minutes, rent a short-lived cloud Windows VM (~$1-2, no lasting setup), or ship on the strength of Mac-parity evidence and watch early user reports. Revisit before shipping, not before planning.

### CI Scope (WIN-05 rescoping)
- Since Creative Cloud Desktop cannot be driven headlessly in CI (requires a GUI and an Adobe account login), a full "installer runs end-to-end, no UAC prompt, uninstaller cleans up" CI job — as WIN-05 is literally worded in ROADMAP.md — is **not achievable as written**. This is a technical rescoping, not a vision decision, so Claude's discretion applies (see below): scope the `windows-latest` CI job to what CAN actually be automated.

### Claude's Discretion
- Exact implementation of the rescoped WIN-05 CI job. Suggested direction (not locked): confirm the `.ccx`/manifest structure is valid when unpacked on a Windows runner, confirm `manifest.json` carries no `requiredPermissions` that would trigger CC Desktop's elevation prompt, confirm the retired raw-copy scripts are actually absent from the built release artifact. Full end-to-end install/uninstall verification is out of reach for CI regardless of implementation — that gap is covered by D-06, not by this CI job.
- Whether/how README or in-package documentation should explain "double-click, then Creative Cloud will guide you" for Windows users specifically — connects to DOCS-01/02 (Phase 5), not this phase's concern to solve, just noting the link so Phase 5 isn't surprised.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Findings (the evidence this phase's decisions rest on)
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` — "CRITICAL ADDENDUM (2026-07-06, post-Wave-4 manual QA): Plugin Discovery Requires Creative Cloud Desktop" section and its follow-up — the core evidence that raw file-copy never registers a plugin with Photoshop on any OS, and that `.ccx`/CC Desktop is the only supported non-Marketplace path
- `.planning/phases/01-foundation-macos-installer-rework/01-CONTEXT.md` — Phase 1 decisions, including D-02 through D-05 marked superseded post-pivot, and D-06 (reuse existing visuals/icons) which still stands and would apply here too if any Windows-facing UI surface exists (unlikely, since CC Desktop owns the install UX)
- `distribution/photoshop/macos/README.md` — explicit statement that `.ccx` packaging "is identical on macOS and Windows and is not an OS-specific mechanism"
- `distribution/photoshop/windows/README.md` — current placeholder describing what Phase 2 was originally scoped to build; superseded by this discussion, worth updating during planning/execution

### Existing Automation to Reuse (not duplicate)
- `distribution/photoshop/build-ccx.js` — the existing cross-platform `.ccx` builder from Phase 1; Phase 2 very likely needs zero new packaging code, just confirmation the same output works via CC Desktop on Windows
- `release/github-release.js`, `release/version.js` — existing host-agnostic release automation, unaffected by this phase

### Project-Level
- `.planning/PROJECT.md` — full milestone context, constraints, Key Decisions table
- `.planning/REQUIREMENTS.md` — WIN-01 through WIN-05 (this phase's requirements) and the note flagging re-verification before assuming they're buildable as literally written
- `.planning/ROADMAP.md` — Phase 2 goal & success criteria (written under the old raw-copy assumption; success criteria #2-5 need re-interpretation per the decisions above, not literal satisfaction)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `distribution/photoshop/build-ccx.js` — cross-platform `.ccx` builder already exists and already works (verified end-to-end on macOS in Phase 1); no new Windows-specific packaging script should be needed
- `scripts/package.js` — orchestrates the overall `npm run package` flow; still contains a separate `-installer.zip` build step resting on the disproven raw-copy assumption on both platforms (flagged in PROJECT.md as "worth a look whenever that script is next touched") — this phase is exactly that moment for the Windows side

### Established Patterns
- `distribution/photoshop/macos/README.md` demonstrates the retirement pattern to follow: keep the directory (for anything genuinely OS-specific later), delete the dead installer scripts, document clearly why the directory still exists and where the real mechanism now lives
- Current Windows scripts (`distribution/photoshop/windows/install.{sh,bat,ps1}`, `uninstall.{bat,ps1}`) — raw file-copy into `%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\...\Plugin\com.guidemygrid.plugin`, unmodified since Phase 1's relocation — these are the files D-03 retires

### Integration Points
- Creative Cloud Desktop's plugin registry is the same integration surface already used on macOS — no new integration code needed on the Windows side, just confirmation of parity
- GitHub Releases already publishes one cross-platform `.ccx` artifact per version — no separate Windows binary needed once the raw-copy scripts are retired

</code_context>

<specifics>
## Specific Ideas

- Real download data was used to resolve the legacy-cleanup question rather than guessing: `gh release view` showed the old Windows `-installer.zip` at 1 total download across v1.6.0–v1.6.2, effectively confirming it was never used by a real customer.
- The user is non-technical (Product Designer) and explicitly asked to be guided through these decisions with recommendations and concrete consequences rather than open-ended technical tradeoffs — this phase leaned heavily on "here's the evidence, here's my recommendation" framing, which worked well and should carry into planning/execution communications for this phase too.

</specifics>

<deferred>
## Deferred Ideas

- **Windows device verification method** (nice-to-have, explicitly deferred by the user) — revisit before this phase actually ships to real customers, not before planning/research/execution starts. See D-06.

No scope-creep items surfaced this session — discussion stayed within Windows installer parity, script retirement, and CI scope.

</deferred>

---

*Phase: 2-Windows Installer Rework*
*Context gathered: 2026-07-06*
