import type { Page } from '@playwright/test';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { MediaFlowPage } from '../../src/pages/media-flow-page';
import { test } from '../../src/fixtures/test';

async function openMediaAssessment({
  page,
  accounts,
  names
}: {
  page: Page;
  accounts: { frontdeskParent: { loginId: string; password: string } };
  names: { aiChildDisplayName: string };
}) {
  const loginPage = new LoginPage(page);
  const frontdesk = new FrontdeskPage(page);
  const mediaFlow = new MediaFlowPage(page);

  await loginPage.goto();
  await loginPage.login(accounts.frontdeskParent);
  await frontdesk.expectLoaded();
  await frontdesk.openChildByName(names.aiChildDisplayName);
  await frontdesk.openDevelopmentTab();
  await frontdesk.openAssessmentEntry();

  return mediaFlow;
}

test.describe('Media flow compatibility', () => {
  test('@compat @stateful @media @mobile 手機與平板可進入題目或上傳互動區，主要控制不應超出 viewport', async ({ page, accounts, names }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');

    const mediaFlow = await openMediaAssessment({ page, accounts, names });
    const progress = await mediaFlow.advanceUntilState(['question', 'upload'], {
      tutorialAction: 'start',
      autoAnswerQuestions: false
    });

    await testInfo.attach('assessment-progress', {
      body: Buffer.from(`state=${progress.state}\nansweredQuestions=${progress.answeredQuestions}\n`, 'utf-8'),
      contentType: 'text/plain'
    });

    await mediaFlow.expectQuestionOrUploadArea();
    await mediaFlow.expectPrimaryInteractionWithinViewport();
  });

  test('@compat @stateful @media @mobile 手機與平板的上傳控制應可見且不被 viewport 遮住', async ({ page, accounts, names }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');

    const mediaFlow = await openMediaAssessment({ page, accounts, names });
    const progress = await mediaFlow.advanceUntilState(['upload', 'question'], {
      tutorialAction: 'start',
      autoAnswerQuestions: true
    });

    await testInfo.attach('assessment-progress', {
      body: Buffer.from(`state=${progress.state}\nansweredQuestions=${progress.answeredQuestions}\n`, 'utf-8'),
      contentType: 'text/plain'
    });

    await mediaFlow.expectUploadControlVisible();
    await mediaFlow.expectUploadControlWithinViewport();
  });

  test('@compat @stateful @media @mobile 若提供影片檔，手機與平板上傳後應顯示預覽或重試控制', async ({ page, accounts, names, assets }, testInfo) => {
    test.skip(!/iphone|android|ipad/.test(testInfo.project.name), 'mobile and tablet only');
    test.skip(!assets.mediaVideoPath, 'MEDIA_VIDEO_PATH not configured');

    const mediaFlow = await openMediaAssessment({ page, accounts, names });
    const progress = await mediaFlow.advanceUntilState(['upload', 'question'], {
      tutorialAction: 'start',
      autoAnswerQuestions: true
    });

    await testInfo.attach('assessment-progress', {
      body: Buffer.from(`state=${progress.state}\nansweredQuestions=${progress.answeredQuestions}\n`, 'utf-8'),
      contentType: 'text/plain'
    });

    await mediaFlow.uploadMedia(assets.mediaVideoPath);
    await mediaFlow.expectSelectedMediaAttached();
    await mediaFlow.expectPreviewOrRetryVisible();
    await mediaFlow.expectPreviewOrRetryWithinViewport();
    await mediaFlow.clickRetryIfPresent();
  });
});
