@echo off
title Google 2FA Generator Installer

echo.
echo ==========================================
echo  Google 2FA App Password Generator
echo  Installer for Windows
echo ==========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed!
    pause
    exit /b 1
)

echo [OK] Node.js installed
echo [OK] npm installed
echo.

REM Set install directory
set INSTALL_DIR=%USERPROFILE%\google-2fa-apppassword

REM Clone or update
if exist "%INSTALL_DIR%" (
    echo Directory exists. Updating...
    cd /d "%INSTALL_DIR%"
    git pull
) else (
    echo Cloning repository...
    git clone https://github.com/systemaudit/google-2fa-apppassword.git "%INSTALL_DIR%"
    cd /d "%INSTALL_DIR%"
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Installing Playwright...
call npx playwright install chromium

echo.
echo Creating directories...
if not exist logs mkdir logs
if not exist output mkdir output

REM Create .env if not exists
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please edit it!
)

echo.
echo ==========================================
echo  Installation Complete!
echo ==========================================
echo.
echo Location: %INSTALL_DIR%
echo.
echo Next steps:
echo 1. Edit .env: notepad "%INSTALL_DIR%\.env"
echo 2. Run: cd "%INSTALL_DIR%" ^&^& npm start
echo.
pause
