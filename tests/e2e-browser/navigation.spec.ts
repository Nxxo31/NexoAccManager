import { test, expect } from '@playwright/test';

// E2E BROWSER TESTS — navegación e interacciones en navegador real (sin Electron).
// Layout único: header con botones que abren modales, sin sidebar ni routing.

test.describe('Navegación E2E — browser mode', () => {
  test('header visible con Ocultar checkbox y botón Ajustes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=NexoAcc')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('checkbox', { name: 'Ocultar' })).toBeVisible();
    await expect(page.locator('button:has-text("Ajustes")')).toBeVisible();
    // NO "Servers" ni "Presencia" en el header
  });

  test('boton Servers abre modal ServerBrowser (solo cuando Place ID está lleno)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // El boton Servers debe estar DESHABILITADO cuando Place ID está vacío
    await expect(page.locator('button:has-text("Servers")')).toBeDisabled();

    // Llenamos Place ID
    await page.locator('input[placeholder*="ej: 5315046213"]').fill('5315046213');
    await expect(page.locator('button:has-text("Servers")')).toBeEnabled();

    // Ahora podemos hacer click
    await page.locator('button:has-text("Servers")').click();
    await page.waitForTimeout(500);

    // Wait for the modal overlay to appear
    const modalOverlay = page.locator('[class*="fixed inset-0"]').last();
    await expect(modalOverlay).toBeVisible({ timeout: 3000 });

    // Inside the modal, check for Place ID input
    await expect(page.locator('input[placeholder*="Place ID (ej: 5315046213)"]')).toBeVisible({ timeout: 3000 });
  });

  test('boton Ajustes abre modal SettingsPanel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Ajustes")').click();
    await page.waitForTimeout(500);

    // Wait for the modal overlay to appear
    const modalOverlay = page.locator('[class*="fixed inset-0"]').last();
    await expect(modalOverlay).toBeVisible({ timeout: 3000 });

    // Inside the modal, check for a unique section title
    await expect(page.locator('h3:has-text("Apariencia")')).toBeVisible({ timeout: 3000 });
  });

  test('cerrar modales con click fuera', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Primero llenamos Place ID para habilitar el boton Servers
    await page.locator('input[placeholder*="ej: 5315046213"]').fill('5315046213');
    await page.locator('button:has-text("Servers")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[class*="fixed inset-0"]').last()).toBeVisible();

    // Click at the top-left corner of the viewport (which is on the backdrop and outside the dialog)
    await page.mouse.click(0, 0);
    await page.waitForTimeout(500);
    await expect(page.locator('[class*="fixed inset-0"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('vista de cuentas muestra estado vacío por defecto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=No hay cuentas')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Agrega tu primera cuenta')).toBeVisible();
    await expect(page.locator('button:has-text("Agregar Cuenta")')).toBeVisible();
  });

  test('action bar muestra botones correctos (agrupados)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // LEFT GROUP (account management)
    await expect(page.locator('button:has-text("Agregar"):not(:has-text("Cuenta"))')).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar")')).toBeVisible();
    
    // DIVIDER (vertical line)
    await expect(page.locator('div.w-px.h-5.bg-border.mx-1')).toBeVisible();
    
    // RIGHT GROUP (contextual actions)
    await expect(page.locator('button:has-text("Abrir App")')).toBeVisible();
    await expect(page.locator('button:has-text("Control")')).toBeVisible();
    await expect(page.locator('button:has-text("Follow")')).toBeVisible();
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

    // Abrir modal desde empty state
    await page.locator('button:has-text("Agregar Cuenta")').click();
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Contenido del modal
    await expect(page.locator('h2:has-text("Agregar Cuenta")')).toBeVisible({ timeout: 3000 });

    // Cerrar con Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});