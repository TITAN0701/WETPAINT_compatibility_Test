import { expectAnyVisible, firstVisible } from '../helpers/locator';
import type { Page } from '@playwright/test';

export class MediaFlowPage {
  constructor(private readonly page: Page) {}

  async expectQuestionOrUploadArea() {
    await expectAnyVisible(
      [
        this.page.locator('input[type="file"]'),
        this.page.getByText(/上傳影片|重新錄製|下一題|完成作答|略過教學/),
        this.page.locator('video')
      ],
      { name: 'assessment media/question area', timeoutMs: 15_000 }
    );
  }

  async skipTutorialIfPresent() {
    const candidate = this.page.locator('button').filter({ hasText: /略過教學|跳過|略過/ }).first();
    if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
      await candidate.click();
    }
  }

  async answerFirstChoiceIfPresent() {
    const candidate = this.page.locator('button').filter({ hasText: /是|否|正確|不正確|沒反應/ }).first();
    if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
      await candidate.click();
    }
  }

  async clickNextIfPresent() {
    const candidate = this.page.locator('button').filter({ hasText: /下一題|下一步|繼續/ }).first();
    if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
      await candidate.click();
    }
  }

  async uploadMedia(filePath?: string) {
    await this.expectQuestionOrUploadArea();
    if (!filePath) {
      return;
    }

    const uploadTarget = await firstVisible(
      [
        this.page.locator('input[type="file"]'),
        this.page.locator('button').filter({ hasText: /上傳影片|選擇檔案/ })
      ],
      { name: 'media upload control' }
    );

    if ((await uploadTarget.evaluate((node) => node.tagName.toLowerCase())) === 'input') {
      await uploadTarget.setInputFiles(filePath);
    } else {
      await this.page.locator('input[type="file"]').first().setInputFiles(filePath);
    }
  }

  async expectPreviewOrRetryVisible() {
    await expectAnyVisible(
      [
        this.page.locator('video'),
        this.page.getByText(/重新錄製|重新上傳|播放/)
      ],
      { name: 'media preview or retry' }
    );
  }

  async clickRetryIfPresent() {
    const retryButton = this.page.locator('button').filter({ hasText: /重新錄製|重新上傳/ }).first();
    if ((await retryButton.count()) > 0 && (await retryButton.isVisible())) {
      await retryButton.click();
    }
  }

  async completeIfPresent() {
    const completeButton = this.page.locator('button').filter({ hasText: /完成作答|完成|提交/ }).first();
    if ((await completeButton.count()) > 0 && (await completeButton.isVisible())) {
      await completeButton.click();
    }
  }

  async expectCompletionArea() {
    await expectAnyVisible(
      [
        this.page.getByText(/完成|結果|雷達圖|歷史紀錄|建議/),
        this.page.locator('canvas, svg')
      ],
      { name: 'completion area', timeoutMs: 20_000 }
    );
  }
}
