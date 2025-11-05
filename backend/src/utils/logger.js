const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = Object.keys(LOG_LEVELS);

// Get log level from environment variable or default to INFO
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function log(level, message, ...args) {
  if (LOG_LEVELS[level] <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [database] ${message}`;
    console.log(logMessage, ...args);
  }
}

export default {
  error: (message, ...args) => log('ERROR', message, ...args),
  warn: (message, ...args) => log('WARN', message, ...args),
  info: (message, ...args) => log('INFO', message, ...args),
  debug: (message, ...args) => log('DEBUG', message, ...args),
  // Check if a specific level is enabled
  isDebugEnabled: () => currentLogLevel >= LOG_LEVELS.DEBUG,
  isInfoEnabled: () => currentLogLevel >= LOG_LEVELS.INFO,
  isWarnEnabled: () => currentLogLevel >= LOG_LEVELS.WARN,
  isErrorEnabled: () => currentLogLevel >= LOG_LEVELS.ERROR
};