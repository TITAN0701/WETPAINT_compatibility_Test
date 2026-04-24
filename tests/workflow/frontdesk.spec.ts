import { expect } from '@playwright/test';
import { AdminShellPage } from '../../src/pages/admin-shell';
import { test } from '../../src/fixtures/test';
import { waitForUiSettled } from '../../src/helpers/locator';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';

async function ensureFrontdeskContext({
  page,
  accounts
}: {
  page: import('@playwright/test').Page;
  accounts: { frontdeskParent: { loginId: string; password: string } };
}) {
  const loginPage = new LoginPage(page);
  const adminShell = new AdminShellPage(page);
  const frontdesk = new FrontdeskPage(page);

  await loginPage.goto();
  await loginPage.login(accounts.frontdeskParent);
  await waitForUiSettled(page).catch(() => undefined);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!(await adminShell.isLoaded(2_000))) {
      break;
    }

    await adminShell.gotoFrontdeskFromUserMenu().catch(() => undefined);
    await waitForUiSettled(page, 8_000).catch(() => undefined);
  }

  if (/\/admin\//.test(page.url())) {
    const frontdeskUrl = new URL('/developmental', page.url()).toString();
    await page.goto(frontdeskUrl, { waitUntil: 'domcontentloaded' });
    await waitForUiSettled(page, 8_000).catch(() => undefined);
  }

  await expect
    .poll(async () => page.url(), { timeout: 15_000 })
    .not.toMatch(/\/admin\//);

  await frontdesk.expectLoaded();
  return frontdesk;
}

test.describe('Frontdesk workflow', () => {
  test('@readonly @frontdesk @smoke 家長可進入前台並檢查主要互動', async ({ page, accounts, names }, testInfo) => {
    const frontdesk = await ensureFrontdeskContext({ page, accounts });
    const isMobileProject = /iphone|android|ipad/.test(testInfo.project.name);

    await frontdesk.openChildByName(names.frontdeskExistingChildName);

    if (isMobileProject) {
      await frontdesk.expectResponsiveNavigationEntry();
      await frontdesk.expectAssessmentEntryVisible();
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    await frontdesk.openDevelopmentTab();
    await frontdesk.openRecordTab();
    await frontdesk.openAdviceTab();
    await frontdesk.openProfileTab();
    await expect(page.locator('body')).toBeVisible();
  });

  test('@readonly @frontdesk @smoke 家長可開啟 FAQ 與 About 頁面', async ({ page, accounts }, testInfo) => {
    const frontdesk = await ensureFrontdeskContext({ page, accounts });
    const isMobileProject = /iphone|android|ipad/.test(testInfo.project.name);

    await frontdesk.openFaq();
    await expect(page).toHaveURL(/faqs/i);

    if (isMobileProject) {
      const aboutUrl = new URL('/about', page.url()).toString();
      await page.goto(aboutUrl, { waitUntil: 'domcontentloaded' });
      await waitForUiSettled(page, 8_000).catch(() => undefined);
    } else {
      await frontdesk.openAbout();
    }

    await expect(page).toHaveURL(/about/i);
  });

  test('@readonly @workflow @frontdesk 家長可切換最新建議與歷史紀錄', async ({ page, accounts, names }) => {
    const frontdesk = await ensureFrontdeskContext({ page, accounts });

    await frontdesk.openChildByName(names.childDisplayName);
    await frontdesk.openAdviceTab();
    await frontdesk.openLatestAdvice();
    await frontdesk.expectAdviceArea();
    await frontdesk.openAdviceHistory();
    await frontdesk.expectAdviceArea();
  });
});
