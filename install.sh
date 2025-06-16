#!/bin/bash

# Google 2FA App Password Generator Installer
# Author: @systemaudit
# Updated with automatic Node.js installation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
INSTALL_DIR="$HOME/google-2fa-apppassword"
NODE_VERSION="18"
MIN_NODE_VERSION="16"

# Banner
clear
echo -e "${GREEN}"
echo "=========================================="
echo " Google 2FA App Password Generator"
echo " Auto Installer for Linux/VPS"
echo "=========================================="
echo -e "${NC}"

# Function to compare versions
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS. Exiting...${NC}"
    exit 1
fi

echo -e "${BLUE}Detected OS: $OS $OS_VERSION${NC}"

# Update package list
echo -e "${YELLOW}Updating package list...${NC}"
sudo apt update -y >/dev/null 2>&1 || apt update -y >/dev/null 2>&1

# Install essential packages
echo -e "${YELLOW}Installing essential packages...${NC}"
if command -v sudo &> /dev/null; then
    sudo apt install -y curl git wget >/dev/null 2>&1
else
    apt install -y curl git wget >/dev/null 2>&1
fi

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo -e "${BLUE}Current Node.js version: v$(node -v | cut -d'v' -f2)${NC}"
    
    version_compare $CURRENT_NODE_VERSION $MIN_NODE_VERSION
    if [ $? -eq 2 ]; then
        echo -e "${YELLOW}Node.js version is too old. Installing Node.js $NODE_VERSION...${NC}"
        INSTALL_NODE=true
    else
        echo -e "${GREEN}✓ Node.js version is compatible${NC}"
        INSTALL_NODE=false
    fi
else
    echo -e "${YELLOW}Node.js not found. Installing Node.js $NODE_VERSION...${NC}"
    INSTALL_NODE=true
fi

# Install Node.js if needed
if [ "$INSTALL_NODE" = true ]; then
    echo -e "${YELLOW}Installing Node.js $NODE_VERSION...${NC}"
    
    # Remove old Node.js
    if command -v sudo &> /dev/null; then
        sudo apt remove -y nodejs npm >/dev/null 2>&1 || true
    else
        apt remove -y nodejs npm >/dev/null 2>&1 || true
    fi
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - >/dev/null 2>&1 || \
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
    
    if command -v sudo &> /dev/null; then
        sudo apt install -y nodejs >/dev/null 2>&1
    else
        apt install -y nodejs >/dev/null 2>&1
    fi
    
    # Verify installation
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js $(node -v) installed successfully${NC}"
        echo -e "${GREEN}✓ npm $(npm -v) installed successfully${NC}"
    else
        echo -e "${RED}Failed to install Node.js. Trying alternative method...${NC}"
        
        # Alternative: Install using NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
        nvm alias default $NODE_VERSION
    fi
fi

# Clone or update repository
echo -e "${YELLOW}Setting up Google 2FA App Password Generator...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd "$INSTALL_DIR"
    git reset --hard HEAD >/dev/null 2>&1
    git pull origin main >/dev/null 2>&1 || git pull origin master >/dev/null 2>&1
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/systemaudit/google-2fa-apppassword.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install >/dev/null 2>&1

# Install Playwright and its dependencies
echo -e "${YELLOW}Installing Playwright...${NC}"
npx playwright install chromium >/dev/null 2>&1

echo -e "${YELLOW}Installing system dependencies for Chromium...${NC}"
if command -v sudo &> /dev/null; then
    sudo npx playwright install-deps chromium >/dev/null 2>&1 || npx playwright install-deps chromium >/dev/null 2>&1
else
    npx playwright install-deps chromium >/dev/null 2>&1
fi

# Create required directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs output

# Setup environment file
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || {
        echo -e "${YELLOW}Creating .env file...${NC}"
        cat > .env << EOF
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
EOF
    }
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Create start script
echo -e "${YELLOW}Creating start script...${NC}"
cat > "$INSTALL_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
npm start
EOF
chmod +x "$INSTALL_DIR/start.sh"

# Add to PATH (optional)
if ! grep -q "google-2fa-apppassword" ~/.bashrc; then
    echo -e "${YELLOW}Adding to PATH...${NC}"
    echo "alias google2fa='cd $INSTALL_DIR && npm start'" >> ~/.bashrc
    echo -e "${GREEN}✓ Added 'google2fa' command${NC}"
fi

# Success message
echo -e "${GREEN}"
echo "=========================================="
echo " Installation Complete!"
echo "=========================================="
echo -e "${NC}"
echo -e "${BLUE}Installation Directory:${NC} $INSTALL_DIR"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "1. ${YELLOW}Edit configuration (optional):${NC}"
echo -e "   nano $INSTALL_DIR/.env"
echo ""
echo -e "2. ${YELLOW}Run the application:${NC}"
echo -e "   ${GREEN}Option A:${NC} cd $INSTALL_DIR && npm start"
echo -e "   ${GREEN}Option B:${NC} $INSTALL_DIR/start.sh"
echo -e "   ${GREEN}Option C:${NC} google2fa ${BLUE}(after reloading shell)${NC}"
echo ""
echo -e "3. ${YELLOW}Reload shell for alias:${NC}"
echo -e "   source ~/.bashrc"
echo ""

# Ask if user wants to start now
echo -e "${YELLOW}Do you want to start the application now? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Starting Google 2FA App Password Generator...${NC}"
    cd "$INSTALL_DIR"
    npm start
else
    echo -e "${BLUE}You can start the application later using:${NC}"
    echo -e "cd $INSTALL_DIR && npm start"
fi
