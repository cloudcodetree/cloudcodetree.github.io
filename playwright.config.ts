import { defineConfig, devices } from '@playwright/test';

const remote = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: remote || 'http://127.0.0.1:8788',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: remote ? undefined : {
    command: 'pnpm exec wrangler dev --local --ip 127.0.0.1 --port 8788',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
