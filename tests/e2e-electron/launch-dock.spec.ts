/**
 * E2E LaunchDock Test — verifies persistent dock is visible and Place ID flows.
 * Requires: dist/main/main.js (npm run build previo)
 */

import { test, expect } from './electron-fixture';

test.describe('LaunchDock Persistence', () => {
  test('LaunchDock is visible at bottom of app shell', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // The LaunchDock has a "Ir a Juegos" button (i18n games.title = "Juegos")
    const gamesBtn = page.getByRole('button', { name: /Juegos/i });
    await expect(gamesBtn).toBeVisible({ timeout: 10000 });
  });

  test('LaunchDock shows Unirse button (disabled when no Place ID)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // The Join button uses i18n accounts.join = "Unirse"
    const joinBtn = page.getByRole('button', { name: /Unirse/i });
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    // Should be disabled when no placeId is set and no account selected
    await expect(joinBtn).toBeDisabled({ timeout: 5000 });
  });

  test('navigation to GamesView and back preserves LaunchDock', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to Games
    const gamesNav = page.getByLabel('Juegos');
    await expect(gamesNav).toBeVisible({ timeout: 10000 });
    await gamesNav.click();

    // Wait for GamesView to render
    const gamesTitle = page.getByText(/Juegos/i);
    await expect(gamesTitle.first()).toBeVisible({ timeout: 5000 });

    // Navigate back to Accounts
    const accountsNav = page.getByLabel('Cuentas');
    await expect(accountsNav).toBeVisible({ timeout: 5000 });
    await accountsNav.click();

    // LaunchDock should still be visible
    const gamesBtn = page.getByRole('button', { name: /Juegos/i });
    await expect(gamesBtn).toBeVisible({ timeout: 5000 });
  });
});
