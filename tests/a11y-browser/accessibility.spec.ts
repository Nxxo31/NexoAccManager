import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/*
 * A11Y BROWSER TESTS — accessibility testing con axe-core en navegador real.
 * Layout: header (logo + Ocultar + Ajustes) → table → nav bar (PlaceID/JobID/Shuffle/Servers/Join) → action bar.
 * Modals: AddAccount, ServerBrowser (requires placeId), Settings, AccountControlPanel.
 */

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

    await page.locator('button:has-text("Agregar")').first().click();
    await page.waitForTimeout(2000);

    // Ensure modal is stable before analyzing
    await expect(page.locator('[class*="fixed inset-0"]').first()).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('modal Servers (Servers button) pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Type a Place ID first to enable the Servers button
    await page.locator('input[placeholder*="5315046213"]').fill('5315046213');
    await page.waitForTimeout(200);

    // Now click the Servers button
    await page.locator('button:has-text("Servers")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[class*="fixed inset-0"]').last()).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('modal Ajustes (Ajustes button) pasa axe WCAG', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Ajustes" in the header
    await page.locator('button:has-text("Ajustes")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[class*="fixed inset-0"]').last()).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
});