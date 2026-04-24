import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Frontdesk workflow', () => {
  test('@readonly @frontdesk @smoke 家長可切換孩童的四個主要頁籤', async ({ page, accounts, names }) => {
    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(names.frontdeskExistingChildName);
    await frontdesk.openDevelopmentTab();
    await frontdesk.openRecordTab();
    await frontdesk.openAdviceTab();
    await frontdesk.openProfileTab();
    await expect(page.locator('body')).toBeVisible();
  });

  test('@readonly @frontdesk @smoke 家長可開啟 FAQ 與 About 頁面', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openFaq();
    await expect(page.locator('body')).toContainText(/faq/i);
    await frontdesk.openAbout();
    await expect(page).toHaveURL(/about/i);
  });

  test('@readonly @workflow @frontdesk 家長可切換最新建議與歷史紀錄', async ({ page, accounts, names }) => {
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
