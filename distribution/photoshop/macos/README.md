# distribution/photoshop/macos/

This directory no longer contains any installer logic.

## What used to be here

An unprivileged `.app`/`.dmg` installer (`install-payload.sh`,
`installer.applescript`, `build-installer.js`) that copied the built
plugin directly into:

```
~/Library/Application Support/Adobe/UXP/PluginsStorage/PHSP/<version>/Plugin/<id>/
```

Manual QA on a real dev machine proved this approach never works: a raw
file copy into `PluginsStorage` does not make Photoshop list the plugin.
Photoshop's Plugins panel only shows what Creative Cloud Desktop's own
install agent (UPIA) has registered, and UPIA only registers what it
installed itself. See `01-RESEARCH.md`'s CRITICAL ADDENDUM (and its
follow-up, both right after `## Summary`) for the full investigation.

## The actual install mechanism

GuideMyGrid is installed via a `.ccx` file — a plain zip of the plugin's
built `dist/` output — that the user double-clicks. This launches
Creative Cloud Desktop, which shows an "unverified third-party developer"
warning and then installs the plugin at user level (no admin/root
prompt, same as before).

The `.ccx` is built by `distribution/photoshop/build-ccx.js`, one
directory level up from here — not inside `macos/`, because `.ccx`
packaging is identical on macOS and Windows and is not an OS-specific
mechanism.

## Why this directory still exists

This directory is kept (rather than deleted) only because Phase 2 still
needs a home for anything genuinely macOS-specific. Note that
`REQUIREMENTS.md` already flags that Phase 2 must re-verify whether
Windows needs the same `.ccx` pivot before assuming its own installer
work is unaffected.

## Naming reminder

Don't confuse this `distribution`-adjacent tree with the top-level
`releases/` directory (plural) — see `../../README.md` for the full
disambiguation. `release/` (singular, sibling of `distribution/`) is
script automation; `releases/` (plural, repo root) is built binary
output.
