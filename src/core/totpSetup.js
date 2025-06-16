const config = require('../config/settings');
const logger = require('../utils/logger');
const totpGenerator = require('../utils/totp');
const { delay, isValidTOTPKey, getAccountIndex } = require('../utils/helpers');

class TOTPSetup {
  constructor(page) {
    this.page = page;
  }
  
  async navigateTo2FA() {
    try {
      const accountIndex = getAccountIndex(this.page.url());
      const twoFAUrl = `https://myaccount.google.com${accountIndex}/two-step-verification/authenticator`;
      
      await this.page.goto(twoFAUrl, {
        waitUntil: 'networkidle',
        timeout: config.timeouts.navigation
      });
      
      await delay(1500);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('authenticator') || currentUrl.includes('two-step-verification')) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }
  
  async setupAuthenticator() {
    try {
      await delay(1500);
      
      const setupSelectors = [
        'button:has-text("Set up authenticator")',
        'button:has-text("Set up")',
        'button:has-text("Get started")',
        'button:has-text("Add authenticator")'
      ];
      
      let setupClicked = false;
      for (const selector of setupSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            if (await element.isVisible()) {
              const text = await element.textContent() || '';
              if (!text.match(/back|cancel/i)) {
                await element.click();
                setupClicked = true;
                await delay(2000);
                break;
              }
            }
          }
          if (setupClicked) break;
        } catch (e) {
          continue;
        }
      }
      
      await delay(1500);
      const pageContent = await this.page.evaluate(() => document.body.innerText);
      
      if (pageContent.includes('scan') || pageContent.includes('QR') || pageContent.includes("can't scan")) {
        const cantScanSelectors = [
          'text=/can.*t scan/i',
          'text=/unable to scan/i',
          'text=/enter.*manually/i',
          'a:has-text("Can\'t scan")',
          'button:has-text("Can\'t scan")'
        ];
        
        for (const selector of cantScanSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element && await element.isVisible()) {
              await element.click();
              await delay(2000);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      const secretKey = await this.extractSecretKey();
      if (!secretKey) {
        return '';
      }
      
      const nextClicked = await this.clickNextInModal();
      if (!nextClicked) {
        await this.page.keyboard.press('Enter');
        await delay(1000);
      }
      
      await delay(2000);
      
      const totpCode = await totpGenerator.generateFromAPI(secretKey);
      if (!totpCode) {
        return secretKey;
      }
      
      const verified = await this.verifyTOTP(totpCode);
      if (!verified) {
        await delay(1000);
        const newCode = await totpGenerator.generateFromAPI(secretKey);
        if (newCode && newCode !== totpCode) {
          await this.verifyTOTP(newCode);
        }
      }
      
      return secretKey;
      
    } catch (error) {
      return '';
    }
  }
  
  async clickNextInModal() {
    try {
      const nextSelectors = [
        'div[role="dialog"] button:has-text("Next")',
        'button:visible:has-text("Next")',
        'button:has-text("Next")'
      ];
      
      for (const selector of nextSelectors) {
        try {
          const buttons = await this.page.$$(selector);
          for (const button of buttons) {
            if (await button.isVisible()) {
              const text = await button.textContent() || '';
              if (text.trim().toLowerCase() === 'next') {
                await button.click();
                return true;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }
  
  async extractSecretKey() {
    try {
      const pageText = await this.page.evaluate(() => document.body.innerText);
      
      const patterns = [
        /\b([a-z0-9]{4}\s+[a-z0-9]{4}\s+[a-z0-9]{4}\s+[a-z0-9]{4}(?:\s+[a-z0-9]{4}\s+[a-z0-9]{4}\s+[a-z0-9]{4}\s+[a-z0-9]{4})?)\b/gi
      ];
      
      for (const pattern of patterns) {
        const matches = pageText.matchAll(pattern);
        for (const match of matches) {
          const key = match[1].trim();
          const normalizedKey = key.replace(/-/g, ' ');
          
          if (isValidTOTPKey(normalizedKey)) {
            return normalizedKey;
          }
        }
      }
      
      return '';
      
    } catch (error) {
      return '';
    }
  }
  
  async verifyTOTP(code) {
    try {
      await delay(1000);
      
      const inputSelectors = [
        'input[aria-label*="code"]',
        'input[type="tel"]',
        'input[type="text"]:not([type="password"])',
        'input:visible'
      ];
      
      let inputFound = false;
      for (const selector of inputSelectors) {
        const inputs = await this.page.$$(selector);
        for (const input of inputs) {
          if (await input.isVisible() && await input.isEnabled()) {
            const value = await input.inputValue();
            const type = await input.getAttribute('type');
            
            if (!value && type !== 'hidden') {
              await input.fill(code);
              inputFound = true;
              break;
            }
          }
        }
        if (inputFound) break;
      }
      
      if (!inputFound) {
        return false;
      }
      
      await delay(500);
      
      const verifySelectors = [
        'button:has-text("Verify")',
        'button:has-text("Submit")',
        'button[type="submit"]'
      ];
      
      for (const selector of verifySelectors) {
        try {
          const buttons = await this.page.$$(selector);
          for (const button of buttons) {
            if (await button.isVisible()) {
              const text = await button.textContent() || '';
              if (!text.match(/back|cancel|close/i)) {
                await button.click();
                await delay(2000);
                return true;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }
  
  async activate2FA() {
    try {
      const accountIndex = getAccountIndex(this.page.url());
      const activationUrl = `https://myaccount.google.com${accountIndex}/signinoptions/twosv`;
      
      await this.page.goto(activationUrl, {
        waitUntil: 'networkidle'
      });
      
      await delay(2000);
      
      const pageContent = await this.page.content();
      const pageText = await this.page.evaluate(() => document.body.innerText);
      
      if (pageContent.toLowerCase().includes('is on') || 
          pageText.toLowerCase().includes('2-step verification is on')) {
        return true;
      }
      
      const activateSelectors = [
        'button:has-text("Turn on 2-Step Verification")',
        'button:has-text("Turn on")'
      ];
      
      for (const selector of activateSelectors) {
        try {
          const buttons = await this.page.$$(selector);
          for (const button of buttons) {
            if (await button.isVisible()) {
              await button.click();
              await delay(2000);
              
              const confirmButton = await this.page.$('button:has-text("Turn on"):last-of-type');
              if (confirmButton && await confirmButton.isVisible()) {
                await confirmButton.click();
                await delay(2000);
              }
              
              return true;
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }
}

module.exports = TOTPSetup;
