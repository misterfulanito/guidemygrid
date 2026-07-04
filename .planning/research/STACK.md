# Stack Research

**Domain:** Self-distributed, no-root/no-admin, unsigned desktop installers (macOS + Windows) for a UXP Photoshop plugin
**Researched:** 2026-07-04
**Confidence:** MEDIUM (individual claims tagged below; no single HIGH-confidence source covers the whole stack, but core mechanisms are cross-checked against official docs)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **AppleScript app via `osacompile`** | Built into macOS (no install) | Replaces `pkgbuild`/.pkg as the macOS installer. Compiles a tiny shell-driving script into a real double-clickable `.app` that copies the plugin into `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/...` | Ships with every Mac (part of Xcode Command Line Tools, already needed for `codesign`/`hdiutil`) — zero new dependency. Runs entirely as the current user (never elevates), so it structurally cannot ask for a root password. Fully scriptable from Node (`child_process.execFileSync('osacompile', [...])`), fitting the existing `scripts/build-mac-pkg.js` pattern. **Confidence: MEDIUM** (mechanism confirmed via `ss64`/community docs; not an Apple-official guide, but osacompile itself is an Apple-shipped tool with stable, decades-old behavior). |
| **`codesign --sign -` (ad-hoc signing)** | macOS built-in | Ad-hoc-signs the installer `.app` (and ideally the actual plugin bundle) with a self-generated hash-only identity — no Apple ID, no $99/yr Developer Program | Free and requires no account. Doesn't remove the Gatekeeper warning, but produces a *slightly* less alarming dialog than a fully unsigned binary, and is a prerequisite for the app to run at all on some Apple Silicon configurations. **Confidence: MEDIUM** (cross-checked across multiple independent sources — Eclectic Light Company, Apple Developer Forums, lapcatsoftware.com). |
| **`create-dmg` (sindresorhus, npm)** | Latest (Node 20+) | Wraps the installer `.app` in a clean, branded `.dmg` for distribution — mount, see one icon, double-click | Free (MIT), actively maintained, purpose-built for "no paid Developer ID" scenarios via its `--no-code-sign` flag (skips code-signing steps that would otherwise fail without a cert, without erroring the CI/build). Fully Node-scriptable — drops directly into a `scripts/build-mac-dmg.js` replacing `build-mac-pkg.js`. **Confidence: MEDIUM** (official npm/GitHub docs; small user base (~3.4k weekly downloads) but well-known maintainer, no red flags). Note: unlike a typical macOS app DMG, do **not** include an "Applications" alias — this isn't an app you drag to `/Applications`, it's a plugin installer; ship a single-icon DMG with a short instructional background image ("Double-click to install"). |
| **NSIS (`makensis`) with `RequestExecutionLevel user`** | NSIS 3.x | Replaces the bare `.bat` script as the Windows installer. Produces a real installer `.exe` wizard that writes only to `%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\...` (via the `$AppData` variable) and never triggers a UAC prompt | `RequestExecutionLevel user` is the documented, correct way to guarantee the installer runs unelevated and that `$AppData` resolves to the *actual* logged-in user's folder (elevated installers can otherwise resolve to the wrong/admin profile). Critically for this project's toolchain: **`makensis` compiles natively on macOS via Homebrew (`brew install nsis`)** — no Windows machine, no Wine, no Docker needed to build the Windows installer from the same Mac that already builds the macOS one. A Node wrapper (`makensis` on npm) lets this slot into the existing `scripts/gh-release.js` pipeline the same way `build-mac-pkg.js` does today. **Confidence: MEDIUM** (official NSIS docs + Homebrew formula confirmed; cross-checked with StackOverflow/forum consensus). |
| **Node `crypto` (built-in) → `SHA256SUMS.txt`** | Node's built-in `crypto` module | Generates a SHA256 checksum manifest for every release asset (macOS `.dmg`, Windows `.exe`) and uploads it as an extra release asset alongside the installers | No new dependency (Node built-in). GitHub *itself* now auto-computes and displays SHA256 digests for every uploaded release asset (as of June 2025, official GitHub changelog) with zero extra effort — visible in the Releases UI, REST/GraphQL API, and `gh release view`. Publishing an additional plain-text `SHA256SUMS.txt` is still worth doing because it gives non-technical users (and the README) a copy-pasteable value to check against, without needing the GitHub API. **Confidence: MEDIUM** (GitHub's native digest feature confirmed via official changelog; the "also publish your own SHA256SUMS.txt" recommendation is standard OSS practice, cross-checked across several release-tooling writeups). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `create-dmg` (npm) | latest | Build the macOS `.dmg` wrapper | Every macOS release build, replacing `build-mac-pkg.js`'s `pkgbuild` call |
| `makensis` (npm wrapper around Homebrew's `nsis`) | latest | Compile the `.nsi` installer script from Node | Every Windows release build |
| Node `crypto` (built-in) | n/a | SHA256 checksum generation | Every release, both platforms |
| `xattr` / `codesign` (macOS built-ins) | n/a | Ad-hoc signing, and (for your own local testing only) stripping the quarantine flag to verify the installed result behaves correctly before shipping | Build + local QA, never instruct *end users* to run `xattr -d com.apple.quarantine` — that trains them to disable a real security control, which cuts against the "feels trustworthy" goal |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Xcode Command Line Tools | Provides `osacompile`, `codesign`, `hdiutil` | Already required for macOS Node native builds generally; almost certainly already installed on the dev machine |
| Homebrew | Installs `nsis` (`makensis` binary) on macOS | One-time `brew install nsis` |
| `gh` CLI | Already in use (`scripts/gh-release.js`) | No change — continue uploading the `.dmg`, `.exe`, and `SHA256SUMS.txt` as release assets the same way |

## Installation

```bash
# macOS build machine — one-time setup
xcode-select --install          # if not already present (gives osacompile, codesign, hdiutil)
brew install nsis               # gives makensis, used to compile the Windows installer FROM macOS

# Node-side tooling
npm install --save-dev create-dmg
npm install --save-dev makensis   # Node wrapper that shells out to the makensis binary
```

No changes needed for checksum generation — use Node's built-in `crypto` module (`crypto.createHash('sha256')`) inside `scripts/gh-release.js`; no package to install.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| NSIS (`makensis`, compiled from macOS via Homebrew, no CI needed) | Inno Setup (`PrivilegesRequired=lowest`) | Inno Setup produces a marginally more polished default wizard UI and has a somewhat better reputation with antivirus heuristics than NSIS (see "What NOT to Use" caveat below) — but its official compiler (`ISCC.exe`) is Windows-only. It only becomes the easier choice if the pipeline later moves to GitHub Actions, where the `windows-latest` runner image ships with Inno Setup preinstalled (confirmed via GitHub's `runner-images` repo). If a Windows machine or Windows CI runner enters the picture, revisit and prefer Inno Setup for the nicer wizard. Compiling Inno Setup directly from macOS today requires Wine/Docker (e.g. `amake/innosetup-docker`), which is meaningfully more setup friction than `brew install nsis`. **Confidence: MEDIUM.** |
| `.app` + `.dmg` (osacompile + create-dmg) | `.pkg` via `productbuild --domains` with `enable_currentUserHome=true` | This *can* make a `.pkg` install without an admin password by targeting the "current user home" domain instead of the system domain — meaning the existing `pkgbuild`-based pipeline could theoretically be patched rather than replaced. However, an Apple Developer Forums report describes this configuration as flaky ("randomly fails, sometimes still asks for the admin password"), and Apple's Installer.app wizard is built for complex multi-location enterprise deployments — heavier and less customizable than a small native app for a simple single-folder copy. Only worth revisiting if a future need arises for a more complex, multi-destination install (e.g. simultaneously installing for Illustrator *and* Photoshop plugin folders in one step) where the Installer.app wizard's built-in choice/step UI becomes genuinely useful. **Confidence: LOW** (single forum report, not independently reproduced in this research pass — flag as a gap, see Gaps below). |
| `osacompile` (built into macOS) | Platypus (`sveinbjornt/Platypus`) | Platypus is a well-regarded, actively maintained GUI/CLI tool for wrapping scripts as native Mac apps, with more polish (custom icons, bundled interpreter choices, etc.) than a raw AppleScript app. Use it instead of `osacompile` if the installer's UX needs grow beyond "copy files + show a native alert" — e.g. a real progress bar, drag-and-drop input, or Python/Ruby logic instead of shell. For this project's scope (copy a folder, verify, alert), `osacompile` avoids adding a third-party dependency at all. **Confidence: MEDIUM.** |
| No paid code signing for now (per PROJECT.md decision) | Microsoft "Artifact Signing" (formerly Trusted Signing), ~$10/month | This is a *materially* cheaper alternative to a full EV certificate that was likely not on the radar when the "no paid signing" decision was made — no hardware token, integrates directly with CI/CD (GitHub Actions, Azure DevOps). It does **not** eliminate the SmartScreen warning immediately (reputation still has to build), but a signed identity's reputation persists and compounds release-over-release, unlike unsigned files which reset to zero reputation on every new version. Given PROJECT.md explicitly asks to "periodically re-ask" about paid signing, this is the concrete option to raise at the next revisit — much lower cost than the EV/OV certs originally being weighed. **Confidence: MEDIUM** (official Microsoft Learn documentation, updated 2026-05). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `pkgbuild` targeting the system domain (current approach) | Requires root/admin authentication even though the actual destination (`~/Library/...`) is inside the user's own home directory — there was never a structural need for elevation. Also invokes Apple's generic Installer.app wizard, whose "unidentified developer" package warning reads as more alarming/legalistic to a non-technical user than a custom native alert. | `osacompile`-built `.app` (ad-hoc signed) inside a `create-dmg`-built `.dmg` |
| Bare `.bat` script (current Windows approach) | No wizard, no uninstall registration, no progress feedback, looks and feels like a raw hacker tool to a non-technical user — actively undermines the "feels trustworthy" goal even though it's technically harmless | NSIS installer with `RequestExecutionLevel user`, a real wizard (Welcome → Ready to Install → Finish), and a registered uninstaller under `HKEY_CURRENT_USER` |
| Paying for a Windows EV code-signing certificate specifically to avoid the SmartScreen warning | Per Microsoft's own current documentation (updated 2026-05), **EV certificates no longer grant an immediate SmartScreen reputation bypass** — this behavior was removed. Paying a premium for EV "solely to avoid SmartScreen is no longer justified" (Microsoft's own wording). | If/when signing is revisited: the cheaper Artifact Signing (~$10/mo) option, or continue unsigned and let reputation build organically |
| Instructing end users to run `xattr -d com.apple.quarantine` on the downloaded file | This is a real (if narrow) security control being disabled by the user on your say-so — it trains a non-technical user to bypass a warning dialog by typing a terminal command, which is a bad habit to teach and reads as suspicious/hacker-ish rather than trustworthy | Document the built-in, supported bypass instead: **System Settings → Privacy & Security → scroll to bottom → "Open Anyway" → authenticate** (see Realistic User Experience below) |
| Homebrew/NSIS/Inno without accounting for antivirus false-positive risk | NSIS installers are a long-documented, recurring target for Windows Defender / third-party AV heuristic false-positives ("Trojan:Win32/Bulta!rfn", "Suspicious.Win32.Save.a") — a known, if usually quickly-corrected, upstream issue that is not GuideMyGrid-specific. This is a real risk to the "feels trustworthy" goal, since an AV "Trojan" flag is scarier to a non-technical user than a generic SmartScreen prompt. Inno Setup is not fully immune either, but has fewer reports of this specific pattern. | Ship NSIS for pipeline simplicity now (per the recommendation above), but if a release ever gets a Defender false-positive report from a user, submit the file to Microsoft's [Security Intelligence portal](https://www.microsoft.com/en-us/wdsi/filesubmission) for a fast correction, and consider moving to Inno Setup (via GitHub Actions) if it recurs |

## Stack Patterns by Variant

**If the paid-signing decision is revisited and approved (either platform):**
- macOS: Enroll in the Apple Developer Program ($99/yr), get a **Developer ID Application** certificate, code-sign + **notarize** the `.app` before wrapping in the DMG (`create-dmg` supports this natively once a cert is present — no code changes needed, just remove `--no-code-sign`)
- Windows: Adopt Microsoft **Artifact Signing** (~$10/mo, no hardware token) over a traditional EV cert — cheaper, CI-friendly, and the current recommended path per Microsoft's own guidance

**If the release pipeline later moves to GitHub Actions (e.g. for other reasons, not required by this milestone):**
- Windows: Switch from local `makensis` (Homebrew) to Inno Setup on the `windows-latest` runner (preinstalled — zero setup), for its more polished default wizard
- macOS: Can still run on `macos-latest`, same `create-dmg` + `osacompile` toolchain

**If the "single-folder copy" install ever needs to become multi-destination (e.g. installing into both Photoshop's and a future Illustrator's UXP folders in one step):**
- Reconsider `.pkg` via `productbuild --domains` (current-user-home domain) on macOS, since Installer.app's built-in "choices" UI is designed for exactly this kind of multi-target install — but re-verify the "flaky, sometimes still asks for password" report before committing (see Gaps below)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `create-dmg` (npm) | Node ≥ 20, macOS ≥ 10.13 (output DMG); no Developer ID required with `--no-code-sign` | |
| `osacompile`-built `.app` | Ad-hoc `codesign` (`--sign -`) works on both Intel and Apple Silicon Macs; on Apple Silicon, unsigned/ad-hoc-signed binaries can still run locally but any distributed copy is Gatekeeper-quarantined on first download regardless of signing state | |
| NSIS 3.x / `makensis` (Homebrew) | Any Windows version currently supported by Photoshop; `RequestExecutionLevel user` requires no OS-side minimum beyond standard Windows 10/11 | |
| GitHub Releases native SHA256 digests | Available for all assets uploaded since June 2025 — no version gate, applies retroactively to newly uploaded assets | |

## Realistic User Experience (No Paid Signing) — What the Guide/README Must Cover

**macOS (current: Sequoia/Tahoe-era Gatekeeper, confirmed cross-source, Confidence: MEDIUM):**
1. User double-clicks the mounted DMG's installer icon → macOS blocks it outright ("cannot be opened because Apple cannot check it for malicious software"). The old workaround (Control-click → Open) **no longer works** as of macOS 15.1 — it was removed.
2. The only supported path now: open **System Settings → Privacy & Security**, scroll to the bottom, click the **"Open Anyway"** button that appears (referencing the specific blocked app), then authenticate with password/Touch ID.
3. This exception is per-app and **expires after about an hour** if the user doesn't act on it — so the install instructions should tell the user to do this immediately after the first failed double-click, not "whenever."
4. Every new version's binary is a new, unrecognized hash — this flow repeats on every update unless the developer later adopts notarization.
5. Ad-hoc signing (free) does not remove this flow; it only avoids the (worse, and technically inaccurate) "app needs to be updated" wording that pure-unsigned binaries can trigger.

**Windows (current SmartScreen behavior per Microsoft's own May-2026-updated docs, Confidence: MEDIUM):**
1. First run of the installer shows **"Windows protected your PC"** (SmartScreen). User must click **"More info"** → **"Run anyway"**.
2. This is independent of which installer tool is used (NSIS/Inno) — it's purely a function of being unsigned.
3. Reputation for this exact file builds automatically over "several weeks and hundreds of clean installs" — it is not something the developer can accelerate manually for a consumer-facing app, and does not carry over between versions unless signed with a consistent identity.
4. **EV certificates no longer bypass this** (confirmed, current as of 2026) — so there is no cheap-but-still-somewhat-expensive shortcut via a "budget EV cert"; it's either full unsigned-and-wait, or Microsoft's newer Artifact Signing subscription.

**Practical mitigation available without any paid signing, for both platforms:**
- A short, plain-language "First-time install" doc/GIF showing exactly the click sequence above (this is a documentation/UX deliverable for this milestone, not a tooling one — flag for the README rewrite already in PROJECT.md's Active requirements)
- Publish the SHA256 checksum prominently in the release notes/README so a user who *does* get suspicious has something concrete to check
- Keep binaries name- and version-consistent between GitHub Releases and Gumroad so users never wonder if they got a tampered copy from a third party

## Gaps to Flag for Phase-Specific Research

- The `productbuild --domains enable_currentUserHome` flakiness claim rests on a single forum report (LOW confidence) — if a future phase wants to keep `.pkg` instead of switching to `.app`+DMG, this specific mechanism should be hands-on tested before relying on it.
- Exact current wording of the macOS "cannot be opened" dialog for an **ad-hoc-signed** (vs fully unsigned) app was not independently confirmed screenshot-for-screenshot in this pass — recommend a quick manual test build early in implementation to capture exact current dialog text/screenshots for the install guide.
- Whether Photoshop needs to be closed/relaunched for the plugin to pick up a fresh install/update was not covered here (this is existing, already-working UXP behavior per PROJECT.md, out of scope for this stack research).

## Sources

- [Microsoft Learn: SmartScreen reputation for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) — official, updated 2026-05 — Confidence: MEDIUM
- [GitHub Changelog: Releases now expose digests for release assets](https://github.blog/changelog/2025-06-03-releases-now-expose-digests-for-release-assets/) — official — Confidence: MEDIUM
- [Eclectic Light Company: Gatekeeper and notarization in Sequoia](https://eclecticlight.co/2024/08/10/gatekeeper-and-notarization-in-sequoia/) — Confidence: MEDIUM (cross-checked with Macworld/iboysoft on Tahoe behavior)
- [Macworld / iboysoft: opening unsigned apps in Sequoia/Tahoe via System Settings](https://iboysoft.com/tips/allow-apps-to-run-sequoia.html) — Confidence: MEDIUM
- [lapcatsoftware.com: Distributing Mac apps without notarization](https://lapcatsoftware.com/articles/without-notarization.html) — Confidence: LOW–MEDIUM (independent developer blog, but consistent with official Apple forum threads)
- [Apple Developer Forums: create pkg without admin password to install](https://developer.apple.com/forums/thread/661733) — Confidence: LOW (single-source forum report)
- [Inno Setup official docs: `PrivilegesRequired`](https://jrsoftware.org/ishelp/topic_setup_privilegesrequired.htm) — official — Confidence: MEDIUM
- [NSIS official docs: `RequestExecutionLevel`](https://nsis.sourceforge.io/Reference/RequestExecutionLevel) — official — Confidence: MEDIUM
- [Homebrew Formula: `makensis`](https://formulae.brew.sh/formula/makensis) — official Homebrew — Confidence: MEDIUM
- [sindresorhus/create-dmg (GitHub/npm)](https://github.com/sindresorhus/create-dmg) — Confidence: MEDIUM
- [NSIS False Positives (official NSIS wiki)](https://nsis.sourceforge.io/NSIS_False_Positives) — official project page — Confidence: MEDIUM
- [electron-builder issue #6347: NSIS installer flagged as trojan](https://github.com/electron-userland/electron-builder/issues/6347) — Confidence: LOW (anecdotal issue thread, but corroborates the official NSIS wiki page above)

---
*Stack research for: no-root/no-admin, unsigned desktop installer distribution (macOS + Windows) for a UXP Photoshop plugin*
*Researched: 2026-07-04*
