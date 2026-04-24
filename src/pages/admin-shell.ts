import { expect, type Locator, type Page } from '@playwright/test';
import {
  clickFirstVisible,
  expectAnyVisible,
  isAnyVisible,
  maybeDismissOpenPopover,
  maybeFirstVisible,
  waitForUiSettled
} from '../helpers/locator';

export class AdminShellPage {
  constructor(private readonly page: Page) {}

  async isLoaded(timeoutMs = 1_500): Promise<boolean> {
    if (/\/admin\//.test(this.page.url())) {
      return true;
    }

    return isAnyVisible(
      [
        this.page.locator('header nav a[href^="/admin"]').first(),
        this.page.locator('a[href="/admin/dashboard"]').first(),
        ...this.mobileNavigationTriggerCandidates()
      ],
      { name: 'admin shell navigation', timeoutMs }
    );
  }

  private topNavCandidates(testId: string, label: string, href: string): Locator[] {
    return [
      this.page.getByTestId(testId),
      this.page.locator(`header nav a[href="${href}"]`).filter({ hasText: label }),
      this.page.locator(`a[href="${href}"]`),
      this.page.getByRole('link', { name: label })
    ];
  }

  private mobileNavigationTriggerCandidates(): Locator[] {
    const hamburgerIcon = this.page
      .locator('header svg:has(path[d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"])')
      .first();

    return [
      this.page.getByTestId('mobile-hamburger-trigger'),
      this.page.getByLabel(/menu/i),
      this.page.getByRole('button', { name: /menu/i }),
      hamburgerIcon.locator('xpath=ancestor::*[self::button or self::div or self::a][1]'),
      this.page.locator('header button').first(),
      this.page.locator('header [role="button"]').first(),
      this.page.locator('header svg').first().locator('xpath=ancestor::*[self::button or self::div or self::a][1]'),
      hamburgerIcon
    ];
  }

  async expectAdminShellReady() {
    await expectAnyVisible([this.page.locator('main'), this.page.locator('header nav'), ...this.mobileNavigationTriggerCandidates()], {
      name: 'admin shell'
    });
  }

  async openUserMenu() {
    const headerUserTrigger = this.page
      .locator('header img')
      .last()
      .locator('xpath=ancestor::*[self::button or self::div or self::a][1]');

    await clickFirstVisible(
      [
        this.page.getByTestId('header-user-menu-trigger'),
        this.page.getByRole('button', { name: /雿輻??徑?犖?詨|撣唾??詨/ }),
        this.page.locator('header [id^="reka-popover-trigger-"][aria-haspopup="dialog"] img').last(),
        this.page.locator('header [id^="reka-popover-trigger-"][aria-haspopup="dialog"]').last(),
        this.page.locator('header button[aria-haspopup="dialog"]').last(),
        this.page.locator('header [role="button"]').last(),
        headerUserTrigger
      ],
      { name: 'user menu trigger' }
    );

    await expectAnyVisible(
      [this.page.locator('[id^="reka-popover-content-"][data-state="open"]'), this.page.locator('[role="dialog"][data-state="open"]')],
      { name: 'user menu content' }
    );
  }

  async gotoDashboard() {
    await this.openNavigationIfNeeded(this.topNavCandidates('header-menu-dashboard', '??嗆', '/admin/dashboard'));
    await clickFirstVisible(this.topNavCandidates('header-menu-dashboard', '??嗆', '/admin/dashboard'), { name: 'dashboard nav' });
    await expect(this.page).toHaveURL(/\/admin\/dashboard/);
  }

  async gotoChildList() {
    await this.openNavigationIfNeeded(this.topNavCandidates('header-menu-child-list', '摮拍咱?”', '/admin/child-list'));
    await clickFirstVisible(this.topNavCandidates('header-menu-child-list', '摮拍咱?”', '/admin/child-list'), { name: 'child list nav' });
    await expect(this.page).toHaveURL(/\/admin\/child-list/);
  }

  async gotoQuestionManage() {
    await this.openNavigationIfNeeded(this.topNavCandidates('header-menu-question-manage', '憿蝞∠?', '/admin/question'));
    await clickFirstVisible(this.topNavCandidates('header-menu-question-manage', '憿蝞∠?', '/admin/question'), { name: 'question nav' });
    await expect(this.page).toHaveURL(/\/admin\/question/);
  }

  async gotoInviteManage() {
    await this.openNavigationIfNeeded(this.topNavCandidates('header-menu-invite-manage', '?隢恣??', '/admin/invite'));
    await clickFirstVisible(this.topNavCandidates('header-menu-invite-manage', '?隢恣??', '/admin/invite'), { name: 'invite nav' });
    await expect(this.page).toHaveURL(/\/admin\/invite/);
  }

  async gotoAbout() {
    await this.openNavigationIfNeeded(this.topNavCandidates('header-menu-about', '???', '/admin/about'));
    await clickFirstVisible(this.topNavCandidates('header-menu-about', '???', '/admin/about'), { name: 'about nav' });
    await expect(this.page).toHaveURL(/\/admin\/about/);
  }

  async gotoFrontdeskFromUserMenu() {
    const frontdeskEntryCandidates = [
      this.page.getByTestId('header-menu-frontdesk'),
      this.page.getByRole('link', { name: /frontdesk/i }),
      this.page.getByRole('button', { name: /frontdesk/i }),
      this.page.locator('header nav > *').filter({ hasText: /前台|frontdesk/i }),
      this.page.locator('header nav').getByText(/前台|frontdesk/i).locator('xpath=ancestor::*[self::button or self::a or self::div][1]'),
      this.page.locator('button, a, div, span').filter({ hasText: /前台|frontdesk/i })
    ];

    await this.openUserMenu().catch(() => undefined);

    const openedMenuRoot = await maybeFirstVisible(
      [this.page.locator('[role="dialog"][data-state="open"], [id^="reka-popover-content-"][data-state="open"]').first()],
      { name: 'user menu content', timeoutMs: 2_500 }
    );

    if (openedMenuRoot) {
      await clickFirstVisible(
        [
          openedMenuRoot.getByTestId('header-menu-frontdesk'),
          openedMenuRoot.getByRole('link', { name: /frontdesk/i }),
          openedMenuRoot.getByRole('button', { name: /frontdesk/i }),
          openedMenuRoot.locator(':scope > *').filter({ hasText: /前台|frontdesk/i }),
          openedMenuRoot.locator('button, a, div, span').filter({ hasText: /前台|frontdesk/i })
        ],
        { name: 'frontdesk entry' }
      );
      await expect(this.page).toHaveURL(/\/(developmental|faqs|about|\d+\/developmental)/, { timeout: 20_000 });
      return;
    }

    await this.openNavigationIfNeeded(frontdeskEntryCandidates);
    await clickFirstVisible(frontdeskEntryCandidates, { name: 'frontdesk entry' });
    await expect(this.page).toHaveURL(/\/(developmental|faqs|about|\d+\/developmental)/, { timeout: 20_000 });
    return;

    await this.openUserMenu();
    const menuRoot = this.page
      .locator('[role="dialog"][data-state="open"], [id^="reka-popover-content-"][data-state="open"]')
      .first();

    await clickFirstVisible(
      [
        menuRoot.getByTestId('header-menu-frontdesk'),
        menuRoot.getByText(/前台|frontdesk/i).locator('xpath=ancestor::*[self::button or self::a or self::div][1]'),
        menuRoot.locator('button, a, div, span').filter({ hasText: /前台|frontdesk/i }),
        this.page.getByText(/前台|frontdesk/i).locator('xpath=ancestor::*[self::button or self::a or self::div][1]')
      ],
      { name: 'frontdesk entry' }
    );
    await expect(this.page).toHaveURL(/\/(developmental|faqs|about|\d+\/developmental)/, { timeout: 20_000 });
  }

  private async openNavigationIfNeeded(targetCandidates: Locator[]) {
    await waitForUiSettled(this.page).catch(() => undefined);
    await maybeDismissOpenPopover(this.page).catch(() => undefined);

    if (await isAnyVisible(targetCandidates, { timeoutMs: 750 })) {
      return;
    }

    for (const candidate of this.mobileNavigationTriggerCandidates()) {
      const trigger = await maybeFirstVisible([candidate], {
        name: 'admin mobile navigation trigger',
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
    }
  }
}
