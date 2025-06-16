# Google 2FA App Password Generator ??

Automated Google 2FA and App Password Generator using Playwright

## ✨ Features

- ?? Automated Google account 2FA setup
- ?? Bulk processing support
- ?? App password generation  
- ?? TOTP secret extraction
- ?? CSV input/output support
- ?? Concurrent processing
- ?? Detailed logging

## ?? Requirements

- Node.js 16+ and npm
- Linux, macOS, or Windows

## ??️ Installation

### Linux/VPS:
```bash
# Clone repository
git clone https://github.com/systemaudit/google-2fa-apppassword.git
cd google-2fa-apppassword

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
npx playwright install-deps chromium

# Create .env file
cp .env.example .env
nano .env  # Edit with your credentials
