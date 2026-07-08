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
- ✓ `manifest.json` v5, network permissions restricted to `api.github.com` — existing (Phase 1 dropped this permission entirely for now — see Phase 1 decisions below; will need conscious re-evaluation when Phase 4 reconnects the update checker)
- ✓ Redesigned the macOS installer to run at user-level only, no root/admin privileges — validated Phase 1. **Not via a custom installer app** (the original plan) — manual QA proved a raw file-copy into Photoshop's `PluginsStorage` never makes Photoshop list a plugin at all. The working mechanism is a `.ccx` package installed through Creative Cloud Desktop (the same mechanism GuideGuide already uses per the Context note below, and the same mechanism this project itself used before v1.6.x's `.pkg` installer). Verified end-to-end on a real Mac with zero admin/root prompt, contingent on `manifest.json` declaring no elevated `requiredPermissions` — declaring network/filesystem access permissions was empirically confirmed to reintroduce an admin-password prompt.
- ✓ Merged `origin/main`'s installer work (v1.6.1-1.6.2) into the working branch, and established the `distribution/photoshop/{macos,windows}` + `release/` directory split — validated Phase 1
- ✓ Windows installer rework — validated Phase 2. Confirmed Windows shares the identical `.ccx` + Creative Cloud Desktop mechanism as macOS (no raw file-copy installer needed); retired the five disproven raw-copy scripts with a regression guard; corrected distribution docs to state the confirmed parity; added a `windows-latest` GitHub Actions job (`windows-ccx-verify.yml`) as the developer's substitute for not having physical Windows hardware. **Known gap, deferred:** that CI job's first real run failed — `distribution/photoshop/build-ccx.js` shells out to the `zip` CLI, which isn't present on Windows. Doesn't affect real end users (they only install the prebuilt `.ccx`, never running this script). Tracked in `.planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md`; developer explicitly deferred the fix rather than blocking Phase 2 on it.
- ✓ Manifest-driven, breadcrumb-free uninstall on both platforms (INTEG-01) — validated Phase 3. No custom uninstaller exists to maintain — Creative Cloud Desktop owns the whole install/uninstall lifecycle (established Phase 1/2); the legacy macOS uninstall scripts were retired with a regression guard, and README now documents the real (CC Desktop) uninstall mechanism.
- ✓ Published, verifiable SHA256 checksums for every release artifact (INTEG-02) — validated Phase 3. `release/checksums.js` generates `releases/SHA256SUMS.txt`, wired into `npm run package`/`publish:*` and uploaded to the GitHub Release; `VERIFY.md` gives plain-language copy-paste verification steps for both OSes.
- ✓ Automated release-artifact regression checks on both platforms (INTEG-03) — validated Phase 3. Rescoped from a literal install→uninstall filesystem diff (not possible — CC Desktop can't be driven headlessly in CI) to a build-artifact regression check: the `.ccx` is built the way a real release does, then asserted to have no `requiredPermissions` and none of the retired installer/uninstaller scripts. Now running on both `macos-latest` and `windows-latest`.
- ✓ Security review of everything that runs during packaging/publishing/CI (INTEG-04) — validated Phase 3. Findings locked in as both a written summary (`03-SECURITY-REVIEW.md`) and an automated regression test.
- ✓ Pre-existing bug fix: panel now detects the active document immediately on mount instead of requiring a marquee/select-all first (GAP-03-DOC-DETECT) — surfaced during Phase 3 UAT (out of Phase 3's original scope, in files no `03-*` commit had touched), closed via gap-closure plan 03-05.
- ✓ Reconnected the in-app update checker end-to-end (UPD-01/02/03) — validated Phase 4. `requiredPermissions.network.domains: ["https://api.github.com"]` restored in `manifest.json`; `checkForUpdates()`/`UpdateBanner` wired into `App.tsx` via mount effect; live-verified on a real macOS install (banner fired, manual browser-download path confirmed, no console error). **Unresolved, flagged for Phase 5:** whether this reintroduces CC Desktop's admin-password prompt is genuinely contradictory across two live trials (Phase 1's original A/B test said yes; this phase's live checkpoint said no, with the credential-caching confound explicitly ruled out) — do not let Phase 5 documentation assert either outcome as settled.
- ✓ Set up a free Gumroad listing as the distribution front-end (DIST-02) — validated Phase 4, live at https://666551126816.gumroad.com/l/guidemygrid-psd. **Deviated from the original plan (DIST-01/DIST-03):** Gumroad's "Redirect to a URL after purchase" mechanism no longer exists in Gumroad's current product editor (UI changed since this phase's research). After being told the tradeoff, the user chose to upload the `.ccx` directly to Gumroad instead, verified authentic via matching SHA-256 checksum. This means Gumroad now hosts its own copy of the binary — GitHub Releases remains the update checker's source of truth, but the Gumroad copy requires a **manual re-upload on every future release** (checksum + file), or it will silently drift stale. No auto-sync exists.
- ✓ Fixed a real versioning bug surfaced by the Phase 4 live checkpoint: the pre-rework GitHub "latest" release (`v1.6.2`) outranked this milestone's fresh `v0.1.0` baseline in semver, so every new install would misleadingly show "update available" pointing at the old, wrong-generation installer. Cut `v2.0.0` as the new canonical release; the 12 pre-rework releases (`v1.0.0`–`v1.6.2`) were marked deprecated pre-releases (not deleted, fully reversible).

### Active

*(none — all requirements carried into Phase 4 were validated or explicitly deviated-and-documented above)*

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
| Accept Creative Cloud Desktop as a required install-time dependency (via `.ccx` packaging), reversing this project's own earlier move away from it | Manual QA on the real dev Mac proved a raw file-copy installer (the original Phase 1 plan) never makes Photoshop list a plugin at all — Photoshop's Plugins panel only shows what CC Desktop's own install agent has registered. This project shipped via `.ccx`+CC Desktop once before (v1.0.x), then deliberately moved to a `.pkg` installer specifically to drop that dependency — which is exactly what introduced the root-elevation problem this milestone exists to fix. "No admin password" and "no Creative Cloud dependency" already conflicted once in this project's history; user chose "no admin password" this time, informed by the full history. | ✓ Confirmed — Phase 1 |
| Register a free plugin ID via Adobe's Developer Distribution portal (Draft listing only, never submitted for review) | Real-world inspection of a competitor's `.ccx` showed the `id` field must be a portal-issued opaque string, not a self-chosen name — required for CC Desktop to install the plugin at all | ✓ Confirmed — Phase 1, ID obtained (`53e308e0`) |
| Keep `manifest.json` free of `requiredPermissions` (network/filesystem) until actually needed | Empirical A/B test found declaring these permissions triggers CC Desktop's admin-password prompt for non-Marketplace plugins; omitting them keeps the install password-free | ✓ Confirmed — Phase 1. Re-evaluate consciously in Phase 4 when the update checker needs network access again |
| Prioritize macOS as the MVP platform; defer the Windows CI packaging bug (`build-ccx.js`'s `zip` CLI dependency) instead of fixing it immediately | User has no way to manually verify Windows behavior themselves and asked to focus on Mac for now. The CI failure doesn't block real Windows end users — they only install the prebuilt `.ccx`, never running the packaging script | ✓ Confirmed — Phase 2. Fix tracked as a todo, not a blocking gap; revisit before Windows is treated as fully shippable |
| Upload the `.ccx` directly to Gumroad instead of the planned GitHub-redirect mechanism (D-05 pivot) | Gumroad redesigned its product editor; the "Redirect to a URL after purchase" toggle the original research documented no longer exists in the current UI. Rather than keep hunting for a relocated setting, the user made an explicit, informed choice after being told the tradeoff | ⚠️ Accepted, with a real ongoing cost — Phase 4. Gumroad now needs a manual re-upload (file + checksum) on every future release, or it silently drifts stale relative to GitHub Releases. No auto-sync exists; not yet added to any release checklist |
| Cut GitHub Release `v2.0.0` and deprecate (not delete) the 12 pre-rework releases | The Phase 4 live checkpoint exposed that the old `v1.6.2` release outranked the new architecture's `v0.1.0` baseline in semver, so the update checker would always point new installs at the wrong-generation installer | ✓ Confirmed — Phase 4. `v2.0.0` is now GitHub's "Latest"; old releases marked pre-release with a deprecation notice, fully reversible |

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
*Last updated: 2026-07-07 after Phase 3 completion*
