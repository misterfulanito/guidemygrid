# Phase 3 Security Review: Release/Build Scripts + CI Workflows (INTEG-04)

**Scope:** D-13 (release/build scripts) + D-14 (CI workflow files). This is the final
PATH/env-trust review for everything that runs during `npm run package` /
`npm run publish:*` and in this project's CI, following the retirement of the
last root-elevated, end-user-facing installer (Phase 03 Plan 01, Phase 02).

## Framing: why severity here is not the same as the retired installer's

The retired macOS/Windows installers ran with **root/admin elevation on an
anonymous end user's machine**, reachable via a downloaded artifact — a
genuine remote attack surface (PATH-hijacking a bare command name there could
let an attacker's binary run with elevated privileges on a stranger's
computer). Every script and workflow reviewed below runs in one of exactly
two contexts instead:

1. **The developer's own machine** — invoked manually via `npm run package` /
   `npm run publish:patch|minor|major`, under the developer's own shell, own
   PATH, own credentials. No untrusted end user ever executes these.
2. **An ephemeral GitHub-hosted CI runner** — spun up fresh per job, torn down
   after, using GitHub-provisioned tokens/credentials, not developer secrets.

A bare command name (`git`, `gh`, `npm`, `zip`) being resolved via `$PATH` in
either context requires the developer's own machine or GitHub's own runner
image to already be compromised for it to matter — a fundamentally different
(and much lower) threat model than the installer's. This review therefore
applies **differentiated severity**: bare command names are a real-but-low
finding (accepted risk, documented below), not treated as equivalent to the
installer's remote PATH-hijack bug.

## In-scope release/build scripts (D-13)

| Script | Runs on | Privileges | PATH/env-trust findings | Severity | Disposition |
|---|---|---|---|---|---|
| `distribution/photoshop/build-ccx.js` | Developer machine (via `npm run package:ccx`, called by `scripts/package.js`) | Developer's own user account, no elevation | Shells out to bare `zip` via `execSync`. `zip` is not bundled with Node and its absence previously produced only an opaque `execSync` non-zero exit — the highest-value, lowest-cost hardening target since it's already a known cross-platform pain point (pending todo). | Low (was: friction/failure-mode risk more than security risk) | **Mitigated** — added a `command -v zip` preflight (Task 1) that throws a clear, actionable error naming `zip` if it's missing, before the `zip -r` call runs. |
| `scripts/package.js` | Developer machine (via `npm run package`) | Developer's own user account | Shells out to `npm run package:ccx`, `node release/checksums.js`, `git add` — all bare command names, all developer-machine-only, no elevation, no remote input. | Low | Accepted — dev-machine-only context, no root, no attacker-planted PATH. |
| `release/version.js` | Developer machine (via `prebuild` hook, every `npm run build`) | Developer's own user account | Pure filesystem read/write (`package.json` → `manifest.json`/`src/version.ts`); no `execSync`/shell-out at all. | N/A | No finding — no shell-out surface. |
| `release/github-release.js` | Developer machine (via `npm run publish:*`) | Developer's own user account; uses local `gh` CLI auth (developer's own credential, never CI-stored) | Shells out to bare `git commit`/`git push`/`gh release create`. Same dev-machine-only context as above. `gh` auth is a local developer credential — never a CI secret, so there is no CI-log-exposure surface here. | Low | Accepted — dev-machine-only, no root, no attacker-planted PATH, no CI secret involved. |
| `release/checksums.js` | Developer machine (via `scripts/package.js`, part of `npm run package`) | Developer's own user account | No `execSync`/shell-out at all — reads only a fixed, developer-controlled file list (`releases/GuideMyGrid-v<version>.*`, derived from `package.json`'s own version) via Node's built-in `crypto`/`fs`. No external/network/user input reaches this script. SHA256 proves **integrity, not authenticity** — a compromised distribution channel that swaps both the `.ccx` and `SHA256SUMS.txt` together is explicitly out of scope for this phase; signing is deferred to v2 (SECV2-01), documented in `VERIFY.md`. | N/A (no shell-out) / informational (integrity-not-authenticity limitation) | No finding — no shell-out surface; the integrity-vs-authenticity scope limit is a documented, accepted design boundary, not a defect. |

## In-scope CI workflows (D-14)

| Workflow | Purpose | Permissions | Findings | Severity | Disposition |
|---|---|---|---|---|---|
| `.github/workflows/release.yml` | Publishes a GitHub Release from CI (currently a disabled fallback — real releases are published locally via `npm run publish:*`) | `permissions: contents: write` — appropriate, since this workflow's whole job is publishing a release | The `files:` list referenced a retired artifact, `releases/GuideMyGrid-v*-installer.zip`, which no longer exists (the macOS/Windows installer builds were retired in Phase 03 Plan 01 / Phase 02). Dead reference, not a security defect itself, but worth removing so a future release doesn't silently `fail_on_unmatched_files: false`-swallow a missing-file mismatch that could mask an actually broken build. | Low | **Mitigated** — removed the retired `installer.zip` entry (Task 1); `permissions: contents: write` left unchanged (correct, least-privilege-appropriate for a release-publishing job). |
| `.github/workflows/windows-ccx-verify.yml` | Build-and-assert-only CI job: builds the `.ccx` on `windows-latest`, extracts it, asserts no `requiredPermissions` and no retired installer scripts | No `permissions:` block at all | Correctly scoped — this job never writes to the repo or a release, so it needs no elevated token scope. No secrets used. | N/A | No finding — already least-privilege. |
| `.github/workflows/macos-ccx-verify.yml` | Build-and-assert-only CI job: builds the `.ccx` on `macos-latest`, extracts it, asserts no `requiredPermissions` and no retired installer/uninstaller scripts (Phase 03 Plan 03) | No `permissions:` block at all | Mirrors the Windows job's least-privilege posture exactly (confirmed at authoring time, Plan 03-03, D-14). No secrets used. | N/A | No finding — already least-privilege. |

## Remediations applied this phase (Task 1)

1. **`distribution/photoshop/build-ccx.js`** — added a `command -v zip` preflight
   immediately before the `zip -r` `execSync` call. If `zip` is not found on
   `PATH`, the script now throws a clear, actionable error explaining the
   `.ccx` cannot be built without it and pointing at the pending
   cross-platform-packaging todo, instead of failing with an opaque
   `execSync` exit-code error.
2. **`.github/workflows/release.yml`** — removed the dead
   `releases/GuideMyGrid-v*-installer.zip` entry from the `files:` list, since
   that artifact was retired earlier in this phase/Phase 02. The
   `permissions: contents: write` block was left unchanged (appropriate — this
   workflow's job is publishing releases).

## Accepted low-risk items (not remediated)

Per the differentiated-severity framing above, bare `git`/`gh`/`npm` command
names across `scripts/package.js` and `release/github-release.js` are
accepted as low-risk: exploiting a bare-command PATH-hijack here requires the
developer's own machine or a GitHub-hosted CI runner image to already be
compromised — neither is the remote, anonymous-end-user, root-elevated attack
surface the retired installer had. No further absolute-pathing pass was
applied to these calls this phase (see Open Question 2 / Pitfall 4 in
`03-RESEARCH.md` — if the project later wants full absolute-pathing
regardless of severity, that is a small, separately-scoped hardening task,
not a defect being carried forward silently).

No secrets are introduced by any script or workflow in scope. `gh` CLI
authentication (used by `release/github-release.js`) is a local developer
credential, never a CI-stored secret, since publishing today always runs
from the developer's own machine (`npm run publish:*`), not from CI.

## Conclusion

All five in-scope release/build scripts (`build-ccx.js`, `scripts/package.js`,
`release/version.js`, `release/github-release.js`, `release/checksums.js`)
and all three in-scope CI workflows (`release.yml`, `windows-ccx-verify.yml`,
`macos-ccx-verify.yml`) have been reviewed for PATH/env-trust issues, CI
token-scope, and secrets handling, with severity differentiated from the
retired root-elevated installer's threat model. The one high-value, low-cost
hardening identified (`zip`-availability preflight in `build-ccx.js`) has been
applied and is guarded by an automated regression test
(`src/__tests__/release-script-safety.test.ts`), alongside a regression test
confirming the dead `installer.zip` reference was removed from `release.yml`.

**INTEG-04 is satisfied.**
