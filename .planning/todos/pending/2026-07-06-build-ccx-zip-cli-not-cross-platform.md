---
created: 2026-07-06T22:52:53Z
title: Fix build-ccx.js zip CLI dependency (fails on Windows)
area: tooling
files:
  - distribution/photoshop/build-ccx.js:68
---

## Problem

`distribution/photoshop/build-ccx.js` shells out to the command-line `zip` tool
(`execSync('cd ... && zip -r ... dist')`) to package the `.ccx` artifact. `zip`
ships by default on macOS/Linux but is not available on a stock Windows
machine, so the script fails immediately with:

```
'zip' is not recognized as an internal or external command, operable program or batch file.
```

Discovered via the Phase 2 `.github/workflows/windows-ccx-verify.yml` CI job
(rescoped WIN-05) — first real execution on a `windows-latest` runner failed
at the "Package .ccx" step (build succeeded, packaging did not). Run:
https://github.com/misterfulanito/guidemygrid/actions/runs/28828410247

**Not a blocker for real Windows users today** — end users never run this
script; they only download the prebuilt `.ccx` (built on macOS) via GitHub
Releases and install it through Creative Cloud Desktop. This only matters if
`build-ccx.js` needs to run on a Windows machine (this CI job, or a future
Windows-based maintainer/contributor).

Explicitly deferred by the developer on 2026-07-06 — project is prioritizing
a Mac-only MVP for now since there's no way to manually verify Windows
locally. WIN-05 in REQUIREMENTS.md/ROADMAP.md is marked as satisfied for the
workflow's existence and correctness, but the CI run itself does not yet pass
green — tracked here instead of blocking Phase 2 closure.

## Solution

Replace the `execSync('zip -r ...')` call with a cross-platform zip
implementation — either:
- Use a Node zip library (e.g. `archiver` or `adm-zip`) instead of shelling
  out to a CLI tool, so the same code path works on macOS/Linux/Windows, or
- Branch on `process.platform === 'win32'` and use PowerShell's
  `Compress-Archive` there instead of `zip -r`.

After fixing, re-run (or re-trigger) the `windows-ccx-verify.yml` workflow to
confirm it goes green, then update `02-UAT.md` test #1 to `result: pass`.
