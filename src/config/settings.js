module.exports = {
  browser: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,720',
      '--disable-images',
      '--disable-javascript-harmony',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ]
  },
  timeouts: {
    navigation: 20000,    // Increased
    implicit: 8000,       // Increased
    verification: 10000   // Increased
  },
  delays: {
    typing: 30,           // Slightly increased
    betweenActions: 500,  // Increased
    afterLogin: 2000,     // Increased
    modalWait: 3000       // Increased
  },
  bulk: {
    batchSize: 3,         // Max 3 parallel
    batchDelay: 5000      // 5 seconds between batches
  },
  totp: {
    apiUrl: 'https://2fa.live/tok'
  },
  output: {
    format: 'csv',
    filename: 'output/results.csv'
  },
  debug: {
    screenshots: false,
    saveLogs: false
  }
};
