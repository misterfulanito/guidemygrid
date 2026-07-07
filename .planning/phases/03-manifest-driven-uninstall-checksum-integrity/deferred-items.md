# Deferred Items — Phase 03

Out-of-scope discoveries logged during plan execution (SCOPE BOUNDARY: only fixed if directly caused by the current task's changes).

## Plan 03-01

### `scripts/package.js` — `git add` on gitignored `.ccx` file fails

**Found during:** Task 2 verification (`node scripts/package.js` full-script run)

**Issue:** The final staging step (`execSync('git add ...')`, now at the bottom of `package.js` after the uninstaller-removal cleanup) calls plain `git add` on `releases/GuideMyGrid-v<version>.ccx`. `.gitignore` excludes both `releases/` and `*.ccx`, so `git add` (without `-f`) exits non-zero and crashes the script with an uncaught `execSync` error — even though the `.ccx` itself is built successfully by the preceding `npm run package:ccx` step.

**Why deferred:** This behavior pre-dates this plan's changes — `git show HEAD:scripts/package.js` (the commit right after Task 1's RED test, before Task 2 touched the file) already had `const toStage = [ccxFile];` followed by the same unguarded `git add`. Task 2's scope was removing the legacy macOS uninstaller invocation/staging; it did not introduce or modify the git-add-on-gitignored-file behavior. Per the SCOPE BOUNDARY rule, out-of-scope pre-existing issues are logged here, not fixed inline.

**Suggested fix (future plan):** Either `git add -f` the release artifacts intentionally (if committing built binaries to the repo is desired) or drop the `git add` call entirely and let `release/github-release.js` (the actual publish step) handle uploading the artifact via the GitHub Releases API instead of a git commit.
