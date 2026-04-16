import { ChildProfileDialogPage } from '../../src/pages/child-profile-dialog';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { MediaFlowPage } from '../../src/pages/media-flow-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Media and RWD compatibility', () => {
  test('@compat @media 手機與平板 AI 題組可進入上傳或題目區', async ({ page, accounts, names }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const mediaFlow = new MediaFlowPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(names.aiChildDisplayName);
    await frontdesk.openDevelopmentTab();
    await frontdesk.openAssessmentEntry();
    await mediaFlow.skipTutorialIfPresent();
    await mediaFlow.answerFirstChoiceIfPresent();
    await mediaFlow.expectQuestionOrUploadArea();
  });

  test('@compat @media 若提供影片檔可執行上傳與預覽檢查', async ({ page, accounts, names, assets }) => {
    test.skip(!assets.mediaVideoPath, 'MEDIA_VIDEO_PATH not configured');

    const loginPage = new LoginPage(page);
    const frontdesk = new FrontdeskPage(page);
    const mediaFlow = new MediaFlowPage(page);

    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(names.aiChildDisplayName);
    await frontdesk.openDevelopmentTab();
    await frontdesk.openAssessmentEntry();
    await mediaFlow.skipTutorialIfPresent();
    await mediaFlow.uploadMedia(assets.mediaVideoPath);
    await mediaFlow.expectPreviewOrRetryVisible();
    await mediaFlow.clickRetryIfPresent();
  });

  test('@compat @rwd 行動版可看到 hamburger 或底部孩童抽屜入口', async ({ page, accounts }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(accounts.frontdeskParent);

    const responsiveCandidates = [
      page.locator('button[aria-label*="menu" i]').first(),
      page.locator('div.fixed.bottom-0.left-0.right-0.cursor-pointer').first(),
      page.locator('button').filter({ hasText: /選擇孩童|孩童檔案/ }).first()
    ];

    let hasResponsiveEntry = false;
    for (const candidate of responsiveCandidates) {
      if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
        hasResponsiveEntry = true;
        break;
      }
    }

    expect(hasResponsiveEntry).toBeTruthy();
  });

  test('@compat @rwd modal 開啟後背景應進入鎖定狀態', async ({ page, accounts }, testInfo) => {
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
