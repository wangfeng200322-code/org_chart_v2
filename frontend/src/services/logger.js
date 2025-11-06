const logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = levels[logLevel] !== undefined ? levels[logLevel] : levels.info;

function shouldLog(level) {
  return levels[level] !== undefined && levels[level] <= currentLevel;
}

function log(level, ...args) {
  if (shouldLog(level)) {
    console[level](`[${new Date().toISOString()}] [${level.toUpperCase()}]`, ...args);
  }
}

export default {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args)
};