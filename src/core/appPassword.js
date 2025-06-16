const config = require('../config/settings');
const logger = require('../utils/logger');
const { delay, isValidAppPassword, getAccountIndex } = require('../utils/helpers');

class AppPassword {
  constructor(page) {
    this.page = page;
  }
  
  async generate(appName) {
    try {
      // Wait lebih lama setelah 2FA activation
      await delay(3000);
      
      const accountIndex = getAccountIndex(this.page.url());
      const appPasswordUrl = `https://myaccount.google.com${accountIndex}/apppasswords`;
      
      await this.page.goto(appPasswordUrl, {
        waitUntil: 'networkidle',  // Wait until network idle
        timeout: config.timeouts.navigation
      });
      
      await delay(2000);
      
      // Check if 2FA is really active
      const pageText = await this.page.evaluate(() => document.body.innerText);
      
      if (pageText.toLowerCase().includes('turn on') || 
          pageText.toLowerCase().includes('2-step verification') ||
          pageText.toLowerCase().includes('not available')) {
        
        // Try to complete 2FA activation if needed
        const turnOnButtons = await this.page.$$('button:has-text("Turn on")');
        for (const button of turnOnButtons) {
          if (await button.isVisible()) {
            await button.click();
            await delay(2000);
            
            // Navigate back to app passwords
            await this.page.goto(appPasswordUrl, {
              waitUntil: 'networkidle'
            });
            await delay(2000);
            break;
          }
        }
        
        // Re-check page content
        const newPageText = await this.page.evaluate(() => document.body.innerText);
        if (newPageText.toLowerCase().includes('not available')) {
          // 2FA might not be fully activated yet
          return '';
        }
      }
      
      // Find app name input with retry
      let appNameInput = null;
      let retries = 3;
      
      while (!appNameInput && retries > 0) {
        const inputSelectors = [
          'input[type="text"]:not([disabled])',
          'input[aria-label*="app"]',
          'input#app-name',
          'input[name="appName"]'
        ];
        
        for (const selector of inputSelectors) {
          const inputs = await this.page.$$(selector);
          
          for (const input of inputs) {
            if (await input.isVisible() && await input.isEnabled()) {
              const value = await input.inputValue();
              
              if (!value || value.length === 0) {
                appNameInput = input;
                break;
              }
            }
          }
          if (appNameInput) break;
        }
        
        if (!appNameInput) {
          await delay(1000);
          retries--;
        }
      }
      
      if (!appNameInput) {
        // Last resort - find any text input
        const visibleInputs = await this.page.$$('input[type="text"]:visible');
        if (visibleInputs.length > 0) {
          appNameInput = visibleInputs[0];
        } else {
          return '';
        }
      }
      
      await appNameInput.fill(appName);
      await delay(800);
      
      // Find and click Create button
      const createSelectors = [
        'button:has-text("Create")',
        'button:visible:has-text("Create")',
        'input[type="submit"][value="Create"]'
      ];
      
      let createButton = null;
      for (const selector of createSelectors) {
        const buttons = await this.page.$$(selector);
        
        for (const button of buttons) {
          if (await button.isVisible() && await button.isEnabled()) {
            const text = await button.textContent() || await button.getAttribute('value') || '';
            if (text.toLowerCase().includes('create')) {
              createButton = button;
              break;
            }
          }
        }
        if (createButton) break;
      }
      
      if (!createButton) {
        return '';
      }
      
      await createButton.click();
      
      // Wait longer for password modal
      await delay(4000);
      
      // Try multiple times to extract password
      let password = '';
      let extractRetries = 3;
      
      while (!password && extractRetries > 0) {
        password = await this.extractAppPassword();
        if (!password) {
          await delay(1000);
          extractRetries--;
        }
      }
      
      if (password) {
        // Try to close modal
        try {
          const doneButton = await this.page.$('button:has-text("Done")');
          if (doneButton && await doneButton.isVisible()) {
            await doneButton.click();
          }
        } catch (e) {
          // Continue even if can't close
        }
        
        return password;
      }
      
      return '';
      
    } catch (error) {
      logger.error(`App password error: ${error.message}`);
      return '';
    }
  }
  
  async extractAppPassword() {
    try {
      // Wait for modal to fully load
      await delay(1000);
      
      // Try to wait for modal dialog
      try {
        await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      } catch (e) {
        // Continue anyway
      }
      
      const pageText = await this.page.evaluate(() => document.body.innerText);
      
      // Look for password pattern
      const patterns = [
        /\b([a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4})\b/gi,
        /([a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4})/gi
      ];
      
      for (const pattern of patterns) {
        const matches = pageText.matchAll(pattern);
        for (const match of matches) {
          const candidate = match[1].toLowerCase().trim();
          
          if (isValidAppPassword(candidate)) {
            return candidate;
          }
        }
      }
      
      // Try specific selectors
      const passwordSelectors = [
        '[role="dialog"] .notranslate',
        '[role="dialog"] code',
        '.notranslate',
        'code'
      ];
      
      for (const selector of passwordSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.match(/[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}/i)) {
              const normalized = text.toLowerCase().trim();
              if (isValidAppPassword(normalized)) {
                return normalized;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return '';
      
    } catch (error) {
      return '';
    }
  }
}

module.exports = AppPassword;
