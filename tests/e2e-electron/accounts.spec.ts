/**
 * E2E Account Flow Test — tests del flujo de gestión de cuentas.
 * Usa selectores semánticos: getByLabel para aria-label, getByRole para botones.
 * Requiere: dist/main/main.js (npm run build previo)
 */

import { test, expect } from './electron-fixture';

test.describe('Account Management Flow', () => {
  test('AddAccountModal se abre con botón Agregar del TopBar', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Botón Agregar del TopBar (i18n topbar.add en español)
    const addBtn = page.getByRole('button', { name: 'Agregar' });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Modal aparece con role=dialog (Mantine Modal usa role=dialog)
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('navegación a Settings y acordeón Apariencia visible', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // NavLink de Settings tiene aria-label="Ajustes" (Mantine <a> con aria-label)
    const settingsNav = page.getByLabel('Ajustes');
    await expect(settingsNav).toBeVisible({ timeout: 10000 });
    await settingsNav.click();

    // El acordeón de Apariencia debe ser visible en SettingsView
    const apariencia = page.getByRole('button', { name: /Apariencia/ });
    await expect(apariencia).toBeVisible({ timeout: 5000 });
  });
});
