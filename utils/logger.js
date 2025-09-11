class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  info(message) {
    console.log(this.formatMessage('info', message));
  }

  error(message) {
    console.error(this.formatMessage('error', message));
  }

  warn(message) {
    console.warn(this.formatMessage('warn', message));
  }

  debug(message) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message));
    }
  }
}

module.exports = {
  logger: new Logger()
};