/**
 * Production Console Guard
 * Silences console.log and console.warn on production.
 * Keeps console.error always active for critical issues.
 * Must be loaded BEFORE all other scripts.
 */
(function() {
  const isLocal = window.location.hostname === 'localhost' 
    || window.location.hostname === '127.0.0.1'
    || window.location.hostname.includes('192.168.');

  if (!isLocal) {
    const noop = function() {};
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    // console.error is intentionally kept active
  }
})();
