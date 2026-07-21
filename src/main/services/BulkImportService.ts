import { RobloxAuthService } from './RobloxAuthService';
import { Account } from '../../types/Account';

export class BulkImportService {
  private authService = new RobloxAuthService();

  /**
   * Bulk import accounts using username and password.
   * Attempts to log in each account via RobloxAuthService.login.
   * @param accounts Array of { username, password } objects
   * @returns Object with counts of added (successful) and failed accounts
   */
  async bulkImport(accounts: { username: string; password: string }[]): Promise<{ added: number; failed: number }> {
    let added = 0;
    let failed = 0;

    for (const { username, password } of accounts) {
      try {
        await this.authService.login(username, password);
        // In a real implementation, we would save the account here.
        added++;
      } catch (err) {
        // Any error (invalid credentials, 2FA, captcha, network) counts as failed.
        failed++;
      }
    }

    return { added, failed };
  }
}