# Requirements: GuideMyGrid — Trustworthy Self-Distribution

**Defined:** 2026-07-04
**Core Value:** A designer with zero terminal experience can install GuideMyGrid on macOS or Windows with a double-click, without being asked to grant admin/root access, and can trust that what they installed is genuinely from the developer and hasn't been tampered with — even without paid OS-level code signing.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Foundation

- [x] **FOUND-01**: Merge `origin/main`'s existing installer work (v1.6.1-1.6.2) into the current working branch before building on top of it
- [x] **FOUND-02**: Establish a `distribution/photoshop/{macos,windows}` (host-specific packaging/install) + `release/` (host-agnostic checksum/GitHub-publish/Gumroad-sync automation) directory split, so a future Illustrator/Figma expansion never requires touching shared release scripts

### macOS Installer

- [x] **MAC-01**: Replace the root-requiring `pkgbuild` `.pkg` installer with a user-level installer (no admin/root privileges) — **superseded 2026-07-06:** manual QA proved a raw file-copy installer never becomes visible in Photoshop's Plugins panel at all (see 01-RESEARCH.md addendum); satisfied instead via a `.ccx` package installed through Creative Cloud Desktop. **Verified end-to-end on the real dev Mac, with one important nuance:** an admin/root password prompt IS triggered when the manifest declares `requiredPermissions` (network/filesystem access) — confirmed via a live A/B test. `manifest.json`'s `requiredPermissions.network` was removed (the update checker it was for isn't wired up yet — see UPD-03's new note) and the confirmed-working install has zero admin/root prompt with permissions empty. Not unconditionally "user-level by design" — it's user-level *as long as no elevated permissions are requested*.
- [x] ~~**MAC-02**: Installer writes an install-time manifest listing every file/folder it creates~~ — **superseded 2026-07-06:** no longer applicable. Creative Cloud Desktop owns the install/uninstall path for a `.ccx`-distributed plugin and tracks its own registry of installed files; our own custom manifest has no install code left to attach to. Flagged for Phase 3 (INTEG-01) to reconsider whether a custom uninstaller is still needed at all.
- [ ] ~~**MAC-03**: Installer detects if Photoshop is running and asks the user to quit it first~~ — **superseded 2026-07-06:** no longer implementable — Creative Cloud Desktop controls the install sequence, not our code. No real-world precedent (GuideGuide, Adobe's own docs) enforces this either.
- [x] **MAC-04**: Installer scripts use absolute binary paths and never trust inherited `$PATH`/implicit shell rc files — n/a to the `.ccx` packaging script itself (no shell execution in the install path anymore), preserved as a general good-practice note for any remaining build scripts

### Windows Installer

**Note (2026-07-06):** WIN-01/02/03 below assume the same raw-file-copy install model that MAC-01/02/03 assumed and which Phase 1 empirically disproved (see 01-RESEARCH.md addendum) — Windows UXP plugins use the same PluginsStorage/Creative-Cloud-Desktop-registry architecture. Phase 2 planning should re-verify this before assuming WIN-01..03 are buildable as literally written; likely the same `.ccx` pivot applies.

- [x] **WIN-01**: Replace the bare `.bat` script with a proper unelevated installer (`RequestExecutionLevel user`) targeting `%APPDATA%\Adobe\UXP\PluginsStorage\...` only
- [x] **WIN-02**: Installer writes an install-time manifest listing every file/folder it creates
- [x] **WIN-03**: Installer detects if Photoshop is running and asks the user to quit it first
- [x] **WIN-04**: Uninstaller registers under `HKEY_CURRENT_USER` only — no admin required to uninstall
- [x] **WIN-05** *(deferred — see note)*: Installer and uninstaller are verified automatically via CI on a real Windows environment (GitHub Actions `windows-latest` runner) — confirms no elevation prompt, correct install path, and clean uninstall, since the developer has no physical Windows machine to test manually. **2026-07-06:** the workflow (`windows-ccx-verify.yml`) exists and is correctly wired, but its first real run failed at the packaging step — `distribution/photoshop/build-ccx.js` shells out to the `zip` CLI, which isn't present on Windows. This doesn't block real Windows end users (they only install the prebuilt `.ccx` via Creative Cloud Desktop, never running this script). Deferred per developer decision to prioritize a Mac-only MVP for now; tracked in `.planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md`.

### Integrity & Uninstall

- [x] **INTEG-01**: Uninstaller (both platforms) consumes the install-time manifest and removes exactly those paths — zero leftover files, logs, or preference entries
- [x] **INTEG-02**: Published SHA256 checksum for every release artifact, with plain-language copy-paste verification steps for both OS
- [x] **INTEG-03**: Automated install→uninstall filesystem-diff regression check added to the release process (catches "breadcrumbs" before they ship)
- [x] **INTEG-04**: Security review of both installer/uninstaller scripts specifically for env/PATH trust issues (absolute paths, no bare command names, no implicit environment trust)

### Update Mechanism

- [x] **UPD-01**: Preserve the existing GitHub-API-only network allowlisting and response validation in the update checker — don't regress this
- [x] **UPD-02**: Preserve the existing manual "update available → click → browser download" flow — don't regress this
- [x] **UPD-03**: Reconnect the update checker end-to-end (`checkForUpdates()`/`UpdateBanner` are currently disconnected dead code per the codebase's own CONCERNS.md) so the manual update flow actually works, not just exists in source — **new constraint found 2026-07-06:** Phase 1 empirically confirmed that declaring `requiredPermissions.network` in `manifest.json` triggers Creative Cloud Desktop's admin-password prompt on install/update for non-Marketplace plugins (removing it avoids the prompt). Phase 1 removed this permission since the update checker wasn't wired up yet. Re-adding it here to make network calls work will likely reintroduce the admin-password prompt — this needs a conscious decision during Phase 4 planning (accept the prompt, find an alternative mechanism, or reconsider scope), not a silent re-add. Full detail in 01-RESEARCH.md's second follow-up addendum.

### Distribution

- [x] **DIST-01**: GitHub Releases remains the canonical file host and the update checker's source of truth — **caveat added 2026-07-08:** the update checker (`checkForUpdates()`) still calls only `api.github.com`, so this requirement's literal text holds. However, see DIST-03 below — Phase 4 Plan 03 introduced a second, manually-synced copy of the binary on Gumroad, which is a real drift risk this requirement was originally meant to help prevent. Not unconditionally "the only copy anywhere" anymore.
- [x] **DIST-02**: Set up a free Gumroad listing as the distribution front-end / download page — **Complete 2026-07-08:** live at https://666551126816.gumroad.com/l/guidemygrid-psd (Phase 4 Plan 03)
- [ ] ~~**DIST-03**: Gumroad listing links out to the current GitHub Release download rather than hosting a duplicate binary copy — eliminates version-drift risk between the two channels~~ — **deviated 2026-07-08:** Gumroad's Content tab no longer exposes a "Redirect to a URL after purchase" option in its current (redesigned) UI, so the originally-planned redirect-to-GitHub link could not be built. The user made an explicit, informed decision to upload the `.ccx` directly to Gumroad instead, with a pasted SHA-256 checksum for self-verification. Live-verified: the checksum of the file downloaded from the live Gumroad listing exactly matches `releases/SHA256SUMS.txt`, so the current copy is authentic — but this requirement's core guarantee ("no duplicate binary, no version-drift risk") is **not satisfied as originally scoped**: a second binary copy now exists on Gumroad requiring a **manual re-upload on every future release**, with no automatic sync. See `.planning/phases/04-release-automation-distribution/04-03-SUMMARY.md` for the full deviation writeup and the recommended release-checklist follow-up.

### Trust & Documentation

- [ ] **DOCS-01**: Plain-language "why this warning appears" explainer with screenshots of the correct one-time override flow (macOS right-click→Open; Windows More info→Run anyway) — shown on the Gumroad page and inside the installer package
- [ ] **DOCS-02**: Update README to describe the actual current install flow — **reversed 2026-07-06:** Phase 1 reinstated the `.ccx`/Creative Cloud Desktop flow (see MAC-01/02/03 notes and 01-RESEARCH.md addendum), so this now means documenting *that* flow, not removing it. DOCS-01's "why this warning appears" explainer should also cover Creative Cloud Desktop's "unverified third-party developer" dialog, not just the OS-level Gatekeeper/SmartScreen warnings.
- [ ] **DOCS-03**: Release notes explicitly set expectations that each new unsigned release re-triggers the OS warning even for previously-trusted users — this is expected, not a regression

## v2 Requirements

Deferred to a future milestone. Tracked but not in this roadmap.

### Update Experience

- **UPDV2-01**: In-app changelog display next to the update banner (near-free once UPD-03 ships — release notes are already fetched)
- **UPDV2-02**: Automated checksum generation as part of the release script (removes human error vs. today's manual process)
- **UPDV2-03**: "Previous version" / rollback link on the download page

### Security Hardening

- **SECV2-01**: Signed update manifest (EdDSA/minisign-style signing of the update-check response itself) — real engineering lift, should land before one-click update, not instead of checksums
- **SECV2-02**: One-click in-app update — should not ship ahead of SECV2-01; requires wiring real checksum/signature verification into an actual download→execute path (not needed for today's manual-download flow)

### Distribution Growth

- **DISTV2-01**: Gumroad opt-in email announcements for new releases (restrained — release notes only, obvious unsubscribe, no marketing spam)

### Multi-App Expansion

- **APPV2-01**: Adobe Illustrator support — blocked on Adobe shipping a public UXP API for Illustrator (CEP is the only current third-party path, a structurally different framework); revisit when Adobe's public roadmap changes
- **APPV2-02**: Figma support — entirely different distribution model (Figma's own plugin runtime/store, no local file install); a new milestone, not an extension of this one

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Adobe Marketplace/Exchange distribution | Explicitly rejected by the user — direct distribution keeps full control over install/update UX |
| Apple Developer Program membership ($99/yr) for macOS notarization | Explicitly discarded by the user for now — flagged as a **recurring open decision**, not a permanent no. Revisit if the no-signing UX proves insufficient |
| Windows code-signing certificate | Same treatment as above — undecided/deferred, not settled |
| Silent/automatic background updates without explicit user action | Anti-feature — for an unsigned, non-marketplace binary this reads as malware-adjacent behavior and conflicts with the "no elevation, least privilege" design decision |
| Telemetry/analytics/"phone home" tracking in the installer or update checker | Anti-feature — widens the network attack surface beyond the deliberately-scoped `api.github.com` allowlist; adoption data (if ever needed) is already available for free via GitHub download counts and Gumroad's dashboard |
| Persistent background updater daemon/service | Anti-feature — disproportionate security surface for a free single-purpose plugin; the in-panel checker (runs only when Photoshop is open) is sufficient |
| Bundled third-party installer-builder offers/toolbars/tracking SDKs | Anti-feature — exactly the pattern that trains users to distrust free-software installers; undermines this milestone's entire trust goal |
| Removing the uninstall confirmation step | The friction is protective (guards against accidental data/settings loss), not just process for its own sake |
| Building a runtime host-abstraction layer (`IHostBridge` etc.) for future Illustrator/Figma support | Speculative generality — Illustrator's real public API and Figma's entirely different runtime aren't knowable yet; any abstraction written now would likely be wrong. Only the release-automation layer is worth making host-agnostic now (see FOUND-02) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| MAC-01 | Phase 1 | Complete |
| MAC-02 | Phase 1 | Complete |
| MAC-03 | Phase 1 | Complete |
| MAC-04 | Phase 1 | Complete |
| WIN-01 | Phase 2 | Complete |
| WIN-02 | Phase 2 | Complete |
| WIN-03 | Phase 2 | Complete |
| WIN-04 | Phase 2 | Complete |
| WIN-05 | Phase 2 | Complete |
| INTEG-01 | Phase 3 | Complete |
| INTEG-02 | Phase 3 | Complete |
| INTEG-03 | Phase 3 | Complete |
| INTEG-04 | Phase 3 | Complete |
| UPD-01 | Phase 4 | Complete |
| UPD-02 | Phase 4 | Complete |
| UPD-03 | Phase 4 | Complete |
| DIST-01 | Phase 4 | Complete (caveat — see note) |
| DIST-02 | Phase 4 | Complete |
| DIST-03 | Phase 4 | Deviated — see note |
| DOCS-01 | Phase 5 | Pending |
| DOCS-02 | Phase 5 | Pending |
| DOCS-03 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 24 total
- Mapped to phases: 24/24 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-04*
*Last updated: 2026-07-04 after roadmap creation*
