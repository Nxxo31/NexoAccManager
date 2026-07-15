import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A11Y BROWSER TESTS — axe-core en navegador real.
// v2.4.0 Layout: header → table → dock. Modals: AddAccount, Settings.

test.describe('Accesibilidad — axe-core browser mode', () => {
  test('vista de cuentas (cuentas vacías) pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('header pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('modal agregar cuenta pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Agregar" button in dock
    await page.locator('button:has-text("Agregar")').first().click();
    await page.waitForTimeout(2000);

    // Ensure modal is visible
    await expect(page.locator('[class*="fixed inset-0"]').first()).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('modal Ajustes pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Ajustes" button in header
    await page.locator('header button[aria-label="Cambiar tema"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[class*="fixed inset-0"]')).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
});
