import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, maybeDismissOpenPopover } from '../helpers/locator';

export class AdminShellPage {
  constructor(private readonly page: Page) {}

  private topNavCandidates(testId: string, label: string, href: string): Locator[] {
    return [
      this.page.getByTestId(testId),
      this.page.locator(`header nav a[href="${href}"]`).filter({ hasText: label }),
      this.page.getByRole('link', { name: label })
    ];
  }

  async expectAdminShellReady() {
    await expectAnyVisible(
      [
        this.page.locator('main'),
        this.page.locator('header nav')
      ],
      { name: 'admin shell' }
    );
  }

  async openUserMenu() {
    await clickFirstVisible(
      [
        this.page.getByTestId('header-user-menu-trigger'),
        this.page.getByRole('button', { name: /使用者選單|個人選單|帳號選單/ }),
        this.page.locator('[id^="reka-popover-trigger-"][aria-haspopup="dialog"] img'),
        this.page.locator('[id^="reka-popover-trigger-"][aria-haspopup="dialog"]')
      ],
      { name: 'user menu trigger' }
    );

    await expectAnyVisible(
      [
        this.page.locator('[id^="reka-popover-content-"][data-state="open"]'),
        this.page.locator('[role="dialog"][data-state="open"]')
      ],
      { name: 'user menu content' }
    );
  }

  async gotoDashboard() {
    await maybeDismissOpenPopover(this.page);
    await clickFirstVisible(this.topNavCandidates('header-menu-dashboard', '儀錶板', '/admin/dashboard'), { name: 'dashboard nav' });
    await expect(this.page).toHaveURL(/\/admin\/dashboard/);
  }

  async gotoChildList() {
    await maybeDismissOpenPopover(this.page);
    await clickFirstVisible(this.topNavCandidates('header-menu-child-list', '孩童列表', '/admin/child-list'), { name: 'child list nav' });
    await expect(this.page).toHaveURL(/\/admin\/child-list/);
  }

  async gotoQuestionManage() {
    await maybeDismissOpenPopover(this.page);
    await clickFirstVisible(this.topNavCandidates('header-menu-question-manage', '題目管理', '/admin/question'), { name: 'question nav' });
    await expect(this.page).toHaveURL(/\/admin\/question/);
  }

  async gotoInviteManage() {
    await maybeDismissOpenPopover(this.page);
    await clickFirstVisible(this.topNavCandidates('header-menu-invite-manage', '邀請管理', '/admin/invite'), { name: 'invite nav' });
    await expect(this.page).toHaveURL(/\/admin\/invite/);
  }

  async gotoAbout() {
    await maybeDismissOpenPopover(this.page);
    await clickFirstVisible(this.topNavCandidates('header-menu-about', '關於我們', '/admin/about'), { name: 'about nav' });
    await expect(this.page).toHaveURL(/\/admin\/about/);
  }

  async gotoFrontdeskFromUserMenu() {
    await this.openUserMenu();
    const menuRoot = this.page.locator('[id^="reka-popover-content-"][data-state="open"]').first();
    await clickFirstVisible(
      [
        menuRoot.getByTestId('header-menu-frontdesk'),
        menuRoot.getByText('前往前台').locator('..'),
        menuRoot.locator('button, a, div, span').filter({ hasText: '前往前台' }),
        this.page.getByText('前往前台').locator('xpath=ancestor::*[self::button or self::a or self::div][1]')
      ],
      { name: 'frontdesk entry' }
    );
    await expect(this.page).toHaveURL(/\/(developmental|faqs|about|\d+\/developmental)/, { timeout: 20_000 });
  }
}
