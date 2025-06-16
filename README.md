# Google 2FA App Password Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.40.0-45ba4b)](https://playwright.dev/)

Automated Google 2FA and App Password Generator using Playwright - A powerful automation tool for setting up Google two-factor authentication and generating app-specific passwords.

## ✨ Features

- 🔐 **Automated Google account 2FA setup** - Streamline the process of enabling 2FA
- 📊 **Bulk processing support** - Process multiple accounts from CSV files
- 🔑 **App password generation** - Automatically create app-specific passwords
- 🎯 **TOTP secret extraction** - Extract and save authenticator secret keys
- 📁 **CSV input/output support** - Easy data management with CSV format
- ⚡ **Concurrent processing** - Process multiple accounts simultaneously
- 📝 **Detailed logging** - Comprehensive logs for debugging and monitoring

## 📋 Requirements

- **Node.js** 16+ and npm
- **Operating System**: Linux, macOS, or Windows
- **Network**: Stable internet connection
- **Google Account**: Valid credentials with 2FA not yet enabled

## 🚀 Installation

### 🐧 Linux/VPS

#### One-line Installation
```bash
curl -O https://raw.githubusercontent.com/systemaudit/google-2fa-apppassword/main/install.sh && bash install.sh
```

#### Manual Installation
```bash
# Clone repository
git clone https://github.com/systemaudit/google-2fa-apppassword.git
cd google-2fa-apppassword

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Create required directories
mkdir -p logs output

# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

### 🪟 Windows

#### PowerShell Installation (Recommended)
```powershell
# Download and run installer
certutil -urlcache -f -split https://raw.githubusercontent.com/systemaudit/google-2fa-apppassword/main/install.ps1 install.ps1
powershell -ExecutionPolicy Bypass -File install.ps1
```

#### Batch File Installation
```cmd
# Download installer
certutil -urlcache -f -split https://raw.githubusercontent.com/systemaudit/google-2fa-apppassword/main/install.bat install.bat

# Run installer
install.bat
```

#### Manual Installation
```cmd
# Clone repository
git clone https://github.com/systemaudit/google-2fa-apppassword.git
cd google-2fa-apppassword

# Install dependencies
npm install

# Install Playwright
npx playwright install chromium

# Create directories
mkdir logs output

# Copy environment file
copy .env.example .env

# Edit configuration
notepad .env
```

## 🐳 Docker

```bash
# Build image
docker build -t google-2fa-generator .

# Run container
docker run -v $(pwd)/output:/app/output google-2fa-generator

# With custom environment
docker run -v $(pwd)/output:/app/output -v $(pwd)/.env:/app/.env:ro google-2fa-generator
```

### Docker Compose
```bash
# Start service
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# Browser Settings
HEADLESS=true
DEBUG_MODE=false

# Timeouts (ms)
NAVIGATION_TIMEOUT=20000
IMPLICIT_TIMEOUT=8000
VERIFICATION_TIMEOUT=10000

# Processing
BATCH_SIZE=3
BATCH_DELAY=5000

# TOTP API
TOTP_API_URL=https://2fa.live/tok

# Output
OUTPUT_FORMAT=csv
OUTPUT_PATH=output/results.csv
```

## 📖 Usage

### Interactive Mode
```bash
npm start
```

Follow the interactive menu:
1. **Single account** - Process one account
2. **Bulk (CSV)** - Process multiple accounts from CSV file
3. **Exit** - Close the application

### Single Account Processing
When selecting single account mode, you'll be prompted to enter:
- Email address
- Password

### Bulk Processing
Prepare a CSV file with the following format:
```csv
email,password
user1@gmail.com,password123
user2@gmail.com,password456
```

Then select bulk mode and provide the CSV file path.

### Command Line Usage
```bash
# Process single account
node src/index.js --email user@gmail.com --password yourpassword

# Process from CSV
node src/index.js --csv accounts.csv

# With custom output
node src/index.js --csv accounts.csv --output results.txt
```

## 📊 Output Format

### Successful Processing
```
email@gmail.com | abcd efgh ijkl mnop | SECRETKEY123456
```

Format: `email | app_password | totp_secret`

### Output Files
- `output/results_{timestamp}.txt` - Successful accounts
- `output/partial_{timestamp}.txt` - Partially processed accounts
- `output/failed_{timestamp}.csv` - Failed accounts (for retry)

## 🛠️ Advanced Configuration

### Proxy Support
```env
# HTTP Proxy
HTTP_PROXY=http://proxy.server:8080

# SOCKS Proxy
SOCKS_PROXY=socks5://proxy.server:1080
```

### Custom User Agent
```env
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

### Performance Tuning
```env
# Increase for slower connections
NAVIGATION_TIMEOUT=30000
IMPLICIT_TIMEOUT=15000

# Decrease for faster processing (may cause failures)
BATCH_SIZE=5
BATCH_DELAY=2000
```

## 🔍 Troubleshooting

### Common Issues

#### Login Failures
- Verify credentials are correct
- Check if account has unusual activity protection
- Try reducing batch size
- Enable debug mode for detailed logs

#### 2FA Setup Failures
- Ensure 2FA is not already enabled
- Check network stability
- Increase timeout values
- Try single account mode first

#### App Password Generation Failures
- Verify 2FA was activated successfully
- Check if account has app password limits
- Wait longer between operations

### Debug Mode
Enable debug mode for detailed logging:
```env
DEBUG_MODE=true
DEBUG_SCREENSHOTS=true
```

### Logs Location
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Screenshots: `logs/screenshots/` (when enabled)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and legitimate purposes only. Users are responsible for complying with Google's Terms of Service and applicable laws. The authors are not responsible for any misuse or damage caused by this tool.

## 🙏 Acknowledgments

- Created by [@systemaudit](https://github.com/systemaudit)
- Special thanks to Ulul Azmi for contributions
- Built with [Playwright](https://playwright.dev/)
- TOTP implementation using [Speakeasy](https://github.com/speakeasyjs/speakeasy)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/systemaudit/google-2fa-apppassword/issues)
- **Discussions**: [GitHub Discussions](https://github.com/systemaudit/google-2fa-apppassword/discussions)

---

**Note**: Always ensure you have proper authorization before automating any Google account operations. This tool should only be used on accounts you own or have explicit permission to manage.
