import { BrowserWindow } from 'electron';

export class BrowserService {
  constructor() {}

  async openBrowserSession(accountId: string, cookie: string): Promise<void> {
    // Stub: opens BrowserWindow with account profile
    // Implementation would create a BrowserWindow and load a URL with the cookie
    return;
  }
}