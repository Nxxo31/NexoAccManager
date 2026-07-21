import { RobloxAuthService } from './RobloxAuthService';

export class ImportService {
  private authService = new RobloxAuthService();

  /**
   * Import cookies from an array of cookie strings.
   * Each cookie is validated via RobloxAuthService.verifyCookie.
   * @param cookies Array of cookie strings (.ROBLOSECURITY value)
   * @returns Number of valid cookies added
   */
  async importCookies(cookies: string[]): Promise<{ added: number }> {
    let added = 0;
    for (const cookie of cookies) {
      try {
        const isValid = await this.authService.verifyCookie(cookie);
        if (isValid) {
          added++;
          // In a real implementation, we would save the cookie to storage here.
        }
      } catch (e) {
        // Invalid cookie, skip
        continue;
      }
    }
    return { added };
  }

  /**
   * Import cookies from clipboard text (cookies separated by newlines).
   * @param clipboardText Text containing cookies, one per line
   * @returns Number of valid cookies added
   */
  async importFromClipboard(clipboardText: string): Promise<{ added: number }> {
    const cookies = clipboardText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return this.importCookies(cookies);
  }
}