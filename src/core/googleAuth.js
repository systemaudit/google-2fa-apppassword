const config = require('../config/settings');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

class GoogleAuth {
  constructor(page) {
    this.page = page;
  }
  
  async login(email, password) {
    try {
      await this.page.goto('https://accounts.google.com/signin', {
        waitUntil: 'domcontentloaded',
        timeout: config.timeouts.navigation
      });
      
      await helpers.delay(1000);
      
      await this.page.waitForSelector('#identifierId', { timeout: config.timeouts.implicit });
      await this.page.fill('#identifierId', email);
      await helpers.delay(config.delays.betweenActions);
      
      await this.page.click('#identifierNext');
      
      await this.page.waitForSelector('input[type="password"]', { 
        timeout: config.timeouts.implicit * 2 
      });
      
      await helpers.delay(1000);
      
      await this.page.fill('input[type="password"]', password);
      await helpers.delay(config.delays.betweenActions);
      
      await this.page.click('#passwordNext');
      await helpers.delay(config.delays.afterLogin);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('myaccount.google.com')) {
        return true;
      }
      
      if (currentUrl.includes('speedbump') || currentUrl.includes('challenge') || currentUrl.includes('gaplustos')) {
        const handled = await this.handleChallenge();
        if (!handled) {
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }
  
  async handleChallenge() {
    try {
      await helpers.delay(2000);
      
      const proceedSelectors = [
        'button:has-text("I agree")',
        'button:has-text("Accept")',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button:has-text("Get started")',
        'button:has-text("Skip")',
        'button:has-text("Not now")',
        'button:has-text("Remind me later")',
        'button:has-text("Weiter")',
        'button:has-text("Akzeptieren")',
        'input[value="Verstanden"]',
        'button[type="submit"]',
        'input[type="submit"]',
        'a:has-text("Skip")',
        'a:has-text("Continue")',
        'a:has-text("Not now")'
      ];
      
      for (const selector of proceedSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            if (await element.isVisible()) {
              await element.click();
              await helpers.delay(3000);
              
              const newUrl = this.page.url();
              if (!newUrl.includes('speedbump') && !newUrl.includes('gaplustos')) {
                return true;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      const allButtons = await this.page.$$('button');
      for (const button of allButtons) {
        if (await button.isVisible()) {
          const text = await button.textContent() || '';
          if (text && !text.toLowerCase().includes('back')) {
            await button.click();
            await helpers.delay(3000);
            
            const newUrl = this.page.url();
            if (!newUrl.includes('speedbump') && !newUrl.includes('gaplustos')) {
              return true;
            }
          }
        }
      }
      
      return true;
      
    } catch (error) {
      return true;
    }
  }
}

module.exports = GoogleAuth;
