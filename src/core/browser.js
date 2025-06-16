const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const config = require('../config/settings');

chromium.use(stealth());

class BrowserManager {
  async launch() {
    try {
      this.browser = await chromium.launch({
        headless: config.browser.headless,
        args: config.browser.args
      });
      
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Speed optimizations
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        // Disable all permissions
        permissions: []
      });
      
      this.page = await this.context.newPage();
      
      // Aggressive resource blocking
      await this.page.route('**/*', route => {
        const url = route.request().url();
        const resourceType = route.request().resourceType();
        
        // Block more resources
        if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
          route.abort();
        } 
        // Block tracking/analytics
        else if (url.includes('google-analytics') || 
                 url.includes('googletagmanager') || 
                 url.includes('doubleclick') ||
                 url.includes('facebook') ||
                 url.includes('twitter')) {
          route.abort();
        } 
        else {
          route.continue();
        }
      });
      
      // Set faster default navigation timeout
      this.page.setDefaultNavigationTimeout(config.timeouts.navigation);
      this.page.setDefaultTimeout(config.timeouts.implicit);
      
      return this.page;
      
    } catch (error) {
      throw error;
    }
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = BrowserManager;
