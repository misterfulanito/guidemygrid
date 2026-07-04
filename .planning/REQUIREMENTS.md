# Requirements: GuideMyGrid — Trustworthy Self-Distribution

**Defined:** 2026-07-04
**Core Value:** A designer with zero terminal experience can install GuideMyGrid on macOS or Windows with a double-click, without being asked to grant admin/root access, and can trust that what they installed is genuinely from the developer and hasn't been tampered with — even without paid OS-level code signing.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Foundation

- [x] **FOUND-01**: Merge `origin/main`'s existing installer work (v1.6.1-1.6.2) into the current working branch before building on top of it
- [x] **FOUND-02**: Establish a `distribution/photoshop/{macos,windows}` (host-specific packaging/install) + `release/` (host-agnostic checksum/GitHub-publish/Gumroad-sync automation) directory split, so a future Illustrator/Figma expansion never requires touching shared release scripts

### macOS Installer

- [x] **MAC-01**: Replace the root-requiring `pkgbuild` `.pkg` installer with a user-level installer (no admin/root privileges) that copies the plugin into `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/...`
- [x] **MAC-02**: Installer writes an install-time manifest listing every file/folder it creates (foundation for the uninstaller's "no breadcrumbs" guarantee)
- [ ] **MAC-03**: Installer detects if Photoshop is running and asks the user to quit it first, rather than risking a partial install
- [x] **MAC-04**: Installer scripts use absolute binary paths and never trust inherited `$PATH`/implicit shell rc files

### Windows Installer

- [ ] **WIN-01**: Replace the bare `.bat` script with a proper unelevated installer (`RequestExecutionLevel user`) targeting `%APPDATA%\Adobe\UXP\PluginsStorage\...` only
- [ ] **WIN-02**: Installer writes an install-time manifest listing every file/folder it creates
- [ ] **WIN-03**: Installer detects if Photoshop is running and asks the user to quit it first
- [ ] **WIN-04**: Uninstaller registers under `HKEY_CURRENT_USER` only — no admin required to uninstall
- [ ] **WIN-05**: Installer and uninstaller are verified automatically via CI on a real Windows environment (GitHub Actions `windows-latest` runner) — confirms no elevation prompt, correct install path, and clean uninstall, since the developer has no physical Windows machine to test manually

### Integrity & Uninstall

- [ ] **INTEG-01**: Uninstaller (both platforms) consumes the install-time manifest and removes exactly those paths — zero leftover files, logs, or preference entries
- [ ] **INTEG-02**: Published SHA256 checksum for every release artifact, with plain-language copy-paste verification steps for both OS
- [ ] **INTEG-03**: Automated install→uninstall filesystem-diff regression check added to the release process (catches "breadcrumbs" before they ship)
- [ ] **INTEG-04**: Security review of both installer/uninstaller scripts specifically for env/PATH trust issues (absolute paths, no bare command names, no implicit environment trust)

### Update Mechanism

- [ ] **UPD-01**: Preserve the existing GitHub-API-only network allowlisting and response validation in the update checker — don't regress this
- [ ] **UPD-02**: Preserve the existing manual "update available → click → browser download" flow — don't regress this
- [ ] **UPD-03**: Reconnect the update checker end-to-end (`checkForUpdates()`/`UpdateBanner` are currently disconnected dead code per the codebase's own CONCERNS.md) so the manual update flow actually works, not just exists in source

### Distribution

- [ ] **DIST-01**: GitHub Releases remains the canonical file host and the update checker's source of truth
- [ ] **DIST-02**: Set up a free Gumroad listing as the distribution front-end / download page
- [ ] **DIST-03**: Gumroad listing links out to the current GitHub Release download rather than hosting a duplicate binary copy — eliminates version-drift risk between the two channels (verify Gumroad's product-page options support this before committing to any other sync approach)

### Trust & Documentation

- [ ] **DOCS-01**: Plain-language "why this warning appears" explainer with screenshots of the correct one-time override flow (macOS right-click→Open; Windows More info→Run anyway) — shown on the Gumroad page and inside the installer package
- [ ] **DOCS-02**: Update README to describe the actual current install flow, removing the obsolete Creative Cloud Desktop `.ccx` instructions
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
| MAC-03 | Phase 1 | Pending |
| MAC-04 | Phase 1 | Complete |
| WIN-01 | Phase 2 | Pending |
| WIN-02 | Phase 2 | Pending |
| WIN-03 | Phase 2 | Pending |
| WIN-04 | Phase 2 | Pending |
| WIN-05 | Phase 2 | Pending |
| INTEG-01 | Phase 3 | Pending |
| INTEG-02 | Phase 3 | Pending |
| INTEG-03 | Phase 3 | Pending |
| INTEG-04 | Phase 3 | Pending |
| UPD-01 | Phase 4 | Pending |
| UPD-02 | Phase 4 | Pending |
| UPD-03 | Phase 4 | Pending |
| DIST-01 | Phase 4 | Pending |
| DIST-02 | Phase 4 | Pending |
| DIST-03 | Phase 4 | Pending |
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
