import { test, expect } from '@playwright/test';

test.describe('Navigation tests - NexoAccManager v2.5.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should open settings modal when clicking Ajustes button in dock', async ({ page }) => {
      const settingsBtn = page.locator('button[aria-label="Ajustes"]');
      await expect(settingsBtn).toBeVisible();
      await settingsBtn.click();
      
      // Wait for modal to appear - target by content
      const modal = page.locator('[role="dialog"]:has-text("Ajustes")');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check modal has expected elements
      await expect(modal.locator('text=Tema')).toBeVisible();
      await expect(modal.locator('text=Idioma')).toBeVisible();
      await expect(modal.locator('button:has-text("Cerrar")')).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

  test('should open add account modal when clicking Agregar button in dock', async ({ page }) => {
      const addBtn = page.locator('button:has-text("Agregar")');
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      
      // Wait for modal to appear - target by content
      const modal = page.locator('[role="dialog"]:has-text("Agregar cuenta")');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Close via clicking the cancel button in model
      await page.click('button:has-text("Cancelar")');
      await expect(modal).not.toBeVisible();
    });

  test('should close modals when clicking outside (backdrop)', async ({ page }) => {
    // Open add account modal
    await page.click('button:has-text("Agregar")');
    let modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Click on backdrop (top-left corner of modal)
    await page.click('[role="dialog"] >> nth=0', { position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible({ timeout: 3000 });
    
    // Open settings modal
    await page.click('button[aria-label="Ajustes"]');
    modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Click on backdrop
    await page.click('[role="dialog"] >> nth=0', { position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('should close modals when pressing Escape key', async ({ page }) => {
    // Test add account modal
    await page.click('button:has-text("Agregar")');
    let modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 3000 });
    
    // Test settings modal
    await page.click('button[aria-label="Ajustes"]');
    modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('should open and close add account modal via dock button', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Agregar")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Close via clicking the cancel button in modal
    await page.click('button:has-text("Cancelar")');
    await expect(modal).not.toBeVisible();
  });

  test('should have correct aria labels on all interactive elements', async ({ page }) => {
    // Header
    await expect(page.locator('button[aria-label="Cambiar tema"]')).toBeVisible();
    await expect(page.locator('label:has-text("Ocultar")')).toBeVisible();
    
    // Dock inputs
    await expect(page.locator('input[aria-label="Place ID"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Job ID"]')).toBeVisible();
    await expect(page.locator('button:has-text("Agregar")')).toHaveAttribute('aria-label', /Añadir cuenta/i);
    await expect(page.locator('button:has-text("Eliminar")')).toHaveAttribute('aria-label', /Eliminar cuenta/i);
    await expect(page.locator('button:has-text("Abrir App")')).toHaveAttribute('aria-label', /Abrir Roblox/i);
    await expect(page.locator('button[aria-label="Más opciones"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Ajustes"]')).toBeVisible();
    
    // In modals
    await page.click('button:has-text("Agregar")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelar")')).toHaveAttribute('aria-label', /Cancelar/i);
    await expect(page.locator('button:has-text("Iniciar sesión")')).toHaveAttribute('aria-label', /Iniciar sesión/i);
    await page.keyboard.press('Escape');
    
    await page.click('button[aria-label="Ajustes"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('button:has-text("Cerrar")')).toHaveAttribute('aria-label', /Cerrar/i);
    await page.keyboard.press('Escape');
  });

  test('should maintain focus inside modal when tabbing', async ({ page }) => {
    // Open add account modal
    await page.click('button:has-text("Agregar")');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Focus should be on first input (email/username)
    const firstInput = modal.locator('input[placeholder="Email o nombre de usuario"]');
    await expect(firstInput).toBeFocused();
    
    // Tab to next element (password)
    await page.keyboard.press('Tab');
    const passwordInput = modal.locator('input[placeholder="Contraseña"]');
    await expect(passwordInput).toBeFocused();
    
    // Tab to next element (submit button)
    await page.keyboard.press('Tab');
    const submitBtn = modal.locator('button:has-text("Iniciar sesión")');
    await expect(submitBtn).toBeFocused();
    
    // Tab should wrap back to first input
    await page.keyboard.press('Tab');
    await expect(firstInput).toBeFocused();
  });
});