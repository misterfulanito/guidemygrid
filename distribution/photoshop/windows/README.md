# distribution/photoshop/windows/

The Windows installer/uninstaller scripts for GuideMyGrid, as a Photoshop
plugin.

## Status: relocated as-is, not yet reworked

The scripts in this folder (`install.sh`, `install.bat`, `install.ps1`,
`uninstall.bat`, `uninstall.ps1`) were moved here unmodified from
`scripts/` during Phase 1's directory restructure (FOUND-02). **Their
internal logic has not been touched.**

The actual Windows installer rework — a no-elevation installer targeting
the user-level `%APPDATA%\...` plugin folder, an install-time manifest,
and the other improvements this milestone makes for macOS — **lands in
Phase 2 (requirements WIN-01 through WIN-05)**. Do not modify the logic
of these scripts in Phase 1; this directory only needed to *exist* and
have a stable home for Phase 2 to build on, not be rewritten yet.

## Naming reminder

Don't confuse this `release`-adjacent tree with the top-level `releases/`
directory (plural) — see `../../README.md` for the full disambiguation.
`release/` (singular, sibling of `distribution/`) is script automation;
`releases/` (plural, repo root) is built binary output.
