import { test as base, expect } from '@playwright/test';
import { appAccounts, appAssets, appNames, type AppAccounts, type AppAssets, type AppNames } from '../helpers/env';
import { defaultChildProfile, type ChildProfileData } from './child-data';

type AppFixtures = {
  accounts: AppAccounts;
  assets: AppAssets;
  names: AppNames;
  childProfile: ChildProfileData;
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
  }
});

export { expect };
