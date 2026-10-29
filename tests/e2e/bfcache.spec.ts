import { expect, test } from '@playwright/test';
import { trackGoogle } from './helpers';

const banner = '#numberstuff-banner';

test.use({ channel: 'chromium', launchOptions: { ignoreDefaultArgs: ['--disable-back-forward-cache'] } });

test('a page restored from the back/forward cache after withdrawal reloads without GTM', async ({ page }) => {
  const google = await trackGoogle(page);
  await page.goto('/sample/');
  await page.locator(`${banner} [data-numberstuff-choice="granted"]`).click();
  await expect.poll(() => google.some((u) => u.includes('gtm.js?id=GTM-TEST123'))).toBe(true);
  await page.evaluate(() => {
    (window as unknown as { numberstuffMarker: boolean }).numberstuffMarker = true;
  });

  await page.goto('/pt/amostra/');
  await page.locator('[data-numberstuff-consent]').click();
  await Promise.all([page.waitForEvent('load'), page.locator(`${banner} [data-numberstuff-choice="denied"]`).click()]);
  google.length = 0;

  await Promise.all([page.waitForEvent('load', { timeout: 5000 }), page.evaluate(() => history.back())]);
  await expect(page).toHaveURL(/\/sample\/$/);
  expect(await page.evaluate(() => (window as unknown as { numberstuffMarker?: boolean }).numberstuffMarker)).toBeUndefined();
  expect(await page.evaluate(() => (window as unknown as { numberstuff: { loaded: boolean } }).numberstuff.loaded)).toBe(false);
  expect(google).toEqual([]);
});

test('another tab that loaded GTM reloads without it when shown again after withdrawal', async ({ context, page }) => {
  await trackGoogle(page);
  await page.goto('/sample/');
  await page.locator(`${banner} [data-numberstuff-choice="granted"]`).click();
  await page.evaluate(() => {
    (window as unknown as { numberstuffMarker: boolean }).numberstuffMarker = true;
  });

  const other = await context.newPage();
  await trackGoogle(other);
  await other.goto('/pt/amostra/');
  await other.locator('[data-numberstuff-consent]').click();
  await Promise.all([other.waitForEvent('load'), other.locator(`${banner} [data-numberstuff-choice="denied"]`).click()]);

  await page.bringToFront();
  await Promise.all([
    page.waitForEvent('load', { timeout: 5000 }),
    page.evaluate(() => setTimeout(() => document.dispatchEvent(new Event('visibilitychange')))),
  ]);
  expect(await page.evaluate(() => (window as unknown as { numberstuffMarker?: boolean }).numberstuffMarker)).toBeUndefined();
  expect(await page.evaluate(() => (window as unknown as { numberstuff: { loaded: boolean } }).numberstuff.loaded)).toBe(false);
});
