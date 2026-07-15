import { test, expect } from '@playwright/test';
import axe from '@axe-core/playwright';

test.describe('Accessibility tests - NexoAccManager v2.5.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should have no accessibility violations on initial load', async ({ page }) => {
    const accessibilityScanResults = await axe.run(page);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations in add account modal', async ({ page }) => {
    // Open add account modal
    await page.click('button:has-text("Agregar")');
    
    // Wait for modal to be visible
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Get the modal element
    const modal = await page.$('[role="dialog"]');
    expect(modal).toBeTruthy();
    
    // Run axe on the modal only
    const accessibilityScanResults = await axe.run(page, { include: [modal] });
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Clean up
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should have no accessibility violations in settings modal', async ({ page }) => {
    // Open settings modal
    await page.click('button[aria-label="Ajustes"]');
    
    // Wait for modal to be visible
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Get the modal element
    const modal = await page.$('[role="dialog"]');
    expect(modal).toBeTruthy();
    
    // Run axe on the modal only
    const accessibilityScanResults = await axe.run(page, { include: [modal] });
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Clean up
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });
});