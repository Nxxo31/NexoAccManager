import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A11Y BROWSER TESTS — accessibility testing con axe-core en navegador real.
// Corren en WSL sin necesidad de Electron.

test.describe('Accesibilidad — axe-core browser mode', () => {
  test('vista de cuentas pasa axe WCAG', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('sidebar pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .include('aside, nav')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('modal agregar cuenta pasa axe WCAG', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Agregar Cuenta")').click();
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .include('[class*="fixed inset-0"], [role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('vista de ajustes pasa axe WCAG', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
});
