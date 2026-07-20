import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Accessibility tests - NX-Manager v3.2.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should have no critical accessibility violations on initial load', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });

  test('should have accessible theme toggle button', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label*="tema" i], button[aria-label*="theme" i]');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toHaveAttribute('aria-label');
  });

  test('should have accessible settings gear button', async ({ page }) => {
    const gearBtn = page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]');
    await expect(gearBtn).toBeVisible();
    await expect(gearBtn).toHaveAttribute('aria-label');
  });

  test('should have accessible search input in sidebar', async ({ page }) => {
    const search = page.locator('input[placeholder*="Buscar"], input[placeholder*="cuentas" i]');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder');
  });

  test('should open settings view with no critical a11y violations', async ({ page }) => {
    const gearBtn = page.locator('button[aria-label*="ajustes" i], button[aria-label*="settings" i]');
    await gearBtn.click();
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });
});
