import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Child profile compatibility', () => {
  test('@compat 桌機與平板可開啟孩童新增視窗並檢查必填驗證', async ({ page, accounts }, testInfo) => {
    test.skip(/iphone|android/.test(testInfo.project.name), 'desktop/tablet only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await childDialog.openCreateDialog();
    await childDialog.expectModalScrollLock();
    await childDialog.submitCreate();
    await childDialog.expectValidationState();
  });

  test('@compat 桌機與平板可填寫孩童資料欄位並上傳頭像', async ({ page, accounts, childProfile, assets }, testInfo) => {
    test.skip(/iphone|android/.test(testInfo.project.name), 'desktop/tablet only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await childDialog.openCreateDialog();
    await childDialog.fill(childProfile);

    if (assets.avatarPath) {
      await childDialog.uploadAvatar(assets.avatarPath);
    }

    await childDialog.submitCreate();
    await expect(page.locator('body')).toContainText(childProfile.childName);
  });

  test('@compat @rwd @mobile 手機表單至少可輸入且日期欄位不被遮擋', async ({ page, accounts, childProfile }, testInfo) => {
    test.skip(!/iphone|android/.test(testInfo.project.name), 'mobile only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const childDialog = new ChildProfileDialogPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await childDialog.openCreateDialog();
    await childDialog.fill(childProfile);

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();
    const box = await dateInput.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
  });
});
