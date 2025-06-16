const winston = require('winston');

class Logger {
  constructor() {
    this.winston = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
      ]
    });
  }

  info(message) {
    this.winston.info(message);
  }

  success(message) {
    this.winston.info('SUCCESS: ' + message);
  }

  warn(message) {
    this.winston.warn(message);
  }

  error(message) {
    this.winston.error(message);
  }

  debug(message) {
    this.winston.debug(message);
  }
}

module.exports = new Logger();
