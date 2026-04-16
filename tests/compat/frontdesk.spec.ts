import { AdminShellPage } from '../../src/pages/admin-shell';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Frontdesk compatibility', () => {
  test('@compat 管理者可切換前台並開啟孩童四個主要頁籤', async ({ page, accounts, names }) => {
    const loginPage = new LoginPage(page);
    const adminShell = new AdminShellPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await adminShell.gotoFrontdeskFromUserMenu();
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(names.frontdeskExistingChildName);
    await frontdesk.openDevelopmentTab();
    await frontdesk.openRecordTab();
    await frontdesk.openAdviceTab();
    await frontdesk.openProfileTab();
    await expect(page.locator('body')).toContainText(/發展|檢測|建議|孩童/);
  });

  test('@compat 家長可開啟 FAQ 與 About 頁面', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openFaq();
    await expect(page.locator('body')).toContainText(/FAQ|孩子|研究/);
    await frontdesk.openAbout();
    await expect(page.locator('body')).toContainText(/關於我們|團隊|單位/);
  });

  test('@compat 家長可進入建議區並切換最新結果與歷史紀錄', async ({ page, accounts, names }) => {
    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(names.childDisplayName);
    await frontdesk.openAdviceTab();
    await frontdesk.openLatestAdvice();
    await frontdesk.expectAdviceArea();
    await frontdesk.openAdviceHistory();
    await frontdesk.expectAdviceArea();
  });
});
