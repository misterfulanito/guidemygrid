# Feature Research

**Domain:** Self-distributed desktop plugin installer/updater (macOS + Windows, free, no app store, no paid code signing)
**Researched:** 2026-07-04
**Confidence:** MEDIUM (web-sourced, cross-checked across multiple independent sources; no official docs/API involved — this is a UX/security-practice domain, not an SDK)

## Context Note

GuideMyGrid ships without paid OS-level signing (Apple Developer Program and Windows code-signing cert both explicitly declined for now). That single constraint shapes almost every recommendation below: **you cannot make the OS warning disappear** — you can only make the warning less scary and back it up with independent proof of integrity (checksums, transparent process, a clean uninstall). Every feature here is evaluated against that reality, not against "get rid of the warning."

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete, or worse, feels like malware.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Plain-language "why am I seeing this warning" explainer, shown *before* the user hits the OS warning (on the download page and/or in a first-run readme) | Non-technical users who hit an unexplained "unidentified developer" / SmartScreen block will assume the software is malware and abandon install. GuideGuide (paid competitor) still triggers this same warning on Photoshop, so this is normal — the differentiator is explaining it, not avoiding it | LOW | One paragraph + 1 screenshot per OS: "macOS/Windows shows this because we haven't paid for a $99/yr developer certificate — here's exactly what to click and why it's safe." Ship this on the Gumroad download page AND inside the installer/zip as a README |
| Published SHA256 checksum per release artifact, with copy-paste verification steps | This is the only integrity proof available without paid signing. Docs (Ubuntu, Atlassian, etc.) confirm publishing checksums alongside binaries is the standard practice for exactly this "no code signing" situation | LOW | GitHub Releases already supports this trivially — generate `shasum -a 256` / `Get-FileHash` output at release time and paste into release notes. Add one line on the download page: "Verify your download hasn't been tampered with" with the exact command to paste |
| Visible version number surfaced in-app (plugin panel) and on the download page | Users need to know if they're on the latest version and installers need to know what "clean" looks like when uninstalling. Already partially built (update checker) — just needs to be visibly displayed, not just checked in the background | LOW | Likely already exists in some form; confirm it's shown somewhere a user can screenshot when reporting a bug |
| A findable, one-step uninstall path (not "delete this folder yourself") | Users' baseline expectation for any desktop software; absence reads as either amateurish or suspicious ("it doesn't want to be removed") | LOW–MEDIUM | Already exists per PROJECT.md — main gap flagged is *completeness* (no breadcrumbs), covered below, not existence |
| Uninstaller that removes 100% of what the installer created — files, logs, temp/cache dirs, any preference files — with no exceptions the user has to hunt for manually | This is the developer's explicitly named security/trust concern. Leftover files/logs/prefs are the single most common desktop-software complaint documented across every leftover-cleanup guide found in research, and on a security-conscious plugin, breadcrumbs look like either sloppiness or a cover for something hidden | MEDIUM | The only reliable way to guarantee this: the installer should write a manifest (a simple list of every path it created) at install time, and the uninstaller reads that manifest and deletes exactly those paths — no guessing, no globbing broad directories. This also make future installer changes safe (manifest evolves with the installer) |
| Update checker continues to hit only `api.github.com`, validates response shape before use (already built) | Baseline security hygiene for anything that phones home; already implemented and should be preserved as installer/updater surfaces are reworked | LOW | No new work — this is a "don't regress" table-stakes item, not new scope |
| Manual, user-initiated download link from the update banner (already built) — user clicks, goes to browser, downloads new installer themselves | The zero-effort table-stakes update UX; already exists and should not be removed even if one-click update (a differentiator, below) is added later | LOW | Keep this as the guaranteed fallback path even if richer update UX ships |
| Close-the-host-app-before-install/uninstall guard (i.e., don't let a user try to reinstall/uninstall while Photoshop still has the plugin loaded) | Prevents partial file writes/deletes and confusing "why didn't this work" states — a well-documented cause of leftover files in general desktop uninstall research | LOW | Simple check-and-message in the installer/uninstaller script: "Please quit Photoshop before continuing" |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required for trust, but they push GuideMyGrid noticeably ahead of "install and hope."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| In-app changelog display alongside the update banner (not just "update available") | Shows the user *what* changed and *why* to bother updating — turns a vague nag into an informed decision, and signals active, transparent maintenance | LOW–MEDIUM | GitHub Releases already stores release notes in Markdown; the update checker already fetches release metadata from the same API call, so surfacing `body` text in the panel is a small addition, not a new integration |
| Automated checksum generation + publish as part of the release process (script, not manual copy-paste each time) | Removes the realistic risk that a developer forgets to update the checksum on a release and it goes stale/wrong, which would actively erode trust worse than not publishing one at all | MEDIUM | A small release script (already has release automation groundwork per PROJECT.md's "automated checks that catch security regressions") that computes and writes SHA256 + appends to release notes automatically |
| Signed update manifest / signed appcast-equivalent (Sparkle-style EdDSA signing of the "here's the latest version" response, separate from OS code signing) | Protects the *update check* channel itself from tampering (e.g., a compromised or MITM'd response telling the plugin to fetch a malicious "update"), independent of whether the binary itself is OS-signed. This is the single most "professional indie tool" security signal available without spending money | MEDIUM–HIGH | Doesn't require paid signing — this is a self-managed keypair (openssl/minisign), verified client-side inside the plugin. Meaningfully more engineering than checksums-on-a-webpage; recommend as a fast-follow once the userlevel installer rework ships, not in the first pass |
| Version pinning / rollback: keep the previous installer artifact easily accessible (e.g., a "previous version" link) in case a new release has a regression | Gives a safety net for both the developer (can point users at last-known-good) and the user (doesn't feel trapped if an update breaks their workflow) | LOW | GitHub Releases already retains every prior release/asset indefinitely — this is really just "link to the releases page" or "list the last 2-3 versions" on the download page, not new infrastructure |
| Gumroad email capture used only for release announcements, explicitly opt-in, with obvious unsubscribe | Builds a direct channel to notify users of security-relevant updates without depending on them noticing an in-app banner or checking GitHub — valuable specifically because there's no marketplace auto-update mechanism to lean on | LOW | Gumroad's built-in customer/email tools cover this natively; the differentiator is *restraint* (no marketing spam, no dark patterns), which is itself a trust signal for this audience |
| "How to verify this is really from me" page/section that also explains checksum verification in even simpler terms with copy-paste one-liners for both OS | Extra layer of reassurance beyond the baseline explainer; useful for the security-conscious subset of users (or IT-adjacent friends users ask for a second opinion) | LOW | Can be the same page as the plain-language warning explainer, just one section further down |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems — actively avoid these, they read as malware-adjacent behavior or overreach for a free tool.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Silent / automatic background updates that install without explicit user action or confirmation | Feels convenient, "modern," reduces update friction | For an unsigned, non-marketplace binary, silently replacing files on a user's machine without an explicit click is exactly the behavior security guidance tells users to be suspicious of — it also removes the user's ability to notice something's wrong before it lands. Marketplace apps get away with this because the store itself is the trust anchor; a self-distributed tool has no equivalent anchor | Keep updates user-initiated: banner + changelog + explicit "download/install" click (manual today, one-click-with-confirmation as a differentiator later) |
| Telemetry/analytics/"phone home" usage tracking bundled into the update checker or installer ("just to see adoption") | Tempting for a solo/indie dev to want usage numbers | Any additional outbound network call beyond the already-scoped `api.github.com` update check widens the exact attack surface and privacy footprint the user explicitly asked to minimize ("no gaps/breadcrumbs that could compromise the user's computer or data"); it also directly contradicts the existing manifest.json network allowlisting work already done | If adoption data matters later, use passive signals already available for free — GitHub release download counts, Gumroad sales/download dashboard — both already provide this with zero extra code or privacy cost |
| A custom self-hosted auto-updater "app" / background daemon/service that runs even when Photoshop/the plugin isn't open | Feels like the "professional" pattern used by big desktop apps (Chrome, Slack) | A persistent background process is a much bigger security surface (needs to run at every login, needs elevated install typically, is exactly the kind of "always-running unknown process" that anti-malware tools and cautious users flag) — wildly disproportionate for a free single-purpose plugin, and cuts against the user-level, no-elevation design decision already made this milestone | The in-panel update checker that runs only when Photoshop/the plugin is open is sufficient and matches the existing architecture |
| Third-party installer-builder SaaS/analytics platforms bundled into the install flow (some installer builders inject their own bundled offers, toolbars, or tracking SDKs by default) | Some popular installer generators default-enable "recommended offers" or bundled analytics to monetize free tools | This is precisely the pattern that has trained users to distrust free-software installers generally (bundleware, opt-out toolbars); it would actively undermine the "trustworthy self-distribution" goal of this milestone even if individually harmless | Stick with minimal, native installer tooling (`pkgbuild` on mac, a plain script or a lightweight installer generator on Windows) with every step reviewed and no default-on bundled offers |
| A "quiet"/forced uninstall confirmation-skip flag to make uninstall "one click too" | Symmetry argument: "install is one click, so uninstall should be too" | Removing the confirmation step on *deletion* is a different risk profile than removing friction on *installation* — accidental data loss (if any local presets/config exist) is a real cost, and a too-eager uninstall can also mask incomplete removal happening silently | Keep a single, simple confirmation step on uninstall ("Remove GuideMyGrid and all its settings? This can't be undone") — friction here is protective, not just process for its own sake |

## Feature Dependencies

```
Published SHA256 checksum per release
    └──requires──> Automated (or at minimum consistent) release process
                       └──enhances──> Signed update manifest (differentiator) — checksum discipline is a prerequisite habit

Uninstaller "no breadcrumbs" guarantee
    └──requires──> Installer writes a manifest of every path it creates
                       └──enhances──> Automated regression checks ("installer leaves no residue") already scoped in PROJECT.md Active requirements

In-app changelog display
    └──requires──> Existing update checker (already built, hits GitHub Releases API)

One-click update (future) ──requires──> Signed update manifest (should not ship one-click install of an unsigned binary without verifying it wasn't tampered with in transit)

Silent background auto-update (anti-feature) ──conflicts──> No-elevation / user-level installer design decision already confirmed this milestone
```

### Dependency Notes

- **Uninstaller guarantee requires an install-time manifest:** you cannot reliably guarantee zero breadcrumbs by having the uninstaller "guess" which files/folders/plist entries belong to GuideMyGrid after the fact — the only deterministic approach is recording what was written at install time and deleting exactly that list at uninstall time. This should be treated as a design constraint on the installer rework itself, not a separate uninstaller task.
- **Signed update manifest enhances but doesn't replace checksums:** checksums protect the file at rest (did *this specific download* get tampered with); a signed update feed protects the *update-check response itself* (did something tell the plugin to fetch a malicious version). Both matter, checksums are cheaper and should ship first.
- **One-click update conflicts with an unverified fetch:** if one-click update is added later, it should not exist without the signed-manifest differentiator in place first — auto-fetching and auto-installing a binary based on an unauthenticated GitHub API response is a meaningfully bigger risk than the current "show a banner, user clicks through to browser" flow.
- **Silent auto-update directly conflicts with the milestone's own stated design decision** (user-level, no elevation, least privilege) — flagging this explicitly so it isn't accidentally proposed later as a "nice to have."

## MVP Definition

### Launch With (v1 — this milestone)

Minimum viable trust-building set — matches the Active requirements already listed in PROJECT.md.

- [ ] Plain-language warning explainer (mac + Windows versions) on the Gumroad download page and inside the installer package/zip
- [ ] Published SHA256 checksum per release artifact with copy-paste verification steps for both OS
- [ ] Uninstaller driven by an install-time manifest — guarantees no leftover files/logs/registry/plist entries
- [ ] Close-app-before-install/uninstall guard on both platforms
- [ ] Keep existing manual update-banner-to-browser-download flow unchanged (already built, don't regress)
- [ ] Keep existing GitHub-API-only network allowlisting unchanged (already built, don't regress)

### Add After Validation (v1.x)

Add once the base installer/uninstaller rework has shipped and been used for a release cycle or two.

- [ ] In-app changelog display next to the update banner — trigger: once the update checker rework is stable, this is a near-free addition since release notes are already fetched
- [ ] Automated checksum generation as part of the release script — trigger: after the first manual release cycle proves the checksum process, automate it to remove human error
- [ ] "Previous version" / rollback link on the download page — trigger: whenever the first release-with-regression scenario actually happens, or proactively once there are 2+ published versions

### Future Consideration (v2+)

Defer until the core trust/uninstall rework has proven itself and there's bandwidth for meaningfully more engineering.

- [ ] Signed update manifest (EdDSA/minisign-style signing of the update-check response) — why defer: real engineering lift (keypair management, client-side verification code) relative to the free-tool scope; checksums + explainer already address the most acute trust gap
- [ ] One-click in-app update (vs. manual download) — why defer: should not ship ahead of the signed update manifest; also a bigger UX/engineering investment than this milestone's scope (installer/uninstaller rework + Gumroad setup)
- [ ] Illustrator/Figma installer variants — explicitly out of scope this milestone per PROJECT.md, but nothing above should structurally block it (manifest-driven install/uninstall and checksum practices generalize to any future per-app installer)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Plain-language warning explainer | HIGH | LOW | P1 |
| Published SHA256 checksums | HIGH | LOW | P1 |
| Manifest-driven "no breadcrumbs" uninstaller | HIGH | MEDIUM | P1 |
| Close-app-before-install/uninstall guard | MEDIUM | LOW | P1 |
| In-app changelog display | MEDIUM | LOW-MEDIUM | P2 |
| Automated checksum generation in release script | MEDIUM | MEDIUM | P2 |
| Previous-version/rollback link | LOW-MEDIUM | LOW | P2 |
| Gumroad opt-in email announcements | MEDIUM | LOW | P2 |
| Signed update manifest (EdDSA) | MEDIUM-HIGH (security) | HIGH | P3 |
| One-click in-app update | MEDIUM (convenience) | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone's launch (matches PROJECT.md Active requirements)
- P2: Should have, natural next iteration once P1 ships
- P3: Nice to have, meaningfully more engineering — future milestone

## Competitor Feature Analysis

| Feature | GuideGuide (paid, marketplace-adjacent via CC Desktop for Photoshop) | Typical open-source indie mac/win tool (e.g., Sparkle-based apps) | Our Approach |
|---------|--------|--------|--------------|
| Code signing / notarization | Still triggers "couldn't verify plugin / third-party developer" warning on Photoshop despite being an established paid product — confirms this friction is not solvable by being bigger/paid, only by OS-level signing spend | Usually code-signed (their users expect to pay indirectly for polish); when unsigned, same warning appears | Unsigned for now (explicit decision) — compensate with explainer + checksums, not by chasing signing parity |
| Install path | Requires Creative Cloud Desktop for Photoshop (marketplace-style flow); installs directly via Figma's own store for Figma (zero friction there) | Direct `.dmg`/`.pkg`/`.exe` download, no marketplace | Direct GitHub Releases download, no marketplace, no CC Desktop — matches the "no Marketplace, ever" constraint |
| Update mechanism | Marketplace/CC Desktop handles updates for the user | Sparkle-based apps show an in-app "update available" dialog with changelog, often one-click | Currently: in-panel banner with manual download link (already built); differentiators above chart a path toward changelog display without committing to one-click yet |
| Checksums/integrity proof | Not surfaced to end users (relies on marketplace's implicit trust) | Common among security-conscious open-source tools to publish SHA256/PGP alongside releases | Publish SHA256 per release — directly closes a gap neither the marketplace-distributed competitor nor most casual indie tools bother to expose |
| Uninstall | Marketplace-managed removal (implicit, opaque to user) | Varies widely; many indie mac apps rely on "drag to trash" (works because most are self-contained `.app` bundles with no system-level writes) | GuideMyGrid needs an explicit uninstaller because it writes into Photoshop's `PluginsStorage`/`%APPDATA%` — closer to a "real installer" pattern than a drag-to-trash app, so manifest-driven removal is the right model, not the drag-to-trash shortcut |

## Sources

- [Gatekeeper (macOS) — Grokipedia](https://grokipedia.com/page/Gatekeeper_(macOS)) — LOW/MEDIUM confidence, web-sourced
- [How to run unsigned apps in macOS 15.1 – IT Notes](https://ordonez.tv/2024/11/04/how-to-run-unsigned-apps-in-macos-15-1/) — MEDIUM confidence
- [Can't you just right click? Yes, with a workflow. — lapcatsoftware.com](https://lapcatsoftware.com/articles/right-click.html) — MEDIUM confidence
- [Living with(out) notarization – The Eclectic Light Company](https://eclecticlight.co/2024/10/01/living-without-notarization/) — MEDIUM confidence, corroborates "no free path to notarize for distribution to others"
- [SmartScreen reputation for Windows app developers — Microsoft Learn](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) — MEDIUM-HIGH confidence (Microsoft first-party docs, reached via web search)
- [Understanding SmartScreen Warnings — GlobalSign](https://www.globalsign.com/en/blog/understanding-smartscreen-warnings-applications-signed-globalsign-code-signing-certificates) — MEDIUM confidence
- [Sparkle: open source software update framework for macOS](https://sparkle-project.org/documentation/) — HIGH confidence (official project docs), reached via web search
- [Upgrading to EdDSA from DSA — Sparkle docs](https://sparkle-project.org/documentation/eddsa-migration/) — HIGH confidence
- [How to Delete Leftover Files From Uninstalled Program? — SysTools](https://www.systoolsgroup.com/how-to/delete-leftover-files-from-uninstalled-program/) — LOW-MEDIUM confidence
- [How to Eradicate Leftovers From Uninstalled Software — MakeUseOf](https://www.makeuseof.com/windows-remove-leftovers-uninstalled-software/) — LOW-MEDIUM confidence
- [What am I missing about Gumroad? — Indie Hackers](https://www.indiehackers.com/post/what-am-i-missing-about-gumroad-e941472758) — LOW confidence, anecdotal/community
- [8 best Gumroad alternatives for software makers (2026) — Freemius](https://freemius.com/blog/best-gumroad-alternatives-free-paid/) — LOW-MEDIUM confidence, vendor-adjacent source
- [Android In-App Updates — Common pitfalls and good patterns — ProAndroidDev](https://proandroiddev.com/android-in-app-updates-common-pitfalls-and-some-good-patterns-9024988bbbe8) — LOW confidence (mobile-platform-specific, used only for the flexible-vs-immediate update concept, adapted to desktop)
- [UI Updates in 2026: How to Communicate and Guide for Fast Adoption — Userpilot](https://userpilot.com/blog/ui-updates/) — LOW confidence
- Existing project context: [`.planning/PROJECT.md`](../PROJECT.md) — GuideGuide competitor analysis already captured there (Photoshop CC Desktop warning parity, Figma zero-friction install)

---
*Feature research for: self-distributed desktop plugin installer/updater trust (GuideMyGrid milestone)*
*Researched: 2026-07-04*
