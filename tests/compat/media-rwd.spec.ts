import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { test } from '../../src/fixtures/test';

test.describe('Responsive navigation compatibility', () => {
  test('@compat @readonly @rwd 行動版可看到 hamburger 或底部孩童抽屜入口', async ({ page, accounts }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.expectResponsiveNavigationEntry();
  });

  test('@compat @readonly @rwd modal 開啟後背景應進入鎖定狀態', async ({ page, accounts }, testInfo) => {
    test.skip(/iphone|android/.test(testInfo.project.name), 'desktop/tablet only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await childDialog.openCreateDialog();
    await childDialog.expectModalScrollLock();
  });
});
