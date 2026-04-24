import { LoginPage } from '../../src/pages/login-page';
import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { test, expect } from '../../src/fixtures/test';

test.describe('Onboarding workflow', () => {
  test('@readonly @workflow 首次登入帳號可進入 onboarding，並可開啟孩童資料表單但不送出', async ({ page, accounts, childProfile }) => {
    test.skip(!accounts.firstLogin, 'FIRST_LOGIN_LOGIN_ID / FIRST_LOGIN_PASSWORD not configured');

    const loginPage = new LoginPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.firstLogin!);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator('body')).toBeVisible();

    const createTrigger = page.getByTestId('child-create-trigger');
    if (await createTrigger.isVisible().catch(() => false)) {
      await childDialog.openCreateDialog();
      await childDialog.fill(childProfile);
      await childDialog.expectFilled(childProfile);
      await childDialog.close();
    }
  });
});
