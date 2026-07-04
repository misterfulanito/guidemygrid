# Project Research Summary

**Project:** GuideMyGrid — Trustworthy Self-Distribution
**Domain:** Self-distributed, unsigned desktop installer/updater for a UXP Photoshop plugin (macOS + Windows), distributed via GitHub Releases + Gumroad
**Researched:** 2026-07-04
**Confidence:** MEDIUM

## Executive Summary

This milestone replaces GuideMyGrid's root-requiring macOS `.pkg` installer and bare Windows `.bat` script with proper, user-level installers on both platforms, backed by published checksums, a manifest-driven uninstaller, and a Gumroad+GitHub Releases distribution flow — all without paid OS code signing. Experts building trustworthy self-distributed software in this exact situation (no Apple Developer Program, no Windows signing cert) converge on the same pattern: you cannot make Gatekeeper/SmartScreen warnings disappear, so the entire strategy is to make the warning less scary (plain-language explainers, screenshotted one-time-override instructions) and back it with independently verifiable integrity (SHA256 checksums, and eventually a signed update manifest). Critically, the current `.pkg` installer's root requirement is not a configuration choice but a property of the `.pkg` format itself — since the actual destination (`~/Library/Application Support/Adobe/UXP/...`) is already inside the user's home directory, root was never structurally needed, and dropping `.pkg` for an `osacompile`-built `.app` (or equivalent unprivileged script) removes the single biggest security/trust liability in one move.

The recommended approach: macOS installer via `osacompile` (ad-hoc signed, wrapped in a `create-dmg` DMG); Windows installer via NSIS with `RequestExecutionLevel user` (compilable from macOS via Homebrew, no Windows machine needed); both write only to user-writable folders and never invoke elevation. Distribution architecture should introduce a clean `distribution/<host>/` (host-specific packaging/install) vs `release/` (host-agnostic checksum/GitHub-publish/Gumroad-sync automation) split — cheap now, and the one investment that actually protects a future Illustrator/Figma expansion, since those hosts use entirely different manifest/runtime models from UXP and do not warrant any shared code beyond the release-automation layer.

The primary risks are: (1) the existing `.pkg` root-elevation pattern is a real, documented privilege-escalation class (root-run postinstall scripts sourcing user-controlled `$HOME`/`$PATH`), (2) checksums are worthless if nothing in the update flow actually verifies them before executing the downloaded file — and the in-app updater is currently disconnected dead code, so "publish checksums" must include wiring real verification into whatever completes that flow, and (3) leftover install artifacts ("breadcrumbs") are both a security surface (world-writable stray files) and the single fastest way to undermine the "trustworthy" positioning with exactly the security-conscious users this milestone targets. All three are directly actionable via the Active requirements already listed in PROJECT.md.

## Key Findings

### Recommended Stack

Replace `pkgbuild` with `osacompile` (built into macOS, ships with Xcode CLT) to build a double-clickable, ad-hoc-signed `.app` installer that copies files as the current user — never root — wrapped in a `create-dmg`-built DMG for distribution. Replace the bare Windows `.bat` with an NSIS installer (`RequestExecutionLevel user`), compiled via Homebrew's `makensis` directly from the existing macOS build machine — no Windows CI/VM required. Checksums use Node's built-in `crypto` module to generate `SHA256SUMS.txt`; GitHub Releases now also auto-computes digests natively (since June 2025), but publishing a plain-text manifest keeps verification accessible without API calls.

**Core technologies:**
- `osacompile` (macOS built-in) — user-level installer app, no elevation possible by construction
- `codesign --sign -` (ad-hoc) — free signing that slightly softens (doesn't remove) the Gatekeeper dialog
- `create-dmg` (npm) — wraps installer in a clean single-icon DMG, `--no-code-sign` flag built for exactly this no-cert scenario
- NSIS / `makensis` (Homebrew) — Windows installer wizard, unelevated, cross-compilable from macOS
- Node `crypto` — SHA256 checksum manifest generation, zero new dependency

### Expected Features

**Must have (table stakes):**
- Plain-language "why this warning appears" explainer with screenshots, shown before the user hits the OS block
- Published SHA256 checksum per release artifact with copy-paste verify steps
- Manifest-driven uninstaller guaranteeing zero leftover files/logs/prefs
- Close-app-before-install/uninstall guard on both platforms
- Preserve existing manual update-banner-to-browser flow and GitHub-API-only network allowlisting (don't regress)

**Should have (competitive):**
- In-app changelog display next to the update banner (near-free — release notes already fetched)
- Automated checksum generation as part of the release script (removes human error)
- "Previous version" rollback link on the download page (GitHub Releases already retains all assets)

**Defer (v2+):**
- Signed update manifest (EdDSA/minisign-style signing of the update-check response) — real engineering lift, do after checksums prove out
- One-click in-app update — should not ship ahead of the signed manifest
- Illustrator/Figma installer variants — explicitly out of scope, architecture should not block it

### Architecture Approach

The three candidate host apps (Photoshop/UXP, Illustrator/CEP, Figma) use genuinely different manifest and install mechanisms — there is no shared "installer abstraction" worth building across them. The only layer that's genuinely reusable across any future host is release automation (checksums, GitHub Release publish, Gumroad sync), because it operates on build artifacts and version strings, not host-specific paths. Recommended structure: `distribution/photoshop/{macos,windows}` for host-specific packaging/install, sibling to a generic `release/` directory (`version.js`, `checksums.js`, `github-release.js`, `gumroad-sync.js`) that never contains host-specific path literals. `src/services/updateChecker.ts` stays in `src/` as in-app runtime code, structurally separate from build-time distribution tooling.

**Major components:**
1. Host-specific packager (`distribution/photoshop/{macos,windows}`) — turns build output into `.dmg`/NSIS `.exe`, no elevation
2. Release orchestrator (`release/`) — host-agnostic: checksum → GitHub Release → Gumroad sync, driven by file paths + version string
3. In-app update checker (`src/services/updateChecker.ts`) — existing runtime code, reads GitHub Releases API, unchanged boundary from the release pipeline

### Critical Pitfalls

1. **`.pkg` installers always elevate to root, regardless of destination** — confirmed already present in the current v1.6.1-1.6.2 macOS installer per PROJECT.md; this is the highest-priority fix. Replace with `osacompile`/unprivileged script; verify zero `sudo`/password prompts in manual testing.
2. **Checksums published but never verified before execution** — the in-app updater is currently dead code (per codebase CONCERNS.md), so "publish SHA256" alone is security theater unless verification is actually wired into the download→install path, fails closed on mismatch, and downloads to a non-predictable path to avoid TOCTOU substitution.
3. **Leftover install/uninstall artifacts ("breadcrumbs")** — requires an install-time manifest of every path created, consumed deterministically by the uninstaller; add an automated install→uninstall filesystem-diff regression check (already scoped in PROJECT.md's Active requirements).
4. **Trusting inherited `$HOME`/`$PATH` inside install/uninstall scripts** — use absolute binary paths, validate destination paths, never implicitly source shell rc files; must be checked directly by reading the actual current `.pkg` postinstall and `.bat` script contents during the planned security review.
5. **Telling users to disable Gatekeeper/SmartScreen entirely** rather than walking through the narrow one-time per-file override — actively worse for security and reads as a red flag to any moderately technical user; document only the built-in per-file overrides with screenshots.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: macOS user-level installer rework
**Rationale:** Highest-severity, highest-confidence fix (documented root-elevation pattern, already flagged in PROJECT.md as present); self-contained to one platform; establishes the `distribution/photoshop/macos/` pattern the rest of the milestone follows.
**Delivers:** `osacompile`-built, ad-hoc-signed `.app` installer wrapped in a `create-dmg` DMG; install-time manifest for later uninstaller work; verified zero elevation/password prompts.
**Addresses:** Table-stakes uninstaller/leftover-file requirements (manifest groundwork), close-app guard.
**Avoids:** Pitfall 1 (root elevation), Pitfall 2 (env/PATH trust) — audit the new script for absolute paths and no implicit env trust from the start rather than retrofitting.

### Phase 2: Windows user-level installer rework
**Rationale:** Same category of fix as Phase 1, applied to the second platform; can reuse the manifest-driven uninstall pattern and install-time-manifest concept established in Phase 1.
**Delivers:** NSIS installer (`RequestExecutionLevel user`) compiled via Homebrew `makensis` from the existing macOS build machine, targeting `%APPDATA%\...` only; registered uninstaller under `HKEY_CURRENT_USER`.
**Uses:** NSIS/`makensis` stack elements from STACK.md.
**Implements:** `distribution/photoshop/windows/` per the recommended project structure.

### Phase 3: Manifest-driven uninstaller (both platforms) + checksum publishing
**Rationale:** Depends on both installers writing an install-time manifest (Phases 1-2); this is the phase that closes the "no breadcrumbs" trust requirement and adds the independently-verifiable-integrity requirement — natural pairing since both are release-time integrity concerns.
**Delivers:** Uninstallers that consume the install-time manifest for exact, symmetric removal; SHA256 checksum generation wired into the release process (`release/checksums.js`); automated install→uninstall filesystem-diff regression check.
**Addresses:** Table-stakes "no leftover files" and "published checksums" requirements from FEATURES.md.
**Avoids:** Pitfall 3 (checksums published but unverified) — flag that verification wiring into the update flow may need its own follow-up since the updater is currently disconnected; Pitfall 4 (leftover artifacts).

### Phase 4: Release automation + Gumroad sync
**Rationale:** Depends on Phases 1-3 producing real artifacts to publish; establishes the host-agnostic `release/` layer (GitHub Release publish, Gumroad sync) that protects future Illustrator/Figma expansion cheaply.
**Delivers:** `release/github-release.js`, `release/gumroad-sync.js` (or documented manual step if Gumroad's API doesn't support it), decision on Gumroad-links-to-GitHub vs. duplicate-hosted binary.
**Uses:** GitHub Releases native SHA256 digests, `gh` CLI groundwork already in place.
**Implements:** `release/` component from ARCHITECTURE.md, Pattern 1 (per-host packager, shared release orchestrator).

### Phase 5: Trust/UX polish — explainers, docs, security review
**Rationale:** Comes last because it depends on the real install flow (Phases 1-2) and real checksums (Phase 3) existing to document accurately; also covers the planned security review, which should read the actual finished scripts rather than an in-progress version.
**Delivers:** Plain-language Gatekeeper/SmartScreen explainer with screenshots (both OSes), README rewrite (removes obsolete CC Desktop `.ccx` documentation), line-by-line security review of both installer/uninstaller scripts for env/PATH trust issues; closes remaining table-stakes and moderate-pitfall items (ambiguous security instructions, documentation drift).

### Phase Ordering Rationale

- Installers must exist before uninstall-manifest and checksum work can be built against them (strict dependency: Phase 1-2 → Phase 3).
- Release automation (Phase 4) depends on Phase 3's checksum generation and needs stable artifact-producing installers to publish.
- Documentation/trust-UX work (Phase 5) is deliberately last so it accurately describes the finished flow rather than an interim state, and so the planned security review examines final code, not a moving target.
- Splitting macOS and Windows into separate phases (1, 2) follows the architecture recommendation that they are genuinely different mechanisms, not two configurations of one mechanism — mixing them into one phase risks conflating unrelated toolchains.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (checksum verification wiring):** The in-app updater is currently dead/disconnected code — wiring real verification into a download→execute flow with TOCTOU-safe handling needs focused design, not just "add a checksum file."
- **Phase 4 (Gumroad sync):** Whether Gumroad's public API supports updating an existing product's file/URL for automation, vs. a documented manual step, is unresolved and needs verification before committing to scripted sync.

Phases with standard patterns (skip research-phase):
- **Phase 1 & 2 (installer rework):** Mechanisms (`osacompile`, ad-hoc codesign, NSIS `RequestExecutionLevel user`) are well-documented, MEDIUM-confidence but cross-checked across multiple independent sources and official tool docs.
- **Phase 5 (docs/explainers):** Standard, low-complexity documentation work with clear precedent (Apple/Microsoft's own support docs for the override flows).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core mechanisms (osacompile, ad-hoc signing, NSIS unelevated) cross-checked across official tool docs and multiple independent sources; no single vendor guide covers the whole "unsigned self-distribution" stack end-to-end. |
| Features | MEDIUM | Web-sourced UX/security-practice consensus (Gatekeeper/SmartScreen mechanics from Apple/Microsoft docs are solid; competitor analysis and Gumroad-specific claims are lower confidence/anecdotal). |
| Architecture | HIGH/MEDIUM | UXP manifest/host mechanics confirmed via official Adobe docs (HIGH); Illustrator UXP availability and Figma packaging specifics are community-sourced with no first-party roadmap commitment (MEDIUM). |
| Pitfalls | MEDIUM | Mechanism descriptions (why `.pkg` elevates, how Gatekeeper/SmartScreen work) are reliable, cross-referenced against a real GHSA security advisory and MITRE ATT&CK; specific numeric claims (SmartScreen reputation timelines) are directional only. |

**Overall confidence:** MEDIUM

### Gaps to Address

- The `productbuild --domains enable_currentUserHome` flakiness claim (potential alternative to dropping `.pkg` entirely) rests on a single LOW-confidence forum report — not needed if going with `osacompile`, but should not be revisited without hands-on testing if it ever comes up.
- Exact current wording/appearance of the macOS "cannot be opened" dialog for an ad-hoc-signed (vs. fully unsigned) app was not independently screenshot-confirmed — recommend a quick manual build-and-test early in Phase 1 to capture accurate dialog text/screenshots for the Phase 5 install guide.
- Whether the current `.pkg` postinstall script and Windows `.bat` actually contain `$HOME`/`$PATH` trust issues (Pitfall 2) is UNKNOWN without reading the actual script source — flagged explicitly for the security review in Phase 5 (or earlier, during Phase 1/2 planning, to inform the rewrite rather than just audit it after the fact).
- Gumroad's API capability for scripted product-file updates is unconfirmed — Phase 4 planning should verify this directly before committing to an automation approach vs. a documented manual/checklist process.
- The in-app update checker's current fully-disconnected state (per codebase CONCERNS.md) means the "publish checksums" requirement and "wire up verification" requirement are more intertwined than PROJECT.md's Active requirements list suggests — Phase 3 planning should treat re-connecting the updater as in-scope, not assume it already works.

## Sources

### Primary (HIGH confidence)
- [UXP Manifest v5 — Adobe Developer docs](https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/) — manifest/host mechanics
- [Figma Plugin Manifest — Figma Developer Docs](https://www.figma.com/plugin-docs/manifest/) — confirms unrelated schema/runtime to UXP
- [Sparkle: open source software update framework for macOS](https://sparkle-project.org/documentation/) — update-signing patterns

### Secondary (MEDIUM confidence)
- [Microsoft Learn: SmartScreen reputation for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) — SmartScreen mechanics, EV cert no longer bypasses it
- [GitHub Changelog: Releases now expose digests for release assets](https://github.blog/changelog/2025-06-03-releases-now-expose-digests-for-release-assets/) — native checksum support
- [Eclectic Light Company: Gatekeeper and notarization in Sequoia](https://eclecticlight.co/2024/08/10/gatekeeper-and-notarization-in-sequoia/) — Gatekeeper flow, override expiry
- [NSIS official docs: RequestExecutionLevel](https://nsis.sourceforge.io/Reference/RequestExecutionLevel) / [Homebrew Formula: makensis](https://formulae.brew.sh/formula/makensis) — cross-compile toolchain
- [HackTricks: macOS Installers Abuse](https://hacktricks.wiki/en/macos-hardening/macos-security-and-privilege-escalation/macos-files-folders-and-binaries/macos-installers-abuse.html) / [root3nl/SupportApp GHSA advisory](https://github.com/root3nl/SupportApp/security/advisories/GHSA-jr78-247f-rhqc) — real-world `.pkg` root exploit pattern
- [MITRE ATT&CK T1574.007](https://attack.mitre.org/techniques/T1574/007/) — PATH hijacking taxonomy

### Tertiary (LOW confidence)
- [Apple Developer Forums: pkg without admin password](https://developer.apple.com/forums/thread/661733) — single forum report, needs hands-on validation if revisited
- [Indie Hackers / Freemius posts on Gumroad](https://www.indiehackers.com/post/what-am-i-missing-about-gumroad-e941472758) — anecdotal, Gumroad API/UX specifics need direct verification
- [electron-builder issue #6347: NSIS flagged as trojan](https://github.com/electron-userland/electron-builder/issues/6347) — anecdotal AV false-positive risk, corroborated by official NSIS wiki

### Internal
- `.planning/PROJECT.md` — primary source for current installer state, milestone scope, key decisions
- `.planning/codebase/CONCERNS.md` (referenced by PITFALLS.md) — confirms update-checker is currently disconnected dead code

---
*Research completed: 2026-07-04*
*Ready for roadmap: yes*
