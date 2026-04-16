import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, fillFirstVisible, firstVisible } from '../helpers/locator';

export interface RegisterFormInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export class RegisterPage {
  constructor(private readonly page: Page) {}

  private fieldCandidates(name: 'name' | 'email' | 'phone' | 'password' | 'confirmPassword'): Locator[] {
    switch (name) {
      case 'name':
        return [this.page.getByPlaceholder('請輸入姓名'), this.page.locator('input').nth(0)];
      case 'email':
        return [this.page.locator('input[type="email"]'), this.page.getByPlaceholder(/email/i)];
      case 'phone':
        return [this.page.locator('input[type="tel"]'), this.page.getByPlaceholder(/09/)];
      case 'password':
        return [this.page.locator('input[type="password"]').nth(0)];
      case 'confirmPassword':
        return [this.page.locator('input[type="password"]').nth(1)];
    }
  }

  async assertLoaded() {
    await expectAnyVisible(
      [
        this.page.getByRole('heading', { name: /註冊|創立帳號/ }),
        this.page.locator('h1, h2').filter({ hasText: /註冊|創立帳號/ })
      ],
      { name: 'register page title' }
    );
  }

  async fillBasicFields(form: RegisterFormInput) {
    await fillFirstVisible(this.fieldCandidates('name'), form.name, { name: 'register name' });
    await fillFirstVisible(this.fieldCandidates('email'), form.email, { name: 'register email' });
    await fillFirstVisible(this.fieldCandidates('phone'), form.phone, { name: 'register phone' });
    await fillFirstVisible(this.fieldCandidates('password'), form.password, { name: 'register password' });
    await fillFirstVisible(this.fieldCandidates('confirmPassword'), form.confirmPassword, { name: 'register confirm password' });
  }

  async chooseGender(value: '男' | '女') {
    await clickFirstVisible(
      [
        this.page.getByLabel(value),
        this.page.getByRole('radio', { name: value }),
        this.page.locator('label, button').filter({ hasText: value })
      ],
      { name: `register gender ${value}` }
    );
  }

  async toggleTerms() {
    await clickFirstVisible(
      [
        this.page.getByLabel(/同意|服務條款/),
        this.page.getByRole('checkbox'),
        this.page.locator('label, button, span').filter({ hasText: /同意|服務條款/ })
      ],
      { name: 'register terms' }
    );
  }

  async submit() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: /建立帳號|註冊|確認註冊/ }),
        this.page.locator('button').filter({ hasText: /建立帳號|註冊|確認註冊/ })
      ],
      { name: 'register submit' }
    );
  }

  async assertTermsVisible() {
    await expectAnyVisible(
      [
        this.page.getByText(/服務條款/),
        this.page.getByText(/同意/)
      ],
      { name: 'register terms section' }
    );
  }

  async expectValidationState() {
    const invalidIndicators = [
      this.page.locator('[aria-invalid="true"]'),
      this.page.getByText(/必填|格式|請輸入|錯誤/),
      this.page.locator('.text-red-500, .text-destructive, .text-danger')
    ];

    const locator = await firstVisible(invalidIndicators, { name: 'register validation state', timeoutMs: 5_000 });
    await expect(locator).toBeVisible();
  }
}
