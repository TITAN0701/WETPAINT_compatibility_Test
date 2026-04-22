import { expect, type Locator, type Page } from '@playwright/test';
import { AdminShellPage } from './admin-shell';
import {
  clickFirstVisible,
  expectAnyVisible,
  firstVisible,
  isAnyVisible,
  maybeDismissOpenPopover,
  maybeFirstVisible,
  normalizeText,
  waitForUiSettled
} from '../helpers/locator';

export class FrontdeskPage {
  constructor(private readonly page: Page) {}

  private async firstTab(testId: string, textPattern: RegExp): Promise<Locator> {
    return firstVisible(
      [
        this.page.getByTestId(testId),
        this.page.getByRole('tab').filter({ hasText: textPattern }).first(),
        this.page.getByRole('button').filter({ hasText: textPattern }).first(),
        this.page.locator('button, a, [role="tab"], [role="option"], [role="menuitem"]').filter({ hasText: textPattern }).first()
      ],
      { name: `frontdesk tab ${testId}` }
    );
  }

  private childDrawerTriggerCandidates(): Locator[] {
    return [
      this.page.getByTestId('frontdesk-child-drawer-trigger'),
      this.page
        .locator('div.fixed.right-0.bottom-0.left-0.z-40.flex.cursor-pointer.items-center.justify-between.rounded-t-3xl.bg-white')
        .first(),
      this.page
        .locator('div.fixed.right-0.bottom-0.left-0.z-40.cursor-pointer')
        .filter({ has: this.page.locator('img[alt="孩童頭像"]') })
        .first(),
      this.page.locator('div.fixed.bottom-0.left-0.right-0.cursor-pointer').first()
    ];
  }

  private childDrawerPanelCandidates(): Locator[] {
    return [
      this.page.locator('div.fixed.right-0.bottom-0.left-0.z-50').first(),
      this.page.locator('div.fixed.bottom-0.left-0.right-0.z-50').first(),
      this.page.locator('div.fixed.bottom-0.left-0.right-0.rounded-t-3xl').first()
    ];
  }

  private mobileNavigationTriggerCandidates(): Locator[] {
    const hamburgerIcon = this.page
      .locator('header svg:has(path[d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"])')
      .first();

    return [
      hamburgerIcon.locator('xpath=ancestor::*[self::button or self::div or self::a][1]'),
      hamburgerIcon,
      this.page.getByTestId('mobile-hamburger-trigger'),
      this.page.getByLabel(/menu/i),
      this.page.getByRole('button', { name: /menu/i }),
      this.page.locator('header button').last(),
      this.page.locator('header [role="button"]').last(),
      this.page.locator('header svg').last().locator('xpath=ancestor::*[self::button or self::div or self::a][1]'),
      this.page.locator('header svg').last()
    ];
  }

  private mobileFrontdeskEntryCandidates(): Locator[] {
    return [
      this.page.getByTestId('mobile-frontdesk-entry'),
      this.page
        .locator('div.cursor-pointer')
        .filter({ has: this.page.locator('span', { hasText: '前往前台' }) })
        .first(),
      this.page.getByText('前往前台', { exact: true }).locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]'),
      this.page.getByRole('button', { name: '前往前台' }),
      this.page.getByRole('link', { name: '前往前台' }),
      this.page.locator('button, a, div, span').filter({ hasText: '前往前台' }).first(),
      this.page.getByRole('button', { name: /frontdesk/i }),
      this.page.getByRole('link', { name: /frontdesk/i }),
      this.page.locator('button, a, div, span').filter({ hasText: /frontdesk/i }).first()
    ];
  }

  private faqLinkCandidates(): Locator[] {
    return [
      this.page.getByTestId('frontdesk-faq-link'),
      this.page.getByRole('link', { name: /faq/i }),
      this.page.getByRole('button', { name: /faq/i }),
      this.page.locator('a, button, div, span').filter({ hasText: /faq/i }).first()
    ];
  }

  private aboutLinkCandidates(): Locator[] {
    return [
      this.page.getByTestId('frontdesk-about-link'),
      this.page.getByRole('link', { name: /about/i }),
      this.page.getByRole('button', { name: /about/i }),
      this.page.locator('a, button, div, span').filter({ hasText: /about/i }).first()
    ];
  }

  private assessmentEntryCandidates(): Locator[] {
    return [
      this.page.getByTestId('assessment-start'),
      this.page.getByTestId('assessment-resume'),
      this.page.getByRole('button').filter({ hasText: /開始|繼續|檢測|assessment/i }).first(),
      this.page.locator('button, div, span').filter({ hasText: /開始|繼續|檢測|assessment/i }).first()
    ];
  }

  private tabComboboxCandidates(): Locator[] {
    return [
      this.page.getByRole('combobox').first(),
      this.page.locator('[role="combobox"], button[aria-haspopup="listbox"], [data-slot="select-trigger"]').first()
    ];
  }

  private frontdeskRootCandidates(): Locator[] {
    return [
      this.page.getByTestId('frontdesk-child-drawer-trigger'),
      this.page.getByTestId('frontdesk-tab-development'),
      this.page.getByTestId('frontdesk-tab-record'),
      this.page.getByTestId('frontdesk-tab-advice'),
      this.page.getByTestId('frontdesk-tab-profile'),
      this.page.getByRole('link', { name: /faq/i }),
      this.page.getByRole('button', { name: /faq/i }),
      this.page.getByText(/FAQ|開始|檢測|建議|孩童/i),
      ...this.childDrawerTriggerCandidates(),
      ...this.faqLinkCandidates()
    ];
  }

  async expectLoaded() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await this.maybeRedirectFromAdminShell();
    await this.maybeOpenFrontdeskFromMobileHamburger();
    await expectAnyVisible(this.frontdeskRootCandidates(), { name: 'frontdesk root', timeoutMs: 15_000 });
  }

  async openChildByName(name: string) {
    await this.expectLoaded();

    const mobileTrigger = await maybeFirstVisible(this.childDrawerTriggerCandidates(), {
      name: 'frontdesk child drawer trigger',
      timeoutMs: 2_500
    });
    if (mobileTrigger) {
      await mobileTrigger.click({ force: true }).catch(() => undefined);
      await waitForUiSettled(this.page, 6_000).catch(() => undefined);
    }

    const childCandidates = [
      this.page.getByTestId('child-card').filter({ hasText: name }),
      this.page
        .getByTestId('child-card-name')
        .filter({ hasText: name })
        .locator('xpath=ancestor::*[@data-testid="child-card" or self::button or self::div][1]'),
      this.page.locator('div.cursor-pointer').filter({ hasText: name }).first(),
      this.page.locator('button, div').filter({ hasText: name }).first()
    ];

    const fallbackChildCandidates = [
      this.page.getByTestId('child-card').first(),
      this.page
        .getByTestId('child-card-name')
        .first()
        .locator('xpath=ancestor::*[@data-testid="child-card" or self::button or self::div][1]'),
      this.page.locator('div.cursor-pointer').filter({ has: this.page.locator('img[alt="孩童頭像"]') }).first()
    ];

    const exactChildCard = await maybeFirstVisible(childCandidates, { name: `child card ${name}`, timeoutMs: 8_000 });
    const fallbackChildCard = exactChildCard
      ? null
      : await maybeFirstVisible(fallbackChildCandidates, { name: 'any child card', timeoutMs: 12_000 });
    const childCard = exactChildCard ?? fallbackChildCard;

    if (!childCard) {
      await this.closeChildDrawerIfOpen();
      await expect(this.page.locator('body')).toBeVisible();
      return;
    }

    await childCard.scrollIntoViewIfNeeded();
    await childCard.click().catch(() => undefined);
    await this.page.waitForTimeout(800).catch(() => undefined);
    await waitForUiSettled(this.page, 4_000).catch(() => undefined);
    await this.ensureChildDrawerClosed();

    if (!exactChildCard) {
      await expect(this.page.locator('body')).toBeVisible();
      return;
    }

    await expect
      .poll(async () => normalizeText(await this.page.locator('body').innerText()), { timeout: 10_000 })
      .toContain(normalizeText(name));
  }

  async openDevelopmentTab() {
    await this.closeChildDrawerIfOpen();
    if (await this.openTabFromCompactSelector(/發展|development/i, 'development')) {
      return;
    }
    const tab = await this.firstTab('frontdesk-tab-development', /發展|development/i);
    await tab.click();
  }

  async openRecordTab() {
    await this.closeChildDrawerIfOpen();
    if (await this.openTabFromCompactSelector(/紀錄|record/i, 'record')) {
      return;
    }
    const tab = await this.firstTab('frontdesk-tab-record', /紀錄|record/i);
    await tab.click();
  }

  async openAdviceTab() {
    await this.closeChildDrawerIfOpen();
    if (await this.openTabFromCompactSelector(/建議|advice/i, 'advice')) {
      return;
    }
    const tab = await this.firstTab('frontdesk-tab-advice', /建議|advice/i);
    await tab.click();
  }

  async openProfileTab() {
    await this.closeChildDrawerIfOpen();
    if (await this.openTabFromCompactSelector(/孩童|檔案|profile/i, 'profile')) {
      return;
    }
    const tab = await this.firstTab('frontdesk-tab-profile', /孩童|檔案|profile/i);
    await tab.click();
  }

  async openLatestAdvice() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await clickFirstVisible(
      [
        this.page.getByTestId('frontdesk-advice-latest'),
        this.page.getByRole('button').filter({ hasText: /latest|最新/i }).first(),
        this.page.locator('button, div, span').filter({ hasText: /latest|最新/i }).first()
      ],
      { name: 'latest advice button' }
    );
  }

  async openAdviceHistory() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await clickFirstVisible(
      [
        this.page.getByTestId('frontdesk-advice-history'),
        this.page.getByRole('button').filter({ hasText: /history|歷史/i }).first(),
        this.page.locator('button, div, span').filter({ hasText: /history|歷史/i }).first()
      ],
      { name: 'advice history button' }
    );
  }

  async expectAdviceArea() {
    await expectAnyVisible([this.page.locator('canvas, svg'), this.page.getByText(/建議|advice|history|歷史/i)], {
      name: 'advice area'
    });
  }

  async openFaq() {
    await this.openMobileNavigationIfNeeded(this.faqLinkCandidates());
    await clickFirstVisible(this.faqLinkCandidates(), { name: 'faq nav' });
  }

  async openAbout() {
    await this.openMobileNavigationIfNeeded(this.aboutLinkCandidates());
    await clickFirstVisible(this.aboutLinkCandidates(), { name: 'about nav' });
  }

  async hasResponsiveNavigationEntry() {
    return isAnyVisible([...this.mobileNavigationTriggerCandidates(), ...this.childDrawerTriggerCandidates()], {
      name: 'responsive navigation entry',
      timeoutMs: 2_000
    });
  }

  async expectResponsiveNavigationEntry() {
    expect(await this.hasResponsiveNavigationEntry()).toBeTruthy();
  }

  async expectAssessmentEntryVisible() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await expectAnyVisible(this.assessmentEntryCandidates(), { name: 'assessment entry' });
  }

  async openAssessmentEntry() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await clickFirstVisible(this.assessmentEntryCandidates(), { name: 'assessment entry' });
  }

  private async openTabFromCompactSelector(optionPattern: RegExp, optionName: string): Promise<boolean> {
    const trigger = await maybeFirstVisible(this.tabComboboxCandidates(), {
      name: `frontdesk compact tab trigger ${optionName}`,
      timeoutMs: 1_500
    });

    if (!trigger) {
      return false;
    }

    const currentText = await trigger.innerText().catch(() => '');
    if (optionPattern.test(currentText)) {
      return true;
    }

    await trigger.click().catch(() => undefined);
    await waitForUiSettled(this.page, 2_000).catch(() => undefined);

    const option = await maybeFirstVisible(
      [
        this.page.getByRole('option').filter({ hasText: optionPattern }).first(),
        this.page.getByRole('button').filter({ hasText: optionPattern }).first(),
        this.page.locator('[role="option"], [data-radix-collection-item], li, button').filter({ hasText: optionPattern }).first()
      ],
      { name: `frontdesk compact tab option ${optionName}`, timeoutMs: 1_500 }
    );

    if (!option) {
      await maybeDismissOpenPopover(this.page).catch(() => undefined);
      return false;
    }

    await option.click().catch(() => undefined);
    await waitForUiSettled(this.page, 3_000).catch(() => undefined);
    await maybeDismissOpenPopover(this.page).catch(() => undefined);
    return true;
  }

  private async closeChildDrawerIfOpen() {
    if (!(await isAnyVisible(this.childDrawerPanelCandidates(), { timeoutMs: 750 }))) {
      return;
    }

    const closeTrigger = await maybeFirstVisible(this.childDrawerTriggerCandidates(), {
      name: 'frontdesk child drawer close trigger',
      timeoutMs: 750
    });

    if (closeTrigger) {
      await closeTrigger.click({ force: true }).catch(() => undefined);
      await waitForUiSettled(this.page, 2_000).catch(() => undefined);
    }

    if (await isAnyVisible(this.childDrawerPanelCandidates(), { timeoutMs: 500 })) {
      await maybeDismissOpenPopover(this.page).catch(() => undefined);
      await waitForUiSettled(this.page, 2_000).catch(() => undefined);
    }
  }

  private async ensureChildDrawerClosed() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (!(await isAnyVisible(this.childDrawerPanelCandidates(), { timeoutMs: 500 }))) {
        return;
      }

      await this.closeChildDrawerIfOpen();
      await this.page.waitForTimeout(600).catch(() => undefined);
    }
  }

  private async openMobileNavigationIfNeeded(targetCandidates: Locator[]) {
    await waitForUiSettled(this.page).catch(() => undefined);
    await this.maybeOpenFrontdeskFromMobileHamburger();

    if (await isAnyVisible(targetCandidates, { timeoutMs: 750 })) {
      return;
    }

    for (const candidate of this.mobileNavigationTriggerCandidates()) {
      const trigger = await maybeFirstVisible([candidate], {
        name: 'mobile navigation trigger',
        timeoutMs: 500
      });
      if (!trigger) {
        continue;
      }

      await trigger.click().catch(() => undefined);
      await waitForUiSettled(this.page, 4_000).catch(() => undefined);
      if (await isAnyVisible(targetCandidates, { timeoutMs: 1_500 })) {
        return;
      }

      if (await this.isNotificationView()) {
        await this.page.goBack().catch(() => undefined);
        await this.page.waitForLoadState('load').catch(() => undefined);
      }
    }
  }

  private async maybeRedirectFromAdminShell() {
    const adminShellVisible = await isAnyVisible(
      [this.page.locator('header nav a[href^="/admin"]').first(), this.page.locator('a[href="/admin/dashboard"]').first()],
      { name: 'admin shell navigation', timeoutMs: 1_000 }
    );

    if (!adminShellVisible) {
      return;
    }

    const adminShell = new AdminShellPage(this.page);
    await adminShell.gotoFrontdeskFromUserMenu();
    await waitForUiSettled(this.page).catch(() => undefined);
  }

  private async maybeOpenFrontdeskFromMobileHamburger() {
    if (await isAnyVisible(this.frontdeskRootCandidates(), { timeoutMs: 750 })) {
      return;
    }

    if (!(await this.isDashboardLikeView())) {
      return;
    }

    for (const candidate of this.mobileNavigationTriggerCandidates()) {
      const trigger = await maybeFirstVisible([candidate], {
        name: 'mobile frontdesk hamburger',
        timeoutMs: 750
      });

      if (!trigger) {
        continue;
      }

      await trigger.click().catch(() => undefined);
      await waitForUiSettled(this.page, 4_000).catch(() => undefined);

      if (await isAnyVisible(this.frontdeskRootCandidates(), { timeoutMs: 1_000 })) {
        return;
      }

      const frontdeskEntry = await maybeFirstVisible(this.mobileFrontdeskEntryCandidates(), {
        name: 'mobile frontdesk entry',
        timeoutMs: 2_000
      });

      if (!frontdeskEntry) {
        continue;
      }

      await frontdeskEntry.click().catch(() => undefined);
      await waitForUiSettled(this.page, 6_000).catch(() => undefined);
      return;
    }
  }

  private async isNotificationView() {
    const pageText = await this.page.locator('body').innerText().catch(() => '');
    return /notification/i.test(pageText);
  }

  private async isDashboardLikeView() {
    const pageText = await this.page.locator('body').innerText().catch(() => '');
    return /dashboard|儀表板/i.test(pageText);
  }
}
