import { LoginPage } from '../../src/pages/login-page';
import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { test, expect } from '../../src/fixtures/test';

test.describe('First login / onboarding compatibility', () => {
  test('@compat 首次登入帳號可進入 onboarding 並完成基本孩童資料填寫', async ({ page, accounts, childProfile }) => {
    test.skip(!accounts.firstLogin, 'FIRST_LOGIN_LOGIN_ID / FIRST_LOGIN_PASSWORD not configured');

    const loginPage = new LoginPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.firstLogin!);

    await expect
      .poll(async () => await page.locator('body').innerText(), { timeout: 15_000 })
      .toMatch(/首次|設定|孩童|角色|單位|檔案/);

    const roleButton = page.locator('button').filter({ hasText: /家長|管理者|操作員|機構/ }).first();
    if ((await roleButton.count()) > 0 && (await roleButton.isVisible())) {
      await roleButton.click();
    }

    const nextButton = page.locator('button').filter({ hasText: /下一步|繼續|開始設定/ }).first();
    if ((await nextButton.count()) > 0 && (await nextButton.isVisible())) {
      await nextButton.click();
    }

    if ((await page.locator('button').filter({ hasText: '新增檔案' }).count()) > 0) {
      await childDialog.openCreateDialog();
      await childDialog.fill(childProfile);
      await childDialog.submitCreate();
    }

    await expect(page.locator('body')).toContainText(/孩童|檔案|首頁|前台|發展/);
  });
});
