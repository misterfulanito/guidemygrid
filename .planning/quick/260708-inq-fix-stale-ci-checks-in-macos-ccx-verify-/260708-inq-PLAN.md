---
phase: 260708-inq-fix-stale-ci-checks
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/macos-ccx-verify.yml
  - .github/workflows/windows-ccx-verify.yml
autonomous: true
requirements: [UPD-03]
must_haves:
  truths:
    - "macOS CCX Verification job passes on push to epic/ui-icons with the current manifest.json (requiredPermissions scoped to api.github.com only)"
    - "The requiredPermissions assertion PASSES when the block is absent OR is exactly {network:{domains:[\"https://api.github.com\"]}}, and FAILS for anything broader (extra domain, domains:\"all\", or any additional permission category)"
    - "The retired installer/uninstaller script checks in both workflows are byte-for-byte unchanged"
    - "No new tooling dependency is introduced (bash stays on node -e; Windows stays on native PowerShell)"
  artifacts:
    - .github/workflows/macos-ccx-verify.yml
    - .github/workflows/windows-ccx-verify.yml
  key_links:
    - "push to epic/ui-icons -> both workflows trigger (both list epic/ui-icons in their on.push.branches)"
    - "built .ccx dist/manifest.json is a copy of repo-root manifest.json (webpack CopyWebpackPlugin) -> assertion reads the same content"
---

<objective>
Fix the stale `requiredPermissions` assertion in both CI verification workflows so they reflect the Phase 4 D-01/D-03 reviewed tradeoff. Both workflows currently fail because they assert the built `.ccx`'s `manifest.json` has NO `requiredPermissions` block at all — but Phase 4 intentionally restored `requiredPermissions.network.domains: ["https://api.github.com"]` to reconnect the in-app update checker (documented in PROJECT.md Key Decisions and REQUIREMENTS.md UPD-03). This is a known, accepted change, not a regression.

Purpose: Turn a false-positive CI failure into a correct guard — the check should now permit exactly the reviewed api.github.com-only scope while still failing loudly if a broader (higher-risk) permission scope ever slips into a release.

Output: Updated `macos-ccx-verify.yml` (bash + `node -e`) and `windows-ccx-verify.yml` (PowerShell) assertion blocks, pushed to `epic/ui-icons`, with the macOS CI job confirmed green.
</objective>

<execution_context>
@/Users/hurisb/.claude/gsd-core/workflows/execute-plan.md
@/Users/hurisb/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.github/workflows/macos-ccx-verify.yml
@.github/workflows/windows-ccx-verify.yml
@manifest.json

Key facts (validated during planning):
- Current `manifest.json` (repo root) has `requiredPermissions: {"network": {"domains": ["https://api.github.com"]}}`. The `.ccx`'s `dist/manifest.json` is a webpack copy of this file, so the assertion reads identical content.
- Both workflows trigger on push to `epic/ui-icons` (current branch), so a push here re-runs both.
- The scope-check logic below was tested during planning against 5 fixtures: exact-match → exit 0, absent → exit 0, extra-domain → exit 1, `domains:"all"` → exit 1, extra `localFileSystem` key → exit 1.
- SEPARATE, OUT OF SCOPE: `windows-ccx-verify.yml` also fails earlier at the `Package .ccx` step due to `build-ccx.js`'s `zip` CLI dependency missing on the Windows runner (tracked in `.planning/todos/pending/2026-07-06-build-ccx-zip-cli-not-cross-platform.md`). Do NOT touch packaging. Fixing the requiredPermissions check will not make the Windows job fully green — its check just needs to be correct for when that separate issue is fixed.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite the requiredPermissions assertion in macos-ccx-verify.yml (bash + node -e)</name>
  <files>.github/workflows/macos-ccx-verify.yml</files>
  <action>
    Replace ONLY the current if/else `requiredPermissions` assertion (the `if node -e "...requiredPermissions ? 1 : 0..."` block that prints the success line about having "no requiredPermissions block" and, in its else branch, the error telling the maintainer to remove it). Do NOT alter the `RETIRED_NAMES` loop below it, the `.ccx` discovery, the `unzip` step, or the `MANIFEST` path resolution.

    Replace it with a single `node -e '<script>' "$PWD/$MANIFEST"` invocation (no surrounding bash `if/else` — the script owns the exit code, and the step's existing `set -euo pipefail` fails the step on a non-zero exit). Pass the manifest path as `process.argv[1]` and `require()` it (the path is absolute, so `require` resolves it). The script must:
    - Read `const rp = m.requiredPermissions;`.
    - Compute `okScope` true only when ALL of: `rp` is a non-null object; `Object.keys(rp).length === 1`; `rp.network` is a non-null object; `Object.keys(rp.network).length === 1`; `Array.isArray(rp.network.domains)`; `rp.network.domains.length === 1`; `rp.network.domains[0] === "https://api.github.com"`.
    - If `!rp || okScope`: print the success line `OK: manifest.json requiredPermissions is absent or scoped to the reviewed api.github.com-only tradeoff (Phase 4 D-01/D-03)` and `process.exit(0)`.
    - Otherwise: print (to stderr) the failure line `manifest.json declares requiredPermissions broader than the reviewed api.github.com-only scope (Phase 4 D-01/D-03) -- found: <JSON.stringify(rp)>. This widens Creative Cloud Desktop admin-password-prompt trigger beyond what was reviewed.` (interpolate the real `JSON.stringify(rp)` in place of `<...>`) and `process.exit(1)`.

    Write the node script in SINGLE quotes so the JS body can use double quotes for its string literals without escaping. Keep it a multi-line script inside the `run: |` block. Do not introduce `jq` or any other dependency — `node` is already used here.
  </action>
  <verify>
    <automated>cd /Users/hurisb/Projects/guidemygrid && node -e 'const m=require("./manifest.json");const rp=m.requiredPermissions;const ok=rp&&typeof rp==="object"&&Object.keys(rp).length===1&&rp.network&&typeof rp.network==="object"&&Object.keys(rp.network).length===1&&Array.isArray(rp.network.domains)&&rp.network.domains.length===1&&rp.network.domains[0]==="https://api.github.com";process.exit(!rp||ok?0:1)' && grep -q 'scoped to the reviewed api.github.com-only tradeoff (Phase 4 D-01/D-03)' .github/workflows/macos-ccx-verify.yml && grep -q 'broader than the reviewed api.github.com-only scope (Phase 4 D-01/D-03)' .github/workflows/macos-ccx-verify.yml && grep -q 'RETIRED_NAMES=' .github/workflows/macos-ccx-verify.yml && echo VERIFY_OK</automated>
  </verify>
  <done>The macOS workflow's requiredPermissions block accepts an absent block or the exact api.github.com-only scope and rejects anything broader; both new success and failure message strings (citing Phase 4 D-01/D-03) are present; the `RETIRED_NAMES` loop is unchanged; no `jq` reference added.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite the requiredPermissions assertion in windows-ccx-verify.yml (PowerShell)</name>
  <files>.github/workflows/windows-ccx-verify.yml</files>
  <action>
    Replace ONLY the current PowerShell `requiredPermissions` assertion — the `if ($manifest.PSObject.Properties.Name -contains "requiredPermissions") { throw ... }` block plus its immediately following `Write-Host "OK: ..."` success line. Do NOT alter the `.ccx` discovery, `ExtractToDirectory`, `ConvertFrom-Json` of `$manifest`, or the `$retiredNames` loop below it.

    Replace with native PowerShell (no new module, no `jq`) that:
    - Reads `$rp = $manifest.requiredPermissions`.
    - If `$null -eq $rp`: `Write-Host` the success line `OK: manifest.json requiredPermissions is absent or scoped to the reviewed api.github.com-only tradeoff (Phase 4 D-01/D-03)`.
    - Else: compute the exact-scope check using nested `if` blocks (avoid multi-line boolean line-continuation ambiguity). Gather `$rpKeys = @($rp.PSObject.Properties.Name)`, `$net = $rp.network`, `$netKeys = if ($net) { @($net.PSObject.Properties.Name) } else { @() }`, `$domains = if ($net) { @($net.domains) } else { @() }`. Set `$okScope = $true` only when `$rpKeys.Count -eq 1` and `$rpKeys[0] -eq "network"` and `$netKeys.Count -eq 1` and `$netKeys[0] -eq "domains"` and `$domains.Count -eq 1` and `$domains[0] -eq "https://api.github.com"`; otherwise leave `$okScope = $false`.
    - If `$okScope`: `Write-Host` the same success line as above.
    - Else: `$found = $rp | ConvertTo-Json -Compress -Depth 10` then `throw` the failure line `manifest.json declares requiredPermissions broader than the reviewed api.github.com-only scope (Phase 4 D-01/D-03) -- found: $found. This widens Creative Cloud Desktop admin-password-prompt trigger beyond what was reviewed.`

    This mirrors Task 1's semantics in PowerShell so both platforms enforce the identical rule. Match the file's existing 2-space YAML/pwsh indentation style.
  </action>
  <verify>
    <automated>cd /Users/hurisb/Projects/guidemygrid && grep -q 'scoped to the reviewed api.github.com-only tradeoff (Phase 4 D-01/D-03)' .github/workflows/windows-ccx-verify.yml && grep -q 'broader than the reviewed api.github.com-only scope (Phase 4 D-01/D-03)' .github/workflows/windows-ccx-verify.yml && grep -q '\$okScope' .github/workflows/windows-ccx-verify.yml && grep -q '\$retiredNames' .github/workflows/windows-ccx-verify.yml && echo VERIFY_OK</automated>
  </verify>
  <done>The Windows workflow's requiredPermissions block accepts an absent block or the exact api.github.com-only scope and rejects anything broader using native PowerShell; both new message strings (citing Phase 4 D-01/D-03) are present; the `$retiredNames` loop is unchanged; no new PowerShell module or `jq` added.</done>
</task>

<task type="auto">
  <name>Task 3: Commit, push to epic/ui-icons, and confirm the macOS CI job goes green</name>
  <files>.github/workflows/macos-ccx-verify.yml, .github/workflows/windows-ccx-verify.yml</files>
  <action>
    Commit both workflow changes with a message like `ci: allow api.github.com-scoped requiredPermissions in ccx-verify checks (Phase 4 D-01/D-03)`. Push to the current branch `epic/ui-icons` (both workflows list `epic/ui-icons` under `on.push.branches`, so the push triggers both). Then watch the `macOS CCX Verification` run for this commit and confirm its conclusion is `success`.

    Expected outcome: the macOS job goes green. The Windows job will still fail — but at the LATER `Package .ccx` step due to the pre-existing, out-of-scope `zip`-CLI issue, NOT at the requiredPermissions assertion. If the Windows run reaches the extract/validate step, its requiredPermissions check should pass; if it fails earlier at packaging, that is expected and out of scope for this task. Do not attempt to fix the zip-CLI issue.
  </action>
  <verify>
    <automated>cd /Users/hurisb/Projects/guidemygrid && gh run list --workflow=macos-ccx-verify.yml --branch epic/ui-icons --limit 1 --json headSha,conclusion,status --jq '.[0] | select(.status=="completed" and .conclusion=="success") | "MACOS_GREEN " + .headSha' | grep MACOS_GREEN</automated>
  </verify>
  <done>Both workflow files are committed and pushed to `epic/ui-icons`; the latest `macOS CCX Verification` run for the pushed commit completed with conclusion `success`. (The Windows job may still fail at the separate, out-of-scope packaging/zip-CLI step — that is acceptable.)</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| release artifact → end-user machine | The `.ccx`'s `manifest.json` declares permissions Creative Cloud Desktop honors at install time; over-broad permissions widen the install-time privilege/network surface. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-inq-01 | Elevation of Privilege | manifest.json `requiredPermissions` in built `.ccx` | low | mitigate | The rewritten assertion pins the accepted scope to exactly `{network:{domains:["https://api.github.com"]}}` and FAILS CI on any broader scope (extra domain, `domains:"all"`, added filesystem/other permission categories), preventing an unreviewed permission-scope expansion from shipping. |
| T-inq-02 | Tampering | CI assertion logic itself | low | accept | Assertion is data-only JSON-shape comparison with no shell-out/network; no new dependency introduced (bash keeps `node -e`, Windows keeps native PowerShell), preserving the project's zero-new-dependency CI convention. |
</threat_model>

<verification>
- Both `<action>` blocks touch only the `requiredPermissions` assertion; the retired-installer/uninstaller loops (`RETIRED_NAMES` / `$retiredNames`) remain byte-for-byte unchanged.
- The scope rule is identical across macOS and Windows: PASS if absent OR exactly api.github.com-only; FAIL if broader.
- macOS `node -e` logic verified locally against 5 fixtures during planning (exact/absent pass; extra-domain/`all`/filesystem fail).
- Final proof is CI: the `macOS CCX Verification` run for the pushed commit ends `success`.
</verification>

<success_criteria>
- `macOS CCX Verification` workflow passes on the pushed `epic/ui-icons` commit with the current manifest.
- Both workflows' `requiredPermissions` checks accept the reviewed api.github.com-only scope and reject anything broader, in each file's native scripting style, with no new dependency.
- The Windows `requiredPermissions` check is correct (would pass if reached); its still-failing packaging step is the known, out-of-scope zip-CLI issue and is left untouched.
</success_criteria>

<output>
Create `.planning/quick/260708-inq-fix-stale-ci-checks-in-macos-ccx-verify-/260708-inq-SUMMARY.md` when done.
</output>
