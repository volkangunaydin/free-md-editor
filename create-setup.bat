@echo off
setlocal EnableDelayedExpansion
REM ---------------------------------------------------------------------------
REM  create-setup.bat - builds the Free MD Editor Windows installer.
REM
REM  Result: setup\Free MD Editor_<version>_x64-setup.exe  (folder is git-ignored)
REM
REM  Requirements: Rust (rustup), Node.js 20+, MSVC build tools, Windows 10 SDK.
REM ---------------------------------------------------------------------------
cd /d "%~dp0"

echo.
echo === Free MD Editor - setup builder ===
echo.

REM --- make sure rc.exe (Windows SDK resource compiler) is reachable ----------
where rc.exe >nul 2>&1
if errorlevel 1 (
  set "RCDIR="
  for /d %%K in ("%ProgramFiles(x86)%\Windows Kits\10\bin\10.*") do (
    if exist "%%~K\x64\rc.exe" set "RCDIR=%%~K\x64"
    if not defined RCDIR if exist "%%~K\x86\rc.exe" set "RCDIR=%%~K\x86"
  )
  if defined RCDIR (
    echo Using rc.exe from "!RCDIR!"
    set "PATH=!RCDIR!;!PATH!"
  ) else (
    echo WARNING: rc.exe not found. Install the Windows 10 SDK or run this from a
    echo          "Developer Command Prompt for VS". Continuing anyway...
  )
)

REM --- toolchain checks ----------------------------------------------------
where cargo >nul 2>&1 || (echo ERROR: cargo not found. Install Rust from https://rustup.rs & exit /b 1)
where npm >nul 2>&1   || (echo ERROR: npm not found. Install Node.js from https://nodejs.org & exit /b 1)

REM --- dependencies --------------------------------------------------------
if not exist node_modules (
  echo Installing npm dependencies...
  call npm install || exit /b 1
)

REM --- build ---------------------------------------------------------------
echo Building release installer (this takes a few minutes the first time)...
call npm run tauri build || (echo. & echo BUILD FAILED. & exit /b 1)

REM --- collect output ------------------------------------------------------
if not exist setup mkdir setup
del /q setup\*.exe >nul 2>&1
copy /y "src-tauri\target\release\bundle\nsis\*.exe" setup\ >nul || (echo ERROR: installer not found. & exit /b 1)

echo.
echo === Done. Installer(s): ===
dir /b setup\*.exe
echo.
endlocal
