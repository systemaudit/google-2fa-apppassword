/*
 * Google 2FA + App Password Generator
 * By @xsystemaudit
 * Thanks to Ulul Azmi
 * 
 * Note untuk developer:
 * - Jangan Ganti Copyright untuk menghargai kreator
 * - Hargai Orang lain jika anda ingin dihargai
 */

const BrowserManager = require('./core/browser');
const GoogleAuth = require('./core/googleAuth');
const TOTPSetup = require('./core/totpSetup');
const AppPassword = require('./core/appPassword');
const BulkProcessor = require('./core/bulkProcessor');
const logger = require('./utils/logger');
const { delay } = require('./utils/helpers');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

class Google2FABot {
  constructor() {
    this.results = [];
  }
  
  async processAccount(email, password, appName = '@xsystemaudit') {
    const startTime = Date.now();
    const browserManager = new BrowserManager();
    
    const result = {
      email,
      secretKey: '',
      totpCode: '',
      appPassword: '',
      status: 'failed',
      time: 0,
      message: '',
      twoFAActive: false,
      appPasswordCreated: false
    };
    
    try {
      console.log(`\n[${new Date().toLocaleTimeString()}] Processing ${email}...`);
      
      const page = await browserManager.launch();
      
      const auth = new GoogleAuth(page);
      const totp = new TOTPSetup(page);
      const appPwd = new AppPassword(page);
      
      console.log('→ Logging in...');
      const loginSuccess = await auth.login(email, password);
      if (!loginSuccess) {
        throw new Error('Login failed');
      }
      
      console.log('→ Setting up 2FA...');
      const nav2FASuccess = await totp.navigateTo2FA();
      if (!nav2FASuccess) {
        throw new Error('Failed to navigate to 2FA page');
      }
      
      console.log('→ Configuring authenticator...');
      const secretKey = await totp.setupAuthenticator();
      if (!secretKey) {
        throw new Error('Failed to setup authenticator');
      }
      result.secretKey = secretKey;
      
      console.log('→ Activating 2FA...');
      const activateSuccess = await totp.activate2FA();
      if (activateSuccess) {
        result.twoFAActive = true;
      }
      
      console.log('→ Generating app password...');
      const appPassword = await appPwd.generate(appName);
      if (appPassword) {
        result.appPassword = appPassword;
        result.appPasswordCreated = true;
      }
      
      if (result.twoFAActive && result.appPasswordCreated) {
        result.status = 'complete';
        result.message = 'Success';
        console.log(chalk.green('✓ Complete'));
      } else if (result.secretKey && result.twoFAActive) {
        result.status = 'partial';
        result.message = '2FA active, app password failed';
        console.log(chalk.yellow('⚠ Partial - 2FA OK, App Password failed'));
      } else if (result.secretKey) {
        result.status = 'partial';
        result.message = 'Authenticator setup, activation failed';
        console.log(chalk.yellow('⚠ Partial - Secret key OK'));
      } else {
        result.status = 'failed';
        result.message = 'Setup failed';
        console.log(chalk.red('✗ Failed'));
      }
      
    } catch (error) {
      result.message = error.message;
      console.log(chalk.red(`✗ Failed: ${error.message}`));
    } finally {
      await browserManager.close();
      result.time = ((Date.now() - startTime) / 1000).toFixed(2);
      this.results.push(result);
    }
    
    return result;
  }
  
  displayResult(result) {
    console.log('\n' + '─'.repeat(70));
    
    if (result.status === 'complete') {
      console.log(chalk.green('STATUS: SUCCESS'));
      console.log(`Time: ${result.time}s`);
      console.log('\nOutput:');
      console.log(chalk.cyan(`${result.email} | ${result.appPassword} | ${result.secretKey}`));
      
      this.saveResult(`${result.email} | ${result.appPassword} | ${result.secretKey}`);
      
    } else if (result.status === 'partial' && result.secretKey) {
      console.log(chalk.yellow('STATUS: PARTIAL SUCCESS'));
      console.log(`Time: ${result.time}s`);
      console.log('\nData retrieved:');
      console.log(`Email: ${result.email}`);
      console.log(`Secret Key: ${result.secretKey}`);
      console.log(`2FA Active: ${result.twoFAActive ? 'Yes' : 'No'}`);
      console.log(`App Password: ${result.appPassword || 'Not generated'}`);
      console.log(chalk.yellow(`\nNote: ${result.message}`));
      
      // Save partial result
      if (result.secretKey) {
        this.saveResult(`${result.email} | PARTIAL | ${result.secretKey}`);
      }
      
    } else {
      console.log(chalk.red('STATUS: FAILED'));
      console.log(`Error: ${result.message}`);
    }
    
    console.log('─'.repeat(70));
  }
  
  async saveResult(output) {
    try {
      const outputPath = path.join('output', 'results.txt');
      await fs.appendFile(outputPath, output + '\n');
    } catch (error) {
      // Silent error
    }
  }
  
  async promptUser() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise(resolve => rl.question(query, resolve));
    
    const email = await question('Email: ');
    const password = await question('Password: ');
    
    rl.close();
    
    return { email, password };
  }
  
  async promptCSVFile() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise(resolve => rl.question(query, resolve));
    
    console.log('\nCSV Format: email,password');
    const filePath = await question('CSV file path: ');
    
    rl.close();
    
    return filePath.trim();
  }
  
  async run() {
    console.clear();
    console.log('═'.repeat(50));
    console.log('  Google 2FA + App Password Generator');
    console.log('  By @xsystemaudit | Thanks to Ulul Azmi');
    console.log('═'.repeat(50));
    
    await fs.mkdir('output', { recursive: true });
    await fs.mkdir('logs', { recursive: true });
    
    while (true) {
      console.log('\n1. Single account');
      console.log('2. Bulk (CSV)');
      console.log('3. Exit');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const choice = await new Promise(resolve => {
        rl.question('\nChoice: ', resolve);
      });
      rl.close();
      
      if (choice === '1') {
        const { email, password } = await this.promptUser();
        const result = await this.processAccount(email, password);
        this.displayResult(result);
        
      } else if (choice === '2') {
        const csvPath = await this.promptCSVFile();
        const bulkProcessor = new BulkProcessor();
        
        try {
          await bulkProcessor.loadCSV(csvPath);
          await bulkProcessor.processAll(this);
        } catch (error) {
          console.log(chalk.red(`Error: ${error.message}`));
        }
        
      } else if (choice === '3') {
        console.log('\nGoodbye!\n');
        break;
      }
      
      const continueRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const continueChoice = await new Promise(resolve => {
        continueRl.question('\nPress Enter to continue or q to quit: ', resolve);
      });
      continueRl.close();
      
      if (continueChoice.toLowerCase() === 'q') {
        break;
      }
    }
  }
}

(async () => {
  const bot = new Google2FABot();
  try {
    await bot.run();
  } catch (error) {
    process.exit(1);
  }
})();

module.exports = Google2FABot;
