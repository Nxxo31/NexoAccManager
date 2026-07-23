// Config: Constants and app configuration

export const MAX_ACCOUNTS = 50;
export const POLL_INTERVAL_MS = 30_000;
export const COOKIE_WARN_MINUTES = 60;
export const DEFAULT_THEME = 'dark';
export const DEFAULT_LANG = 'es';

export const PAGES = {
  ACCOUNTS: 'accounts',
  SERVERS: 'servers',
  GAMES: 'games',
  FRIENDS: 'friends',
  SETTINGS: 'settings',
} as const;

export type PageKey = typeof PAGES[keyof typeof PAGES];
