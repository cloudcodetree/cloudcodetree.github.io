import { test, expect } from '@playwright/test';

test('homepage renders without JavaScript and keeps the archive out of HTML', async ({ browser, request, baseURL }) => {
  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();
  expect(Buffer.byteLength(await response.text())).toBeLessThan(400_000);
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  const main = page.locator('main');
  await expect(main).toBeVisible();
  expect(await main.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  await expect(page.getByRole('heading', { name: 'AI News', exact: true })).toBeVisible();
  await expect(main.locator('a[href^="/ai-news/20"]').first()).toBeVisible();
  await context.close();
});

test('homepage hydrates without browser errors or CSP violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    (window as unknown as { cspErrors: string[] }).cspErrors = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as unknown as { cspErrors: string[] }).cspErrors.push(event.blockedURI);
    });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Full feed', exact: true })).toBeVisible();
  await expect(page.locator('main a[href^="/ai-news/20"]').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  const scripts = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'script')
    .reduce((bytes, entry) => bytes + (entry as PerformanceResourceTiming).decodedBodySize, 0));
  expect(scripts).toBeLessThan(1_200_000);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { cspErrors: string[] }).cspErrors)).toEqual([]);
});

test('contact accepts keyboard-only input and submit without a timing gate', async ({ page }) => {
  let submitted = 0;
  // Never send a real message, including when run against production.
  await page.route('https://api.web3forms.com/**', async (route) => {
    submitted++;
    await route.fulfill({ json: { success: true } });
  });
  await page.goto('/about/contact/');
  await page.locator('#contact-name').focus();
  await page.keyboard.insertText('Browser regression');
  await page.keyboard.press('Tab');
  await page.keyboard.insertText('browser-test@example.invalid');
  await page.keyboard.press('Tab');
  await page.keyboard.insertText('Mock submission');
  await page.keyboard.press('Tab');
  await page.keyboard.insertText('This request is intercepted by Playwright.');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send Message', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Send Message', exact: true })).toBeEnabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('main').getByRole('alert')).toContainText('Thank you for your message');
  expect(submitted).toBe(1);
});

test('mobile navigation opens, closes and navigates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'open drawer' }).click();
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await expect(page.getByRole('button', { name: 'Close navigation' })).toBeHidden();
  await page.getByRole('button', { name: 'open drawer' }).click();
  await page.getByRole('link', { name: 'Tutorials', exact: true }).click();
  await expect(page).toHaveURL(/\/tutorials\//);
});

test('archive pagination and full feed load individual article bodies', async ({ page }) => {
  const bodies = new Set<string>();
  let bulkDownloads = 0;
  page.on('request', (request) => {
    if (request.url().includes('/blog/bodies/')) bodies.add(request.url());
    if (new URL(request.url()).pathname === '/blog/posts.json') bulkDownloads++;
  });
  await page.goto('/?page=2');
  await expect(page.getByRole('button', { name: 'page 2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('main a[href^="/ai-news/20"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Full feed', exact: true }).click();
  await expect.poll(() => bodies.size).toBe(5);
  await expect(page.locator('main article').first().locator('p').last()).toBeVisible();
  expect(bulkDownloads).toBe(0);
});

test('archive failures show a working retry', async ({ page }) => {
  let fail = true;
  await page.route('**/blog/archive/*.json', (route) => fail
    ? route.fulfill({ status: 503, body: 'unavailable' }) : route.continue());
  await page.goto('/?page=2');
  await expect(page.locator('main').getByRole('alert')).toContainText('archive');
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toBeHidden();
  await expect(page.locator('main a[href^="/ai-news/20"]').first()).toBeVisible();
});

test('a rejected contact submission shows an error and preserves the message', async ({ page }) => {
  await page.route('https://api.web3forms.com/**', (route) => route.fulfill({ json: { success: false } }));
  await page.goto('/about/contact/');
  await page.locator('#contact-name').fill('Browser regression');
  await page.locator('#contact-email').fill('browser-test@example.invalid');
  await page.locator('#contact-subject').fill('Mock rejection');
  await page.locator('#contact-message').fill('Keep this message when submission fails.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Failed to send');
  await expect(page.locator('#contact-message')).toHaveValue('Keep this message when submission fails.');
  await expect(page.getByRole('button', { name: 'Send Message', exact: true })).toBeEnabled();
});

test('saved posts recover from a failed read instead of reporting an empty list', async ({ page, request }) => {
  const home = await (await request.get('/')).text();
  const postId = /href="\/ai-news\/(20[^/]+)\//.exec(home)![1];
  let reads = 0;
  let fail = true;
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', email: 'browser-test@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const expires_at = Math.floor(Date.now() / 1000) + 3600;
  const access_token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp: expires_at })).toString('base64url'), 'mock-signature'].join('.');
  await page.addInitScript((session) => localStorage.setItem('sb-tgcysgioncdmtzcfknix-auth-token', JSON.stringify(session)), {
    access_token, refresh_token: 'mock-refresh', expires_at, expires_in: 3600, token_type: 'bearer', user,
  });
  // All auth/storage requests are mocked; no live reader account is used.
  await page.route('**/api/session', (route) => route.fulfill({ json: { ok: true } }));
  await page.route('https://*.supabase.co/**', (route) => {
    if (route.request().url().includes('/rest/v1/reader_state')) {
      reads++;
      return fail ? route.fulfill({ status: 503, json: { message: 'offline' } })
        : route.fulfill({ json: [{ post_id: postId, saved: true, read_at: null }] });
    }
    return route.fulfill({ json: route.request().url().includes('/auth/') ? { user } : [] });
  });
  await page.goto('/saved/');
  await expect(page.locator('main').getByRole('alert')).toContainText('could not be loaded');
  await expect(page.getByText('// nothing saved yet', { exact: false })).toBeHidden();
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator(`main a[href="/ai-news/${postId}/"]`).first()).toBeVisible();
  await expect(page.locator('main').getByRole('alert')).toBeHidden();
  expect(reads).toBeGreaterThanOrEqual(2);
});
