# Phase 3: Manifest-Driven Uninstall & Checksum Integrity - Research

**Researched:** 2026-07-06
**Domain:** Release-artifact checksum publishing (Node.js `crypto`), build-artifact regression testing (Jest + GitHub Actions `macos-latest`/`windows-latest`), and a security review of release/build scripts for PATH/env-trust issues
**Confidence:** HIGH — every recommendation below is grounded either in code read directly from this repository this session, or in official/standard-tool documentation (Node.js `crypto`, `shasum`, `certutil`, `Get-FileHash`). No framework/library research was needed — this phase is almost entirely built-in tooling.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Uninstall Ownership (INTEG-01 rescoping)**
- **D-01:** Retire the legacy macOS uninstaller outright — `scripts/build-mac-uninstaller.js` and `scripts/pkg-resources/uninstall-preinstall` are deleted, along with their invocation in `scripts/package.js` (currently gated behind a comment: "kept until Phase 3's manifest-driven rework"). This mirrors Phase 2's Windows decision (D-05: no custom uninstaller, rely on CC Desktop's "Manage Plugins"). Rationale: CC Desktop already owns uninstall for both platforms; the legacy `.pkg` uninstaller uses `pkgbuild --install-location /`, which typically requires admin elevation — directly contradicting this milestone's "no root/admin" goal.
- **D-02:** No custom install-time manifest is needed. CC Desktop's own plugin registry is sufficient — same conclusion Phase 1/2 already reached for MAC-02/WIN-02 (both marked superseded). INTEG-01 is satisfied by "confirm CC Desktop's uninstall works + document it," not by building new tracking code.
- **D-03:** Document clearly (README or equivalent) that uninstalling GuideMyGrid means using Creative Cloud Desktop's "Manage Plugins" panel — there is no separate uninstaller app. Exact placement (README section vs. elsewhere) is Claude's discretion during planning; connects to Phase 5's DOCS-02 but a short note here prevents user confusion in the interim.
- **D-04:** No legacy-cleanup path for pre-Phase-1 raw-copy installs. The user confirmed they are the only person who has ever installed GuideMyGrid so far — there are no real end users with orphaned pre-`.ccx` files on disk. This removes what would otherwise be a real "breadcrumbs" concern.

**Checksum Publishing (INTEG-02)**
- **D-05:** Create `release/checksums.js`, matching the existing `release/version.js` + `release/github-release.js` pattern (host-agnostic release automation). This is the script FOUND-02 deliberately left unstubbed for this phase.
- **D-06:** Output format is a single `SHA256SUMS.txt` listing all release artifacts and their hashes (standard `shasum -a 256 -c SHA256SUMS.txt` verification convention) — not per-file `.sha256` sidecars.
- **D-07:** Checksum generation is fully automated as part of `npm run publish:*` — `release/checksums.js` runs during the publish flow and `SHA256SUMS.txt` is uploaded to the GitHub Release alongside the `.ccx`, with no manual copy-paste step.
- **D-08:** Plain-language, copy-paste verification steps for both macOS and Windows live in a new `VERIFY.md`, linked from README — kept separate from README to stay focused, and easy to link from Gumroad later (Phase 4).

**Install/Uninstall Regression Check (INTEG-03 rescoping)**
- **D-09:** Since CC Desktop cannot be driven headlessly in CI (confirmed Phase 2, D-06 — GUI + Adobe login required) and there's no custom install/uninstall code left after D-01/D-02, INTEG-03's "automated filesystem-diff check" is rescoped to a **build-artifact regression check** — the same category of check as the existing `windows-ccx-verify.yml`: confirm the built `.ccx` has no `requiredPermissions`, contains no retired installer/uninstaller scripts, and has a well-formed `manifest.json`. This is a real, automatable proxy for "nothing left behind" given the constraints — not a literal install-then-uninstall filesystem diff.
- **D-10:** Add a `macos-latest` CI job mirroring `windows-ccx-verify.yml`'s checks, giving both platforms the same build-artifact regression guard. Currently only Windows has this coverage despite macOS being the primary platform.
- **D-11:** The regression check (CI job and/or a Jest test, following the `installer-retirement.test.ts` pattern already used for the retired Windows scripts) must assert the legacy macOS uninstaller files (`build-mac-uninstaller.js`, `uninstall-preinstall`) are actually absent from the repo — prevents the retired root-requiring uninstaller from silently reappearing.
- **D-12:** Real device-level confirmation that CC Desktop's uninstall leaves zero residue on an actual machine is **deferred**, mirroring Phase 2's Windows device-verification precedent (D-06) — not blocking for this phase's planning or execution. Revisit before shipping, not before planning.

**Security Review Scope (INTEG-04 rescoping)**
- **D-13:** Review scope covers all remaining release/build scripts: `distribution/photoshop/build-ccx.js`, `scripts/package.js`, `release/version.js`, `release/github-release.js`, and the new `release/checksums.js` — everything that runs during `npm run package`/`publish`. There is no custom installer/uninstaller script left on either platform to review (per D-01).
- **D-14:** The review also covers CI workflow files (`release.yml`, `windows-ccx-verify.yml`, the new macOS CI job from D-10) for permission scoping and secrets handling — these execute with GitHub-provided credentials (`contents: write`), worth confirming least-privilege there too, not just local scripts.
- **D-15:** Findings are captured as **both** automated regression tests (e.g., "no bare command names," "no relative-PATH-trusting exec calls," following the `installer-retirement.test.ts` pattern) **and** a short written review summary confirming what was checked and that INTEG-04 is satisfied.

### Claude's Discretion
- Exact placement of the "uninstall via Creative Cloud Desktop" documentation note (D-03) — README section vs. a dedicated spot; final call belongs to whichever reads more naturally once written, doesn't need to block on Phase 5.
- Whether the macOS CI job (D-10) is a new file (`macos-ccx-verify.yml`) or a job added within the existing workflow — implementation detail, not a vision decision.
- Exact written-review format for D-15 (inline in a phase doc vs. a dedicated `SECURITY.md`-style file) — follow whatever this project's existing conventions suggest during planning.

### Deferred Ideas (OUT OF SCOPE)
- **Real device-level uninstall verification** (CC Desktop leaves zero residue on an actual machine) — deferred per D-12, mirrors Phase 2's Windows device-verification precedent (D-06). Revisit before shipping, not before planning.
- **Windows CI packaging bug** (`build-ccx.js`'s `zip` CLI dependency fails on `windows-latest`) — pre-existing, tracked in `.planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md`, low relevance to this phase's actual scope (checksums/uninstall, not cross-platform packaging tooling). Not folded into this phase's decisions.

No scope-creep items surfaced during discuss-phase — discussion stayed within uninstall retirement, checksum publishing, and their supporting regression/security checks.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INTEG-01 | Uninstaller (both platforms) removes exactly what was installed, zero leftover files — **rescoped per D-01/D-02** to: retire the legacy macOS `.pkg` uninstaller, rely on CC Desktop's "Manage Plugins," and document it | See `## Legacy Code Removal (D-01)` and `## Architecture Patterns` Pattern 1 |
| INTEG-02 | Published SHA256 checksum for every release artifact, with plain-language copy-paste verification steps for both OS | See `## Standard Stack`, `## Code Examples` (checksums.js + SHA256SUMS.txt format), and `## VERIFY.md Content Spec` |
| INTEG-03 | Automated install→uninstall filesystem-diff regression check — **rescoped per D-09** to a build-artifact regression check (no `requiredPermissions`, no retired scripts, well-formed manifest) on both `windows-latest` (exists) and `macos-latest` (new) | See `## Architecture Patterns` Pattern 2, `## Code Examples` (macOS CI job + Jest test) |
| INTEG-04 | Security review of remaining release/build scripts and CI workflows for absolute-path/PATH-trust issues | See `## Security Domain` and `## Common Pitfalls` |
</phase_requirements>

## Summary

This phase is almost entirely "finish what Phase 1/2 already proved works," not new architectural exploration. Three of its four requirements (INTEG-01, INTEG-03, INTEG-04) are documentation, deletion, and regression-testing of a decision Phase 1/2 already made and validated empirically (CC Desktop owns install/uninstall for `.ccx`-distributed UXP plugins). Only INTEG-02 (checksum publishing) is genuinely new engineering work, and it is small: a ~40-line Node script using the built-in `crypto` module (no new npm dependency), wired into the existing `npm run publish:*` flow the same way `release/version.js` and `release/github-release.js` already are.

**Checksum generation** should use Node's built-in `crypto.createHash('sha256')` streamed over `fs.createReadStream()`, not shelling out to `shasum`/`certutil` — this keeps `release/checksums.js` consistent with the zero-external-dependency style of its two sibling scripts, and avoids relying on a platform-specific binary being present in whatever environment eventually runs the publish flow (today: the developer's own Mac; potentially CI in the future). The output format matters precisely: `shasum -a 256 -c` requires **two spaces** between the hex digest and the filename (a single space silently fails to parse), and file paths must be relative to the directory the check is run from — both are simple to get right but easy to get subtly wrong, and are called out explicitly in Common Pitfalls below.

**Verification commands for `VERIFY.md`** are confirmed: macOS uses the standard `shasum -a 256 -c SHA256SUMS.txt` batch-check (built into every Mac, no install needed). Windows has two built-in options — `certutil -hashfile <file> SHA256` (Command Prompt, zero setup, but its default output splits the hex string into byte-pairs which needs a visual side-by-side compare, not an exact string match) or PowerShell's `Get-FileHash -Algorithm SHA256 <file>` (produces a plain hex string, directly comparable to a `SHA256SUMS.txt` entry, works out of the box on Windows 10+ default PowerShell). Recommend leading with `certutil` (Command Prompt is more universally recognized by non-technical users than PowerShell) and offering `Get-FileHash` as the alternative for users who prefer an exact-string comparison. Windows has no built-in batch-verify-against-a-list equivalent to `shasum -c` — the copy-paste instructions must show a single-file compare, which is an acceptable and expected asymmetry between the two OSes for this phase's scope (only one artifact, the `.ccx`, is published today).

**Build-artifact regression checks (INTEG-03)** should mirror the existing `.github/workflows/windows-ccx-verify.yml` almost exactly. A new `macos-latest` job needs to: build the `.ccx`, extract it (macOS has `unzip` built in — no new tooling), parse `dist/manifest.json` (use `node -e` rather than adding a `jq` dependency, since Node is already the toolchain the rest of the pipeline uses and `jq` presence isn't guaranteed to be styled consistently with the Windows job's PowerShell-native `ConvertFrom-Json`), assert no `requiredPermissions`, and assert none of the five retired Windows scripts *or* the two retired macOS scripts (`build-mac-uninstaller.js`, `uninstall-preinstall`) are present inside the extracted `.ccx`. A companion Jest test, following `src/__tests__/installer-retirement.test.ts`'s exact pattern, should assert the two retired macOS files are absent from the **repository** (not just the built artifact) and that `scripts/package.js` no longer references `build-mac-uninstaller.js`.

**Security review (INTEG-04)** surfaces one genuine, concrete nuance the planner should weigh explicitly rather than silently resolve: the retired installer/uninstaller scripts this milestone has been hardening against PATH-hijacking (MAC-04, WIN-01) ran **on an end user's untrusted machine** with root/admin privileges — a real, high-severity attack surface. The remaining scripts in scope for D-13 (`build-ccx.js`, `package.js`, `version.js`, `github-release.js`, the new `checksums.js`) run only on **the developer's own machine** during `npm run publish:*`, or inside a GitHub Actions runner using GitHub-provided ephemeral credentials — a meaningfully lower-severity context (no anonymous end user, no elevated privileges, no untrusted PATH an attacker plants ahead of time). All of these scripts already invoke bare command names via `execSync` (`git`, `gh`, `zip`, `npm`) rather than absolute paths — this is a real, documentable finding, but the recommended write-up should state the *actual* risk level (dev-machine/CI-only, not remotely triggerable) rather than treating it as equivalent to the retired root-elevated installer bug it's superficially similar to. `distribution/photoshop/build-ccx.js` additionally shells out to a bare `zip` — the same command already flagged in a pending todo as broken on `windows-latest` CI, which strengthens (not weakens) the case for reviewing it here since it's a script that will keep changing.

**Primary recommendation:** Build `release/checksums.js` using Node's built-in `crypto` module (no new dependency), wire it into `scripts/package.js` immediately after the `.ccx` is built and into `release/github-release.js`'s upload file list; write `VERIFY.md` with `shasum -a 256 -c` (macOS) and `certutil -hashfile` (Windows, primary) / `Get-FileHash` (Windows, alternative); mirror `windows-ccx-verify.yml` for a new `macos-latest` job using `unzip` + `node -e` instead of PowerShell's native zip/JSON handling; and scope the D-13/D-14 security review as a documented, deliberately-modest hardening pass (absolute paths where cheap to add) rather than a rewrite, since the actual attack surface for these dev-machine/CI-only scripts is fundamentally lower than the root-elevated installer this milestone exists to eliminate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Checksum generation (`release/checksums.js`) | Build/Release tooling (developer machine) | — | Runs only during `npm run publish:*`, never on an end user's machine or inside the plugin runtime |
| Checksum verification (user-run) | End-user OS shell (Terminal/Command Prompt) | — | Explicitly a manual, user-initiated step (D-07 automates *generation*, not verification — verification is inherently the user's own trust-but-verify action) |
| Build-artifact regression checks (INTEG-03) | CI (GitHub Actions runners) | Build/Release tooling | Runs on ephemeral, GitHub-provisioned VMs; asserts properties of the artifact `package.js`/`build-ccx.js` already produced |
| Legacy uninstaller removal (INTEG-01/D-01) | Build/Repo tooling | — | Pure deletion + doc update, no runtime component |
| Uninstall (actual mechanism) | Creative Cloud Desktop (external, Adobe-owned) | — | Confirmed by Phase 1/2 — GuideMyGrid's own code has no install/uninstall runtime role left |
| Security review scope (INTEG-04) | Build/Release tooling + CI config | — | All in-scope files are either Node scripts invoked at release time or CI YAML — no plugin runtime code is touched |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `crypto` (built-in) | bundled with Node 20 (CI) / Node 26.4.0 (confirmed installed locally this session) | Generates SHA256 digests for `release/checksums.js` | [VERIFIED: local + Node.js official docs] No new dependency; `crypto.createHash('sha256')` streamed via `fs.createReadStream()` is the documented, memory-safe pattern for hashing files of any size. Matches the zero-dependency style of `release/version.js`/`release/github-release.js`. |
| `shasum` (macOS built-in) | ships with every Mac (`/usr/bin/shasum`, confirmed present this session) | End-user verification command for `VERIFY.md` (macOS) | [VERIFIED: local + CITED public docs] `shasum -a 256 -c SHA256SUMS.txt` is the de facto standard batch-verification convention this format is designed around (per D-06). |
| `certutil` (Windows built-in) | ships with every Windows install (Command Prompt) | End-user verification command for `VERIFY.md` (Windows, primary recommendation) | [CITED: Microsoft Learn] No install/setup needed; simplest possible single command for a non-technical user (`certutil -hashfile <file> SHA256`). |
| `Get-FileHash` (PowerShell, Windows built-in) | ships with PowerShell 5.1+/7.x (Windows 10+ default) | End-user verification command for `VERIFY.md` (Windows, alternative) | [CITED: Microsoft Learn] `Get-FileHash -Algorithm SHA256 <file>` — output is a plain hex string, directly comparable to a `SHA256SUMS.txt` entry with no manual reformatting, unlike `certutil`'s spaced-byte-pair output. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `unzip` (macOS built-in) | ships with macOS (confirmed present on `macos-latest` GitHub-hosted runners) | Extracts the built `.ccx` inside the new macOS CI job (D-10), mirroring the Windows job's `System.IO.Compression.ZipFile` use | Use for CI artifact-content assertions; no need to add a Node zip-parsing dependency when the shell already has this built in. |
| `node -e` (Node one-liner) | matches whatever Node version the CI job's `setup-node` step installs | Parses `dist/manifest.json` inside the macOS CI job, in place of adding `jq` | Keeps the macOS job's JSON-parsing logic in the same language as the rest of the release toolchain (Node), rather than introducing a new dependency (`jq`) not otherwise used in this project. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node `crypto` built-in for checksum generation | Shell out to `shasum -a 256` (`execSync`) from `release/checksums.js` | Works fine since publish today only runs on the developer's own Mac, but ties the script to a macOS-only binary and breaks the "pure Node, no shell dependency" style of its sibling scripts; not worth it when `crypto` is built in and platform-agnostic. |
| `unzip` + `node -e` for the macOS CI job | `jq` for JSON parsing (mirrors nothing already in the codebase) | `jq` is preinstalled on GitHub-hosted `macos-latest` runners, so it would work, but introduces a second JSON-parsing idiom (bash+jq) alongside the project's existing Node-everywhere convention with no benefit. |
| `certutil` as the primary Windows verification command | `Get-FileHash` as primary | `Get-FileHash`'s output is easier to string-compare exactly, but requires PowerShell (some non-technical Windows users associate "typing commands" with the black Command Prompt window, not PowerShell) — `certutil` is marginally more universally recognizable as "the way you run a command on Windows," at the cost of a spaced-hex output format that needs a visual (not exact-string) comparison. Both are documented in `VERIFY.md`; certutil leads. |

**Installation:**
No new packages required. `crypto`, `fs`, `unzip`, `shasum`, `certutil`, and `Get-FileHash` are all built into their respective platforms/runtimes already present in this project's toolchain.

**Version verification:** N/A — no external npm/PyPI/crates packages are introduced by this phase. All tools used are language/OS built-ins already confirmed present (Node.js on the dev machine and both CI runners; `shasum` and `unzip` on macOS; `certutil`/`Get-FileHash`/PowerShell's `Expand-Archive`-equivalent already proven working in `windows-ccx-verify.yml`).

## Package Legitimacy Audit

**Not applicable this phase.** No new external (npm/PyPI/crates) packages are introduced. `release/checksums.js` uses Node's built-in `crypto` module; the macOS CI job uses `unzip` (OS built-in) and `node -e` (already-installed Node runtime) rather than adding `jq` or any npm package. The Package Legitimacy Gate protocol is skipped per its own scope condition ("whenever this phase installs external packages" — it does not).

## Architecture Patterns

### System Architecture Diagram

```
[npm run publish:patch/minor/major]
        │
        ▼
[release:patch/minor/major]  (npm version bump)
        │
        ▼
[npm run package]  →  scripts/package.js
        │
        ├─▶ npm run package:ccx  →  distribution/photoshop/build-ccx.js
        │        └─▶ releases/GuideMyGrid-v<ver>.ccx   (the only artifact left after D-01)
        │
        ├─▶ [REMOVED per D-01] scripts/build-mac-uninstaller.js invocation deleted
        │
        └─▶ node release/checksums.js   ← NEW this phase (D-05)
                 │
                 ├─ reads every artifact file actually present in releases/GuideMyGrid-v<ver>.*
                 ├─ streams each through crypto.createHash('sha256')
                 └─▶ releases/SHA256SUMS.txt   (two-space text format, D-06)
        │
        ▼
[node release/github-release.js]
        │
        ├─ git commit + push (existing, unchanged)
        └─ gh release create <tag> <ccx-file> <SHA256SUMS.txt> --title ... --generate-notes
                 (file list extended to include SHA256SUMS.txt, D-07)

── separately, on every push/PR ──

[.github/workflows/windows-ccx-verify.yml]  (existing)          [.github/workflows/macos-ccx-verify.yml]  (NEW, D-10)
   runs-on: windows-latest                                          runs-on: macos-latest
   npm ci → npm run build → npm run package:ccx                     npm ci → npm run build → npm run package:ccx
   Expand .ccx via System.IO.Compression.ZipFile                    unzip .ccx via built-in `unzip`
   assert: no requiredPermissions in dist/manifest.json              assert: no requiredPermissions in dist/manifest.json
   assert: none of 5 retired Windows scripts present                 assert: none of 5 retired Windows scripts + 2 retired
                                                                        macOS scripts present

── repo-level, run via `npm test` ──

[src/__tests__/installer-retirement.test.ts]  (existing, Phase 2 pattern)
[src/__tests__/macos-installer-retirement.test.ts]  (NEW, D-11) — asserts build-mac-uninstaller.js
   and uninstall-preinstall are absent from the repo; asserts package.js no longer references them
```

### Recommended Project Structure

```
guidemygrid/
├── release/
│   ├── version.js              # UNCHANGED
│   ├── github-release.js       # MODIFIED — add SHA256SUMS.txt to upload file list (D-07)
│   └── checksums.js            # NEW this phase (D-05) — generates releases/SHA256SUMS.txt
├── scripts/
│   ├── package.js               # MODIFIED — remove build-mac-uninstaller.js invocation (D-01);
│   │                             #             call `node release/checksums.js` after ccx build
│   ├── build-mac-uninstaller.js # DELETED (D-01)
│   └── pkg-resources/
│       └── uninstall-preinstall # DELETED (D-01)
├── .github/workflows/
│   ├── windows-ccx-verify.yml   # UNCHANGED (existing Phase 2 job)
│   └── macos-ccx-verify.yml     # NEW (D-10) — or a job added to a renamed/shared workflow, Claude's discretion
├── src/__tests__/
│   ├── installer-retirement.test.ts        # UNCHANGED (Phase 2, Windows)
│   └── macos-installer-retirement.test.ts  # NEW (D-11) — mirrors the above for the macOS retirement
├── VERIFY.md                    # NEW (D-08) — plain-language checksum verification steps
└── README.md                    # MODIFIED — link to VERIFY.md; add "how to uninstall" note (D-03)
```

### Pattern 1: Retirement documentation, not new tracking code (INTEG-01)

**What:** INTEG-01 as literally worded in ROADMAP.md asks for manifest-consuming uninstall code. The actual work is the inverse: delete the last vestige of custom uninstall code and document that CC Desktop's "Manage Plugins" panel is the uninstall mechanism.

**When to use:** Follow the exact retirement pattern Phase 2 already established for the Windows scripts — see `distribution/photoshop/windows/README.md`, which documents "what used to be here" and "the actual mechanism" in place of the deleted files. The macOS equivalent doesn't need an update (its README already documents the `.ccx`/CC-Desktop mechanism from Phase 1) — only `scripts/build-mac-uninstaller.js` and its preinstall script need deleting, plus the invocation removed from `scripts/package.js`.

**Example (documentation pattern to mirror, from `distribution/photoshop/windows/README.md`):**
```markdown
## What used to be here
[old mechanism, now deleted, one sentence on why it didn't work]

## The actual [install/uninstall] mechanism
[CC Desktop / Manage Plugins, in plain language]
```

### Pattern 2: Build-artifact regression check as CI + Jest pair (INTEG-03)

**What:** Since CC Desktop can't be driven headlessly, "regression check" means: build the artifact the same way a real release would, then assert specific, automatable properties about its *contents* (CI, both OSes) and about the *repository* (Jest, cross-platform, runs anywhere `npm test` runs).

**When to use:** Any time a "thing that used to be dangerous/broken" is deleted, add both: (1) a CI job asserting the built artifact doesn't contain it, mirroring `windows-ccx-verify.yml`; (2) a Jest test asserting the repo doesn't contain it, mirroring `installer-retirement.test.ts`. The two are complementary, not redundant — CI catches it if it ever leaks back into the *built output*; Jest catches it the moment it's *committed* (fails fast, no CI round-trip needed), and Jest runs on every `npm test` locally too.

**Example (macOS CI job, adapting the existing Windows job's structure):**
```yaml
# Source: .github/workflows/windows-ccx-verify.yml (existing Phase 2 pattern), adapted for macOS
name: macOS CCX Verification

on:
  push:
    branches: [ main, epic/ui-icons ]
  pull_request:
  workflow_dispatch:

jobs:
  verify-macos-ccx:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build plugin
        run: npm run build
      - name: Package .ccx
        run: npm run package:ccx
      - name: Extract .ccx and validate contents
        run: |
          set -euo pipefail
          CCX=$(ls releases/*.ccx | head -n1)
          if [ -z "$CCX" ]; then echo "No .ccx artifact found in releases/"; exit 1; fi

          mkdir -p ccx-extracted
          unzip -q "$CCX" -d ccx-extracted

          MANIFEST="ccx-extracted/dist/manifest.json"
          if [ ! -f "$MANIFEST" ]; then
            echo "manifest.json not found at expected path dist/manifest.json inside the .ccx"; exit 1
          fi

          if node -e "process.exit(require('$PWD/$MANIFEST').requiredPermissions ? 1 : 0)"; then
            echo "OK: manifest.json has no requiredPermissions block"
          else
            echo "manifest.json declares requiredPermissions -- triggers CC Desktop's admin prompt (see 01-RESEARCH.md)"; exit 1
          fi

          RETIRED_NAMES="install.bat install.ps1 install.sh uninstall.bat uninstall.ps1 build-mac-uninstaller.js uninstall-preinstall"
          for name in $RETIRED_NAMES; do
            if find ccx-extracted -name "$name" | grep -q .; then
              echo "Retired script '$name' found inside the built .ccx"; exit 1
            fi
          done
          echo "OK: no retired installer/uninstaller scripts found in the .ccx"
```

### Anti-Patterns to Avoid

- **Building a literal install→uninstall filesystem-diff harness:** ROADMAP.md's original wording for INTEG-03 assumes custom install/uninstall code exists to diff around. It doesn't (per Phase 1/2). Don't build a fake installer just to have something to diff — the build-artifact regression check (Pattern 2) is the correct, already-user-approved (D-09) proxy.
- **Shelling out to `shasum`/`certutil` from `release/checksums.js`:** Ties the generation script to whichever OS the developer happens to publish from. Node's `crypto` module works identically everywhere and matches the existing scripts' zero-shell-dependency style (`version.js` has no `execSync` at all; `github-release.js`'s `execSync` calls are for `git`/`gh`, which have no built-in Node equivalent — hashing does).
- **Adding a `.sha256` sidecar file per artifact:** Explicitly rejected by D-06 in favor of a single `SHA256SUMS.txt`. Don't reintroduce per-file sidecars even though some tools default to that convention.
- **Treating the security review (INTEG-04) as a full rewrite:** The remaining scripts run in a fundamentally lower-risk context (developer's own machine / GitHub-managed CI runner) than the root-elevated, end-user-facing installer this milestone was created to eliminate. Absolute-path hygiene is still worth doing where cheap, but don't over-invest relative to actual risk — see Summary and Security Domain below.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA256 file hashing | A custom byte-reading/hashing loop, or a hand-rolled hex-encoding routine | Node's built-in `crypto.createHash('sha256')` + `fs.createReadStream()` | Battle-tested, memory-safe for files of any size, zero new dependency, and it's what every other checksum tool (`shasum`, `certutil`, `Get-FileHash`) is independently implementing the same algorithm as — no reason to reimplement SHA256 itself. |
| `.ccx` content extraction for CI assertions | A hand-rolled zip-format parser | `unzip` (macOS/Linux built-in) or `System.IO.Compression.ZipFile` (Windows/.NET built-in, already used in `windows-ccx-verify.yml`) | Both platforms' CI runners already ship a correct, well-tested zip-extraction tool; a custom parser would be pure risk for zero benefit. |
| Checksum-file parsing/verification for the end user | A custom script the user has to download and run | The OS's own built-in `shasum`/`certutil`/`Get-FileHash` | These are exactly the tools this format (`SHA256SUMS.txt`, two-space text mode) is designed to be verified by. Asking a non-technical user to download *another* tool just to verify the first tool defeats the "zero terminal experience, but able to verify" goal (Core Value). |

**Key insight:** Every piece of this phase's genuinely new work (checksum generation) is solvable with tools already built into Node.js and both target OSes. The only design decisions that matter are format precision (two spaces, relative paths) and matching an existing script's style — not tool selection.

## Runtime State Inventory

> Included because this phase deletes committed code (`scripts/build-mac-uninstaller.js`, `scripts/pkg-resources/uninstall-preinstall`) and retires a previously-shipped mechanism (`.pkg` uninstaller) — a refactor/removal operation with potential runtime-state implications beyond the git diff.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** No datastore references the uninstaller's identifier or behavior; the plugin itself has no persistent state beyond `presetStorage.ts`'s `localStorage` use, which is unrelated to install/uninstall. | None. |
| Live service config | **None.** No external service (n8n, Datadog, Gumroad, etc.) references the macOS uninstaller by name — Gumroad integration doesn't exist yet (Phase 4). | None. |
| OS-registered state | **None found — the legacy `.pkg` uninstaller (`com.guidemygrid.uninstaller` identifier) was never actually built/shipped/run.** Per D-01, `scripts/build-mac-uninstaller.js` exists in the repo but its invocation in `scripts/package.js` has run at most during Phase 1/2 development testing on the same dev machine described in D-04 ("the user confirmed they are the only person who has ever installed GuideMyGrid so far"). Per Phase 1's own Runtime State Inventory, only the old `.pkg` **installer** (not uninstaller) was confirmed as ever having plausibly run, and even that finding was about pre-Phase-1 history, not this uninstaller. No confirmed `pkgutil --pkgs` receipt for `com.guidemygrid.uninstaller` exists on any known machine. | None required for this phase's execution; worth a quick `pkgutil --pkgs \| grep guidemygrid` sanity check on the dev machine during planning/execution as a cheap confirmation, but not a blocking migration. |
| Secrets/env vars | **None new.** `release/github-release.js` already relies on the `gh` CLI's own stored auth (not a project-managed secret); `checksums.js` introduces no new secret or env var. | None. |
| Build artifacts / installed packages | **Yes.** `scripts/build-mac-uninstaller.js` currently produces `releases/GuideMyGrid-v<ver>-uninstaller.pkg` when invoked on macOS; `release/github-release.js` currently includes this filename (existence-filtered) in its upload list. After D-01's deletion, this file will simply never be produced again — `github-release.js`'s `.filter(f => fs.existsSync(f))` already handles its absence gracefully with no code change required, though the dead filename reference is worth removing for clarity during this phase's edit anyway. | Remove the dead `GuideMyGrid-v${version}-uninstaller.pkg` reference from `release/github-release.js`'s `files` array as part of this phase's edit (cosmetic cleanup, not a functional fix — the existence filter already no-ops it safely). |

**Canonical question for this phase:** *After `build-mac-uninstaller.js` and `uninstall-preinstall` are deleted, does any real machine (dev or end-user) have leftover state that pointed at them?* Answer: no confirmed OS-registered receipts exist for the uninstaller specifically (unlike the installer, which Phase 1 already handled as low-risk documented debt); a one-time `pkgutil --pkgs` check on the dev machine is cheap due-diligence but not a blocking migration.

## Common Pitfalls

### Pitfall 1: `shasum -c` silently fails to parse on a single missing space
**What goes wrong:** The `SHA256SUMS.txt` format requires exactly two spaces between the hex digest and the filename in text mode (one space is binary mode's format and won't parse the same way; trailing whitespace or CRLF line endings from a Windows-edited file also break parsing).
**Why it happens:** It's an easy thing to get subtly wrong when hand-writing the format instead of using a library/tool that already emits it correctly.
**How to avoid:** Build the line format explicitly in `release/checksums.js` as `` `${hexDigest}  ${filename}\n` `` (two literal spaces), always with `\n` (not `\r\n`) line endings, and always with the filename as a path *relative to the `releases/` directory* (not an absolute path) so `shasum -a 256 -c SHA256SUMS.txt` run from inside `releases/` resolves correctly.
**Warning signs:** A `shasum -c` dry run (as part of manual QA, or ideally an automated test) reporting `no properly formatted checksum lines found` instead of `OK`/`FAILED` per file.

### Pitfall 2: `certutil -hashfile`'s default output format isn't a plain hex string
**What goes wrong:** `certutil -hashfile <file> SHA256` prints the hash split into space-separated byte pairs (e.g., `e3 b0 c4 42 98 ...`) plus header/footer lines ("SHA256 hash of file X:" / "CertUtil: -hashfile command completed successfully."), not a single contiguous hex string. A non-technical user comparing this byte-for-byte against a `SHA256SUMS.txt` entry (no spaces) may see what looks like a mismatch when it's actually correct.
**Why it happens:** `certutil`'s default display formatting predates the now-common plain-hex convention most other tools use.
**How to avoid:** In `VERIFY.md`, explicitly tell the user to ignore the spaces and compare only the sequence of characters, or lead with the visual instruction "the letters and numbers should match" rather than "the strings should be identical" — or provide the `Get-FileHash` alternative (plain hex, directly comparable) for users who want an exact string match.
**Warning signs:** A user reporting "my hash doesn't match" when it actually does, just reformatted.

### Pitfall 3: Confusing "regression check on the build artifact" with "regression check on the repo" — they catch different failure modes
**What goes wrong:** Relying on only the CI artifact check (Pattern 2) means a retired script reappearing in the repo isn't caught until the next CI run finishes building and extracting a `.ccx` — slower feedback than a Jest test that fails immediately on `npm test`.
**Why it happens:** It's tempting to think one check "covers" the other since they're testing a related invariant.
**How to avoid:** Implement both, per D-11 and Pattern 2 above — the Jest test (repo-level, fast, local) and the CI artifact check (build-output-level, catches issues even if a Jest test itself were accidentally deleted/skipped) are complementary defense-in-depth, not redundant.
**Warning signs:** A PR that deletes `src/__tests__/macos-installer-retirement.test.ts` "to fix a flaky test" without anyone noticing the CI job's own retired-file check still exists as a backstop — or vice versa.

### Pitfall 4: Treating every bare `execSync` command name as an equal-severity finding
**What goes wrong:** A security review that flags `execSync('git commit ...')`, `execSync('gh release create ...')`, and `execSync('zip -r ...')` in `release/github-release.js`/`build-ccx.js` with the same severity as the retired installer's root-elevated PATH-hijacking bug (Pitfall 2 in `01-RESEARCH.md`) overstates the actual risk — these scripts run on the developer's own trusted machine or a GitHub-managed CI runner, not on an anonymous end user's machine with elevated privileges.
**Why it happens:** The literal wording of INTEG-04 and D-13/D-15 ("no bare command names," following the retired-installer-hardening pattern) invites treating every remaining bare command name as equally urgent, without re-examining whether the threat model that made it urgent for the *installer* (untrusted end-user machine + root elevation) still applies to the *release scripts* (trusted dev machine / ephemeral CI runner, no elevation).
**How to avoid:** Document the actual context for each finding (who runs this script, with what privileges, on what machine) alongside the finding itself — see `## Security Domain` below for the concrete per-script breakdown. Absolute-pathing `git`/`gh`/`zip`/`npm` calls is still cheap, reasonable hygiene worth doing, but frame it as defense-in-depth for a low-probability scenario (a compromised dev machine's PATH), not as closing the same hole the installer had.
**Warning signs:** A written security review (D-15) that doesn't distinguish "runs with root on an untrusted end-user machine" from "runs on the developer's own machine during a manual release" when assigning severity.

## Code Examples

### `release/checksums.js` (D-05, D-06)

```javascript
// Source: Node.js official crypto docs (https://nodejs.org/api/crypto.html) — streaming hash pattern
// release/checksums.js
//
// This is the release-automation-scripts directory. Built binary artifacts
// live in releases/ (plural) — do not confuse the two.

const crypto = require('crypto');
const fs   = require('fs');
const path = require('path');

const root    = path.resolve(__dirname, '..');
const pkg     = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const outDir  = path.join(root, 'releases');
const sumsFile = path.join(outDir, 'SHA256SUMS.txt');

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function main() {
  // Only hash this version's release artifacts, never a stale SHA256SUMS.txt from a prior run
  const artifacts = fs.readdirSync(outDir)
    .filter((name) => name.startsWith(`GuideMyGrid-v${version}`) && name !== 'SHA256SUMS.txt');

  if (artifacts.length === 0) {
    throw new Error(`No release artifacts found in releases/ for version ${version}`);
  }

  const lines = [];
  for (const name of artifacts.sort()) {
    const digest = await hashFile(path.join(outDir, name));
    // Two literal spaces + relative filename — required by `shasum -a 256 -c` text-mode parsing
    lines.push(`${digest}  ${name}`);
  }

  fs.writeFileSync(sumsFile, lines.join('\n') + '\n');
  console.log(`✅  Checksums: releases/SHA256SUMS.txt (${artifacts.length} artifact${artifacts.length === 1 ? '' : 's'})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Wiring into `scripts/package.js` (D-07)

```javascript
// After the .ccx is built and the legacy uninstaller invocation is removed (D-01):
execSync('node release/checksums.js', { stdio: 'inherit', cwd: root });

// Update the staging list to include the checksums file:
const toStage = [ccxFile, path.join(outDir, 'SHA256SUMS.txt')];
```

### Wiring into `release/github-release.js` (D-07)

```javascript
const files = [
  path.join(root, 'releases', `GuideMyGrid-v${version}.ccx`),
  path.join(root, 'releases', 'SHA256SUMS.txt'),
  // GuideMyGrid-v${version}-installer.zip and -uninstaller.pkg references removed —
  // both mechanisms are retired (Phase 1/2 and this phase's D-01)
].filter(f => fs.existsSync(f));
```

### macOS verification command (VERIFY.md, D-08)

```bash
# Source: shasum man page (macOS built-in) — standard SHA256SUMS.txt batch-check convention
cd ~/Downloads   # or wherever you saved the downloaded files
shasum -a 256 -c SHA256SUMS.txt
```
Expected output: `GuideMyGrid-vX.Y.Z.ccx: OK`

### Windows verification commands (VERIFY.md, D-08)

```cmd
:: Primary — Command Prompt, no setup required
:: Source: Microsoft Learn (certutil reference)
certutil -hashfile GuideMyGrid-vX.Y.Z.ccx SHA256
```
Compare the printed hash (ignoring the spaces between byte pairs) against the matching line in `SHA256SUMS.txt`.

```powershell
# Alternative — PowerShell, produces a directly-comparable plain hex string
# Source: Microsoft Learn (Get-FileHash reference)
Get-FileHash -Algorithm SHA256 GuideMyGrid-vX.Y.Z.ccx
```

### Jest test for macOS uninstaller retirement (D-11)

```typescript
// Source: src/__tests__/installer-retirement.test.ts (existing Phase 2 pattern), adapted for macOS
import * as fs from 'fs';
import * as path from 'path';

describe('macOS uninstaller retirement (Phase 3, D-01)', () => {
  const scriptsDir = path.resolve(__dirname, '../../scripts');
  const retiredFiles = [
    path.join(scriptsDir, 'build-mac-uninstaller.js'),
    path.join(scriptsDir, 'pkg-resources', 'uninstall-preinstall'),
  ];

  it.each(retiredFiles)('%s should not exist (retired per D-01)', (file) => {
    expect(fs.existsSync(file)).toBe(false);
  });

  it('scripts/package.js should not reference build-mac-uninstaller.js', () => {
    const packageJs = fs.readFileSync(path.join(scriptsDir, 'package.js'), 'utf8');
    expect(packageJs).not.toContain('build-mac-uninstaller.js');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `pkgbuild`-based `.pkg` uninstaller, root-elevated, manifest-blind | Deleted entirely; CC Desktop's "Manage Plugins" panel is the sole uninstall mechanism, documented in README | This phase (D-01) | Eliminates the last root-requiring code path in the project; matches the same conclusion Phase 1/2 already reached for install |
| Manual/no checksum publishing | Automated `SHA256SUMS.txt` generated and uploaded as part of every `npm run publish:*` | This phase (D-05–D-07) | Closes INTEG-02 — the only genuinely new capability this milestone's "trust" goal still needed |
| Windows-only build-artifact CI regression guard | Both `windows-latest` and `macos-latest` get the same guard | This phase (D-10) | Parity — macOS (the primary platform) previously had no automated check for its own retired-script/`requiredPermissions` regressions |

**Deprecated/outdated:**
- `.pkg`/`pkgbuild` for any install/uninstall purpose in this project: fully superseded by `.ccx` + Creative Cloud Desktop (confirmed Phase 1, reinforced by this phase's final cleanup).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No confirmed OS-registered `pkgutil` receipt exists for `com.guidemygrid.uninstaller` on any known machine (the uninstaller was likely never actually run, unlike the installer) | Runtime State Inventory | If wrong, the dev machine could carry an orphaned package receipt from earlier testing — harmless/cosmetic (same category Phase 1 already flagged for the installer), not a functional blocker either way. A one-command `pkgutil --pkgs \| grep guidemygrid` check during execution resolves this cheaply. |
| A2 | `certutil -hashfile`'s spaced-byte-pair output is an acceptable primary recommendation for non-technical Windows users, with `Get-FileHash` as the exact-string-match alternative | Summary, Standard Stack, Common Pitfalls Pitfall 2 | If the spaced format proves too confusing in practice, `VERIFY.md` should lead with `Get-FileHash` instead — low-cost to swap the ordering during planning/execution if user testing suggests it. |
| A3 | The security review's differentiated-severity framing (dev-machine/CI-only scripts vs. the retired root-elevated installer) will be accepted by the user rather than expecting a literal "fix every bare command name to absolute paths" pass | Summary, Common Pitfalls Pitfall 4, Security Domain | If the user actually wants full absolute-pathing regardless of severity, the planner should treat this as a small additional task (wrapping `git`/`gh`/`zip`/`npm` calls with resolved absolute paths via `which`/hardcoded paths) — not a large scope change, just a framing decision to confirm during planning. |

## Open Questions

1. **Should `release/checksums.js` hash artifacts by an explicit filename list (matching `github-release.js`'s existing style) or by globbing `releases/GuideMyGrid-v<version>.*`?**
   - What we know: `github-release.js` uses an explicit array of candidate filenames, filtered by `fs.existsSync`. The Code Examples above use a glob-by-prefix approach instead, to avoid hardcoding a list that must be kept in sync across two files as artifacts are added/removed.
   - What's unclear: Whether the project prefers consistency with the existing explicit-list style over the glob's lower-maintenance tradeoff.
   - Recommendation: Either is fine; the glob approach in this research reduces future edit-two-files risk if a new artifact type is ever added, but planning should confirm which style fits the project's stated preference for matching existing conventions.

2. **Does the security review (D-13–D-15) actually need to change any script behavior, or is documenting current low-risk status sufficient?**
   - What we know: Every remaining in-scope script already uses absolute paths for filesystem destinations (no `~`/relative ambiguity) but bare command names for external tools (`git`, `gh`, `zip`, `npm`). The threat model for these dev-machine/CI-only scripts is meaningfully lower risk than the retired installer's (see Pitfall 4).
   - What's unclear: Whether "confirms both installer/uninstaller scripts use absolute paths" (the phase's literal success criterion #4, written before D-01's rescoping) should be read as "confirm this is no longer applicable since no installer/uninstaller scripts remain" or "apply the same absolute-path standard to whatever scripts replaced them."
   - Recommendation: Plan a small, cheap task — wrap the highest-value external tool calls (`zip` in particular, since it's already a known cross-platform pain point per the pending todo) with a resolved absolute path or at minimum a `command -v zip` preflight check — as reasonable, low-cost hardening, while documenting in the written review (D-15) that the severity context has fundamentally changed from the original installer-era finding.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `crypto` module | `release/checksums.js` | ✓ | Built into Node 26.4.0 (local) / Node 20 (CI, per `setup-node@v4`) | — |
| `shasum` | macOS end-user verification (`VERIFY.md`) | ✓ | Confirmed present at `/usr/bin/shasum` this session | — |
| `unzip` | macOS CI job (D-10) | ✓ | Standard on GitHub-hosted `macos-latest` runners | — |
| `certutil` | Windows end-user verification (`VERIFY.md`) | Not verified this session (dev machine is macOS) | N/A locally | [ASSUMED, standard Windows built-in per Microsoft Learn docs] — ships with every Windows install since Windows XP; no fallback needed. |
| `Get-FileHash` (PowerShell) | Windows end-user verification alternative (`VERIFY.md`) | Not verified this session (dev machine is macOS) | N/A locally | [ASSUMED, standard on Windows 10+ default PowerShell per Microsoft Learn docs] — already proven present/working via `windows-ccx-verify.yml`'s own `pwsh` steps in Phase 2. |
| `gh` CLI | `release/github-release.js` (unchanged, existing dependency) | ✓ (pre-existing, unaffected by this phase) | Already in use by Phase 1/2's release flow | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `certutil`/`Get-FileHash` presence on end-user Windows machines is assumed (industry-standard built-ins, not independently verified on a physical Windows machine this session) — consistent with Phase 2's own explicit deferral (D-06) of real Windows device verification to pre-ship, not pre-planning.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.0.0 + ts-jest 29.0.0 (existing, confirmed in `package.json`) |
| Config file | Inline in `package.json` (`"jest"` key) — `testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"]` |
| Quick run command | `npx jest src/__tests__/macos-installer-retirement.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTEG-01 | Legacy macOS uninstaller files absent from repo; `package.js` doesn't reference them | unit (Jest) | `npx jest src/__tests__/macos-installer-retirement.test.ts` | ❌ Wave 0 (new file, mirrors existing `installer-retirement.test.ts`) |
| INTEG-02 | `release/checksums.js` produces a correctly-formatted `SHA256SUMS.txt` that `shasum -a 256 -c` accepts | unit (Jest) + manual | Jest: assert two-space format + correct digest for a known fixture file; manual: run `shasum -a 256 -c` against a real generated file | ❌ Wave 0 (no test file yet for `checksums.js`) |
| INTEG-03 | Built `.ccx` has no `requiredPermissions`, no retired scripts, well-formed `manifest.json`, on both OSes | integration (CI) | `windows-ccx-verify.yml` (exists) / new `macos-ccx-verify.yml` (D-10) — both run via `git push`/PR, not a local one-liner | ❌ Wave 0 (macOS job doesn't exist yet) |
| INTEG-04 | Release/build scripts and CI workflows reviewed for absolute-path/PATH-trust issues | unit (Jest) + manual review doc | Jest: pattern-match `execSync` calls in scope for bare command names (see Pitfall 4); manual: written summary per D-15 | ❌ Wave 0 (no automated PATH-trust test exists yet for the release scripts) |

### Sampling Rate
- **Per task commit:** `npx jest src/__tests__/macos-installer-retirement.test.ts` (and any new checksum-format test)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green, plus both `windows-ccx-verify.yml` and `macos-ccx-verify.yml` green on the phase's final commit, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/macos-installer-retirement.test.ts` — covers INTEG-01/D-11 (mirrors existing `installer-retirement.test.ts`)
- [ ] `src/__tests__/checksums.test.ts` (or similar) — covers INTEG-02, asserting `release/checksums.js`'s output format (two-space separator, correct relative filenames, correct digest against a known fixture)
- [ ] `.github/workflows/macos-ccx-verify.yml` — covers INTEG-03/D-10, the macOS half of the build-artifact regression guard
- [ ] A lightweight pattern-based test or manual grep step asserting no *new* bare command names were introduced in `release/checksums.js` itself (INTEG-04/D-15) — framework install not needed, Jest already present

## Security Domain

### Applicable ASVS Categories

This phase touches no authentication, session, or access-control surface — it is entirely build/release tooling and a static plugin manifest. Most ASVS categories (V2 Authentication, V3 Session Management, V4 Access Control) do not apply. The relevant categories are narrower:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No login/session surface exists in this phase's scope |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Partial | `release/checksums.js` reads a fixed, developer-controlled list of files (own release artifacts) — no external/user-controlled input to validate. `manifest.json`'s `requiredPermissions` absence is itself validated by the CI checks (Pattern 2) — this is the closest analogue to "input validation" in this phase's scope. |
| V6 Cryptography | Yes | SHA256 via Node's built-in `crypto` module — never hand-roll a hash function (see Don't Hand-Roll). Note: SHA256 checksums verify *integrity against corruption/simple tampering*, not *authenticity* (no signing key) — this is consistent with the milestone's explicit deferral of signed manifests to v2 (SECV2-01) and should not be oversold to users as "cryptographically proves this came from the developer," only "proves the file matches what was published." |

### Known Threat Patterns for This Domain (build/release scripts + CI)

| Pattern | STRIDE | Standard Mitigation | Applicability Here |
|---------|--------|---------------------|---------------------|
| PATH hijacking (malicious binary earlier in `$PATH` shadows the intended `git`/`gh`/`zip`/`npm`) | Tampering | Absolute paths for all `execSync`/shell-out calls | **Real but low-severity here** (see Pitfall 4) — requires a compromised developer machine or compromised CI runner image, not a remote/anonymous attack vector like the retired root-elevated installer had. Recommend fixing `zip` in `build-ccx.js` first (already a known pain point) as the highest-value, lowest-cost improvement; treat `git`/`gh`/`npm` as lower priority. |
| Overly broad CI token permissions | Elevation of Privilege | Explicit least-privilege `permissions:` block per workflow | `release.yml` already declares `permissions: contents: write` (appropriate — it publishes releases). `windows-ccx-verify.yml` has no `permissions:` block at all (correct — build-and-assert only, no write access needed); the new `macos-ccx-verify.yml` should follow the same no-permissions-block pattern (D-14). |
| Checksum file substitution (attacker swaps both the `.ccx` and `SHA256SUMS.txt` together on a compromised distribution channel) | Tampering | Out of scope for SHA256-only integrity checks — would require signing (v2, SECV2-01) | Explicitly acknowledged limitation of INTEG-02's scope — `VERIFY.md` should not claim the checksum protects against a fully compromised GitHub Releases page, only against corruption/accidental modification/simple tampering of a file downloaded from a channel the user otherwise trusts. |
| Secrets exposure in CI logs | Information Disclosure | No secrets are introduced by this phase's CI changes; `gh` CLI auth (used by `github-release.js`, unaffected) already relies on local developer credentials, never a CI-stored secret, since publish always runs from the developer's own machine today | No new risk introduced; confirm no new workflow step this phase (`macos-ccx-verify.yml`) needs any secret at all — it only builds and inspects a local artifact. |

## Sources

### Primary (HIGH confidence)
- Direct repository inspection this session: `scripts/build-mac-uninstaller.js`, `scripts/pkg-resources/uninstall-preinstall`, `scripts/package.js`, `release/version.js`, `release/github-release.js`, `distribution/photoshop/build-ccx.js`, `.github/workflows/windows-ccx-verify.yml`, `.github/workflows/release.yml`, `src/__tests__/installer-retirement.test.ts`, `manifest.json`, `package.json`, `README.md`, `distribution/*/README.md`
- `.planning/phases/01-foundation-macos-installer-rework/01-RESEARCH.md` — CRITICAL ADDENDUM and its two follow-ups (CC Desktop ownership finding, `requiredPermissions`/admin-prompt A/B test)
- `.planning/phases/02-windows-installer-rework/02-CONTEXT.md` — D-05, D-06 (Windows uninstall/CI precedent this phase extends)
- [Node.js Crypto documentation](https://nodejs.org/api/crypto.html) — `createHash`/streaming pattern

### Secondary (MEDIUM confidence)
- [SHA-256 checksum generation and verification on various platforms — tobywf.com](https://tobywf.com/2023/03/sha-256-checksums/) — `SHA256SUMS.txt` two-space text-mode format requirement
- [Get-FileHash — Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash) — output format, case-insensitive comparison
- [certutil — Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil) — `-hashfile` syntax and supported algorithms

### Tertiary (LOW confidence)
- General WebSearch results on `certutil -hashfile` spaced-byte-pair output formatting — not independently verified against a real Windows machine this session (consistent with the project's own deferred Windows-device-verification precedent, D-06/D-12)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all built-in tools, verified present locally (macOS) or via official docs (Windows, not independently hands-on tested this session)
- Architecture: HIGH — directly mirrors Phase 2's already-shipped, working `windows-ccx-verify.yml` and `installer-retirement.test.ts` patterns
- Pitfalls: HIGH for format/parsing pitfalls (verified against tool documentation); MEDIUM for the severity-framing pitfall (a judgment call, not a factual claim)

**Research date:** 2026-07-06
**Valid until:** 2026-08-05 (30 days — stable, built-in-tool-only domain, no fast-moving dependencies)
