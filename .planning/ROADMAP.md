# Roadmap: GuideMyGrid — Trustworthy Self-Distribution

## Overview

This milestone takes GuideMyGrid from a root-requiring, unsigned macOS installer and a bare Windows `.bat` script to a fully user-level, verifiably-trustworthy self-distribution flow on both platforms. The work proceeds in dependency order: first sync and reorganize the codebase and fix the macOS installer (the highest-severity, already-documented root-elevation issue), then bring Windows to the same standard, then close the "no breadcrumbs" and "verifiable integrity" gaps with a manifest-driven uninstaller and published checksums, then wire release automation (GitHub + Gumroad) and reconnect the dead in-app update checker, and finally document the finished flow so a non-technical designer can install, trust, and update the plugin with confidence — all without paid OS code signing.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & macOS Installer Rework** - Merge existing installer work, establish the host-agnostic directory split, and replace the root-requiring `.pkg` with a user-level macOS installer
- [ ] **Phase 2: Windows Installer Rework** - Replace the bare `.bat` script with a proper unelevated Windows installer using the same manifest pattern
- [ ] **Phase 3: Manifest-Driven Uninstall & Checksum Integrity** - Symmetric, breadcrumb-free uninstall on both platforms plus published, verifiable release checksums
- [ ] **Phase 4: Release Automation & Distribution** - GitHub Release + Gumroad sync, and a working (not dead) in-app update checker
- [ ] **Phase 5: Trust & Documentation Polish** - Plain-language warning explainers, accurate README, and expectation-setting release notes

## Phase Details

### Phase 1: Foundation & macOS Installer Rework

**Goal**: The codebase is synced and reorganized for host-specific packaging, and a designer can install GuideMyGrid on macOS at user level without ever being asked for an admin/root password
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, MAC-01, MAC-02, MAC-03, MAC-04
**Success Criteria** (what must be TRUE):

  1. The working branch contains all of origin/main's installer work (v1.6.1-1.6.2) merged in with no unresolved conflicts, and the repo has a `distribution/photoshop/{macos,windows}` + `release/` directory split ready for host-specific and release-automation work
  2. A designer can double-click the macOS installer and it completes without ever prompting for an admin/root password
  3. If Photoshop is running, the installer detects it and asks the user to quit before proceeding, rather than risking a partial install
  4. After installing, an install-time manifest file exists listing every file/folder the installer created
  5. The installer script uses only absolute binary paths and never relies on inherited `$PATH` or shell rc files

**Plans**: 3/4 plans executed
**Wave 1**

- [x] 01-01-PLAN.md — Merge origin/main into epic/ui-icons (+ manifest schema decision) [FOUND-01]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Establish distribution/photoshop/{macos,windows} + release/ directory split [FOUND-02]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Unprivileged install-payload core + manifest + Nyquist validation harness [MAC-01, MAC-02, MAC-04]

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-04-PLAN.md — Installer .app + DMG build + Photoshop hard block + end-to-end QA [MAC-01, MAC-03, MAC-04]

### Phase 2: Windows Installer Rework

**Goal**: A designer can install GuideMyGrid on Windows at user level without any admin/UAC elevation, following the same manifest-based pattern established on macOS
**Depends on**: Phase 1
**Requirements**: WIN-01, WIN-02, WIN-03, WIN-04, WIN-05
**Success Criteria** (what must be TRUE):

  1. A designer can double-click the Windows installer and it completes without a UAC admin elevation prompt
  2. The installer copies the plugin only into `%APPDATA%\Adobe\UXP\PluginsStorage\...`
  3. If Photoshop is running, the installer detects it and asks the user to quit before proceeding
  4. After installing, an install-time manifest file exists listing every file/folder the installer created
  5. The uninstaller registers under `HKEY_CURRENT_USER` only, so uninstalling never requires admin rights
  6. A GitHub Actions `windows-latest` CI job runs the installer and uninstaller non-interactively and confirms: no UAC/elevation prompt occurs, files land in the expected `%APPDATA%\...` path, and the uninstaller cleanly removes them — substituting for manual testing since the developer has no physical Windows machine

**Plans**: TBD

### Phase 3: Manifest-Driven Uninstall & Checksum Integrity

**Goal**: Users can uninstall GuideMyGrid on either platform with zero leftover files, and can independently verify that a downloaded release hasn't been tampered with
**Depends on**: Phase 1, Phase 2
**Requirements**: INTEG-01, INTEG-02, INTEG-03, INTEG-04
**Success Criteria** (what must be TRUE):

  1. Running the uninstaller on macOS or Windows removes exactly the paths listed in the install-time manifest — no leftover files, logs, or preference entries remain
  2. Every published release artifact has an accompanying SHA256 checksum with plain-language, copy-paste verification steps for both operating systems
  3. An automated install-then-uninstall filesystem-diff check runs as part of the release process and flags any residue before a release ships — on Windows this runs via the same GitHub Actions `windows-latest` CI runner established in Phase 2, since that's the only way to exercise it on real Windows
  4. A completed security review confirms both installer/uninstaller scripts use absolute paths and don't trust inherited environment/PATH state

**Plans**: TBD

### Phase 4: Release Automation & Distribution

**Goal**: Releases flow consistently from build to GitHub to Gumroad, and the in-app update checker reliably tells users when a new version is available
**Depends on**: Phase 3
**Requirements**: UPD-01, UPD-02, UPD-03, DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):

  1. When a new GitHub Release is published, the in-app update banner detects it and prompts the user — the previously-dead `checkForUpdates()`/`UpdateBanner` code path now actually fires
  2. The update checker still calls only `api.github.com`, with the existing response validation and domain allowlisting intact
  3. Clicking "update available" still takes the user to a manual browser download — no silent or automatic install is introduced
  4. A public Gumroad listing exists as the download page/front-end, and its download link points to the current GitHub Release rather than a duplicate hosted binary
  5. GitHub Releases remains the definitive, versioned file host that both the update checker and the Gumroad listing reference

**Plans**: TBD

### Phase 5: Trust & Documentation Polish

**Goal**: A non-technical designer understands and trusts the unsigned-binary install/update experience, guided by clear documentation that matches the actual finished flow
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):

  1. A plain-language explainer with screenshots of the correct one-time override (macOS right-click→Open; Windows More info→Run anyway) appears both on the Gumroad listing and inside the installer package
  2. The README describes the actual current install flow, with no remaining references to the obsolete Creative Cloud Desktop `.ccx` process
  3. Release notes explicitly tell users that each new unsigned release re-triggers the OS security warning, even for previously-trusted users — framed as expected, not a regression

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & macOS Installer Rework | 3/4 | In Progress|  |
| 2. Windows Installer Rework | 0/TBD | Not started | - |
| 3. Manifest-Driven Uninstall & Checksum Integrity | 0/TBD | Not started | - |
| 4. Release Automation & Distribution | 0/TBD | Not started | - |
| 5. Trust & Documentation Polish | 0/TBD | Not started | - |
