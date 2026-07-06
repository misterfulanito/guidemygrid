# distribution/

This directory holds everything needed to package and install GuideMyGrid
for a specific host application — one subfolder per host app.

Today that's just `photoshop/`. If GuideMyGrid ever adds Illustrator or
Figma support, those would become sibling folders (`illustrator/`,
`figma/`) right alongside it, each with their own macOS/Windows installer
logic. Nothing about this milestone's installer work should make that
harder later.

The actual macOS install mechanism is a `.ccx` file (a plain zip of the
built plugin) processed by Creative Cloud Desktop — this is a
cross-platform packaging format, not an OS-specific mechanism, so `.ccx`
packaging lives directly under `photoshop/` (`build-ccx.js`), not inside
`macos/`. Windows uses the identical `.ccx` + Creative Cloud Desktop mechanism as
macOS (confirmed in Phase 2) — there is no OS-specific installer script
directory anymore; `distribution/photoshop/windows/` is kept only as a
placeholder for any genuinely Windows-specific future need.

## What does NOT live here

Release automation that has nothing to do with any specific host app or
OS — checksum generation, publishing to GitHub Releases, syncing to
Gumroad — lives in the sibling `release/` directory instead. That
directory is deliberately generic: it doesn't know or care whether the
thing it's publishing is a Photoshop plugin or (someday) an Illustrator
one.

**Important — do not confuse `release/` with `releases/`:**
- `release/` (this repo, singular) — release-automation *scripts* (this
  directory's sibling)
- `releases/` (plural) — the actual built binary *output* (installers,
  DMGs, zips) that those scripts produce/publish

They are two different directories with dangerously similar names. Never
write a script or glob pattern that could match both.
