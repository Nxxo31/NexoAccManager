const { chromium } = require('@playwright/test');

(async () => {
  // Configuración
  const appPath = 'C:\\Users\\sebas\\Desktop\\NexoAccManager-final\\NexoAccManager.exe';
  const outputDir = 'C:\\Users\\sebas\\Desktop\\NexoAccManager-screenshots';

  // Lanzar la app
  const electronApp = await chromium.launchPersistentContext('', {
    headless: false,
    args: [appPath],
    timeout: 30000,
  });

  const page = await electronApp.newPage();

  // Esperar a que la app carga
  await page.waitForTimeout(5000);

  // Tomar screenshot de la ventana principal
  await page.screenshot({
    path: `${outputDir}\\nexaccmanager-main-window.png`,
    fullPage: true
  });

  // Intentar interactuar con el formulario de agregar cuenta
  try {
    await page.fill('textarea[placeholder*="cookie"]', '_|WARNING:-DO-NOT-SHARE|_test_test_test');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${outputDir}\\nexaccmanager-add-account-form.png`,
      fullPage: true
    });
  } catch (e) {
    console.log('No se encontró el textarea de cookie:', e.message);
  }

  // Cerrar
  await electronApp.close();
  console.log('Screenshots guardados en:', outputDir);
})();
