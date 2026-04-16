import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

loadEnv();

const baseURL = process.env.PW_BASE_URL || 'http://61.220.55.161:47080';
const defaultTimeout = Number(process.env.PW_DEFAULT_TIMEOUT_MS || 30_000);

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: defaultTimeout,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: 'test-results/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/html', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results/playwright-results.json' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'iphone-safari',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit'
      }
    },
    {
      name: 'android-chrome',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium'
      }
    },
    {
      name: 'ipad-safari',
      use: {
        ...devices['iPad Pro 11'],
        browserName: 'webkit'
      }
    },
    {
      name: 'ipad-chrome',
      use: {
        ...devices['iPad Pro 11'],
        browserName: 'chromium'
      }
    }
  ]
});
