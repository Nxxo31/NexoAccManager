import { test, expect } from '@playwright/test';

test.describe('Visual regression tests - NexoAccManager v2.5.0', () => {
  test.use({ viewportWidth: 1440, viewportHeight: 900 });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should match empty state snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('accounts-empty-chromium-linux.png', { maxDiffPixels: 50 });
  });

  test('should match header snapshot', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header-chromium-linux.png', { maxDiffPixels: 50 });
  });

  test('should match dock snapshot', async ({ page }) => {
    // Select the dock by its class (first row: Place ID, Job ID, Shuffle)
    const dockElement = page.locator('.flex-shrink-0.flex.items-center.gap-2.px-4.py-2.border-t.border-border.bg-bg-card');
    await expect(dockElement).toHaveScreenshot('dock-bar-chromium-linux.png', { maxDiffPixels: 50 });
  });

  test('should match add account modal snapshot', async ({ page }) => {
    await page.click('button:has-text("Agregar")');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toHaveScreenshot('add-account-modal-chromium-linux.png', { maxDiffPixels: 50 });
    await page.keyboard.press('Escape');
  });

  test('should match settings modal snapshot', async ({ page }) => {
    await page.click('button[aria-label="Ajustes"]');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toHaveScreenshot('settings-modal-chromium-linux.png', { maxDiffPixels: 50 });
    await page.keyboard.press('Escape');
  });

  test.skip('Server browser modal - not currently accessible from UI', async ({ page }) => {
    // TODO: Add a way to open the server browser modal (e.g., a button in the header or dock)
  });
});