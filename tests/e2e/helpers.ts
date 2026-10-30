import type { Page } from '@playwright/test';

const GOOGLE = /(^|\.)(googletagmanager|google-analytics|doubleclick|google)\.(com|net)$/;

export async function trackGoogle(page: Page): Promise<string[]> {
  const hits: string[] = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (GOOGLE.test(url.hostname)) {
      hits.push(url.href);
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    }
    return route.continue();
  });
  return hits;
}

export async function counterCalls(page: Page): Promise<string[]> {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/wp-json/numberstuff/v1/consent')) {
      calls.push(request.postData() ?? '');
    }
  });
  return calls;
}

export async function dataLayer(page: Page): Promise<unknown[]> {
  return page.evaluate(() =>
    (window as unknown as { dataLayer: unknown[] }).dataLayer.map((entry) =>
      entry && typeof entry === 'object' && 'length' in (entry as object) ? Array.from(entry as ArrayLike<unknown>) : entry,
    ),
  );
}
