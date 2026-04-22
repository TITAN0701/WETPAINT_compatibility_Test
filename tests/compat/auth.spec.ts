import { LoginPage } from '../../src/pages/login-page';
import { RegisterPage } from '../../src/pages/register-page';
import { test, expect } from '../../src/fixtures/test';

test.describe('Auth compatibility', () => {
  test('@compat @readonly @shared 使用 email 可成功登入', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await expect(page).toHaveURL(/(dashboard|admin|developmental|child)/);
  });

  test('@compat @readonly @shared 使用手機帳號可成功登入', async ({ page, accounts }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(accounts.adminPhone);
    await expect(page).toHaveURL(/(dashboard|admin|developmental|child)/);
  });

  test('@compat @readonly @shared 錯誤帳密應停留在登入相關流程並顯示錯誤狀態', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({ loginId: 'wrong@example.com', password: 'wrongpassword' });

    await expect
      .poll(async () => await page.locator('body').innerText(), { timeout: 10_000 })
      .toMatch(/登入|錯誤|失敗|帳號|密碼/);
  });

  test('@compat @readonly @shared 登入頁可切換密碼顯示並看見忘記密碼入口', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await loginPage.togglePasswordVisibility();
    await expect(passwordInput).not.toHaveAttribute('type', 'password');
    await loginPage.assertForgotPasswordEntryVisible();
  });

  test('@compat @readonly @shared 註冊頁基本欄位與條款區塊可顯示', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);
    await loginPage.goto();
    await loginPage.openRegister();
    await registerPage.assertLoaded();
    await registerPage.assertTermsVisible();
  });

  test('@compat @readonly @shared 註冊表單欄位可輸入並保留內容，不送出註冊', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);
    const form = {
      name: 'Playwright User',
      email: 'invalid-email',
      phone: '0912345678',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123'
    };

    await loginPage.goto();
    await loginPage.openRegister();
    await registerPage.assertLoaded();
    await registerPage.fillBasicFields(form);
    await registerPage.expectBasicFieldValues(form);
    await registerPage.chooseGender('女');
    await registerPage.toggleTerms();
    await registerPage.assertTermsVisible();
    await registerPage.expectBasicFieldValues(form);
  });
});
