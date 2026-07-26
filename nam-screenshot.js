
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const screenshotDir = '/tmp/nam-screenshots';
  require('fs').mkdirSync(screenshotDir, { recursive: true });
  
  // Navigate to the app
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  //Screenshot 1: Main view (AccountsView)
  await page.screenshot({ path: screenshotDir + '/01-accounts-view.png', fullPage: false });
  console.log('Screenshot 1: AccountsView');
  
  // Screenshot 2: Try to open AddAccountModal
  try {
    const addBtn = page.getByRole('button', { name: /Agregar|Add/ });
    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotDir + '/02-add-account-modal.png', fullPage: false });
      console.log('Screenshot 2: AddAccountModal');
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch (e) { console.log('Modal screenshot failed:', e.message); }
  
  // Screenshot 3: Settings view
  try {
    const settingsNav = page.getByLabel(/Ajustes|Settings/);
    if (await settingsNav.isVisible({ timeout: 3000 })) {
      await settingsNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotDir + '/03-settings-view.png', fullPage: false });
      console.log('Screenshot 3: SettingsView');
    }
  } catch (e) { console.log('Settings screenshot failed:', e.message); }
  
  // Screenshot 4: Games view
  try {
    const gamesNav = page.getByLabel(/Juegos|Games/);
    if (await gamesNav.isVisible({ timeout: 3000 })) {
      await gamesNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotDir + '/04-games-view.png', fullPage: false });
      console.log('Screenshot 4: GamesView');
    }
  } catch (e) { console.log('Games screenshot failed:', e.message); }
  
  // Screenshot 5: Servers view
  try {
    const serversNav = page.getByLabel(/Servidores|Servers/);
    if (await serversNav.isVisible({ timeout: 3000 })) {
      await serversNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotDir + '/05-servers-view.png', fullPage: false });
      console.log('Screenshot 5: ServersView');
    }
  } catch (e) { console.log('Servers screenshot failed:', e.message); }
  
  // Screenshot 6: Friends view
  try {
    const friendsNav = page.getByLabel(/Amigos|Friends/);
    if (await friendsNav.isVisible({ timeout: 3000 })) {
      await friendsNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: screenshotDir + '/06-friends-view.png', fullPage: false });
      console.log('Screenshot 6: FriendsView');
    }
  } catch (e) { console.log('Friends screenshot failed:', e.message); }
  
  // Get page title and any console errors
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for any visible text content
  const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => 'N/A');
  console.log('Body text preview:', bodyText.substring(0, 500));
  
  await browser.close();
  console.log('All screenshots saved to', screenshotDir);
})();
