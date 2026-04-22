import { LoginPage } from '../../src/pages/login-page';
import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { test, expect } from '../../src/fixtures/test';

test.describe('First login / onboarding compatibility', () => {
  test('@compat @readonly @workflow 首次登入帳號可進入 onboarding 並檢查基本孩童資料表單，不送出建立', async ({ page, accounts, childProfile }) => {
    test.skip(!accounts.firstLogin, 'FIRST_LOGIN_LOGIN_ID / FIRST_LOGIN_PASSWORD not configured');

    const loginPage = new LoginPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.firstLogin!);

    await expect
      .poll(async () => await page.locator('body').innerText(), { timeout: 15_000 })
      .toMatch(/擐活|閮剖?|摮拍咱|閫|完成|瑼?/);

    const roleButton = page.locator('button').filter({ hasText: /摰園|蝞∠?|家長|管理者/ }).first();
    if ((await roleButton.count()) > 0 && (await roleButton.isVisible())) {
      await roleButton.click();
    }

    const nextButton = page.locator('button').filter({ hasText: /下一步|開始|繼續/ }).first();
    if ((await nextButton.count()) > 0 && (await nextButton.isVisible())) {
      await nextButton.click();
    }

    if ((await page.locator('button').filter({ hasText: /建立檔案|建立孩童/ }).count()) > 0) {
      await childDialog.openCreateDialog();
      await childDialog.fill(childProfile);
      await childDialog.expectFilled(childProfile);
      await childDialog.close();
    }

    await expect(page.locator('body')).toContainText(/摮拍咱|瑼?|擐?|前台|發展/);
  });
});
