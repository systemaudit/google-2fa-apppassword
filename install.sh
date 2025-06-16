#!/bin/bash

# Google 2FA App Password Generator Installer
# Author: @systemaudit
# Updated with automatic Node.js installation and better error handling

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        echo -e "${YELLOW}Running as root${NC}"
        SUDO=""
    else
        echo -e "${YELLOW}Running as regular user${NC}"
        SUDO="sudo"
    fi
}

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

# Check root
check_root

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
$SUDO apt update -y 2>&1 | grep -E "packages|upgraded|newly" || echo -e "${GREEN}✓ Package list updated${NC}"

# Install essential packages
echo -e "${YELLOW}Installing essential packages...${NC}"
PACKAGES="curl git wget ca-certificates gnupg"
for pkg in $PACKAGES; do
    if ! command -v $pkg &> /dev/null; then
        echo -e "  Installing $pkg..."
        $SUDO apt install -y $pkg 2>&1 | tail -n 1
    fi
done
echo -e "${GREEN}✓ Essential packages installed${NC}"

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
    echo -e "  Removing old Node.js..."
    $SUDO apt remove -y nodejs npm 2>/dev/null || true
    $SUDO apt autoremove -y 2>/dev/null || true
    
    # Install Node.js from NodeSource
    echo -e "  Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x -o nodesource_setup.sh
    $SUDO bash nodesource_setup.sh
    rm nodesource_setup.sh
    
    echo -e "  Installing Node.js..."
    $SUDO apt install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js $(node -v) installed successfully${NC}"
        echo -e "${GREEN}✓ npm $(npm -v) installed successfully${NC}"
    else
        echo -e "${RED}Failed to install Node.js.${NC}"
        exit 1
    fi
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found. Installing...${NC}"
    $SUDO apt install -y npm
fi

# Clone or update repository
echo -e "${YELLOW}Setting up Google 2FA App Password Generator...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd "$INSTALL_DIR"
    git reset --hard HEAD
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/systemaudit/google-2fa-apppassword.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# Install Playwright and its dependencies
echo -e "${YELLOW}Installing Playwright...${NC}"
npx playwright install chromium

echo -e "${YELLOW}Installing system dependencies for Chromium...${NC}"
$SUDO npx playwright install-deps chromium || npx playwright install-deps chromium

# Create required directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs output

# Setup environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOF'
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
