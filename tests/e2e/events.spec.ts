import { expect, test } from '@playwright/test';
import { dataLayer, trackGoogle } from './helpers';

test.beforeEach(async ({ page }) => {
  await trackGoogle(page);
  await page.addInitScript(() => {
    window.addEventListener('click', (event) => {
      if ((event.target as Element).closest('a[href]')) {
        event.preventDefault();
      }
    });
  });
});

function events(layer: unknown[], name: string) {
  return layer.filter((e) => e && typeof e === 'object' && (e as { event?: string }).event === name);
}

test('PDF link pushes file_download', async ({ page }) => {
  await page.goto('/sample/');
  await page.getByRole('link', { name: 'CV' }).click();
  expect(events(await dataLayer(page), 'file_download')).toEqual([
    expect.objectContaining({ file_name: 'cv.pdf', link_url: expect.stringMatching(/\/cv\.pdf$/) }),
  ]);
});

test('external and mailto links push outbound_click', async ({ page }) => {
  await page.goto('/sample/');
  await page.getByRole('link', { name: 'LinkedIn' }).click();
  await page.getByRole('link', { name: 'Email' }).click();
  expect(events(await dataLayer(page), 'outbound_click')).toEqual([
    expect.objectContaining({ link_url: 'https://www.linkedin.com/in/example' }),
    expect.objectContaining({ link_url: 'mailto:hello@example.com' }),
  ]);
});

test('language switcher pushes language_switch with both languages', async ({ page }) => {
  await page.goto('/sample/');
  await page.locator('.lang-item a[lang="pt-BR"]').first().click();
  expect(events(await dataLayer(page), 'language_switch')).toEqual([
    expect.objectContaining({ language_from: 'en-US', language_to: 'pt-BR' }),
  ]);
});

test('internal links push nothing', async ({ page }) => {
  await page.goto('/sample/');
  await page.locator('[data-numberstuff-consent]').click();
  const layer = await dataLayer(page);
  expect(events(layer, 'outbound_click')).toEqual([]);
  expect(events(layer, 'file_download')).toEqual([]);
});

test('successful form submission pushes generate_lead', async ({ page }) => {
  await page.goto('/sample/');
  const form = page.locator('form.wpforms-form');
  const formId = await form.getAttribute('data-formid');
  await form.getByLabel('Name').fill('Test visitor');
  await form.locator('button[type="submit"]').click();
  await expect.poll(async () => events(await dataLayer(page), 'generate_lead')).toEqual([
    expect.objectContaining({ form_id: formId }),
  ]);
});
