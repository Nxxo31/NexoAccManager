import { test, expect } from '@playwright/test';

// E2E BROWSER TESTS — navegación e interacciones en navegador real (sin Electron).
// La app usa MemoryRouter (no BrowserRouter), así que las aserciones de URL
// NO funcionan. Verificamos contenido visible en su lugar.

test.describe('Navegación E2E — browser mode', () => {
  test('navegación completa por las 4 vistas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Cuentas (vista default, contenido visible)
    await expect(page.locator('text=No hay cuentas')).toBeVisible({ timeout: 10000 });

    // Servers — click y verificar input de Place ID
    await page.locator('a[href="/servers"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('input[placeholder*="place" i]')).toBeVisible({ timeout: 5000 });

    // Presencia — click y verificar h2 (heading específico, no text genérico)
    await page.locator('a[href="/presence"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Presencia")')).toBeVisible({ timeout: 5000 });

    // Ajustes — click y verificar heading principal
    await page.locator('a[href="/settings"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Ajustes")')).toBeVisible({ timeout: 5000 });

    // Volver a cuentas — verificar botón principal
    await page.locator('a[href="/accounts"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Agregar Cuenta")')).toBeVisible();
  });

  test('modal agregar cuenta abre y cierra', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Abrir modal
    await page.locator('button:has-text("Agregar Cuenta")').click();
    const modal = page.locator('[class*="fixed inset-0"], [role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Contenido del modal: h3 específico (no el botón que tiene el mismo texto)
    await expect(page.locator('h3:has-text("Iniciar sesión en Roblox")')).toBeVisible({ timeout: 3000 });

    // Cerrar con Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('checkbox ocultar usernames funciona', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const checkbox = page.locator('input[type="checkbox"]');
    const label = page.locator('text=Ocultar Usernames');

    await expect(label).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});
