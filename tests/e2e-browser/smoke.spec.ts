import { test, expect } from '@playwright/test';

test.describe('Smoke tests - NX-Manager v3.2.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application with new shell', async ({ page }) => {
    // Sidebar visible (left accounts slicer)
    await expect(page.locator('aside, [data-testid="sidebar"], nav')).toBeVisible();

    // TopBar visible (theme toggle + settings gear)
    await expect(page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]')).toBeVisible();
    await expect(page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]')).toBeVisible();

    // Empty accounts state
    await expect(page.locator('text=No hay cuentas')).toBeVisible();
  });

  test('should show login button in sidebar', async ({ page }) => {
    const loginBtn = page.locator('button:has-text("Iniciar sesión"), button:has-text("Iniciar sesion"), button:has-text("Login")');
    await expect(loginBtn).toBeVisible();
  });

  test('should toggle theme via TopBar button', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(500);
    await themeBtn.click();
    await page.waitForTimeout(500);
  });

  test('should open settings view via gear button', async ({ page }) => {
    const settingsBtn = page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await page.waitForTimeout(500);
    // SettingsView renders with title
    await expect(page.locator('text=Ajustes, text=Configuración')).toBeVisible({ timeout: 3000 });
  });

  test('should have search input in sidebar', async ({ page }) => {
    const search = page.locator('input[placeholder*="Buscar"], input[placeholder*="cuentas" i]');
    await expect(search).toBeVisible();
  });

  test('should have brand "NX-Manager" visible', async ({ page }) => {
    await expect(page.locator('text=NX-Manager').first()).toBeVisible();
  });
});
