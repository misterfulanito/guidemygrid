# Domain Pitfalls

**Domain:** Self-distributed desktop installers (outside official app stores/marketplaces, without paid code signing) — macOS + Windows, GitHub Releases + Gumroad distribution
**Researched:** 2026-07-04
**Overall confidence:** MEDIUM (cross-referenced web sources agree on mechanisms; no vendor-curated docs exist for this exact combination of practices, so treat specific numeric claims — e.g. SmartScreen reputation timelines — as directional, not authoritative)

## Critical Pitfalls

Mistakes that cause rewrites, security incidents, or destroy user trust.

### Pitfall 1: `pkgbuild` .pkg installers always elevate to root, even when the destination doesn't need it

**What goes wrong:** Apple's `.pkg` format (built via `pkgbuild`/`productbuild` and opened through Installer.app) always runs pre/postinstall scripts as **root**, regardless of what the scripts actually do or where they write. Developers often don't realize this is a property of the format itself, not a configuration choice — so they don't question it even when the actual payload only needs to land somewhere user-writable.
**Why it happens:** `.pkg` was designed for system-level installs (`/Applications`, `/Library`). Using it out of habit/familiarity for a payload that only needs `~/Library/Application Support/Adobe/UXP/...` inherits root elevation nobody asked for.
**Consequences:** Every root-run postinstall script is a privilege-escalation surface. Documented real-world exploits (e.g., a `#!/bin/zsh` postinstall script run as root still resolves `$HOME` to the *invoking user's* home and sources `$HOME/.zshenv` — an attacker who can write to that file gets root code execution the next time any `.pkg` with a zsh postinstall script runs). Any script the installer shells out to (`cp`, a helper `.sh`, PhotoshopBridge setup, etc.) inherits root, so a bug anywhere in that chain becomes a root-level bug.
**Prevention:** Since the destination is already inside the user's home directory, drop `.pkg`/`pkgbuild` entirely for this milestone. Replace with a **plain, unprivileged shell script or a double-clickable `.command`/app-bundle wrapper** that copies files directly as the invoking user — no `installer`, no root, no privileged helper. If a GUI double-click experience is wanted, a minimal `.app` wrapper (an AppleScript droplet or a tiny Swift/shell launcher) run as the current user is sufficient and never touches root.
**Detection:** Any script your installer runs whose shebang starts with `#!/bin/zsh`, `#!/bin/bash`, or similar, that is invoked from a `.pkg` postinstall context — check `sudo installer -pkg ... -target /` in your test/build docs. If your install docs or `.pkg` build script ever mention `sudo` or the Installer.app requests a password, that's the signal.
**Already present in v1.6.1-1.6.2?** **YES — confirmed by PROJECT.md.** The current macOS installer is explicitly described as "root-requiring `pkgbuild` .pkg installer... unsigned, requires root," writing into a per-user UXP folder that never needed root. This is precisely the pattern above and is the single highest-priority fix this milestone.

### Pitfall 2: Trusting `$HOME`, `$PATH`, or other inherited environment variables inside privileged or automated install/uninstall scripts

**What goes wrong:** Scripts resolve destination paths via `$HOME`, call helper binaries by bare name (`cp`, `rm`, `mv`) relying on `$PATH`, or read config from a path built from an environment variable — all of which can be manipulated by anything that ran earlier in the same shell/user session, or (worse) by an attacker if the script ever runs elevated.
**Why it happens:** It's the path of least resistance in a `.sh`/`.bat` script, and works fine in the "happy path" the developer tests on their own machine.
**Consequences:** A malicious or compromised entry earlier in `$PATH` gets executed instead of the real system binary (classic PATH-hijacking privilege escalation — documented as MITRE ATT&CK T1574.007). If a script is ever invoked with elevation (see Pitfall 1) while still trusting the invoking user's environment, that's a direct root-escalation vector.
**Prevention:**
- Always call binaries by absolute path (`/bin/cp`, not `cp`) inside install/uninstall scripts, or explicitly set a minimal `PATH` at the top of the script.
- Resolve destination directories from OS-provided APIs/known-good locations rather than blindly trusting `%APPDATA%`/`$HOME` env vars without sanity-checking they point where expected (e.g., non-empty, absolute, no `..`).
- Never source a shell rc file (`.zshenv`, `.bashrc`) implicitly — scripts should be run with `env -i` or an explicit minimal environment when correctness matters.
**Detection:** Grep installer/uninstaller scripts for bare command names without a leading `/`, and for any `source`/`.` of a dotfile. Grep for `$HOME`, `%APPDATA%`, `%USERPROFILE%` used directly in a path-join without validation.
**Already present in v1.6.1-1.6.2?** UNKNOWN — the existing `.bat` and `.pkg` postinstall script contents weren't provided in the codebase docs read for this research; this must be checked directly during the security review phase this milestone already has scheduled.

### Pitfall 3: Verifying the update *metadata* (GitHub API response) but not the *downloaded installer binary* itself before running it

**What goes wrong:** Teams correctly validate the GitHub Releases API JSON response (shape, types, domain allowlist, semver) — which GuideMyGrid has already done — but stop there. The actual asset download (the `.pkg`/`.exe`/`.zip` the API points to) is fetched and then executed/opened without any independent integrity check.
**Why it happens:** The API call feels like "the security-sensitive part" because it's where JSON parsing and injection risks live. The binary download feels like "just a file grab," so it doesn't get the same scrutiny — but it's the part that actually runs code on the user's machine.
**Consequences:** Even with the API locked to `api.github.com`, the *asset* URL is normally on `github.com`/`objects.githubusercontent.com` (redirected). Any compromise between validation and execution — a compromised release upload, a supply-chain issue in the build pipeline, a MITM on a network the user is behind, or a TOCTOU race where the file on disk is swapped between download and execution — is invisible if there's no checksum/signature check on the artifact itself. This milestone's own checksum requirement exists precisely to close this gap, but if the update-checker code isn't wired to actually *verify* the checksum before invoking the installer, publishing SHA256 files is security theater.
**Prevention:**
- Publish a SHA256 (or better, a signed manifest) alongside every release asset.
- When the in-app updater (or manual download instructions) fetches the asset, compute its SHA256 after download and compare against the published value **before** the file is opened/executed/copied into the plugin folder. Fail closed (refuse to proceed, show an error) on mismatch.
- Download to a private, non-predictable, non-world-writable location (not a shared `/tmp` path with a guessable name) to avoid a window where another process could swap the file between the checksum check and execution (TOCTOU). Verify-then-immediately-execute the same file handle/path with no gap for substitution.
- Treat the asset's own download URL with the same domain-allowlist discipline already applied to the API (assets should resolve to GitHub-owned domains only; don't blindly follow arbitrary redirects).
**Detection:** Search the codebase for where `checkForUpdates()`/`UpdateBanner` would eventually trigger a download — confirm whether any checksum verification code exists at all. Per `CONCERNS.md`, `checkForUpdates()` and `UpdateBanner` are currently **dead code, never wired up** — meaning there is presently zero enforcement path for checksum verification because there's no working update-to-install flow yet.
**Already present in v1.6.1-1.6.2?** **PARTIALLY — this is a live gap.** The API-response validation is genuinely good (confirmed in `CONCERNS.md` as "MITIGATED"). But since the update feature is disconnected end-to-end, there is no checksum verification anywhere in the current pipeline — this milestone's plan to "publish checksums" must include actually wiring verification logic into whatever completes the update flow, not just publishing the `.sha256` file and stopping.

### Pitfall 4: Leftover artifacts from failed or partial installs/uninstalls ("breadcrumbs") that are either exploitable or just look unprofessional

**What goes wrong:** Installers copy files but don't clean up on failure; uninstallers remove only the main plugin folder but leave logs, temp copies, or preference/cache files scattered in `~/Library` or `%APPDATA%` subfolders. Some of these leftovers end up world-writable because the install script created them with permissive umask/default permissions rather than deliberately setting them.
**Why it happens:** Uninstall is usually an afterthought relative to install; testing rarely covers the "install fails halfway through" case; scripts written quickly (e.g., a `.bat` with no error handling) don't bother with rollback or targeted cleanup.
**Consequences:** Two distinct harms: (1) security — a world-writable leftover file/folder in a path the app (or another trusted process) later reads from could be used to inject content or achieve code execution; (2) trust/professionalism — a user who goes looking (exactly the security-conscious behavior this milestone is trying to earn) and finds stray `.log`, `.tmp`, or orphaned folders after "uninstall" concludes the developer is sloppy, undermining the entire "we can be trusted without paid signing" pitch.
**Prevention:**
- Install script: write to a temp staging location first, then atomically move/copy into place; on any failure, explicitly delete the partial destination rather than leaving it.
- Uninstall script: maintain an explicit manifest of every file/folder the installer created (even a simple flat list written at install time) and have uninstall consume that manifest rather than guessing/globbing — guarantees symmetry between what's installed and what's removed.
- Never leave logs or debug output behind by default; if logging is useful for support purposes, write to a single well-known location and let uninstall remove it too, and never make it world-writable (`chmod 644`/inherit sane default ACLs, not `777`/`666`).
- Add exactly the "automated regression check" this milestone already lists as a requirement — a CI check that runs install → uninstall in a clean environment and asserts the destination folder(s) are byte-for-byte gone.
**Detection:** After running the current installer + uninstaller on a clean VM/user account, diff the filesystem before/after. Look specifically at `~/Library/Application Support/Adobe/UXP/...` (macOS) and `%APPDATA%\Adobe\UXP\...` (Windows) for anything left behind, and check permissions on anything the installer created (`ls -la` / `icacls`) for unintended world-write bits.
**Already present in v1.6.1-1.6.2?** LIKELY, though unconfirmed without reading the actual scripts. The bare `.bat` on Windows described in `PROJECT.md` strongly suggests no error handling or rollback logic (bare batch scripts rarely include this), and the milestone's own requirement list ("no leftover temp files/logs, safe failure handling") reads as an admission this hasn't been verified yet. Flag for the security-review task already scheduled this milestone.

## Moderate Pitfalls

### Pitfall 1: Making Gatekeeper/SmartScreen instructions ambiguous, or (worse) telling users to disable a whole security feature

**What goes wrong:** Faced with "this app is from an unidentified developer," some indie developers' support docs say things like "disable Gatekeeper" (`sudo spctl --master-disable`) or "turn off SmartScreen" globally, rather than walking the user through the narrow, per-file, one-time override both OSes already provide.
**Why it happens:** It's the first answer that shows up in old forum threads, and it "solves" the immediate problem without the developer realizing they're asking users to disable a system-wide protection instead of a one-time exception for one file.
**Consequences:** This is actively worse for the user's overall security posture, and it's also a red flag to any moderately technical user reading the instructions — it signals either that the developer doesn't understand code-signing basics, or worse, that they want the user to lower their guard generally. Both erode exactly the trust this milestone is trying to build.
**Prevention:** Document (with screenshots, since the audience is non-technical) only the built-in one-time overrides:
- **macOS:** right-click (Control-click) the installer/app → "Open" → confirm in the dialog. This creates a persistent, file-specific exception — no system setting changes. On modern macOS, System Settings → Privacy & Security shows an "Open Anyway" button for about an hour after a blocked attempt, as a secondary path.
- **Windows:** click "More info" (small, easy-to-miss link) on the SmartScreen dialog, then "Run anyway." No registry edits, no disabling Windows Defender, no admin rights needed for this specific action.
Never instruct users to disable Gatekeeper or SmartScreen entirely, and never ask them to run `sudo spctl --master-disable` or similar.
**Prevention (also):** In the same doc, explain briefly *why* the warning appears (no paid Apple/Microsoft signing certificate) in plain language ("this removes the scary warning" framing from PROJECT.md's own audience guidance) so the user understands this is a cost trade-off, not evidence the software is unsafe.

### Pitfall 2: Assuming reputation (SmartScreen) or Gatekeeper history carries over between versions/releases

**What goes wrong:** Developers expect that once users have successfully run version 1.6.1 without warnings, version 1.6.2 will be equally trusted.
**Why it happens:** It seems intuitive that "the app" builds trust, but the mechanisms actually key off the **exact file hash** (SmartScreen) or an **ad-hoc per-app Gatekeeper exception the OS remembers locally per machine**, neither of which transfers to a new build.
**Consequences:** Every new unsigned release resets to zero reputation on Windows (SmartScreen warnings reappear even for previously-trusted users on other machines) and every new unsigned build re-triggers the "unidentified developer" flow on macOS for users who haven't seen that specific build before. This is not a bug to "fix" — it's structural without paid signing — but it must be expected and documented in release notes/support material so it isn't mistaken for a regression.
**Prevention:** Set expectations in release notes ("you may see the same one-time security prompt as before for this new version — this is expected without a paid certificate"). If/when the discarded Apple Developer Program or a Windows signing cert is revisited (already flagged as a recurring open decision in PROJECT.md), signing consistently with the *same* certificate across versions is the only way reputation/trust carries forward — worth surfacing as the concrete payoff next time that decision is revisited.

### Pitfall 3: GitHub Releases and Gumroad drifting out of sync with no rollback path

**What goes wrong:** New version ships to GitHub Releases; the Gumroad listing either isn't updated at all, points at a manually re-uploaded (and potentially stale or mismatched) copy of the installer, or references a hardcoded version number in copy/screenshots that no longer matches what's actually downloadable.
**Why it happens:** Two independent distribution surfaces with no shared automation; updating both is manual, easy to forget under release-day time pressure, and there's no single source of truth enforced by tooling.
**Consequences:** Users download mismatched installers from the two channels (e.g., Gumroad serving an older build while GitHub's in-app updater expects the newer one), support confusion ("it says v1.7 on Gumroad but the plugin says v1.6.2"), and no clean way to roll back a bad release on one channel without manually reconciling the other.
**Prevention:**
- Treat GitHub Releases as the single source of truth (already the plan per PROJECT.md/Key Decisions) and make the Gumroad listing **link out** to the current GitHub Release download rather than hosting a duplicate binary — eliminates the sync problem entirely by removing the second copy.
- If Gumroad must host its own file copy (e.g., for the email-capture gate to work without sending users off-platform), add a lightweight release checklist (even a markdown checklist in the repo, or a simple script that diffs the latest GitHub Release tag against what's manually confirmed on Gumroad) as part of the release process — this is exactly the kind of "decide sync approach" open item PROJECT.md already flags for phase planning.
- Keep a rollback plan: know how to un-publish/replace a bad GitHub Release (delete the tag/release, or mark as pre-release while a fix ships) and have the equivalent manual step ready for Gumroad, documented once so it isn't reinvented under pressure during an incident.
**Detection:** Periodically (or as part of a release checklist) manually compare the version number/checksum on Gumroad's current download against the latest GitHub Release — this is a cheap, no-tooling check appropriate for a free/low-volume listing.

## Minor Pitfalls

### Pitfall 1: Silent update-check failures hiding real problems from users and developers

**What goes wrong:** `checkForUpdates()` (per `CONCERNS.md`) currently returns `null` on any error, indistinguishable from "no update available." Once wired up, this means a broken update-checker (network failure, GitHub API rate-limiting, checksum mismatch) looks identical to "you're up to date" — the worst possible failure mode for a security-relevant feature.
**Prevention:** Return a typed result (`{ hasUpdate, latestVersion, error }` or similar) so the UI — and any future logging — can distinguish "checked, no update" from "check failed" from "update found but integrity check failed." A failed integrity check in particular should surface loudly to the user, not fail silently into "no update."

### Pitfall 2: Documentation drift describing an install flow that no longer exists

**What goes wrong:** README still documents the obsolete Creative Cloud Desktop `.ccx` flow (confirmed as an open item in PROJECT.md), while the actual flow is direct-download installers. A security-conscious user reading stale docs before installing unsigned software from an unfamiliar flow is more likely to distrust it, since the instructions don't match what they're seeing.
**Prevention:** Update README as part of this milestone's already-planned scope (already listed as an Active requirement) before/alongside shipping the new installers, not after — documentation mismatch at first install is exactly the moment trust is won or lost for a non-technical user.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| macOS installer rework (drop `.pkg`, go user-level) | Reflexively keeping `pkgbuild`/root-based flow out of habit (Pitfall 1) | Replace with unprivileged shell script or lightweight `.app`/`.command` wrapper; verify zero `sudo`/password prompts in manual test |
| Windows installer rework (replace bare `.bat`) | New installer still assumes admin, or still leaves no rollback/cleanup on failure (Pitfalls 1 & 4) | Target `%APPDATA%` only; add explicit error handling and a manifest-driven uninstall; test install-fails-halfway scenario |
| Checksum publishing + verification | Checksums published but never actually checked before executing the downloaded file (Pitfall 3) | Wire verification into whatever completes the update-checker → download → install path; fail closed on mismatch; needs deeper research/threat-modeling given `checkForUpdates()` is currently fully disconnected |
| Installer/uninstaller security review (already planned this milestone) | Environment/PATH trust issues invisible without reading actual script source (Pitfall 2) | Read the actual `.pkg` postinstall script and `.bat` contents line-by-line during this review; grep for bare commands, `$HOME`/`%APPDATA%` usage, and any `sudo`/elevation calls |
| Automated pre-release checks (already planned this milestone) | Regression checks focus on manifest permissions but skip install/uninstall filesystem diffing (Pitfall 4) | Explicitly add a clean-install/uninstall filesystem-diff check, not just static checks on `manifest.json` and secrets |
| Gumroad listing setup | Ambiguous or security-feature-disabling instructions for Gatekeeper/SmartScreen (Moderate Pitfall 1) | Write the per-file override instructions (with screenshots) once, reuse on both GitHub release notes and Gumroad product page |
| Release process (GitHub + Gumroad) | Version drift between the two channels (Moderate Pitfall 3) | Prefer linking Gumroad to GitHub's download rather than duplicating the binary; if duplicating, add a release checklist |

## Sources

- [Packaging guidelines for macOS](https://themacwrangler.wordpress.com/2017/04/28/packaging-guidelines-for-mac-os/) — MEDIUM (community mac-admin blog, cross-referenced)
- [macOS Installers Abuse — HackTricks](https://hacktricks.wiki/en/macos-hardening/macos-security-and-privilege-escalation/macos-files-folders-and-binaries/macos-installers-abuse.html) — MEDIUM (widely-used offensive-security reference wiki; root/postinstall zsh `.zshenv` exploit pattern)
- [Privilege Escalation Abusing installer — root3nl/SupportApp GHSA advisory](https://github.com/root3nl/SupportApp/security/advisories/GHSA-jr78-247f-rhqc) — MEDIUM (real published security advisory illustrating the exact pkgbuild/root pattern)
- [SmartScreen reputation for Windows app developers — Microsoft Learn](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) — MEDIUM (vendor documentation)
- [Windows Defender SmartScreen FAQ](https://feedback.smartscreen.microsoft.com/smartscreenfaq.aspx) — MEDIUM (vendor documentation)
- [Safely open apps on your Mac — Apple Support](https://support.apple.com/en-us/102445) — MEDIUM (vendor documentation)
- [Open a Mac app from an unknown developer — Apple Support](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac) — MEDIUM (vendor documentation)
- [How to Open Apps from "Unidentified Developers" on Your Mac — How-To Geek](https://www.howtogeek.com/205393/gatekeeper-101-why-your-mac-only-allows-apple-approved-software-by-default/) — LOW (enthusiast press, corroborates vendor docs)
- [Implementing Auto-Update Securely — ExpressVPN Blog](https://www.expressvpn.com/blog/secure-auto-update-mac-linux-windows-apps/) — LOW (vendor blog, general auto-update security patterns)
- [Security Design for Auto-Update — Why HTTPS Alone Is Not Enough — KomuraSoft](https://comcomponent.com/en/blog/2026/04/09/000-comcomponent-autoupdate-security/) — LOW (vendor blog, but directly on-topic for the "API validated but binary not verified" gap)
- [Linux Privilege Escalation Using PATH Variable — hackingarticles.in](https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/) — LOW (security training content, corroborated by MITRE ATT&CK)
- [Hijack Execution Flow: Path Interception — MITRE ATT&CK T1574.007](https://attack.mitre.org/techniques/T1574/007/) — MEDIUM (industry-standard threat taxonomy)
- [Symlink attacks reference (CWE-based teaching material)](https://www.seclab.cs.sunysb.edu/sekar/cse360/ln/cwe.pdf) — LOW (academic course material, general symlink/TOCTOU guidance)
- Internal: `/Users/hurisb/Projects/guidemygrid/.planning/PROJECT.md` — HIGH (primary source describing the exact current installer implementation and milestone scope)
- Internal: `/Users/hurisb/Projects/guidemygrid/.planning/codebase/CONCERNS.md` — HIGH (primary source confirming update-checker validation status and dead-code state of the update flow)

**Confidence note:** No single authoritative vendor document exists that covers "unsigned installer + GitHub Releases + Gumroad" as a combined workflow — this is a synthesis across Apple/Microsoft official docs (Gatekeeper/SmartScreen mechanics, MEDIUM confidence), a security-research wiki and a real GHSA advisory (root/pkgbuild exploit pattern, MEDIUM confidence), and general web sources on auto-update and PATH/symlink security (LOW confidence individually, but consistent with each other and with well-established secure-coding principles). Treat mechanism descriptions (how Gatekeeper/SmartScreen work, why `.pkg` always elevates) as reliable; treat specific claims like exact SmartScreen reputation timelines as directional only.
