// Smoke E2E — browser-mode, no Electron.
// Verifies the renderer shell renders, core layout is present, navigation
// switches views, the AddAccount modal opens, and i18n defaults to Spanish.
//
// Layout (from src/application/App.tsx — single-view, no routing):
//   Sidebar (nav: Cuentas/Servidores/Juegos/Amigos/Ajustes + counter)
//   TopBar  (search input + "Agregar" button + theme toggle)
//   ContentArea (switches by activeView; default = AccountsView)
//   LaunchDock (bottom: Place ID input + launch controls)
//   AddAccountModal (opened via TopBar "Agregar" button; Mantine <Modal>)
//
// Settings is a *view* reached via the Sidebar "Ajustes" NavLink (not a modal).
// Default language is Spanish (index.html <html lang="es"> + i18n default).

import { test, expect } from '@playwright/test';

test.describe('NAM renderer smoke — browser-mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('app shell renders with Sidebar, TopBar, and LaunchDock', async ({ page }) => {
    // Sidebar — brand text + nav links
    await expect(page.getByText('NX-Manager')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cuentas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ajustes' })).toBeVisible();

    // TopBar — "Agregar" button opens the AddAccount modal
    await expect(page.getByRole('button', { name: 'Agregar' })).toBeVisible();

    // LaunchDock — bottom dock exposes the Place ID field (ES label "Place ID")
    await expect(page.getByText('Place ID')).toBeVisible();
  });

  test('AccountsView is the default view with empty state in Spanish', async ({ page }) => {
    // Default view = accounts. With no DB in browser-mode, the empty state shows.
    await expect(page.getByText('No hay cuentas agregadas')).toBeVisible();
    // Empty-state CTA button in Spanish
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('AddAccount modal opens from TopBar and shows Spanish i18n strings', async ({ page }) => {
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Mantine Modal renders in a portal with role="dialog"
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Title — modal.addAccountTitle = "Agregar cuenta"
    await expect(dialog.getByText('Agregar cuenta')).toBeVisible();

    // Tabs — modal.browser = "Navegador", modal.cookie = "Cookie",
    // modal.bulkImport = "Bulk Import" (kept literal in the ES catalog)
    await expect(dialog.getByRole('tab', { name: 'Navegador' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Cookie' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Bulk Import' })).toBeVisible();

    // Close via the modal's close button (Mantine renders an ActionIcon with
    // aria-label "Close" by default). Escape also works but Close is more semantic.
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('Settings view opens via Sidebar "Ajustes" and shows Spanish accordion sections', async ({ page }) => {
    // Settings is a view, not a modal — navigate via Sidebar NavLink.
    await page.getByRole('link', { name: 'Ajustes' }).click();

    // SettingsView renders the section title (settings.title = "Ajustes")
    // and an Accordion of 12 sections. Assert a representative subset in ES.
    await expect(page.getByText('Ajustes').first()).toBeVisible();
    await expect(page.getByText('Apariencia')).toBeVisible();
    await expect(page.getByText('General')).toBeVisible();
  });
});
