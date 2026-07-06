# distribution/photoshop/windows/

This directory no longer contains any installer logic.

## What used to be here

Five raw-copy install/uninstall scripts (`install.bat`, `install.ps1`,
`install.sh`, `uninstall.bat`, `uninstall.ps1`) that copied the built
plugin directly into:

```
%APPDATA%\Adobe\UXP\PluginsStorage\PHSP\<version>\Plugin\<id>\
```

Manual QA (mirroring Phase 1's macOS finding, an architectural property
of Creative Cloud Desktop itself, not OS-specific) confirms a raw file
copy into `PluginsStorage` does not make Photoshop list the plugin.
Photoshop's Plugins panel only shows what Creative Cloud Desktop's own
install agent (UPIA) has registered, and UPIA only registers what it
installed itself.

## The actual install mechanism

GuideMyGrid is installed via the same `.ccx` file mechanism as macOS —
a plain zip of the plugin's built `dist/` output — that the user
double-clicks. This launches Creative Cloud Desktop, which installs the
plugin at user level (no admin prompt).

The `.ccx` is built by `distribution/photoshop/build-ccx.js`, one
directory level up from here — not inside `windows/`, because `.ccx`
packaging is identical on macOS and Windows and is not an OS-specific
mechanism.

## Why this directory still exists

This directory is kept (rather than deleted) only in case something
genuinely Windows-specific is needed later. Windows parity with the
macOS install mechanism is now confirmed (D-01) — this phase's own
CI verification (`.github/workflows/windows-ccx-verify.yml`) proves the
`.ccx` build pipeline works on a real Windows runner. Real end-to-end
install/uninstall verification via Creative Cloud Desktop itself
remains deferred to D-06, before ship.
