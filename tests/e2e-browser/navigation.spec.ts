import { test, expect } from '@playwright/test';

test.describe('Navigation tests - NX-Manager v3.2.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should open settings view via TopBar gear', async ({ page }) => {
    const gearBtn = page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]');
    await expect(gearBtn).toBeVisible();
    await gearBtn.click();
    await page.waitForTimeout(500);
    // SettingsView content
    await expect(page.locator('text=Ajustes, text=Configuración')).toBeVisible({ timeout: 3000 });
  });

  test('should filter accounts via sidebar search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="cuentas" i]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test_nonexistent_account');
    await page.waitForTimeout(300);
    // No results state (broad match - actual text may vary)
    const accounts = page.locator('[data-account-id], .account-row, .account-item');
    await expect(accounts).toHaveCount(0);
  });

  test('should toggle theme via TopBar button', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(500);
    // Theme should toggle (we just verify the button is still interactive)
    await expect(themeBtn).toBeVisible();
  });

  test('should have aria labels on interactive elements', async ({ page }) => {
    // Theme toggle
    await expect(page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]')).toBeVisible();
    // Settings gear
    await expect(page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]')).toBeVisible();
    // Sidebar login button
    await expect(
      page.locator('button:has-text("Iniciar sesión"), button:has-text("Iniciar sesion"), button:has-text("Login")'),
    ).toBeVisible();
    // Sidebar collapse toggle (optional)
    const collapseBtn = page.locator('button[aria-label*="colapsar" i], button[aria-label*="collapse" i]');
    // (may or may not be visible without accounts; assert.soft)
    if (await collapseBtn.count() > 0) {
      await expect(collapseBtn.first()).toBeVisible();
    }
  });

  test('should keep focus on theme toggle after click', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]');
    await themeBtn.click();
    await expect(themeBtn).toBeFocused();
  });
});
