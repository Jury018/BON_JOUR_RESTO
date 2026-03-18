/**
 * Server-Side Logger Utility
 * Silences console.log/warn in production (Vercel).
 * Keeps console.error always active.
 */
const isProduction = process.env.VERCEL_ENV === 'production';

const logger = {
  log: (...args) => { if (!isProduction) console.log(...args); },
  warn: (...args) => { if (!isProduction) console.warn(...args); },
  info: (...args) => { if (!isProduction) console.info(...args); },
  error: (...args) => { console.error(...args); } // Always active
};

module.exports = logger;
