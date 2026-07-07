---
phase: 03-manifest-driven-uninstall-checksum-integrity
plan: 02
subsystem: infra
tags: [crypto, sha256, checksums, release-scripts, jest, docs]

# Dependency graph
requires:
  - phase: 03-manifest-driven-uninstall-checksum-integrity
    provides: Plan 03-01 cleaned scripts/package.js of darwin-gated uninstaller invocation, giving this plan a stable "post-uninstaller-retirement" base to wire checksum generation into
provides:
  - release/checksums.js — hashFile()/formatChecksumLine() built on Node's crypto/fs, generating releases/SHA256SUMS.txt
  - scripts/package.js and release/github-release.js wired to generate + upload SHA256SUMS.txt automatically
  - VERIFY.md — plain-language macOS/Windows checksum verification guide, linked from README
affects: [03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["release-script sibling style (header comment, root/pkg/version resolution, CommonJS require, ✅ console success line) extended to release/checksums.js", "async main().catch() wrapper for the one async release script (streaming hash needs it; version.js/github-release.js are synchronous)"]

key-files:
  created:
    - release/checksums.js
    - src/__tests__/checksums.test.ts
    - VERIFY.md
  modified:
    - scripts/package.js
    - release/github-release.js
    - README.md
    - .gitignore

key-decisions:
  - "release/checksums.js uses Node's built-in crypto.createHash('sha256') streamed over fs.createReadStream() — no new npm dependency, matches the zero-dependency style of version.js/github-release.js"
  - "formatChecksumLine emits exactly two literal spaces between digest and filename (shasum -a 256 -c text-mode requirement) — verified both via unit test and a live shasum -c dry run"
  - "Added !VERIFY.md exception to .gitignore's blanket *.md exclusion (Rule 3 — blocking fix, VERIFY.md is a required deliverable that must be committed and linked from README)"

patterns-established:
  - "Async top-level release scripts use main().catch((err) => { console.error(err); process.exit(1); }) guarded by require.main === module — keeps the script import-safe for testing while still runnable standalone"

requirements-completed: [INTEG-02]

coverage:
  - id: D1
    description: "release/checksums.js generates correctly-formatted SHA256 checksum lines (two-space separator, LF endings, relative filenames) using only Node built-ins"
    requirement: INTEG-02
    verification:
      - kind: unit
        ref: "src/__tests__/checksums.test.ts#formatChecksumLine joins digest and filename with exactly two spaces"
        status: pass
      - kind: unit
        ref: "src/__tests__/checksums.test.ts#hashFile resolves to the correct lowercase-hex SHA256 of an empty file"
        status: pass
      - kind: unit
        ref: "src/__tests__/checksums.test.ts#hashFile resolves to a correct SHA256 for known non-empty content"
        status: pass
      - kind: unit
        ref: "src/__tests__/checksums.test.ts#importing the module does not execute main() (require.main guard)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Checksum generation runs automatically during npm run package/publish:* with no manual step, and SHA256SUMS.txt uploads to the GitHub Release alongside the .ccx"
    requirement: INTEG-02
    verification:
      - kind: other
        ref: "npm run package (end-to-end run) produced releases/GuideMyGrid-v0.1.0.ccx and releases/SHA256SUMS.txt; shasum -a 256 -c SHA256SUMS.txt from releases/ reported OK"
        status: pass
      - kind: other
        ref: "grep -q SHA256SUMS.txt scripts/package.js && grep -q SHA256SUMS.txt release/github-release.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "A non-technical user has plain-language, copy-paste verification steps for both macOS and Windows in VERIFY.md, linked from the README, framed as integrity (not authenticity)"
    requirement: INTEG-02
    verification:
      - kind: other
        ref: "VERIFY.md contains 'shasum -a 256 -c', 'certutil', and 'Get-FileHash'; README.md links to VERIFY.md"
        status: pass
    human_judgment: true
    rationale: "Plain-language clarity and tone for a self-described non-technical audience is a subjective quality judgment automated grep checks cannot fully assess — human sign-off recommended at end-of-phase per human_verify_mode."

duration: 12min
completed: 2026-07-07
status: complete
---

# Phase 3 Plan 2: Checksum Integrity Summary

**SHA256 checksum generation via Node's built-in crypto, auto-wired into the release/publish flow, with a plain-language VERIFY.md for non-technical macOS/Windows users**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-07T15:23:00Z
- **Completed:** 2026-07-07T15:35:00Z
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- `release/checksums.js` generates `releases/SHA256SUMS.txt` via `crypto.createHash('sha256')` streamed over `fs.createReadStream()` — no new npm dependency
- `formatChecksumLine()` emits the exact two-space `shasum -a 256 -c` text-mode separator; verified both by unit test and a live `shasum -a 256 -c` dry run (`OK` for the produced `.ccx`)
- `scripts/package.js` now runs `node release/checksums.js` automatically after the `.ccx` build and stages `SHA256SUMS.txt` for commit
- `release/github-release.js`'s upload file list now includes `SHA256SUMS.txt` and drops the retired `-installer.zip`/`-uninstaller.pkg` entries
- `VERIFY.md` gives non-technical users copy-paste verification steps for macOS (`shasum -a 256 -c`) and Windows (`certutil -hashfile` primary, `Get-FileHash` alternative), honestly framed as integrity — not authenticity — with signing deferred to a future version
- README links to `VERIFY.md` at the release-download step

## Task Commits

Each task was committed atomically:

1. **Task 1: Create release/checksums.js + its format test** - `553dd3c` (feat)
2. **Task 2: Wire checksum generation into the package + publish flow** - `1cad42c` (feat)
3. **Task 3: Write VERIFY.md and link it from the README** - `a8ec5e3` (docs)

**Plan metadata:** (pending — final docs commit follows this SUMMARY)

## Files Created/Modified
- `release/checksums.js` - Exports `hashFile(filePath)` (streaming SHA256) and `formatChecksumLine(digest, filename)`; `main()` scans `releases/` for this version's artifacts and writes `SHA256SUMS.txt`, guarded by `require.main === module`
- `src/__tests__/checksums.test.ts` - Asserts the two-space separator format, correct SHA256 for both an empty fixture and known content, and that importing the module never runs `main()`
- `scripts/package.js` - Added the `node release/checksums.js` invocation after the `.ccx` build; `toStage` now includes `SHA256SUMS.txt`; updated header comment to list both release artifacts
- `release/github-release.js` - `files` array now lists exactly `GuideMyGrid-v${version}.ccx` and `SHA256SUMS.txt` (existence-filtered); removed the two retired candidate entries
- `VERIFY.md` (new) - Plain-language, numbered checksum verification guide for macOS and Windows, with an explicit integrity-vs-authenticity framing sentence
- `README.md` - Added a `VERIFY.md` link at the release-download step (Installation, step 2)
- `.gitignore` - Added `!VERIFY.md` exception to the blanket `*.md` ignore rule (see Deviations)

## Decisions Made
- Used Node's built-in `crypto`/`fs`/`path` only for `release/checksums.js` — no new npm dependency, matching the zero-dependency style of its `version.js`/`github-release.js` siblings.
- Used the `main().catch((err) => { console.error(err); process.exit(1); })` wrapper (a pattern not present in the synchronous sibling scripts) because `checksums.js` is the first release script needing async file streaming — guarded by `require.main === module` so the test suite can import `hashFile`/`formatChecksumLine` without triggering the release-artifact scan.
- Led Windows verification with `certutil -hashfile` (Command Prompt, zero setup) over `Get-FileHash` (PowerShell) per the plan's research, offering `Get-FileHash` as the exact-string-match alternative — matches D-08's phasing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `.gitignore`'s blanket `*.md` exclusion silently blocked committing VERIFY.md**
- **Found during:** Task 3 (attempting to commit `VERIFY.md`)
- **Issue:** `.gitignore` ignores all `*.md` files except `README.md` and `.planning/**/*.md`. `VERIFY.md` — a required plan deliverable, referenced by both the plan's `must_haves.artifacts` and the README link — was silently excluded, and `git add` failed outright rather than staging it.
- **Fix:** Added `!VERIFY.md` as an explicit exception in `.gitignore`, immediately after the existing `!README.md` line.
- **Files modified:** `.gitignore`
- **Verification:** `git check-ignore -v VERIFY.md` exits 1 (not ignored) after the fix; `git add VERIFY.md` (no `-f` needed) stages it cleanly.
- **Committed in:** `a8ec5e3` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for VERIFY.md — an explicitly required artifact — to exist in version control at all. No scope creep; the fix is a single-line, minimally-scoped `.gitignore` exception.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `INTEG-02` is complete: checksums generate automatically during `npm run package`/`publish:*`, upload alongside the `.ccx`, and a plain-language verification guide exists for both platforms.
- Confirmed end-to-end during Task 2 verification: `npm run package` produces both `releases/GuideMyGrid-v0.1.0.ccx` and `releases/SHA256SUMS.txt`; `shasum -a 256 -c SHA256SUMS.txt` (run from `releases/`) reports `OK`.
- Pre-existing bug (logged in Plan 03-01's `deferred-items.md`): `scripts/package.js`'s final `git add` step fails because `releases/` is gitignored, crashing the script after both artifacts already exist on disk. Unchanged by this plan — confirmed still present and still out of scope (predates both Plan 03-01 and this plan). A future plan touching the publish/staging flow (likely Phase 4) should address it.
- The full `<verification>` block's manual step ("run a real publish/dry-run, confirm `shasum -a 256 -c` reports OK") was exercised via `npm run package` + `shasum -a 256 -c` locally during Task 2 — a full `gh release create` dry-run against the real GitHub Release flow was not performed (would create/require a real tag/push) and remains for end-of-phase human verification per `human_verify_mode: end-of-phase`.

---
*Phase: 03-manifest-driven-uninstall-checksum-integrity*
*Completed: 2026-07-07*

## Self-Check: PASSED

- FOUND: release/checksums.js
- FOUND: src/__tests__/checksums.test.ts
- FOUND: VERIFY.md
- FOUND: .planning/phases/03-manifest-driven-uninstall-checksum-integrity/03-02-SUMMARY.md
- FOUND commits: 553dd3c, 1cad42c, a8ec5e3
