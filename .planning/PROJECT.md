# GuideMyGrid — Trustworthy Self-Distribution

## What This Is

GuideMyGrid is a UXP plugin for Adobe Photoshop that generates precise column/row grids and guide lines for designers. This milestone reworks how the plugin is installed and updated on macOS and Windows: replacing the current root-requiring, unsigned installer with a lighter, user-level installer that's demonstrably trustworthy (checksums, least privilege, no leftover artifacts), distributed via Gumroad (front-end) and GitHub Releases (file host + update source) — with no dependency on the Adobe Marketplace/Exchange.

## Core Value

A designer with zero terminal experience can install GuideMyGrid on macOS or Windows with a double-click, without being asked to grant admin/root access, and can trust that what they installed is genuinely from the developer and hasn't been tampered with — even without paid OS-level code signing.

## Requirements

### Validated

<!-- Already exists on origin/main (v1.6.1-1.6.2), built ~months ago, functional but flagged by the user for rework -->

- ✓ GitHub Releases-based distribution, no Adobe Marketplace — existing
- ✓ macOS `.pkg` installer via `pkgbuild`, copies plugin into Photoshop's UXP `PluginsStorage` folder — existing (unsigned, requires root — being replaced this milestone with a user-level installer)
- ✓ macOS/Windows uninstallers — existing
- ✓ In-app update checker against GitHub Releases API, with response validation and domain allowlisting — existing
- ✓ `manifest.json` v5, network permissions restricted to `api.github.com` — existing

### Active

- [ ] Redesign the macOS installer to run at user-level only (no root/admin privileges) — the UXP plugin destination folder is already inside `~/Library/...`, so root was never structurally necessary
- [ ] Build an equivalent no-elevation Windows installer (currently only a bare `.bat` script) targeting the user-level `%APPDATA%\...` plugin folder
- [ ] Publish checksums (SHA256) for release artifacts so integrity can be verified independently of OS-level signing
- [ ] Security review of installer/uninstaller scripts on both platforms — least privilege, no leftover temp files/logs, safe failure handling
- [ ] Add automated checks that catch security regressions before a release ships (manifest network permissions stay restricted, no secrets committed, installer scripts leave no residue)
- [ ] Update README to describe the actual current install flow (it still documents the obsolete Creative Cloud Desktop `.ccx` flow)
- [ ] Sync local repo — merge `origin/main`'s installer work into the current working branch before building on top of it
- [ ] Set up a free Gumroad listing as the distribution front-end (download page + email capture); GitHub Releases remains the source of truth for versioned installer files, with the in-app update checker continuing to point at GitHub
- [ ] Decide how Gumroad and GitHub Releases stay in sync on each new version (manual re-upload vs. scripted) — needs a plan during phase planning

### Out of Scope

- Adobe Illustrator / Figma support — deferred to a future milestone. This milestone should avoid decisions that would structurally block porting later, but no active build work toward it now.
- Adobe Marketplace/Exchange distribution — explicitly rejected by the user.

## Context

- Existing UXP Photoshop plugin: React 18 + TypeScript + Webpack, Zustand for state.
- Prior installer work (v1.6.1–1.6.2) was already built by the user (with AI assistance) months ago. It works, but the user wasn't happy with the resulting install experience and suspects it isn't following best practice.
- Local `main` is currently 10 commits behind `origin/main`. The current working branch (`epic/ui-icons`) diverged before the installer work landed on `main` and has not merged it.
- The user is a Product Designer, not a developer — they've explicitly asked to be guided through best practices rather than handling technical tradeoffs themselves.
- The user explicitly called out security: avoid leaving gaps or "breadcrumbs" that could compromise the user's computer or data. This should be read as a mandate for least-privilege scripts, verifiable release integrity, and no accidental secret exposure — not just cosmetic polish.
- The plugin is, and will remain, **free**. Gumroad's licensing/payment features are not needed for that reason — it's being used purely as a distribution front-end (download page + email capture), not for monetization.
- Reference product: [GuideGuide](https://guideguide.me) (grid/guide plugin for Photoshop, Illustrator, InDesign, After Effects, Figma — paid). Researched for install-flow comparison: GuideGuide's Photoshop install still requires Creative Cloud Desktop and still shows a "couldn't verify plugin / third-party developer" warning — i.e., even an established paid competitor hasn't escaped this problem for Photoshop specifically. GuideGuide's Figma support installs through Figma's own plugin store (no CC/marketplace friction at all), which is relevant context for the eventual Illustrator/Figma expansion.
- User wants GuideMyGrid architected with the same multi-app ambition as GuideGuide (Photoshop now, Illustrator/Figma later) — reinforces the "don't lock the architecture" requirement above.

## Constraints

- **Platform**: macOS **and** Windows both in scope this milestone (corrected — original ask sounded Mac-only, user clarified both are needed).
- **Distribution**: No Adobe Marketplace/Exchange, under any circumstance — explicit user requirement.
- **Monetization**: Free plugin. No license keys, payment processing, or paid-tier gating in scope.
- **Budget/Signing**: User explicitly **discarded** the Apple Developer Program ($99/yr) for now, but asked to be periodically re-asked rather than closing the door permanently — treat as a recurring open decision, not a settled "no." Windows code-signing cert is similarly unconfirmed/undecided. Given both, the working plan is to ship without paid OS-level signing and instead harden the installer itself (no root/admin, checksums, least privilege) — revisit paid signing if the free/no-signing experience proves insufficient.
- **Security**: Least-privilege installer scripts, verifiable release integrity (checksums/signing), no secrets or credentials committed, no artifacts left behind that could aid an attacker or confuse a user's system.
- **Audience skillset**: The user is non-technical — plans and explanations should stay in plain language, with technical tradeoffs translated into concrete consequences ("this removes the scary warning" rather than "this satisfies Gatekeeper's code-signing requirement").

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Distribute via GitHub Releases (file host) + Gumroad (front-end), not Adobe Marketplace | User explicitly rejected the Marketplace; direct distribution gives full control over install/update UX | ✓ Confirmed |
| Discard Apple Developer Program membership for now | User explicitly declined the $99/yr cost, but asked to keep revisiting — not a permanent no | ⚠️ Revisit periodically — recurring open question, do not treat as closed |
| Redesign installers (both platforms) to run at user-level, no root/admin | Removes the biggest legitimate security concern without needing paid signing; destination folders are already user-writable | ✓ Confirmed direction |
| Keep Illustrator/Figma support out of this milestone's active scope, architect to allow it later | Matches GuideGuide-style multi-app ambition without overbuilding now | ✓ Confirmed |
| Support macOS **and** Windows this milestone | User corrected earlier macOS-only assumption | ✓ Confirmed |
| Plugin remains free — no Gumroad monetization/license-key features needed | User confirmed it's free | ✓ Confirmed |
| Use Gumroad as the distribution front-end | User's choice over a self-hosted page, for its built-in download page + email capture | ✓ Confirmed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-04 after initialization*
