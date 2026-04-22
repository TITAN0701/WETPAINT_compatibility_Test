import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { MediaFlowPage } from '../../src/pages/media-flow-page';
import { test } from '../../src/fixtures/test';

test.describe('Media flow compatibility', () => {
  test('@compat @stateful @media @workflow 手機與平板可從開始檢測進入題目或上傳區', async ({ page, accounts, names }, testInfo) => {
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
    await mediaFlow.beginAssessmentFlow({ tutorialAction: 'start', answerFirstQuestion: true });
    await mediaFlow.expectQuestionOrUploadArea();
  });

  test('@compat @stateful @media @workflow 若提供影片檔可執行上傳與預覽檢查', async ({ page, accounts, names, assets }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');
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
    await mediaFlow.beginAssessmentFlow({ tutorialAction: 'start', answerFirstQuestion: true });
    await mediaFlow.uploadMedia(assets.mediaVideoPath);
    await mediaFlow.expectPreviewOrRetryVisible();
    await mediaFlow.clickRetryIfPresent();
  });
});
