# distribution/photoshop/macos/

The macOS installer for GuideMyGrid, as a Photoshop plugin.

## What it does

Installs GuideMyGrid into Photoshop's per-user UXP plugin folder:

```
~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/<version>/Plugin/com.guidemygrid.plugin/
```

That path is entirely inside the current user's home directory — it does
**not** require admin or root privileges to write to, and this installer
never asks for them.

## How it's packaged

The installer is built as an unprivileged `.app` (via `osacompile`,
ad-hoc signed with `codesign --sign -`), then wrapped in a `.dmg` (via
`create-dmg`) for distribution. Building the `.app`/`.dmg` is what
`build-installer.js` in this directory does; the actual installer
behavior (confirmation dialog, Photoshop-running check, copy, manifest
write, success dialog) lives in the AppleScript source it compiles.

No `sudo`, no `pkgbuild`, no admin password prompt — that's the entire
point of this rework (replacing the old root-requiring `.pkg` installer).

## Naming reminder

Don't confuse this `release`-adjacent tree with the top-level `releases/`
directory (plural) — see `../../README.md` for the full disambiguation.
`release/` (singular, sibling of `distribution/`) is script automation;
`releases/` (plural, repo root) is built binary output.
