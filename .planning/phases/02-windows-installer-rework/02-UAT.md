---
status: complete
phase: 02-windows-installer-rework
source: [02-VERIFICATION.md]
started: 2026-07-06T22:22:13Z
updated: 2026-07-06T22:52:53Z
---

## Current Test

[testing complete]

## Tests

### 1. Windows CCX Verification workflow actually runs green on real Windows infrastructure
expected: Push the current branch (`epic/ui-icons`) to GitHub (or open the relevant PR) so `.github/workflows/windows-ccx-verify.yml` registers and runs on a `windows-latest` runner, then check the Actions run result. The job should succeed — build, package:ccx, and the pwsh extraction/assertion step all pass, confirming no `requiredPermissions` and none of the five retired scripts in the built artifact.
result: issue
reported: "Run failed at the 'Package .ccx' step: 'zip' is not recognized as an internal or external command. distribution/photoshop/build-ccx.js shells out to the zip CLI, which doesn't exist on Windows by default. See https://github.com/misterfulanito/guidemygrid/actions/runs/28828410247"
severity: minor
deferred: true
deferred_reason: "Developer decision (2026-07-06): does not block real Windows end users (they only download the prebuilt .ccx built on macOS via GitHub Releases, they never run build-ccx.js). Project is prioritizing a Mac-only MVP for now. Tracked as a todo instead of gap-closure plan: .planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md"

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The Windows CCX Verification workflow runs green on windows-latest"
  status: deferred
  reason: "build-ccx.js's execSync('zip -r ...') call fails on Windows — zip CLI not present. Real Windows end users are unaffected (they install the prebuilt .ccx via Creative Cloud Desktop, never running this script)."
  severity: minor
  test: 1
  root_cause: "distribution/photoshop/build-ccx.js:68 shells out to the platform-specific 'zip' CLI instead of using a cross-platform zip method"
  artifacts:
    - path: "distribution/photoshop/build-ccx.js"
      issue: "execSync('zip -r ...') has no Windows equivalent"
  missing:
    - "Replace with a cross-platform Node zip library (e.g. archiver) or branch to PowerShell Compress-Archive on win32"
  debug_session: ""
  todo: ".planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md"
