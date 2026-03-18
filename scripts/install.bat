@echo off
:: GuideMyGrid — Direct Installer (Windows)
:: Right-click this file and select "Run as administrator"

echo GuideMyGrid -- Direct Installer (Windows)
echo ------------------------------------------

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Installation failed. See the error above.
  pause
  exit /b 1
)

pause
