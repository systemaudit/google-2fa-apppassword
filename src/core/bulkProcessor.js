const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const chalk = require('chalk');
const logger = require('../utils/logger');
const { delay } = require('../utils/helpers');
const config = require('../config/settings');

class BulkProcessor {
  constructor() {
    this.accounts = [];
    this.results = [];
    this.batchSize = 3;  // Reduced from 5
    this.batchDelay = 5000;  // Increased from 3000
  }
  
  async loadCSV(filePath) {
    return new Promise((resolve, reject) => {
      const accounts = [];
      
      if (!fs.existsSync(filePath)) {
        reject(new Error('CSV file not found'));
        return;
      }
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const email = row.email || row.Email || row.EMAIL;
          const password = row.password || row.Password || row.PASSWORD;
          
          if (email && password) {
            accounts.push({
              email: email.trim(),
              password: password.trim()
            });
          }
        })
        .on('end', () => {
          this.accounts = accounts;
          console.log(`\nLoaded ${accounts.length} accounts`);
          resolve(accounts);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  async processBatch(batch, batchNumber, bot) {
    console.log(`\nBatch ${batchNumber} (${batch.length} accounts)`);
    console.log('─'.repeat(50));
    
    // Add small delay between starting each account in batch
    const promises = batch.map(async (account, index) => {
      // Stagger start times within batch
      await delay(index * 500);
      
      try {
        const result = await bot.processAccount(account.email, account.password);
        return result;
      } catch (error) {
        return {
          email: account.email,
          status: 'failed',
          message: error.message,
          secretKey: '',
          appPassword: '',
          time: 0
        };
      }
    });
    
    const results = await Promise.all(promises);
    this.results.push(...results);
    
    // Show batch results immediately
    results.forEach(result => {
      if (result.status === 'complete') {
        console.log(chalk.green(`✓ ${result.email} - Complete`));
      } else if (result.status === 'partial') {
        console.log(chalk.yellow(`⚠ ${result.email} - Partial (Secret: ${result.secretKey.substring(0, 20)}...)`));
      } else {
        console.log(chalk.red(`✗ ${result.email} - Failed`));
      }
    });
    
    return results;
  }
  
  async processAll(bot) {
    const startTime = Date.now();
    const totalBatches = Math.ceil(this.accounts.length / this.batchSize);
    
    console.log('\n' + '═'.repeat(50));
    console.log('BULK PROCESSING');
    console.log(`Total: ${this.accounts.length} | Batch size: ${this.batchSize} | Batches: ${totalBatches}`);
    console.log('═'.repeat(50));
    
    for (let i = 0; i < this.accounts.length; i += this.batchSize) {
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const batch = this.accounts.slice(i, i + this.batchSize);
      
      await this.processBatch(batch, batchNumber, bot);
      
      if (i + this.batchSize < this.accounts.length) {
        console.log(chalk.gray(`\nWaiting ${this.batchDelay/1000}s before next batch...`));
        await delay(this.batchDelay);
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    await this.generateReport(totalTime);
  }
  
  async generateReport(totalTime) {
    const successful = this.results.filter(r => r.status === 'complete');
    const partial = this.results.filter(r => r.status === 'partial');
    const failed = this.results.filter(r => r.status === 'failed');
    
    console.log('\n' + '═'.repeat(50));
    console.log('SUMMARY');
    console.log('─'.repeat(50));
    console.log(`Total: ${this.results.length} | Success: ${successful.length} | Partial: ${partial.length} | Failed: ${failed.length}`);
    console.log(`Time: ${totalTime}m | Avg: ${(totalTime * 60 / this.results.length).toFixed(1)}s/account`);
    console.log('═'.repeat(50));
    
    if (successful.length > 0) {
      console.log('\nSUCCESS:');
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const outputFile = path.join('output', `results_${timestamp}.txt`);
      
      let outputText = '';
      successful.forEach(result => {
        const line = `${result.email} | ${result.appPassword} | ${result.secretKey}`;
        console.log(chalk.green(line));
        outputText += line + '\n';
      });
      
      await fs.promises.writeFile(outputFile, outputText);
      console.log(`\nSaved: ${outputFile}`);
    }
    
    if (partial.length > 0) {
      console.log('\nPARTIAL SUCCESS:');
      partial.forEach(result => {
        console.log(chalk.yellow(`${result.email} - Secret: ${result.secretKey}`));
      });
      
      // Save partial results
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const partialFile = path.join('output', `partial_${timestamp}.txt`);
      let partialText = '';
      partial.forEach(result => {
        partialText += `${result.email} | PARTIAL | ${result.secretKey}\n`;
      });
      await fs.promises.writeFile(partialFile, partialText);
      console.log(`\nPartial saved: ${partialFile}`);
    }
    
    if (failed.length > 0) {
      console.log('\nFAILED:');
      failed.forEach(result => {
        console.log(chalk.red(`${result.email} - ${result.message}`));
      });
      
      // Save failed for retry
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const failedFile = path.join('output', `failed_${timestamp}.csv`);
      await this.saveFailedToCSV(failed, failedFile);
      console.log(`\nFailed saved for retry: ${failedFile}`);
    }
  }
  
  async saveFailedToCSV(results, filePath) {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'email', title: 'email' },
        { id: 'password', title: 'password' }
      ]
    });
    
    const failedWithPasswords = results.map(result => {
      const account = this.accounts.find(acc => acc.email === result.email);
      return {
        email: result.email,
        password: account ? account.password : ''
      };
    });
    
    await csvWriter.writeRecords(failedWithPasswords);
  }
}

module.exports = BulkProcessor;
