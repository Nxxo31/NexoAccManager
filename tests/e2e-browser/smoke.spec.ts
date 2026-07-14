import { test, expect } from '@playwright/test';

// SMOKE TESTS — validan que la app renderiza sin errores en navegador real.
// Estos tests NO usan mocks de window.api — validan el renderer real contra Vite.
// Si un import está roto o un alias falta, estos tests fallan donde los
// unit tests con mocks pasarían.

test.describe('Smoke tests — la app carga sin errores', () => {
  test('no hay error overlay de Vite', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // El overlay de Vite tiene una clase específica
    const errorOverlay = page.locator('vite-error-overlay, .vite-error-overlay');
    await expect(errorOverlay).not.toBeVisible();

    // Tampoco debe haber un div de error fallback
    const errorFallback = page.locator('text=Error iniciando NexoAccManager');
    await expect(errorFallback).not.toBeVisible();
  });

  test('el div#root tiene contenido real', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    const rootHTML = await root.innerHTML();
    expect(rootHTML.length).toBeGreaterThan(100);  // más que un div vacío
  });

  test('sidebar visible con navegación completa', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar
    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 4 links de navegación
    const navLinks = page.locator('nav a, aside a');
    await expect(navLinks).toHaveCount(4);

    // Links esperados
    await expect(page.locator('a[href="/accounts"]')).toBeVisible();
    await expect(page.locator('a[href="/servers"]')).toBeVisible();
    await expect(page.locator('a[href="/presence"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('logo NexoAcc visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const logo = page.locator('text=NexoAcc').first();
    await expect(logo).toBeVisible({ timeout: 10000 });
  });

  test('vista de cuentas visible por defecto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Nota: el redirect a /accounts puede no funcionar en modo browser sin
    // Electron context. Verificamos que al menos el contenido de cuentas esté
    // presente aunque la URL sea raíz.
    await expect(page.locator('text=No hay cuentas')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Agrega tu primera cuenta')).toBeVisible();
  });

  test('action bar visible con todos los botones', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Agregar Cuenta")')).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();
    await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();
    await expect(page.locator('button:has-text("Editar Tema")')).toBeVisible();
  });

  test('consola no tiene errores críticos', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // tiempo para que cargue i18next

    // Filtrar errores esperados: window.api no existe en browser mode
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('window.api') &&
        !err.includes('api is undefined') &&
        !err.includes('Cannot read properties of undefined') &&
        !err.includes('api.settings') &&
        !err.includes('api.account')
    );

    expect(criticalErrors).toEqual([]);
  });
});
