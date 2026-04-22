import { test as base, expect } from '@playwright/test';
import { appAccounts, appAssets, appNames, type AppAccounts, type AppAssets, type AppNames } from '../helpers/env';
import { waitForUiSettled } from '../helpers/locator';
import { defaultChildProfile, type ChildProfileData } from './child-data';

type AppFixtures = {
  accounts: AppAccounts;
  assets: AppAssets;
  names: AppNames;
  childProfile: ChildProfileData;
  reportScreenshot: void;
};

export const test = base.extend<AppFixtures>({
  accounts: async ({}, use) => {
    await use(appAccounts);
  },
  assets: async ({}, use) => {
    await use(appAssets);
  },
  names: async ({}, use) => {
    await use(appNames);
  },
  childProfile: async ({}, use) => {
    await use(defaultChildProfile);
  },
  reportScreenshot: [
    async ({ page }, use, testInfo) => {
      await use();

      if (testInfo.status === 'skipped' || page.isClosed()) {
        return;
      }

      await waitForUiSettled(page).catch(() => undefined);
      await page.waitForTimeout(300).catch(() => undefined);

      const screenshot = await page
        .screenshot({
          type: 'png',
          fullPage: true,
          animations: 'disabled',
          caret: 'hide'
        })
        .catch(() => null);

      if (!screenshot) {
        return;
      }

      await testInfo.attach('inline-report-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
    },
    { auto: true }
  ]
});

export { expect };
