import { expect, type Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, fillFirstVisible } from '../helpers/locator';

export class LoginPage {
  constructor(private readonly page: Page) {}

  private usernameCandidates() {
    return [
      this.page.locator('#username'),
      this.page.getByLabel('帳號'),
      this.page.getByPlaceholder(/請輸入/i)
    ];
  }

  private passwordCandidates() {
    return [
      this.page.locator('#password'),
      this.page.getByLabel('密碼'),
      this.page.locator('input[type="password"]')
    ];
  }

  private loginButtonCandidates() {
    return [
      this.page.getByRole('button', { name: '登入' }),
      this.page.locator('button').filter({ hasText: '登入' })
    ];
  }

  async goto() {
    await this.page.goto('/login');
    await this.assertLoaded();
  }

  async assertLoaded() {
    await expectAnyVisible(this.usernameCandidates(), { name: 'login username' });
    await expectAnyVisible(this.passwordCandidates(), { name: 'login password' });
    await expectAnyVisible(this.loginButtonCandidates(), { name: 'login submit' });
  }

  async login(credentials: { loginId: string; password: string }) {
    const responsePromise = this.page
      .waitForResponse((response) => response.request().method() === 'POST' && /login/i.test(response.url()), {
        timeout: 20_000
      })
      .catch(() => null);

    await fillFirstVisible(this.usernameCandidates(), credentials.loginId, { name: 'login username' });
    await fillFirstVisible(this.passwordCandidates(), credentials.password, { name: 'login password' });
    await clickFirstVisible(this.loginButtonCandidates(), { name: 'login submit' });

    await responsePromise;
    await expect(this.page).toHaveURL(/(dashboard|admin|developmental|child|login)/, { timeout: 20_000 });
  }

  async togglePasswordVisibility() {
    await clickFirstVisible(
      [
        this.page.locator('#password').locator('..').locator('button'),
        this.page.locator('input[type="password"]').locator('..').locator('button'),
        this.page.locator('button').filter({ has: this.page.locator('svg') }).last()
      ],
      { name: 'password visibility toggle' }
    );
  }

  async openRegister() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: /註冊|創立帳號/ }),
        this.page.getByRole('link', { name: /註冊|創立帳號/ }),
        this.page.locator('button, a').filter({ hasText: /註冊|創立帳號/ })
      ],
      { name: 'register entry' }
    );
  }

  async assertForgotPasswordEntryVisible() {
    await expectAnyVisible(
      [
        this.page.getByRole('button', { name: /忘記密碼/ }),
        this.page.getByRole('link', { name: /忘記密碼/ }),
        this.page.locator('button, a').filter({ hasText: /忘記密碼/ })
      ],
      { name: 'forgot password entry' }
    );
  }
}
