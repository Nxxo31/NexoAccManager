// Infrastructure: Centralized logging via electron-log
// B-4: Structured logging in main process — replaces console.log/warn/error
// Log levels: error, warn, info, debug. Logs to file + console in dev.
//
// Usage:
//   import { logger } from '@/infrastructure/logging/logger';
//   logger.info('App started');
//   logger.error('Failed to start', err);
//
// File output: %USERDATA%/logs/main.log (rotated at 5 MB, 10 files kept)
// Console output: visible in dev tools and terminal during development.

import log from 'electron-log';
import { app } from 'electron';

// ---- Transport configuration ----
// File logging: persists to userData/logs/ directory.
log.transports.file.level = 'info';          // File: info, warn, error
log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB per log file

// Console logging: visible in dev (both main process terminal + renderer devtools)
log.transports.console.level = 'debug';      // Console: debug, info, warn, error

// ---- Format ----
// File format: includes timestamp for forensic traceability
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
// Console format: compact for readability
log.transports.console.format = '[{level}] {text}';

// ---- Initialize scoped logger ----
// Set the logFile path as early as possible so it's ready before any module logs.
try {
  // Resolve userData path — electron-log uses this for file transport by default
  // but we set it explicitly to guarantee /logs/ subdirectory.
  const userDataPath = app.getPath('userData');
  log.transports.file.resolvePathFn = () => `${userDataPath}/logs/main.log`;
} catch {
  // If app.getPath('userData') throws (e.g., called before app is ready),
  // electron-log falls back to its default path. This is fine for startup.
}

// ---- Compatibility: redirect stray console.* to logger ----
// Any code that still uses console.log/warn/error will be captured by electron-log.
// This covers both the main process and any external dependencies.
console.log = (...args: unknown[]) => {
  (log.info as (...a: unknown[]) => void)(...args);
};
console.warn = (...args: unknown[]) => {
  (log.warn as (...a: unknown[]) => void)(...args);
};
console.error = (...args: unknown[]) => {
  (log.error as (...a: unknown[]) => void)(...args);
};

// ---- Export ----
// Named export `logger` is the canonical import. Default is for compat.
export const logger = log;
export default log;