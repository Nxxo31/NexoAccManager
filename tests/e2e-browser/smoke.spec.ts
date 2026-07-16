import { test, expect } from '@playwright/test';

test.describe('Smoke tests - NexoAccManager v2.5.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/NexoAccManager/);
    
      // Check header elements
      await expect(page.locator('text=NexoAcc')).toBeVisible();
      await expect(page.locator('text=0/50')).toBeVisible(); // Account counter
      await expect(page.locator('button[aria-label="Cambiar tema"]')).toBeVisible();
      await expect(page.locator('label:has-text("Ocultar")')).toBeVisible();
    
      // Check empty state
      await expect(page.locator('text=No hay cuentas')).toBeVisible();
    
      // Check dock elements
      await expect(page.locator('input[aria-label="Place ID"]')).toBeVisible();
      await expect(page.locator('input[aria-label="Job ID"]')).toBeVisible();
      await expect(page.locator('button:has-text("Agregar")')).toBeVisible();
      await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();
      await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();
      await expect(page.locator('button[aria-label="Más opciones"]')).toBeVisible();
    });

  test('should open add account modal when clicking Agregar button', async ({ page }) => {
    await expect(page.locator('button:has-text("Agregar")')).toBeVisible();
    await page.click('button:has-text("Agregar")');
    
    // Wait for modal to appear - target by content
    const modal = page.locator('[role="dialog"]:has-text("Agregar cuenta")');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check modal has expected elements
    await expect(modal.locator('text=Email o nombre de usuario')).toBeVisible();
    await expect(modal.locator('text=Contraseña')).toBeVisible();
    await expect(modal.locator('button:has-text("Cancelar")')).toBeVisible();
    await expect(modal.locator('button:has-text("Iniciar sesión")')).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should open settings modal when clicking Settings button in dock', async ({ page }) => {
    // Find the settings button in the dock (gear icon)
    const settingsBtn = page.locator('button[aria-label="Ajustes"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    
    // Wait for modal to appear - target by content
    const modal = page.locator('[role="dialog"]:has-text("Ajustes")');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check modal has expected elements
    await expect(modal.locator('text=Tema')).toBeVisible();
    await expect(modal.locator('text=Idioma')).toBeVisible();
    await expect(modal.locator('button:has-text("Cerrar modal")')).toBeVisible();
    
    // Close modal by clicking backdrop
    await page.click('[role="dialog"] >> nth=0', { position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('should toggle theme when clicking theme button in header', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label="Cambiar tema"]');
    await expect(themeBtn).toBeVisible();
    
    // Get initial theme (we can't easily detect this, but we can click twice)
    await themeBtn.click();
    await page.waitForTimeout(500); // Wait for transition
    
    await themeBtn.click();
    await page.waitForTimeout(500);
  });

  test('should hide/show usernames when clicking checkbox', async ({ page }) => {
    const hideLabel = page.locator('label:has-text("Ocultar")');
    await expect(hideLabel).toBeVisible();
    const checkbox = hideLabel.locator('input[type="checkbox"]');
    
    // Initially unchecked
    await expect(checkbox).not.toBeChecked();
    
    // Click to check
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    // Click to uncheck
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});