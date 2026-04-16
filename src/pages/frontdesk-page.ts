import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, firstVisible, normalizeText } from '../helpers/locator';

export class FrontdeskPage {
  constructor(private readonly page: Page) {}

  private async firstTabByLabel(label: string): Promise<Locator> {
    return firstVisible(
      [
        this.page.getByRole('tab', { name: label }),
        this.page.locator('button, div, span').filter({ hasText: label })
      ],
      { name: `frontdesk tab ${label}` }
    );
  }

  async expectLoaded() {
    await expectAnyVisible(
      [
        this.page.locator('header nav'),
        this.page.getByText(/孩童檔案|FAQs|關於我們/),
        this.page.locator('div.fixed.bottom-0.left-0.right-0.cursor-pointer')
      ],
      { name: 'frontdesk root' }
    );
  }

  async openChildByName(name: string) {
    const normalized = normalizeText(name);
    const mobileTrigger = this.page.locator('div.fixed.bottom-0.left-0.right-0.cursor-pointer').filter({ hasText: /孩童|檔案|child/i });
    if ((await mobileTrigger.count()) > 0 && (await mobileTrigger.first().isVisible())) {
      await mobileTrigger.first().click();
    }

    const childCandidates = [
      this.page.locator('div.group.cursor-pointer').filter({ hasText: name }),
      this.page.locator('div.cursor-pointer').filter({ hasText: name }),
      this.page.locator('span').filter({ hasText: name }).locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
    ];

    const childCard = await firstVisible(childCandidates, { name: `child card ${name}`, timeoutMs: 10_000 });
    await childCard.scrollIntoViewIfNeeded();
    await childCard.click();

    await expect
      .poll(async () => normalizeText(await this.page.locator('body').innerText()), {
        timeout: 10_000
      })
      .toContain(normalized);
  }

  async openDevelopmentTab() {
    const tab = await this.firstTabByLabel('發展檢測');
    await tab.click();
  }

  async openRecordTab() {
    const tab = await this.firstTabByLabel('檢測紀錄');
    await tab.click();
  }

  async openAdviceTab() {
    const tab = await this.firstTabByLabel('發展結果與建議');
    await tab.click();
  }

  async openProfileTab() {
    const tab = await this.firstTabByLabel('孩童資料');
    await tab.click();
  }

  async openLatestAdvice() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: '最新檢測結果' }),
        this.page.locator('button, div, span').filter({ hasText: '最新檢測結果' })
      ],
      { name: 'latest advice button' }
    );
  }

  async openAdviceHistory() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: '歷史紀錄' }),
        this.page.locator('button, div, span').filter({ hasText: '歷史紀錄' })
      ],
      { name: 'advice history button' }
    );
  }

  async expectAdviceArea() {
    await expectAnyVisible(
      [
        this.page.getByText(/最新檢測結果|歷史紀錄|查看就醫地圖/),
        this.page.locator('canvas, svg')
      ],
      { name: 'advice area' }
    );
  }

  async openFaq() {
    await clickFirstVisible(
      [
        this.page.getByRole('link', { name: 'FAQs' }),
        this.page.getByRole('button', { name: 'FAQs' })
      ],
      { name: 'faq nav' }
    );
  }

  async openAbout() {
    await clickFirstVisible(
      [
        this.page.getByRole('link', { name: '關於我們' }),
        this.page.getByRole('button', { name: '關於我們' })
      ],
      { name: 'about nav' }
    );
  }

  async openAssessmentEntry() {
    await clickFirstVisible(
      [
        this.page.locator('button').filter({ hasText: /開始|繼續|續答|進行評估|開始檢測/ }),
        this.page.locator('div, span').filter({ hasText: /開始|繼續|續答|進行評估|開始檢測/ })
      ],
      { name: 'assessment entry' }
    );
  }
}
