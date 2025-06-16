const logger = require('./logger');

const helpers = {
  // Smart delay with randomization
  delay: (ms) => {
    const randomized = ms + Math.random() * ms * 0.3;
    return new Promise(resolve => setTimeout(resolve, randomized));
  },

  // Type text with human-like delays
  async typeHuman(page, selector, text) {
    await page.focus(selector);
    await page.evaluate(el => el.value = '', await page.$(selector));
    
    for (const char of text) {
      await page.type(selector, char);
      await helpers.delay(50 + Math.random() * 100);
    }
  },

  // Validate TOTP secret key - UPDATED to accept lowercase
  isValidTOTPKey(text) {
    if (!text || text.length < 16) return false;
    
    const cleaned = text.replace(/\s/g, '').toUpperCase();
    
    // Check blacklist
    const blacklist = [
      'GOOGLEAUTHENTICATOR', 'AUTHENTICATOR', 'SETUP', 'SCAN',
      'CLICK', 'BUTTON', 'NEXT', 'VERIFY', 'CODE', 'ENTER',
      'PRIVACY', 'TERMS', 'HELP', 'ABOUT' // Added new blacklist
    ];
    
    if (blacklist.some(word => cleaned.includes(word))) {
      return false;
    }
    
    // Check if it's base32 - UPDATED to accept numbers
    if (!/^[A-Z2-7\s]+$/.test(text.toUpperCase())) {
      return false;
    }
    
    // Check format (4 groups of 4 chars) - Case insensitive
    const spacedFormat = /^([A-Za-z0-9]{4}\s+){3,7}[A-Za-z0-9]{4}$/;
    if (spacedFormat.test(text)) {
      return true;
    }
    
    // Check continuous format
    const cleanedOriginal = text.replace(/\s/g, '');
    if (cleanedOriginal.length >= 16 && cleanedOriginal.length <= 64) {
      // Additional check for base32 validity
      if (/^[A-Za-z2-7]+$/i.test(cleanedOriginal)) {
        return true;
      }
    }
    
    return false;
  },

  // Validate app password
  isValidAppPassword(text) {
    if (!text || text.length < 12) return false;
    
    const pattern = /^[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}$/;
    return pattern.test(text.toLowerCase().trim());
  },

  // Extract account index from URL
  getAccountIndex(url) {
    const match = url.match(/\/u\/(\d+)\//);
    return match ? `/u/${match[1]}` : '/u/0';
  }
};

module.exports = helpers;
