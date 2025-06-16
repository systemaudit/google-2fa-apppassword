@echo off
setlocal enabledelayedexpansion
title Google 2FA Generator Installer

:: Colors
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:: Banner
cls
echo.
echo %GREEN%==========================================%NC%
echo %GREEN% Google 2FA App Password Generator%NC%
echo %GREEN% Installer for Windows%NC%
echo %GREEN%==========================================%NC%
echo.

:: Check Administrator (optional, uncomment if needed)
:: net session >nul 2>&1
:: if %errorlevel% neq 0 (
::     echo %RED%Error: Please run as Administrator%NC%
::     pause
::     exit /b 1
:: )

:: Check Git
echo %YELLOW%Checking Git...%NC%
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error: Git is not installed!%NC%
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)
echo %GREEN%[OK] Git installed%NC%

:: Check Node.js
echo %YELLOW%Checking Node.js...%NC%
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error: Node.js is not installed!%NC%
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Recommended: LTS version (18.x or higher)
    echo.
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=2 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i

if %NODE_MAJOR% lss 16 (
    echo %RED%Error: Node.js version is too old!%NC%
    echo Current version: v%NODE_VERSION%
    echo Required: v16.0.0 or higher
    echo.
    echo Please update Node.js from: https://nodejs.org
    pause
    exit /b 1
)
echo %GREEN%[OK] Node.js v%NODE_VERSION%%NC%

:: Check npm
echo %YELLOW%Checking npm...%NC%
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error: npm is not installed!%NC%
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo %GREEN%[OK] npm v%NPM_VERSION%%NC%
echo.

:: Set install directory
set INSTALL_DIR=%USERPROFILE%\google-2fa-apppassword

:: Clone or update repository
if exist "%INSTALL_DIR%" (
    echo %YELLOW%Directory exists. Updating repository...%NC%
    cd /d "%INSTALL_DIR%"
    
    :: Reset any local changes
    git reset --hard HEAD >nul 2>&1
    
    :: Pull latest changes
    git pull origin main >nul 2>&1 || git pull origin master >nul 2>&1
    if %errorlevel% neq 0 (
        echo %RED%Error updating repository%NC%
        pause
        exit /b 1
    )
    echo %GREEN%[OK] Repository updated%NC%
) else (
    echo %YELLOW%Cloning repository...%NC%
    git clone https://github.com/systemaudit/google-2fa-apppassword.git "%INSTALL_DIR%"
    if %errorlevel% neq 0 (
        echo %RED%Error cloning repository%NC%
        pause
        exit /b 1
    )
    cd /d "%INSTALL_DIR%"
    echo %GREEN%[OK] Repository cloned%NC%
)

:: Install dependencies
echo.
echo %YELLOW%Installing dependencies...%NC%
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%Error installing dependencies%NC%
    echo Trying with verbose output...
    call npm install
    pause
    exit /b 1
)
echo %GREEN%[OK] Dependencies installed%NC%

:: Install Playwright
echo.
echo %YELLOW%Installing Playwright Chromium...%NC%
call npx playwright install chromium
if %errorlevel% neq 0 (
    echo %RED%Warning: Playwright installation had issues%NC%
    echo You may need to run manually: npx playwright install chromium
)
echo %GREEN%[OK] Playwright installed%NC%

:: Create directories
echo.
echo %YELLOW%Creating directories...%NC%
if not exist logs mkdir logs
if not exist output mkdir output
echo %GREEN%[OK] Directories created%NC%

:: Create .env if not exists
if not exist .env (
    echo.
    echo %YELLOW%Creating .env file...%NC%
    if exist .env.example (
        copy .env.example .env >nul
    ) else (
        (
            echo # Browser Settings
            echo HEADLESS=true
            echo DEBUG_MODE=false
            echo.
            echo # Timeouts ^(ms^)
            echo NAVIGATION_TIMEOUT=20000
            echo IMPLICIT_TIMEOUT=8000
            echo VERIFICATION_TIMEOUT=10000
            echo.
            echo # Processing
            echo BATCH_SIZE=3
            echo BATCH_DELAY=5000
            echo.
            echo # TOTP API
            echo TOTP_API_URL=https://2fa.live/tok
            echo.
            echo # Output
            echo OUTPUT_FORMAT=csv
            echo OUTPUT_PATH=output/results.csv
        ) > .env
    )
    echo %GREEN%[OK] .env file created%NC%
)

:: Create start script
echo.
echo %YELLOW%Creating start script...%NC%
(
    echo @echo off
    echo cd /d "%INSTALL_DIR%"
    echo npm start
    echo pause
) > "%INSTALL_DIR%\start.bat"
echo %GREEN%[OK] start.bat created%NC%

:: Create desktop shortcut
echo.
echo %YELLOW%Creating desktop shortcut...%NC%
set DESKTOP=%USERPROFILE%\Desktop
set SHORTCUT=%DESKTOP%\Google 2FA Generator.lnk

:: Use PowerShell to create shortcut
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%SHORTCUT%'); $SC.TargetPath = '%INSTALL_DIR%\start.bat'; $SC.WorkingDirectory = '%INSTALL_DIR%'; $SC.IconLocation = 'cmd.exe'; $SC.Description = 'Google 2FA App Password Generator'; $SC.Save()" >nul 2>&1

if exist "%SHORTCUT%" (
    echo %GREEN%[OK] Desktop shortcut created%NC%
) else (
    echo %YELLOW%[!] Could not create desktop shortcut%NC%
)

:: Success message
echo.
echo %GREEN%==========================================%NC%
echo %GREEN% Installation Complete!%NC%
echo %GREEN%==========================================%NC%
echo.
echo %BLUE%Installation Directory:%NC%
echo %INSTALL_DIR%
echo.
echo %BLUE%How to run:%NC%
echo 1. Double-click desktop shortcut: "Google 2FA Generator"
echo 2. Or run: %INSTALL_DIR%\start.bat
echo 3. Or manually: cd "%INSTALL_DIR%" ^&^& npm start
echo.
echo %BLUE%Configuration:%NC%
echo Edit settings: notepad "%INSTALL_DIR%\.env"
echo.

:: Ask if user wants to start now
echo %YELLOW%Do you want to start the application now? (Y/N)%NC%
choice /C YN /N >nul
if %errorlevel% equ 1 (
    echo.
    echo %GREEN%Starting Google 2FA App Password Generator...%NC%
    echo.
    timeout /t 2 /nobreak >nul
    start cmd /k "cd /d "%INSTALL_DIR%" && npm start"
) else (
    echo.
    echo %BLUE%You can start the application later using the desktop shortcut.%NC%
)

echo.
pause
