# Phase 1: Foundation & macOS Installer Rework - Research

**Researched:** 2026-07-04
**Domain:** Branch consolidation + user-level (no-root) macOS installer for a UXP Photoshop plugin, built via `osacompile`/ad-hoc `codesign`/`create-dmg`
**Confidence:** MEDIUM-HIGH (core mechanisms cross-checked against official docs and the project's own prior research; the actual current installer scripts were read directly from `origin/main` this session — HIGH confidence on "what exists today")

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Branch Strategy**
- **D-01:** Merge `origin/main` into the current `epic/ui-icons` branch (not a fresh branch off main). This preserves the 10 unmerged UI-icons commits already on this branch and adds the installer work from `origin/main`. This milestone's work continues on `epic/ui-icons`.

**Installer Feel**
- **D-02:** Double-clicking the installer opens a small confirmation dialog — "Install GuideMyGrid?" with an Install button — rather than silently copying files with no feedback.
- **D-03:** The installer app itself is labeled "Install GuideMyGrid" (not just "GuideMyGrid") wherever its name is visible (Finder, any dialog title).

**Quit-Photoshop Guard**
- **D-04:** Hard block, not a soft warning. If Photoshop is detected running during install or uninstall, the installer refuses to proceed and shows "Please quit Photoshop first" until the user closes it. This applies to both install and uninstall.

**Success Feedback**
- **D-05:** After a successful install, show an "Installed! Open Photoshop" dialog — confirms success and tells the user exactly what to do next. Not a silent close.

**Visual Design / Branding**
- **D-06:** Reuse the existing icon system, colors, and UI already built in the `ui-icons` epic. Do NOT design new visuals for the installer — no new icon, no new color scheme. Whatever installer chrome/branding is needed should draw from what already exists in the plugin.

### Claude's Discretion
- Exact merge conflict resolution mechanics between `epic/ui-icons` and `origin/main` (the user approved the merge direction, not the mechanics).
- Directory structure implementation details within `distribution/photoshop/macos/` and `release/` (per ARCHITECTURE.md research — not re-litigated here).
- Exact wording of the "Please quit Photoshop first" and "Installed!" dialogs beyond the intent captured above.
- Technical choice of installer-building tool (`osacompile` + ad-hoc `codesign` + `create-dmg`, per STACK.md research) — this is an implementation detail, not something the user weighed in on.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within this phase's scope (branch sync, installer mechanics, macOS install/uninstall UX). Windows, checksums, release automation, and documentation are already scoped to their own later phases per ROADMAP.md.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Merge `origin/main`'s existing installer work (v1.6.1-1.6.2) into the current working branch before building on top of it | See `## FOUND-01: Merge Conflict Map` — every conflicting file identified by direct diff, with a resolution recommendation for each |
| FOUND-02 | Establish `distribution/photoshop/{macos,windows}` + `release/` directory split | See `## Architecture Patterns` — exact target structure, what moves now vs. later, and the `release/` vs `releases/` naming collision risk |
| MAC-01 | Replace root-requiring `pkgbuild` `.pkg` with a user-level installer copying into `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/...` | See `## Standard Stack` (osacompile/codesign/create-dmg) and `## Code Examples` |
| MAC-02 | Installer writes an install-time manifest listing every file/folder it creates | See `## Code Examples` — manifest format recommendation (flat JSON list of absolute paths) |
| MAC-03 | Installer detects if Photoshop is running and asks the user to quit first | See `## Code Examples` — process-detection snippet; see `## Common Pitfalls` for the "renamed/wrong process name" gotcha |
| MAC-04 | Installer scripts use absolute binary paths, never trust inherited `$PATH`/shell rc files | See `## Common Pitfalls` Pitfall 2 — confirms the **current** `postinstall` script violates this today (read directly from `origin/main`) |
</phase_requirements>

## Summary

This phase has two halves that must both land before Phase 2 can start: (1) a real git merge bringing `origin/main`'s already-shipped-but-flawed installer work onto `epic/ui-icons`, and (2) a from-scratch rebuild of the macOS installer that eliminates root elevation entirely. Both halves are now grounded in code actually read this session, not just described secondhand in prior research: the current `scripts/pkg-resources/postinstall` script (built via `pkgbuild`) elevates to root by construction (Pitfall 1, already flagged project-wide) *and* independently violates MAC-04 today — it calls `stat`, `dscl`, `awk`, `cp`, `chown`, `find`, `rm`, `rmdir` all by bare name, trusting `$PATH`, with no absolute paths anywhere. This is not a hypothetical risk to audit for later; it is the literal state of the code this phase replaces.

The recommended replacement is the stack already validated in the project's `STACK.md`: an `osacompile`-built `.app` (never elevates, since AppleScript apps run as the invoking user), ad-hoc signed via `codesign --sign -`, wrapped in a `create-dmg`-built DMG (v8.1.0, confirmed installed locally and legitimacy-checked clean). All required build tools (`osacompile`, `codesign`, `hdiutil`, `dscl`, `stat`) are already present on this machine — no environment gaps block this phase. The installer's UX must implement D-02 through D-05: a native "Install GuideMyGrid?" confirmation dialog, a hard Photoshop-running block (D-04), and an "Installed! Open Photoshop" success dialog — all built with AppleScript's native `display dialog`/`display alert`, styled only insofar as D-06 allows (reuse existing icon/color tokens where the OS dialog surface permits an icon, not a redesign).

Merging `origin/main` (FOUND-01) is a small, well-scoped git operation: five files conflict (`manifest.json`, `package.json`, `src/version.ts`, `webpack.config.js`, `.gitignore`), all with clear, low-risk resolutions documented below, plus wholesale additions of installer scripts and `releases/*` binaries that need to be evaluated against the newer `epic/ui-icons` `.gitignore` convention (which excludes built artifacts — a deliberate, better practice this phase should preserve, not regress). FOUND-02's directory split (`distribution/photoshop/{macos,windows}` + `release/`) should be established this phase per the project's own `ARCHITECTURE.md`, with Windows getting a placeholder (its content rework is Phase 2) and `release/` receiving only the scripts that already exist in host-agnostic form today (`gh-release.js`, `sync-version.js`) — not new Phase 3/4 scripts that don't exist yet.

**Primary recommendation:** Merge `origin/main` first (small, mechanical, documented conflicts below), then replace `pkgbuild`+root-postinstall with an `osacompile`-built, ad-hoc-signed, unprivileged `.app` wrapped in a `create-dmg` DMG — do not attempt to patch the existing `.pkg` flow, since root elevation is structural to `.pkg`, not a bug in this specific script.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Merge conflict resolution (FOUND-01) | Build/Repo tooling | — | Git-level operation, not runtime code |
| Directory restructuring (FOUND-02) | Build/Repo tooling | — | Filesystem layout, no runtime behavior |
| Installer UI (confirm/success dialogs) | Native OS layer (AppleScript `.app`) | — | Runs entirely outside the UXP/Photoshop runtime, as the invoking user, pre-install |
| Photoshop-running detection | Native OS layer (AppleScript/`osascript`) | — | Queries `System Events`/process table; has no relationship to the plugin's own React/UXP code |
| File copy → `~/Library/.../PluginsStorage/PHSP/...` | Native OS layer (shell inside the `.app`) | — | Filesystem write, user-level, outside UXP sandbox |
| Install-time manifest write | Native OS layer (shell inside the `.app`) | — | Simple flat-file write, no persistence layer needed |
| Plugin runtime (grid generation, UI panel) | UXP/Photoshop app (`src/`) | — | Unaffected by this phase — installer and app are structurally separate, confirmed by the project's own `ARCHITECTURE.md` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `osacompile` | macOS built-in (Xcode CLT) | Compiles an AppleScript into a real double-clickable `.app` that runs as the current user, never root | [VERIFIED: local] Confirmed present at `/usr/bin/osacompile` on this dev machine. Ships with every Mac. Structurally cannot request elevation — solves MAC-01 by construction, not by configuration. |
| `codesign --sign -` (ad-hoc) | macOS built-in | Signs the `.app` with a self-generated, identity-less signature | [VERIFIED: local] Confirmed present at `/usr/bin/codesign`. Free, no Apple ID needed. Does not remove Gatekeeper's warning (see Pitfall below) but is a prerequisite for reliable execution on Apple Silicon. |
| `create-dmg` (npm, sindresorhus) | 8.1.0 | Wraps the installer `.app` in a distributable single-icon DMG | [VERIFIED: npm registry + package-legitimacy check] `npm view create-dmg version` → `8.1.0`, published 2026-03-21. `package-legitimacy check` verdict: **OK** (weekly downloads 3,975, repo `github.com/sindresorhus/create-dmg`, no postinstall script, not deprecated). Its `--no-code-sign` flag is purpose-built for exactly this no-paid-cert scenario. |
| `hdiutil` | macOS built-in | Underlying DMG creation tool `create-dmg` wraps | [VERIFIED: local] Confirmed present at `/usr/bin/hdiutil`. |
| Node `fs` (built-in) | n/a | Writes the install-time manifest (flat JSON/text list of absolute paths) and orchestrates the `osacompile`/`codesign`/`create-dmg` build steps from a Node script, matching the existing `scripts/build-mac-pkg.js` pattern | No new dependency. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dscl`, `stat` (macOS built-ins) | n/a | Resolve the real invoking user's home directory when needed | [VERIFIED: local] Both present. Only needed if any part of the flow ever runs with elevated context (it should not, post-rework) — otherwise `$HOME`/`~` resolved as the current user is already correct for an unprivileged `.app`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `osacompile`-built `.app` | Platypus (`sveinbjornt/Platypus`) | More polish (custom icons, progress bars) but adds a third-party dependency for a use case (copy files + 2-3 dialogs) that `osacompile` already covers. Not worth it for this phase's scope. |
| `.app` + `.dmg` | `productbuild --domains enable_currentUserHome` (keep `.pkg`, target user domain instead of system domain) | **[CITED: STACK.md research, LOW-confidence single forum source]** Can technically avoid root, but reported as flaky ("randomly fails, sometimes still asks for the admin password"). Do not use without independent hands-on verification — not worth the risk when `osacompile` is a known-good, zero-dependency alternative. |

**Installation:**
```bash
# One-time, macOS build machine (already satisfied on this machine — verified this session)
xcode-select --install    # gives osacompile, codesign, hdiutil — already present

# Node-side
npm install --save-dev create-dmg
```

**Version verification:** `npm view create-dmg version` → `8.1.0` (confirmed this session, 2026-07-04). `osacompile`/`codesign`/`hdiutil`/`dscl`/`stat` verified present via `which` on the local dev machine — no install step needed for those.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| `create-dmg` | npm | ~published 2026-03-21 (latest version; package itself is long-established, maintained by sindresorhus) | 3,975/wk | `github.com/sindresorhus/create-dmg` | **OK** | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

No other new external packages are needed this phase — `osacompile`, `codesign`, and `hdiutil` are macOS built-ins, not npm packages, and require no registry check.

## FOUND-01: Merge Conflict Map

Direct diff of `origin/main` vs. `epic/ui-icons` (merge-base `9593392`) performed this session. **5 files will conflict**, all small and low-risk; the remaining changes are pure additions (new installer scripts, new `releases/*` binaries, new `.github/workflows/release.yml`).

| File | Conflict | Recommended Resolution |
|------|----------|------------------------|
| `manifest.json` | `epic/ui-icons`: `manifestVersion: 4`, `version: 1.6.0`, host has `apiVersion: 2`. `origin/main`: `manifestVersion: 5`, `version: 1.6.2`, host drops `apiVersion`, `minVersion` bumped `22.0.0`→`23.0.0` | **[ASSUMED]** Take `origin/main`'s v5 schema (commit message: "Distribution validator requires v5") — this is a forward-compat fix independent of the Adobe Marketplace decision (out of scope), likely required by Adobe's own local packaging/signing tooling. Confirm `minVersion: 23.0.0` doesn't regress support for any Photoshop version the user still needs before accepting. |
| `package.json` | `epic/ui-icons` is missing the `publish:patch`/`publish:minor`/`publish:major` scripts that `origin/main` added (wired to `scripts/gh-release.js`) | Take `origin/main`'s scripts — they're needed for this milestone's eventual release automation (Phase 4) and cost nothing to keep now. |
| `src/version.ts` | Version string mismatch (`1.6.0` vs `1.6.2`) | Take `origin/main`'s value; this file is regenerated by `scripts/sync-version.js` from `package.json` on every build (`prebuild` hook), so the actual value doesn't need manual reconciliation beyond taking a valid starting point. |
| `webpack.config.js` | `origin/main` added `globOptions: { ignore: ['**/.DS_Store'] }` to the icons `CopyWebpackPlugin` pattern; `epic/ui-icons` doesn't have it | Take `origin/main`'s version — it's a strict hygiene improvement (keeps `.DS_Store` out of the built plugin), no functional conflict with anything on `epic/ui-icons`. |
| `.gitignore` | `epic/ui-icons` added `releases/`, `*.ccx`, `!.planning/**/*.md` and removed `.tmp-installer/`; `origin/main` still tracks `releases/*` binaries in git and still ignores `.tmp-installer/` | **Keep `epic/ui-icons`'s newer convention** (ignore built release artifacts). This directly matches the milestone's own stated principle that "GitHub Releases remains the canonical file host" (PROJECT.md) — tracking multi-MB binary installers in git is repo bloat this milestone should not reintroduce. After merging, decide explicitly whether to `git rm --cached` the historical `releases/*.pkg`/`.ccx`/`.zip` files that `origin/main` already committed, or leave old history alone and just stop tracking new ones going forward (lower-risk option — avoids rewriting shared history). |

**Non-conflicting additions from `origin/main` that will land cleanly:**
`.github/workflows/release.yml` (disabled/fallback CI, `workflow_dispatch` only), `scripts/build-mac-pkg.js`, `scripts/build-mac-uninstaller.js`, `scripts/gh-release.js`, `scripts/install.{sh,bat,ps1}`, `scripts/uninstall.{bat,ps1}`, `scripts/pkg-resources/{postinstall,uninstall-preinstall}`, `scripts/package.js` (modified/expanded), plus `releases/*` binary files (see `.gitignore` note above for what to do with these post-merge).

**Important:** these newly-merged-in scripts are exactly the ones this phase's MAC-01–04 work replaces (macOS side) or leaves untouched for Phase 2 (Windows side) — the merge briefly reintroduces the root-elevating `.pkg` flow into the working tree; this is expected and should be immediately superseded by the `distribution/photoshop/macos/` rework in the same phase, not left in place.

## Architecture Patterns

### System Architecture Diagram

```
[Build: npm run build]
        │
        ▼
   dist/ (webpack output: manifest.json + JS/CSS/icons)
        │
        ▼
[distribution/photoshop/macos/build-installer.js]   ← NEW this phase, replaces scripts/build-mac-pkg.js
        │
        ├─▶ osacompile → GuideMyGrid-Installer.app (unprivileged)
        │        │
        │        ├─ On launch: display dialog "Install GuideMyGrid?" [Install]   (D-02, D-03)
        │        ├─ Check: is Photoshop running? ──▶ if yes: display alert "Please quit Photoshop first", loop/block (D-04, MAC-03)
        │        ├─ Copy dist/ → ~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/<ver>/Plugin/com.guidemygrid.plugin/  (MAC-01)
        │        ├─ Write install-manifest.json listing every created path   (MAC-02)
        │        └─ display dialog "Installed! Open Photoshop"   (D-05)
        │
        ├─▶ codesign --sign - (ad-hoc)
        │
        └─▶ create-dmg --no-code-sign → GuideMyGrid-Installer.dmg
                 │
                 ▼
         releases/ (or GitHub Release asset, Phase 4) — distributable artifact
```

### Recommended Project Structure

```
guidemygrid/
├── src/                              # UNCHANGED — UXP app source
├── manifest.json                     # UNCHANGED location (UXP tooling requirement)
├── distribution/                     # NEW this phase (FOUND-02)
│   ├── README.md                     # "One subfolder per host app. release/ stays generic."
│   └── photoshop/
│       ├── macos/                    # ACTIVE this phase
│       │   ├── build-installer.js    # osacompile + codesign + create-dmg orchestrator (replaces build-mac-pkg.js)
│       │   ├── installer.applescript # the AppleScript source osacompile compiles (dialogs, PS-check, copy, manifest write)
│       │   └── README.md             # "macOS-specific: PluginsStorage/PHSP path, .app/.dmg packaging"
│       └── windows/                  # PLACEHOLDER this phase — content rework is Phase 2
│           └── README.md             # "Windows installer rework lands in Phase 2. Existing scripts relocated here as-is; do not modify their logic in Phase 1."
├── release/                          # NEW this phase — only what already exists in host-agnostic form
│   ├── version.js                    # renamed from scripts/sync-version.js (already host-agnostic)
│   └── github-release.js             # renamed from scripts/gh-release.js (already host-agnostic)
│                                      # checksums.js (Phase 3) and gumroad-sync.js (Phase 4) do NOT exist yet — don't stub them now
├── scripts/                          # Build-time only (webpack-adjacent), reduced scope after this phase
├── releases/                         # Existing binary-output dir — keep .gitignore'd per merge decision above
```

### Structure Rationale

- **`distribution/photoshop/windows/` gets a placeholder, not a rewrite:** FOUND-02 requires the directory to *exist* and be *ready* for Phase 2's work — it does not require Phase 2's content to be written now. Relocate the existing (still-flawed) `install.{sh,bat,ps1}`/`uninstall.{bat,ps1}` scripts here unmodified during the merge/restructure so Phase 2 has a stable starting location, but do not touch their internal logic — that's explicitly out of this phase's requirement list (WIN-01..05 are Phase 2).
- **`release/` gets only `version.js` and `github-release.js` this phase, not `checksums.js`/`gumroad-sync.js`:** Per the project's own `ARCHITECTURE.md` Anti-Pattern 2 ("don't build a scaffold just in case"), only migrate scripts that already exist and are already host-agnostic. Creating empty stub files for Phase 3/4 work this phase adds dead code with no test coverage and risks going stale before those phases start.
- **`release/` (singular, new, scripts) vs. `releases/` (plural, existing, binary output) — deliberately different directories with dangerously similar names.** This is a real, concrete risk of confusion for both humans and any script that globs paths. Recommend a one-line comment at the top of any new `release/*.js` file clarifying: "This is the release-automation-scripts directory. Built binary artifacts live in `releases/` (plural) — do not confuse the two."
- **`src/services/updateChecker.ts` is untouched** — confirmed out of scope for this phase; it's runtime app code, not distribution tooling, per the project's own `ARCHITECTURE.md`.

### Pattern 1: AppleScript installer as a thin script, not an app-in-Xcode

**What:** The entire installer logic (confirm dialog → PS-running check → copy → manifest write → success dialog) lives in one `.applescript` source file compiled by `osacompile`. No Xcode project, no Swift, no compiled binary beyond what `osacompile` produces.

**When to use:** Now — this phase's scope (copy a folder, show 2-3 native dialogs, block on a running-process check) is exactly what `osacompile` is built for. Do not reach for Xcode/Swift or a third-party app-wrapper tool.

**Example:**
```applescript
-- Source: osacompile is a first-party macOS tool; this is a standard AppleScript pattern (not from a single official doc)
-- distribution/photoshop/macos/installer.applescript

property pluginID : "com.guidemygrid.plugin"

set confirmed to display dialog "Install GuideMyGrid?" ¬
  with title "Install GuideMyGrid" ¬
  buttons {"Cancel", "Install"} default button "Install"

if button returned of confirmed is "Cancel" then
  return
end if

-- MAC-03 / D-04: hard block if Photoshop is running
repeat
  set psRunning to (do shell script "/usr/bin/pgrep -i photoshop || true") is not ""
  if not psRunning then exit repeat
  display alert "Please quit Photoshop first" message ¬
    "GuideMyGrid can't install while Photoshop is open. Quit Photoshop, then click OK to continue." ¬
    buttons {"Cancel", "OK"} default button "OK"
end repeat

-- ... copy dist/ into PluginsStorage, write manifest (see Code Examples) ...

display dialog "Installed! Open Photoshop" with title "GuideMyGrid" buttons {"OK"} default button "OK"
```
Then: `osacompile -o "Install GuideMyGrid.app" installer.applescript && codesign --sign - "Install GuideMyGrid.app"`.

### Anti-Patterns to Avoid

- **Patching `.pkg`/`pkgbuild` to "not need root":** Root elevation is a structural property of the `.pkg` format's pre/postinstall script execution model, not a configurable flag on this specific installer. There is no supported way to make `pkgbuild`'s scripts run unprivileged. Replace the mechanism entirely; do not attempt to "fix" it in place.
- **Bare command names inside the AppleScript's `do shell script` calls:** `do shell script "pgrep ..."` still resolves `pgrep` via the invoking shell's `$PATH`. Use absolute paths (`/usr/bin/pgrep`, `/bin/cp`, `/bin/mkdir`) inside every `do shell script` call to satisfy MAC-04 — this is not automatic just because the `.app` itself runs unprivileged.
- **Building `distribution/photoshop/windows/` content this phase:** Explicitly out of scope (Phase 2's WIN-01..05). Relocate existing files only; do not rewrite their logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double-clickable native macOS app wrapper | A custom Swift/Xcode project, or shipping a bare `.sh` the user has to run from Terminal | `osacompile` | Zero new dependency, ships with every Mac, produces a real double-clickable `.app`; matches the existing codebase's pattern of shelling out to macOS built-ins from a Node build script (`scripts/build-mac-pkg.js` already does this for `pkgbuild`). |
| DMG packaging/branding | Manual `hdiutil create` + Finder window position scripting | `create-dmg` | `create-dmg` already solves DMG background/icon-position/`--no-code-sign` handling; hand-rolling `hdiutil` invocations to replicate this is redoing well-tested, MIT-licensed work for no benefit. |
| "Is Photoshop running" detection | A custom polling daemon or LaunchAgent | A single `pgrep`/`osascript System Events` check at install/uninstall time, run synchronously in the AppleScript | This is a one-shot, install-time gate (D-04), not a background service — building anything more elaborate is scope creep the requirements don't ask for. |

**Key insight:** Every piece of this phase's installer can be built entirely from macOS built-in tools plus one small, well-vetted npm package (`create-dmg`). Resist any temptation to introduce a heavier app-packaging framework (Electron-builder-style tooling, Platypus, a Swift project) — none of it is needed for "copy a folder + show three dialogs + block on a process check."

## Runtime State Inventory

> Included because this phase both merges two diverged branches (FOUND-01) and restructures/replaces installer scripts (MAC-01) — both are refactor-adjacent operations with runtime-state implications beyond the git diff.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** The plugin itself has no database/datastore; grid config lives only in in-memory Zustand state (confirmed via `codebase/CONCERNS.md` — "No Persistent State"). | None. |
| Live service config | **None found in scope.** No external service (n8n, Datadog, etc.) references this project's naming. | None. |
| OS-registered state | **Yes — the currently-shipped `.pkg` installer/uninstaller are OS-registered via macOS's package receipt database** (`pkgutil --pkgs` will show `com.guidemygrid.installer` / `com.guidemygrid.uninstaller` on any machine where the old `.pkg` was actually run). Switching to an `.app`-based installer does **not** automatically clean up these old receipts on machines that installed via the old `.pkg` — they become orphaned metadata (harmless but present). | Document (README/release notes, Phase 5 scope) that users who installed via the old `.pkg` may see a stale package receipt; not a functional bug, no code fix needed this phase, but flag it so Phase 5's documentation doesn't overlook it. |
| Secrets/env vars | **None found.** No `.env`, no SOPS keys, no CI secrets referenced by the installer scripts read this session. | None. |
| Build artifacts / installed packages | **Yes.** The existing `releases/*.pkg`/`.ccx`/`.zip` files are committed to git on `origin/main` (binary blobs) — see `.gitignore` merge-conflict note above. Also: any machine that has actually run the old `.pkg` will have plugin files already installed at `~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/<ver>/Plugin/com.guidemygrid.plugin/` — the new installer must overwrite/coexist with these cleanly (same destination path, so a straightforward overwrite is correct and expected — not a migration). | New installer should write to the exact same destination path so it naturally supersedes old installs without a special migration step. Verify this explicitly in manual testing (install old `.pkg` first if a clean-test machine is available, then run the new installer over it). |

**Canonical question for this phase:** *After the new `.app`-based installer replaces the old `.pkg`, what does a machine that already ran the old `.pkg` look like?* Answer: identical plugin files at the same destination (safe to overwrite), plus one harmless orphaned `pkgutil` receipt (cosmetic only, not fixed this phase).

## Common Pitfalls

### Pitfall 1: `pkgbuild`/`.pkg` always elevates to root — already confirmed present in the code this phase replaces
**What goes wrong:** `.pkg` installers run pre/postinstall scripts as root regardless of the actual destination. **Confirmed directly this session**: `scripts/pkg-resources/postinstall` (read from `origin/main`) copies into `~/Library/Application Support/Adobe/UXP/...` — a user-writable path — yet still runs as root because it's invoked through `pkgbuild`/Installer.app.
**Why it happens:** `.pkg` was designed for system-level installs; using it for a user-level payload inherits elevation nobody asked for.
**How to avoid:** Replace `pkgbuild` entirely with `osacompile` (see Standard Stack). Do not attempt `productbuild --domains enable_currentUserHome` without independent hands-on verification (LOW-confidence, reportedly flaky per STACK.md's own research).
**Warning signs:** Any build step that calls `pkgbuild`/`productbuild`, or any manual test where Installer.app asks for a password.

### Pitfall 2: The current `postinstall` script also independently violates MAC-04 (confirmed, not hypothetical)
**What goes wrong:** Read directly this session: `scripts/pkg-resources/postinstall` calls `stat -f%Su`, `dscl`, `awk`, `mkdir`, `cp`, `find`, `chown` — all as bare command names, trusting `$PATH`, with no `set PATH=...` guard and no `env -i`. This is a textbook PATH-hijacking surface (MITRE ATT&CK T1574.007), made worse by the fact this script *also* runs as root (Pitfall 1).
**Why it happens:** Path of least resistance in a quickly-written `.sh` postinstall script.
**How to avoid:** In the new AppleScript-driven installer, every `do shell script` call must use absolute paths: `/bin/cp`, `/bin/mkdir`, `/usr/bin/pgrep`, `/usr/bin/dscl` (if still needed — likely unnecessary once nothing runs as root, since `$HOME` resolves correctly for an unprivileged process). Never source `.zshenv`/`.bashrc`.
**Warning signs:** Grep the new AppleScript/shell code for any `do shell script "word ..."` where `word` doesn't start with `/`.
**Detection command:** `grep -n 'do shell script' distribution/photoshop/macos/installer.applescript | grep -vE '"/'` should return nothing.

### Pitfall 3: Ad-hoc signing does not guarantee a smooth double-click experience — the exact Gatekeeper dialog wording/flow needs hands-on confirmation
**What goes wrong:** **[CITED, LOW-confidence, conflicting sources]** General web sources describe ad-hoc-signed apps as blockable via a right-click→"Open" bypass. The project's own `STACK.md` research claims that as of macOS 15.1+, this control-click bypass **no longer works** and the only path is System Settings → Privacy & Security → "Open Anyway." These two claims partially conflict and neither was independently screenshot-confirmed for an *ad-hoc-signed* (vs. fully unsigned) app.
**Why it happens:** Gatekeeper behavior has changed across recent macOS versions faster than most third-party documentation has been updated.
**How to avoid:** Build the `.app`, ad-hoc sign it, transfer it off the build machine (e.g., via a fresh download/AirDrop to trigger quarantine, or `xattr -w com.apple.quarantine "0081;...;Safari;" file` to simulate quarantine locally), and manually observe the actual dialog/flow on the current macOS version **early in this phase**, before finalizing dialog copy or the D-05 success flow. This directly informs D-02/D-05's wording and any Phase 5 documentation.
**Warning signs:** Shipping install instructions based on assumed dialog text without having seen the actual dialog on the target OS version.

### Pitfall 4: `pgrep -i photoshop`-style detection can miss or misfire depending on the actual process name per Photoshop version
**What goes wrong:** **[CITED, LOW-confidence — web search, not independently verified against a running Photoshop instance]** Photoshop's process name varies by version (e.g., "Adobe Photoshop 2025" vs. a possible future "Adobe Photoshop 2026"), and depending on OS the exact process name reported by `pgrep`/`ps`/`System Events` may differ from the visible app name.
**Why it happens:** No universal, version-independent process name for a rapidly-versioned commercial app.
**How to avoid:** Use a case-insensitive substring match (`pgrep -i photoshop`, not an exact `"Adobe Photoshop 2025"` string) so it matches regardless of year suffix. Verify against whatever Photoshop version is actually installed on the dev/test machine during this phase's manual QA — do not ship without at least one real confirmation.
**Warning signs:** A hardcoded exact process name string anywhere in the check.

### Pitfall 5: Confusing `release/` (new, scripts) with `releases/` (existing, binaries)
**What goes wrong:** Both directories will exist simultaneously after this phase. A future script or a careless glob pattern (`release*/`) could read/write the wrong one.
**Why it happens:** Naming collision introduced by this phase's own restructuring (FOUND-02).
**How to avoid:** Add a one-line clarifying comment at the top of every new file under `release/`. Never use a glob pattern that would match both directories in any build/release script.
**Warning signs:** Any script referencing `release*` with a wildcard.

## Code Examples

### Install-time manifest (MAC-02)

```javascript
// Source: project convention (ARCHITECTURE.md recommends "a flat list of absolute paths" — this phase's own design, no external doc)
// distribution/photoshop/macos/build-installer.js (excerpt — manifest write happens inside the AppleScript at install time,
// but the FORMAT is decided here so Phase 3's uninstaller can consume it identically on both platforms)

// install-manifest.json written by the .app at the end of a successful install:
{
  "installedAt": "2026-07-04T19:00:00Z",
  "pluginId": "com.guidemygrid.plugin",
  "version": "1.7.0",
  "paths": [
    "/Users/<user>/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/23/Plugin/com.guidemygrid.plugin",
    "/Users/<user>/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/23/Plugin/com.guidemygrid.plugin/manifest.json",
    "/Users/<user>/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/23/Plugin/com.guidemygrid.plugin/index.js"
    // ... every file/folder created, absolute paths, flat array
  ]
}
```
Keep this format stable — Phase 3's uninstaller (INTEG-01) consumes it directly, per the phase's own `code_context` notes in CONTEXT.md.

### Absolute-path shell calls inside AppleScript (MAC-04)

```applescript
-- Source: standard AppleScript `do shell script` usage — first-party macOS mechanism, not from one single doc
-- WRONG (bare command names, trusts $PATH — matches the bug already present in origin/main's postinstall):
do shell script "cp -r " & quoted form of srcPath & " " & quoted form of destPath

-- RIGHT (absolute path, no PATH trust):
do shell script "/bin/cp -r " & quoted form of srcPath & " " & quoted form of destPath
```

### Photoshop-running check (MAC-03 / D-04)

```applescript
-- Source: general AppleScript/shell pattern (WebSearch, LOW confidence — verify against real Photoshop process name during manual QA)
on isPhotoshopRunning()
  set result to do shell script "/usr/bin/pgrep -i photoshop || true"
  return result is not ""
end isPhotoshopRunning
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `pkgbuild` `.pkg` with root postinstall script | `osacompile`-built unprivileged `.app` + ad-hoc `codesign` + `create-dmg` | This phase | Eliminates root elevation entirely; matches the project's own already-completed `STACK.md` research |
| `.pkg` installed via Installer.app wizard (generic "unidentified developer" package warning) | Custom native dialogs (D-02/D-03/D-04/D-05) built into the AppleScript app | This phase | More control over UX copy/branding; still subject to Gatekeeper's app-launch warning (separate from the Installer.app package warning it replaces) |
| Binary release artifacts (`releases/*.pkg`/`.ccx`/`.zip`) committed to git | Not committed (per `epic/ui-icons`'s `.gitignore`, kept this phase) | This phase (merge decision) | Smaller repo, GitHub Releases becomes the sole source of truth, matching the milestone's own stated distribution philosophy |

**Deprecated/outdated:**
- `pkgbuild`/`productbuild` for this use case: superseded by `osacompile` for any payload whose destination is entirely inside the user's home directory.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Taking `origin/main`'s `manifest.json` v5/`minVersion 23.0.0` is correct even though Adobe Marketplace distribution is out of scope | FOUND-01: Merge Conflict Map | If v5 was only needed for Marketplace submission (not general packaging), this phase may unnecessarily bump the minimum Photoshop version, narrowing the plugin's supported audience. Verify with a quick UXP packaging-tool test before finalizing the merge. |
| A2 | The exact macOS Gatekeeper dialog/bypass flow for an ad-hoc-signed `.app` on the current macOS version (control-click "Open" vs. System Settings-only) | Common Pitfalls, Pitfall 3 | If the assumed flow is wrong, D-02/D-05 dialog copy and any early Phase 5 documentation drafts could describe a bypass path that doesn't actually work on the target OS, confusing the very non-technical users this milestone is meant to help. Mitigate with a real hands-on test early in this phase. |
| A3 | `pgrep -i photoshop` reliably matches the installed Photoshop process regardless of version year suffix | Common Pitfalls, Pitfall 4 | If it doesn't match, MAC-03/D-04's hard block silently fails to detect a running Photoshop, defeating the "prevent partial install" success criterion. Mitigate by testing against the actual installed Photoshop version during this phase. |
| A4 | Phase 1 does not need to rebuild the macOS **uninstaller** to be unprivileged/manifest-driven — that work belongs entirely to Phase 3 (INTEG-01), even though D-04 says the quit-guard "applies to both install and uninstall" | Open Questions (below) | If the planner reads D-04 as requiring Phase 1 to also fix the uninstaller, scope balloons beyond MAC-01..04's literal requirement list. If the planner defers entirely, D-04's "and uninstall" clause won't actually ship until Phase 3, which may or may not match user expectations — flagged explicitly below for a planning-time decision, not silently assumed either way. |

**If this table is empty:** N/A — assumptions listed above need confirmation before being treated as locked.

## Open Questions

1. **Does Phase 1 need to touch the existing macOS uninstaller at all?**
   - What we know: Phase 1's requirement list is FOUND-01, FOUND-02, MAC-01..04 — none of which mention the uninstaller. Phase 3's INTEG-01 explicitly owns "Uninstaller (both platforms) consumes the install-time manifest." But D-04 (locked decision) states the quit-Photoshop hard block "applies to both install and uninstall."
   - What's unclear: Whether D-04's "and uninstall" clause is describing behavior Phase 3 must implement when it builds the real uninstaller, or an implicit ask that Phase 1 also patch today's `pkgbuild`-based uninstaller (which has the exact same root-elevation problem as the installer) to at least stop elevating, even before manifest-consumption exists.
   - Recommendation: Treat this as Phase 3's responsibility (matches the requirement traceability table in REQUIREMENTS.md) and note in the Phase 1 plan that the merged-in `scripts/build-mac-uninstaller.js`/`uninstall-preinstall` remain root-requiring and manifest-blind until Phase 3 — this is expected, temporary technical debt, not a Phase 1 regression. Surface this explicitly to the user/planner rather than silently deciding either way, since it's a real scope boundary question.

2. **Should `manifest.json`'s `minVersion` bump to `23.0.0` (from `origin/main`) be accepted without further verification?**
   - What we know: The commit message ties it to "Distribution validator requires v5," implying it's an Adobe tooling requirement, not a deliberate product decision to drop support for older Photoshop.
   - What's unclear: Whether any real user currently on Photoshop 22.x would be cut off by this bump.
   - Recommendation: Quick confirmation (ask the user, or check Adobe's current UXP packaging tool docs) before finalizing the merge resolution for `manifest.json`.

3. **What is the exact current Gatekeeper flow for an ad-hoc-signed `.app` distributed via DMG on this specific macOS version?**
   - What we know: STACK.md flags this as an unconfirmed gap; this session's WebSearch surfaced partially conflicting secondhand claims (see Pitfall 3).
   - What's unclear: Exact dialog wording and whether right-click→Open still works at all.
   - Recommendation: Hands-on test (build, ad-hoc sign, simulate quarantine, observe) as an early task in this phase's plan — this should gate the exact wording of D-02/D-05's dialogs and inform Phase 5's screenshots later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| `osacompile` | MAC-01 (installer build) | ✓ | macOS built-in (Xcode CLT) | — |
| `codesign` | MAC-01 (ad-hoc signing) | ✓ | macOS built-in | — |
| `hdiutil` | MAC-01 (DMG creation, via `create-dmg`) | ✓ | macOS built-in | — |
| `dscl` / `stat` | Legacy pattern in current postinstall (likely unneeded once unprivileged) | ✓ | macOS built-in | — |
| `create-dmg` (npm) | MAC-01 (DMG wrapping) | ✓ (verified via `npm view`) | 8.1.0 | — |
| `git` / `gh` CLI | FOUND-01 (merge), existing release flow | ✓ (already in active use per `scripts/gh-release.js`) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — this phase has no environment gaps.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest (existing, config inline in `package.json`) |
| Config file | none — `jest` key inline in `package.json` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single suite, no split today) |

**Gap this phase must address:** The existing Jest setup only covers TypeScript unit logic (`src/__tests__/gridGenerator.sideGuide.test.ts`); it has no precedent for testing shell/AppleScript installer behavior. This phase should NOT introduce a new test framework (e.g., bats-core) for a single phase's shell logic — instead, use Node's built-in `child_process` from a Jest test to drive the build script and static-analyze/execute the compiled artifacts, keeping everything inside the existing Jest runner.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| MAC-04 | Installer scripts use only absolute binary paths, no bare `$PATH`-trusting calls | static/grep | `grep -n 'do shell script' distribution/photoshop/macos/installer.applescript \| grep -vE '"/'` (should output nothing) — wrap in a Jest test that asserts empty output | ❌ Wave 0 |
| MAC-02 | Installer writes a manifest listing every created path | integration | Jest test: run `build-installer.js` in a sandboxed `$HOME`, execute the compiled `.app`'s shell logic (or the underlying copy+manifest routine extracted into a shared, directly-testable Node/shell function) against a fake `dist/`, assert `install-manifest.json` lists exactly the files copied | ❌ Wave 0 |
| MAC-01 | Installer never elevates / never invokes `sudo`/`pkgbuild`/`installer` | static/grep | `grep -rn 'pkgbuild\|productbuild\|sudo' distribution/photoshop/macos/` (should only match historical comments, never actual build logic) | ❌ Wave 0 |
| MAC-03 | Photoshop-running check blocks install | manual (documented) | No reliable automated way to launch/quit real Photoshop in CI or a lightweight test — this is manual-only, justified by the lack of a Photoshop test harness | N/A — manual QA step in the plan |
| FOUND-01 | Merge completes with no unresolved conflicts | manual/CI | `git status` shows clean tree post-merge; `npm run build && npm test` pass | N/A — verified as part of the merge task itself |

### Sampling Rate
- **Per task commit:** `npm test` (fast, existing unit suite) + the new static/grep checks above for any commit touching `distribution/photoshop/macos/`
- **Per wave merge:** Full `npm test` + manual install-flow QA on the actual dev Mac (build → ad-hoc sign → DMG → run → observe zero password prompts)
- **Phase gate:** Manual end-to-end install test (double-click DMG → install → confirm zero elevation prompt → confirm manifest file exists → confirm quit-Photoshop block works with real Photoshop) must pass before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `distribution/photoshop/macos/__tests__/installer-static.test.ts` — grep-based static checks for MAC-04 (absolute paths) and MAC-01 (no `pkgbuild`/`sudo`)
- [ ] `distribution/photoshop/macos/__tests__/manifest.test.ts` — integration test for MAC-02 (manifest correctness) against a sandboxed fake `$HOME`
- [ ] No new framework install needed — reuses existing Jest/ts-jest

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V1 Architecture | yes | Least-privilege installer design — unprivileged `.app`, never invoke `pkgbuild`/`sudo`/`installer` (directly addresses MAC-01) |
| V2 Authentication | no | No user accounts/auth surface in an installer |
| V3 Session Management | no | Not applicable |
| V4 Access Control | no | Not applicable (single-user local filesystem operation) |
| V5 Input Validation | yes | Validate resolved destination paths before any write (non-empty, absolute, no `..`) even though `$HOME` should resolve correctly for an unprivileged process — defense in depth per Pitfall 2 |
| V6 Cryptography | no (this phase) | Checksum/signature verification is explicitly Phase 3 scope (INTEG-02); this phase's ad-hoc `codesign` is a Gatekeeper-compatibility measure, not a cryptographic integrity control |
| V12 File and Resources | yes | Set explicit, sane permissions on every created file/folder (no `777`/world-writable); write manifest to a location the plugin's own runtime never reads from, to avoid conflating install metadata with app state |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| `.pkg` root postinstall privilege escalation (already present in code this phase replaces — see Pitfall 1) | Elevation of Privilege | Replace `pkgbuild` with unprivileged `osacompile` `.app` entirely |
| PATH hijacking via bare command names in shell calls (already present — see Pitfall 2) | Tampering | Absolute paths in every `do shell script` call; never source shell rc files |
| TOCTOU during file copy (race between staging and final placement) | Tampering | Copy directly into place inside the `.app`'s own unprivileged process (no separate staging-then-root-move step, unlike the old flow); if any staging is used, use a private, non-predictable temp directory (`mktemp -d`) |
| Spoofable "is Photoshop running" check (a renamed/fake process could pass) | Tampering (low severity) | Accepted risk — this is a UX safety guard against accidental partial installs, not a security boundary; document as such, don't over-engineer |

## Sources

### Primary (HIGH confidence)
- `origin/main` git history (this session) — `scripts/build-mac-pkg.js`, `scripts/pkg-resources/postinstall`, `scripts/pkg-resources/uninstall-preinstall`, `scripts/build-mac-uninstaller.js`, `scripts/install.{sh,bat,ps1}`, `scripts/uninstall.{bat,ps1}`, `scripts/gh-release.js`, `scripts/package.js`, `.github/workflows/release.yml`, `manifest.json`, `package.json` — read directly, not secondhand
- Local environment probe (this session) — `which osacompile codesign hdiutil dscl stat`, `npm view create-dmg version`, `gsd-tools query package-legitimacy check` — all confirmed present/clean
- `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/SUMMARY.md` — project-level research, MEDIUM-HIGH confidence, cross-checked against official docs per their own source lists

### Secondary (MEDIUM confidence)
- Project's `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/codebase/CONCERNS.md` — internal, high-trust primary sources for current state and scope

### Tertiary (LOW confidence)
- WebSearch this session: "macOS shell script detect if Adobe Photoshop application is running" (process-name matching pattern; not independently verified against a real running Photoshop instance)
- WebSearch this session: "osacompile ad-hoc codesign app bundle distribute unsigned installer macOS Gatekeeper" (ad-hoc signing portability caveat; partially conflicts with STACK.md's macOS 15.1+ claim — flagged as Open Question 3 / Assumption A2)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every core tool (`osacompile`, `codesign`, `hdiutil`, `create-dmg`) verified present/legitimate on this exact machine this session, not assumed from documentation alone
- Architecture (merge map, directory split): HIGH — based on a direct `git diff` of the actual conflicting files, not a description of expected conflicts
- Pitfalls: HIGH for Pitfalls 1 & 2 (confirmed by reading the actual current script source this session); LOW for Pitfalls 3 & 4 (secondhand web sources with some internal conflict, explicitly flagged for hands-on verification)

**Research date:** 2026-07-04
**Valid until:** ~14 days for the Gatekeeper-behavior claims (macOS security UX changes faster than most docs; verify hands-on regardless of elapsed time) — 30 days for the merge-conflict map and tool-availability findings (stable unless `origin/main` receives new commits before this phase executes)
