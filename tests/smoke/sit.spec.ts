import { AdminShellPage } from '../../src/pages/admin-shell';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('SIT smoke', () => {
  test('@smoke @readonly @admin 管理者可登入後台並切換到前台', async ({ page, accounts }, testInfo) => {
    test.skip(/iphone|android|ipad/.test(testInfo.project.name), 'desktop admin smoke only');

    const loginPage = new LoginPage(page);
    const adminShell = new AdminShellPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await adminShell.expectAdminShellReady();
    await adminShell.gotoDashboard();
    await adminShell.gotoChildList();
    await adminShell.gotoFrontdeskFromUserMenu();
    await frontdesk.expectLoaded();
  });

  test('@smoke @readonly @mobile @frontdesk 家長可登入前台並載入手機首頁', async ({ page, accounts }, testInfo) => {
    test.skip(!/iphone|android/.test(testInfo.project.name), 'mobile smoke only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await expect(page.locator('body')).toBeVisible();
  });

  test('@compat @readonly @media 可從前台看見 AI 題組入口', async ({ page, accounts, names }, testInfo) => {
    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();

    if (!/iphone|android|ipad/.test(testInfo.project.name)) {
      await frontdesk.openChildByName(names.aiChildDisplayName);
    }

    await frontdesk.openDevelopmentTab();
    await frontdesk.expectAssessmentEntryVisible();
    await expect(page.locator('body')).toBeVisible();
  });
});
