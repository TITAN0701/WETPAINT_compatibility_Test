import { AdminShellPage } from '../../src/pages/admin-shell';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Admin management compatibility', () => {
  test('@compat 後台主要管理頁可切換', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    const adminShell = new AdminShellPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await adminShell.expectAdminShellReady();
    await adminShell.gotoDashboard();
    await adminShell.gotoChildList();
    await expect(page.locator('body')).toContainText(/孩童列表|孩童檔案/);
    await adminShell.gotoQuestionManage();
    await expect(page.locator('body')).toContainText(/題目管理|AI題組|圖卡/);
    await adminShell.gotoInviteManage();
    await expect(page.locator('body')).toContainText(/邀請管理|邀請連結|角色/);
    await adminShell.gotoAbout();
    await expect(page.locator('body')).toContainText(/關於我們/);
  });
});
