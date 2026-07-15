import { test, expect } from '@playwright/test';

// E2E BROWSER TESTS — navegación e interacciones en navegador real (sin Electron).
// v2.4.0 Layout: header → table → dock. Modales: AddAccount, Settings.

test.describe('Navegación E2E — browser mode', () => {
  test('header visible con Ocultar checkbox y botón Ajustes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('checkbox', { name: 'Ocultar' })).toBeVisible();
    await expect(page.locator('header button[aria-label="Cambiar tema"]')).toBeVisible();
  });

  test('boton Ajustes abre modal SettingsPanel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('header button[aria-label="Cambiar tema"]').click();
    await page.waitForTimeout(1000);

    // Wait for the modal overlay to appear
    const modalOverlay = page.locator('[role="dialog"]');
    await expect(modalOverlay).toBeVisible({ timeout: 5000 });
  });

  test('cerrar modales con click fuera', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Open Settings modal
    await page.locator('header button[aria-label="Cambiar tema"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click at top-left corner (backdrop area)
    await page.mouse.click(5, 5);
    await page.waitForTimeout(500);
    await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('vista de cuentas muestra estado vacío por defecto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=No hay cuentas')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Agrega tu primera cuenta')).toBeVisible();
  });

  test('dock muestra botones correctos (agrupados)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // v2.4.0 Dock: Agregar, Eliminar, Abrir App, More (dropdown)
    await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();

    // Divider
    await expect(page.locator('div.w-px.h-5.bg-border')).toBeVisible();

    await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();

    // More dropdown button (aria-label="Más opciones")
    await expect(page.getByRole('button', { name: 'Más opciones' })).toBeVisible();
  });

  test('checkbox ocultar usernames funciona (en header)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const checkbox = page.getByRole('checkbox', { name: 'Ocultar' });
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('modal agregar cuenta abre y cierra', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open modal from dock "Agregar" button
    await page.locator('button:has-text("Agregar")').first().click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Modal content
    await expect(page.locator('text=Agregar Cuenta')).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
