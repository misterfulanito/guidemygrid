# distribution/

This directory holds everything needed to package and install GuideMyGrid
for a specific host application — one subfolder per host app.

Today that's just `photoshop/`. If GuideMyGrid ever adds Illustrator or
Figma support, those would become sibling folders (`illustrator/`,
`figma/`) right alongside it, each with their own macOS/Windows installer
logic. Nothing about this milestone's installer work should make that
harder later.

Inside each host folder, installer/packaging logic is split further by
operating system (`macos/`, `windows/`) because the actual mechanics of
"install without asking for admin/root" are completely different on each
platform (an AppleScript `.app`/`.dmg` on macOS vs. a batch/PowerShell
script on Windows).

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
