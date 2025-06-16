#!/bin/bash

# Google 2FA App Password Generator Installer
# Author: @systemaudit

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "=========================================="
echo " Google 2FA App Password Generator"
echo " Installer for Linux/VPS"
echo "=========================================="
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo "Please install Node.js first:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Clone repository
INSTALL_DIR="$HOME/google-2fa-apppassword"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd "$INSTALL_DIR"
    git pull
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/systemaudit/google-2fa-apppassword.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Install Playwright
echo -e "${YELLOW}Installing Playwright...${NC}"
npx playwright install chromium
sudo npx playwright install-deps chromium 2>/dev/null || npx playwright install-deps chromium

# Create directories
mkdir -p logs output

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Created .env file. Please edit it!${NC}"
fi

echo -e "${GREEN}"
echo "=========================================="
echo " Installation Complete!"
echo "=========================================="
echo -e "${NC}"
echo "Location: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo "1. Edit .env: nano $INSTALL_DIR/.env"
echo "2. Run: cd $INSTALL_DIR && npm start"
