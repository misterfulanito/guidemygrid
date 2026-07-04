@echo off
:: GuideMyGrid — Uninstaller (Windows)
:: Double-click this file to uninstall.

echo GuideMyGrid -- Uninstaller (Windows)
echo --------------------------------------

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Uninstall failed. See the error above.
  pause
  exit /b 1
)

pause
