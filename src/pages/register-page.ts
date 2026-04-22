import { expect, type Locator, type Page } from '@playwright/test';
import { clickFirstVisible, expectAnyVisible, fillFirstVisible, firstVisible, waitForUiSettled } from '../helpers/locator';

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
        return [
          this.page.getByTestId('register-name'),
          this.page.locator('input#name'),
          this.page.getByPlaceholder(/name|姓名|暱稱|全名/i),
          this.page.locator('main input').nth(0)
        ];
      case 'email':
        return [
          this.page.getByTestId('register-email'),
          this.page.locator('input[type="email"]'),
          this.page.getByPlaceholder(/email|@/i)
        ];
      case 'phone':
        return [
          this.page.getByTestId('register-phone'),
          this.page.locator('input[type="tel"]'),
          this.page.getByPlaceholder(/09|phone|手機/i)
        ];
      case 'password':
        return [this.page.getByTestId('register-password'), this.page.locator('input[type="password"]').nth(0)];
      case 'confirmPassword':
        return [this.page.getByTestId('register-confirm-password'), this.page.locator('input[type="password"]').nth(1)];
    }
  }

  async assertLoaded() {
    await waitForUiSettled(this.page).catch(() => undefined);
    await expectAnyVisible(
      [
        ...this.fieldCandidates('name'),
        ...this.fieldCandidates('email'),
        ...this.fieldCandidates('password'),
        this.page.getByRole('heading'),
        this.page.locator('main').getByText(/註冊|建立帳號|create/i).first()
      ],
      { name: 'register form' }
    );
  }

  async fillBasicFields(form: RegisterFormInput) {
    await fillFirstVisible(this.fieldCandidates('name'), form.name, { name: 'register name' });
    await fillFirstVisible(this.fieldCandidates('email'), form.email, { name: 'register email' });
    await fillFirstVisible(this.fieldCandidates('phone'), form.phone, { name: 'register phone' });
    await fillFirstVisible(this.fieldCandidates('password'), form.password, { name: 'register password' });
    await fillFirstVisible(this.fieldCandidates('confirmPassword'), form.confirmPassword, { name: 'register confirm password' });
  }

  async expectBasicFieldValues(form: RegisterFormInput) {
    await expect(await firstVisible(this.fieldCandidates('name'), { name: 'register name value' })).toHaveValue(form.name);
    await expect(await firstVisible(this.fieldCandidates('email'), { name: 'register email value' })).toHaveValue(form.email);
    await expect(await firstVisible(this.fieldCandidates('phone'), { name: 'register phone value' })).toHaveValue(form.phone);
    await expect(await firstVisible(this.fieldCandidates('password'), { name: 'register password value' })).toHaveValue(form.password);
    await expect(await firstVisible(this.fieldCandidates('confirmPassword'), { name: 'register confirm password value' })).toHaveValue(
      form.confirmPassword
    );
  }

  async chooseGender(value: '男' | '女') {
    await clickFirstVisible(
      [
        this.page.getByLabel(value),
        this.page.getByRole('radio', { name: value }),
        this.page.locator('label, button, div').filter({ hasText: value })
      ],
      { name: `register gender ${value}` }
    );
  }

  async toggleTerms() {
    await clickFirstVisible(
      [
        this.page.getByTestId('register-terms-checkbox'),
        this.page.getByRole('checkbox'),
        this.page.getByRole('button', { name: /條款|同意|terms/i }),
        this.page.locator('label, button, span, div').filter({ hasText: /條款|同意|terms/i })
      ],
      { name: 'register terms' }
    );
  }

  async expectTermsChecked() {
    await expect
      .poll(async () => {
        const checkedCount = await this.page
          .locator(
            [
              '[data-testid="register-terms-checkbox"][data-state="checked"]',
              '[data-testid="register-terms-checkbox"][aria-checked="true"]',
              '[role="checkbox"][aria-checked="true"]',
              'input[type="checkbox"]:checked'
            ].join(', ')
          )
          .count();
        return checkedCount > 0;
      })
      .toBeTruthy();
  }

  async submit() {
    await clickFirstVisible(
      [
        this.page.getByTestId('register-submit'),
        this.page.getByRole('button', { name: /註冊|建立帳號|送出/i }),
        this.page.locator('button').filter({ hasText: /註冊|建立帳號|送出/i })
      ],
      { name: 'register submit' }
    );
  }

  async assertTermsVisible() {
    await expectAnyVisible(
      [
        this.page.getByRole('checkbox'),
        this.page.getByText(/條款|同意|terms/i),
        this.page.getByRole('button', { name: /條款|同意|terms/i })
      ],
      { name: 'register terms section' }
    );
  }

  async expectValidationState() {
    const invalidIndicators = [
      this.page.locator('[aria-invalid="true"]'),
      this.page.getByText(/必填|錯誤|invalid|required/i),
      this.page.locator('.text-red-500, .text-destructive, .text-danger')
    ];

    const locator = await firstVisible(invalidIndicators, { name: 'register validation state', timeoutMs: 5_000 });
    await expect(locator).toBeVisible();
  }
}
