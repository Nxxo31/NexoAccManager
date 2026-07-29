// Infrastructure: Centralized logging via electron-log
// B-4: Structured logging in main process — replaces console.log/warn/error
// Log levels: error, warn, info, debug. Logs to file + console in dev.

import log from 'electron-log';

// Configure electron-log
log.transports.file.level = 'info';   // File log: info and above
log.transports.console.level = 'debug'; // Console: debug and above (dev visibility)
log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB max per log file

// Log file location: userData/logs/main.log
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{level}] {text}';

// Override console methods in main process so any stray console.* also gets logged
console.log = (...args: unknown[]) => log.info(...args);
console.warn = (...args: unknown[]) => log.warn(...args);
console.error = (...args: unknown[]) => log.error(...args);

export const logger = log;
export default log;
