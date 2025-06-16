# Google 2FA App Password Generator Installer for Windows
# Author: @systemaudit

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Google 2FA App Password Generator" -ForegroundColor Green
Write-Host " Installer for Windows" -ForegroundColor Green  
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "✓ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm is not installed!" -ForegroundColor Red
    exit 1
}

# Set install directory
$installDir = "$env:USERPROFILE\google-2fa-apppassword"

# Clone or update
if (Test-Path $installDir) {
    Write-Host "Directory exists. Updating..." -ForegroundColor Yellow
    Set-Location $installDir
    git pull
} else {
    Write-Host "Cloning repository..." -ForegroundColor Yellow
    git clone https://github.com/systemaudit/google-2fa-apppassword.git $installDir
    Set-Location $installDir
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Install Playwright
Write-Host "Installing Playwright..." -ForegroundColor Yellow
npx playwright install chromium

# Create directories
New-Item -ItemType Directory -Force -Path logs | Out-Null
New-Item -ItemType Directory -Force -Path output | Out-Null

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "Created .env file. Please edit it!" -ForegroundColor Yellow
}

# Create desktop shortcut
$desktop = [Environment]::GetFolderPath("Desktop")
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("$desktop\Google 2FA Generator.lnk")
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/k cd /d `"$installDir`" && npm start"
$shortcut.WorkingDirectory = $installDir
$shortcut.Save()

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $installDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env: notepad `"$installDir\.env`"" -ForegroundColor White
Write-Host "2. Run: Desktop shortcut or 'npm start'" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
