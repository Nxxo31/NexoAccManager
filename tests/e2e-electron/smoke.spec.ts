/**
 * E2E Smoke Test — verifica que la app Electron lanza y renderiza.
 * Usa selectores semánticos: getByLabel para aria-label, getByRole para botones.
 * Requiere: dist/main/main.js (npm run build previo)
 */

import { test, expect } from './electron-fixture';

test.describe('Electron App — Smoke', () => {
  test('app lanza y muestra ventana con título', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  test('sidebar renderiza con 5 items de navegación', async ({ page }) => {
    // Los NavLink de Mantine renderizan <a> con aria-label (sin role explicito)
    const navLabels = ['Cuentas', 'Servidores', 'Juegos', 'Amigos', 'Ajustes'];
    for (const label of navLabels) {
      const navItem = page.getByLabel(label);
      await expect(navItem).toBeVisible({ timeout: 10000 });
    }
  });

  test('contador de cuentas visible en sidebar', async ({ page }) => {
    // El counter muestra "X / 50 cuentas" (i18n key sidebar.count)
    const counter = page.getByText(/\d+\s*\/\s*50\s+cuentas/);
    await expect(counter).toBeVisible({ timeout: 15000 });
  });

  test('TopBar: búsqueda visible con aria-label, botón Agregar visible', async ({ page }) => {
    // El input de búsqueda tiene aria-label="Buscar..." (i18n topbar.searchAria)
    const searchInput = page.getByLabel(/Buscar/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // El botón Agregar usa t('topbar.add') = "Agregar" en español
    const addButton = page.getByRole('button', { name: 'Agregar' });
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // El toggle de tema tiene aria-label="Cambiar tema" (i18n topbar.toggleTheme)
    const themeToggle = page.getByLabel(/Cambiar tema/i);
    await expect(themeToggle).toBeVisible({ timeout: 5000 });
  });
});
