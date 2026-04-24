import { AdminShellPage } from '../../src/pages/admin-shell';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Admin workflow', () => {
  test('@readonly @admin @smoke 後台主要管理頁可切換', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    const adminShell = new AdminShellPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await adminShell.expectAdminShellReady();
    await adminShell.gotoDashboard();
    await adminShell.gotoChildList();
    await adminShell.gotoQuestionManage();
    await adminShell.gotoInviteManage();
    await adminShell.gotoAbout();
    await expect(page).toHaveURL(/\/admin\/about/);
  });
});
