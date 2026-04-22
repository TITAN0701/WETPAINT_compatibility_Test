import type { Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, firstVisible, maybeFirstVisible, waitForUiSettled } from '../helpers/locator';

export type AssessmentScreenState = 'overview' | 'tutorial' | 'question' | 'upload' | 'unknown';
export type AssessmentTutorialAction = 'start';

export class MediaFlowPage {
  constructor(private readonly page: Page) {}

  private startEntryCandidates() {
    return [
      this.page.getByTestId('assessment-start'),
      this.page.getByTestId('assessment-resume'),
      this.page.getByRole('button').filter({ hasText: /開始檢測|繼續檢測|start|resume|assessment/i }).first(),
      this.page.locator('button, a, div, span').filter({ hasText: /開始檢測|繼續檢測|start|resume|assessment/i }).first()
    ];
  }

  private overviewCandidates() {
    return [
      this.page.getByRole('heading', { name: /測驗總覽|overview/i }),
      this.page.getByText(/測驗總覽|測驗須知|overview/i),
      this.page.locator('body').getByText(/WETPAINT/i).first()
    ];
  }

  private overviewActionCandidates() {
    return [
      ...this.startEntryCandidates(),
      this.page.getByRole('button').filter({ hasText: /開始|繼續|下一步|start|continue|next/i }).first(),
      this.page.locator('button').filter({ hasText: /開始|繼續|下一步|start|continue|next/i }).first()
    ];
  }

  private tutorialActionCandidates(action: AssessmentTutorialAction) {
    return [
      this.page.getByRole('button').filter({ hasText: /開始錄製|開始拍照|開始|start/i }).first(),
      this.page.locator('button').filter({ hasText: /開始錄製|開始拍照|開始|start/i }).first()
    ];
  }

  private tutorialCandidates() {
    return [
      ...this.tutorialActionCandidates('start'),
      this.page.getByText(/教學|錄製|拍照|tutorial/i)
    ];
  }

  private choiceCandidates() {
    return [
      this.page.getByRole('button').filter({ hasText: /是|否|不知道|yes|no|unknown/i }).first(),
      this.page.locator('button').filter({ hasText: /是|否|不知道|yes|no|unknown/i }).first()
    ];
  }

  private nextCandidates() {
    return [
      this.page.getByTestId('assessment-next'),
      this.page.getByRole('button').filter({ hasText: /下一題|下一步|繼續|next|continue/i }).first(),
      this.page.locator('button').filter({ hasText: /下一題|下一步|繼續|next|continue/i }).first()
    ];
  }

  private uploadCandidates() {
    return [
      this.page.getByTestId('assessment-upload-video'),
      this.page.locator('input[type="file"]'),
      this.page.locator('button').filter({ hasText: /上傳影片|上傳檔案|upload/i }).first()
    ];
  }

  private questionCandidates() {
    return [
      ...this.choiceCandidates(),
      ...this.nextCandidates(),
      ...this.uploadCandidates(),
      this.page.locator('video'),
      this.page.getByText(/題目|下一題|question|upload/i)
    ];
  }

  async getScreenState(): Promise<AssessmentScreenState> {
    await waitForUiSettled(this.page, 5_000).catch(() => undefined);

    if (await maybeFirstVisible(this.overviewCandidates(), { name: 'assessment overview', timeoutMs: 750 })) {
      return 'overview';
    }

    if (await maybeFirstVisible(this.tutorialCandidates(), { name: 'assessment tutorial', timeoutMs: 750 })) {
      return 'tutorial';
    }

    if (await maybeFirstVisible([...this.uploadCandidates(), this.page.locator('video')], { name: 'assessment upload', timeoutMs: 750 })) {
      return 'upload';
    }

    if (await maybeFirstVisible(this.questionCandidates(), { name: 'assessment question', timeoutMs: 750 })) {
      return 'question';
    }

    return 'unknown';
  }

  async openEntryIfNeeded() {
    if ((await this.getScreenState()) !== 'unknown') {
      return;
    }

    const entry = await maybeFirstVisible(this.startEntryCandidates(), { name: 'assessment entry', timeoutMs: 2_000 });
    if (!entry) {
      return;
    }

    await entry.click();
    await waitForUiSettled(this.page, 6_000).catch(() => undefined);
  }

  async beginAssessmentFlow(options: { tutorialAction?: AssessmentTutorialAction; answerFirstQuestion?: boolean } = {}) {
    const tutorialAction = options.tutorialAction ?? 'start';
    const answerFirstQuestion = options.answerFirstQuestion ?? false;

    await this.openEntryIfNeeded();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const screenState = await this.getScreenState();

      if (screenState === 'overview') {
        await clickFirstVisible(this.overviewActionCandidates(), { name: 'assessment overview action' });
        await waitForUiSettled(this.page, 6_000).catch(() => undefined);
        continue;
      }

      if (screenState === 'tutorial') {
        await clickFirstVisible(this.tutorialActionCandidates(tutorialAction), { name: `assessment tutorial ${tutorialAction}` });
        await waitForUiSettled(this.page, 6_000).catch(() => undefined);
        continue;
      }

      if (screenState === 'question' && answerFirstQuestion) {
        await this.answerFirstChoiceIfPresent();
        await this.clickNextIfPresent();
        await waitForUiSettled(this.page, 6_000).catch(() => undefined);
        const nextState = await this.getScreenState();
        if (nextState !== 'unknown') {
          return nextState;
        }
      }

      if (screenState !== 'unknown') {
        return screenState;
      }
    }

    await this.expectQuestionOrUploadArea();
    return this.getScreenState();
  }

  async expectQuestionOrUploadArea() {
    await expectAnyVisible(this.questionCandidates(), { name: 'assessment media/question area', timeoutMs: 15_000 });
  }

  async answerFirstChoiceIfPresent() {
    const candidate = await maybeFirstVisible(this.choiceCandidates(), { name: 'assessment first choice', timeoutMs: 1_000 });
    if (candidate) {
      await candidate.click();
    }
  }

  async clickNextIfPresent() {
    const candidate = await firstVisible(this.nextCandidates(), { name: 'assessment next', timeoutMs: 1_000 }).catch(() => null);
    if (candidate) {
      await candidate.click();
    }
  }

  async uploadMedia(filePath?: string) {
    await this.expectQuestionOrUploadArea();
    if (!filePath) {
      return;
    }

    const uploadTarget = await firstVisible(this.uploadCandidates(), { name: 'media upload control' });

    if ((await uploadTarget.evaluate((node) => node.tagName.toLowerCase())) === 'input') {
      await uploadTarget.setInputFiles(filePath);
    } else {
      await this.page.locator('input[type="file"]').first().setInputFiles(filePath);
    }
  }

  async expectPreviewOrRetryVisible() {
    await expectAnyVisible(
      [
        this.page.getByTestId('assessment-preview-video'),
        this.page.getByTestId('assessment-retry-video'),
        this.page.locator('video'),
        this.page.getByText(/預覽|重錄|retry|preview/i)
      ],
      { name: 'media preview or retry' }
    );
  }

  async clickRetryIfPresent() {
    const retryButton = await firstVisible(
      [
        this.page.getByTestId('assessment-retry-video'),
        this.page.locator('button').filter({ hasText: /重錄|重新上傳|retry/i }).first()
      ],
      { name: 'retry upload', timeoutMs: 1_000 }
    ).catch(() => null);

    if (retryButton) {
      await retryButton.click();
    }
  }

  async completeIfPresent() {
    const completeButton = await firstVisible(
      [
        this.page.getByTestId('assessment-complete'),
        this.page.locator('button').filter({ hasText: /完成|送出|complete/i }).first()
      ],
      { name: 'assessment complete', timeoutMs: 1_000 }
    ).catch(() => null);

    if (completeButton) {
      await completeButton.click();
    }
  }

  async expectCompletionArea() {
    await expectAnyVisible(
      [
        this.page.getByTestId('assessment-result-page'),
        this.page.getByText(/完成|結果|建議|result/i),
        this.page.locator('canvas, svg')
      ],
      { name: 'completion area', timeoutMs: 20_000 }
    );
  }
}
