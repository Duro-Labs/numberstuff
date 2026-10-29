import { expect, test } from '@playwright/test';
import { counterCalls, dataLayer, trackGoogle } from './helpers';

const banner = '#numberstuff-banner';

test('first visit shows the banner and contacts no Google host', async ({ page }) => {
  const google = await trackGoogle(page);
  await page.goto('/sample/');
  await expect(page.locator(banner)).toBeVisible();
  expect(google).toEqual([]);
  expect(await dataLayer(page)).toContainEqual([
    'consent',
    'default',
    expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }),
  ]);
});

test('accept loads GTM, grants analytics and counts once', async ({ page, context }) => {
  const google = await trackGoogle(page);
  const calls = await counterCalls(page);
  await page.goto('/sample/');
  await page.locator(`${banner} [data-numberstuff-choice="granted"]`).click();
  await expect(page.locator(banner)).toBeHidden();
  await expect.poll(() => google.some((u) => u.includes('gtm.js?id=GTM-TEST123'))).toBe(true);
  const layer = await dataLayer(page);
  expect(layer).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }]);
  expect(layer).toContainEqual(expect.objectContaining({ event: 'consent_choice', choice: 'granted' }));
  await expect.poll(() => calls.length).toBe(1);
  expect(JSON.parse(calls[0])).toEqual({ choice: 'granted' });
  const cookie = (await context.cookies()).find((c) => c.name === 'numberstuff_consent');
  expect(cookie?.value).toBe('granted');
  expect(cookie?.sameSite).toBe('Lax');
});

test('reject stores the choice, counts once and loads nothing', async ({ page, context }) => {
  const google = await trackGoogle(page);
  const calls = await counterCalls(page);
  await page.goto('/sample/');
  await page.locator(`${banner} [data-numberstuff-choice="denied"]`).click();
  await expect(page.locator(banner)).toBeHidden();
  await expect.poll(() => calls.length).toBe(1);
  expect(JSON.parse(calls[0])).toEqual({ choice: 'denied' });
  await page.reload();
  await expect(page.locator(banner)).toBeHidden();
  expect(google).toEqual([]);
  expect((await context.cookies()).find((c) => c.name === 'numberstuff_consent')?.value).toBe('denied');
});

test('a returning visitor who accepted gets GTM without the banner or a count', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'numberstuff_consent', value: 'granted', url: baseURL! }]);
  const google = await trackGoogle(page);
  const calls = await counterCalls(page);
  await page.goto('/sample/');
  await expect(page.locator(banner)).toBeHidden();
  await expect.poll(() => google.some((u) => u.includes('gtm.js?id=GTM-TEST123'))).toBe(true);
  expect(calls).toEqual([]);
});

test('Global Privacy Control means no banner, no GTM, no count', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
  const google = await trackGoogle(page);
  const calls = await counterCalls(page);
  await page.goto('/sample/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator(banner)).toBeHidden();
  await page.locator('[data-numberstuff-consent]').click();
  await expect(page.locator(banner)).toBeHidden();
  expect(google).toEqual([]);
  expect(calls).toEqual([]);
});

test('withdrawing consent removes analytics cookies and reloads without GTM', async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: 'numberstuff_consent', value: 'granted', url: baseURL! },
    { name: '_ga', value: 'GA1.1.1.1', url: baseURL! },
    { name: '_ga_TEST', value: 'GS1.1.1', url: baseURL! },
  ]);
  const google = await trackGoogle(page);
  const calls = await counterCalls(page);
  await page.goto('/sample/');
  await page.locator('[data-numberstuff-consent]').click();
  await expect(page.locator(banner)).toBeVisible();
  google.length = 0;
  await Promise.all([page.waitForEvent('load'), page.locator(`${banner} [data-numberstuff-choice="denied"]`).click()]);
  const names = (await context.cookies()).map((c) => c.name);
  expect(names).not.toContain('_ga');
  expect(names).not.toContain('_ga_TEST');
  expect((await context.cookies()).find((c) => c.name === 'numberstuff_consent')?.value).toBe('denied');
  expect(google).toEqual([]);
  expect(calls).toEqual([]);
});

test('the banner speaks Portuguese on Portuguese pages', async ({ page }) => {
  await trackGoogle(page);
  await page.goto('/pt/amostra/');
  await expect(page.locator(`${banner} [data-numberstuff-choice="granted"]`)).toHaveText('Aceitar');
  await expect(page.locator(`${banner} [data-numberstuff-choice="denied"]`)).toHaveText('Recusar');
});
