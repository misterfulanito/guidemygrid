-- distribution/photoshop/macos/installer.applescript
-- Unprivileged macOS installer for GuideMyGrid (MAC-01, MAC-03, MAC-04).
--
-- Compiled into "Install GuideMyGrid.app" by build-installer.js via
-- osacompile. This app runs entirely as the invoking user — it never
-- elevates and never invokes any privileged package-installer tooling.
-- Every shell invocation below begins with an absolute path (never
-- a bare command name) so this file passes the MAC-04 static gate.
--
-- __VERSION__ below is replaced with the real plugin version by
-- build-installer.js immediately before the source is handed to
-- osacompile — this checked-in copy is never compiled as-is.

property pluginVersion : "__VERSION__"

set appPath to POSIX path of (path to me)
set payloadPath to appPath & "Contents/Resources/install-payload.sh"
set pluginSrcPath to appPath & "Contents/Resources/plugin"

-- D-02 / D-03: confirmation dialog, titled with the app's own display name.
try
	display dialog "Install GuideMyGrid?" with title "Install GuideMyGrid" buttons {"Cancel", "Install"} default button "Install"
on error number -128
	-- Cancel or window closed — exit quietly, nothing was installed.
	return
end try

-- MAC-03 / D-04: hard block while Photoshop is running. Case-insensitive
-- substring match so this catches any year-suffixed Photoshop process
-- name (e.g. "Adobe Photoshop 2025", "Adobe Photoshop 2026") rather than
-- a single hardcoded process name.
repeat
	set psRunning to (do shell script "/usr/bin/pgrep -i photoshop || true") is not ""
	if not psRunning then exit repeat
	try
		display alert "Please quit Photoshop first" message "GuideMyGrid can't install while Photoshop is open. Quit Photoshop, then click OK to try again." buttons {"Cancel", "OK"} default button "OK"
	on error number -128
		return
	end try
end repeat

-- MAC-01 / MAC-04: hand off to the unprivileged copy+manifest core via a
-- single absolute-path shell invocation. No other filesystem writes happen
-- in this file — install-payload.sh (Plan 03) owns all of that logic.
try
	do shell script "/bin/sh " & quoted form of payloadPath & " " & quoted form of pluginSrcPath & " " & quoted form of pluginVersion
on error errMsg
	display alert "Install failed" message errMsg buttons {"OK"} default button "OK"
	return
end try

-- D-05: success feedback — tell the user exactly what to do next.
display dialog "Installed! Open Photoshop" with title "GuideMyGrid" buttons {"OK"} default button "OK"
