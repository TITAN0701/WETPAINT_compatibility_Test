import { expect, type Locator, type Page } from '@playwright/test';
import type { ChildProfileData } from '../fixtures/child-data';
import { clickFirstVisible, expectAnyVisible, fillFirstVisible, firstVisible } from '../helpers/locator';

export class ChildProfileDialogPage {
  constructor(private readonly page: Page) {}

  private dialogCandidates(): Locator[] {
    return [
      this.page.locator('[role="dialog"]'),
      this.page.locator('[data-state="open"]')
    ];
  }

  private async dialog() {
    return firstVisible(this.dialogCandidates(), { name: 'child dialog' });
  }

  async openCreateDialog() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: '新增檔案' }),
        this.page.locator('button').filter({ hasText: '新增檔案' })
      ],
      { name: 'create child trigger' }
    );
    await this.assertOpen('新增孩童檔案');
  }

  async openEditDialog() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: /編輯檔案|編輯/ }),
        this.page.locator('button').filter({ hasText: /編輯檔案|編輯/ })
      ],
      { name: 'edit child trigger' }
    );
    await this.assertOpen('編輯孩童檔案');
  }

  async assertOpen(title?: string) {
    const dialog = await this.dialog();
    await expect(dialog).toBeVisible();
    if (title) {
      await expect(dialog).toContainText(title);
    }
  }

  async fill(data: ChildProfileData) {
    const dialog = await this.dialog();

    await fillFirstVisible(
      [dialog.getByPlaceholder('請輸入孩童全名'), dialog.locator('input[placeholder="請輸入孩童全名"]')],
      data.childName,
      { name: 'child name' }
    );

    await fillFirstVisible([dialog.locator('input[placeholder="F123456789"]')], data.childId, { name: 'child id' });

    await this.selectLabeledOption('孩童戶籍地', data.childBornCity, 0);
    await this.selectLabeledOption('孩童戶籍地', data.childBornDistrict, 1);

    if (data.sameResidence) {
      await clickFirstVisible(
        [
          dialog.getByLabel(/同戶籍地/),
          dialog.locator('input[type="checkbox"]')
        ],
        { name: 'same residence checkbox' }
      );
    } else {
      await this.selectLabeledOption('孩童居住地', data.childResidenceCity, 0);
      await this.selectLabeledOption('孩童居住地', data.childResidenceDistrict, 1);
    }

    const dateInput = await firstVisible(
      [dialog.locator('input[type="date"]'), dialog.getByPlaceholder(/年\s*\/\s*月\s*\/\s*日/)],
      { name: 'birth date input' }
    );
    await dateInput.fill(data.childBirthDate);

    await clickFirstVisible(
      [
        dialog.getByRole('radio', { name: data.childGender }),
        dialog.locator('label, button').filter({ hasText: data.childGender })
      ],
      { name: `gender ${data.childGender}` }
    );

    await clickFirstVisible(
      [
        dialog.locator('label, button').filter({ hasText: data.over37Weeks === '否' ? /否/ : /^是$/ })
      ],
      { name: 'over 37 weeks' }
    );

    if (data.dueDate) {
      const dueDateInput = dialog.locator('input[name="dueDate"]');
      if ((await dueDateInput.count()) > 0) {
        await dueDateInput.fill(data.dueDate);
      }
    }

    await clickFirstVisible(
      [
        dialog.locator('label, button').filter({ hasText: data.birthWeight })
      ],
      { name: 'birth weight' }
    );

    await clickFirstVisible(
      [
        dialog.locator('label, button').filter({ hasText: data.isIndigenous === '是' ? /是/ : /否/ })
      ],
      { name: 'is indigenous' }
    );

    if (data.isIndigenous === '是' && data.indigenousType) {
      const tribeSelect = dialog.locator('select[name="indigenousTribe"]');
      if ((await tribeSelect.count()) > 0) {
        await tribeSelect.selectOption({ label: data.indigenousType });
      }
    }
  }

  async uploadAvatar(filePath: string) {
    const dialog = await this.dialog();
    const uploadTarget = await firstVisible(
      [
        dialog.locator('input[type="file"]'),
        dialog.locator('button').filter({ hasText: /上傳|選擇圖片/ })
      ],
      { name: 'avatar upload' }
    );

    if ((await uploadTarget.evaluate((node) => node.tagName.toLowerCase())) === 'input') {
      await uploadTarget.setInputFiles(filePath);
    } else {
      await dialog.locator('input[type="file"]').first().setInputFiles(filePath);
    }
  }

  async submitCreate() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: '建立檔案' }),
        this.page.locator('button').filter({ hasText: '建立檔案' })
      ],
      { name: 'create child submit' }
    );
  }

  async submitSave() {
    await clickFirstVisible(
      [
        this.page.getByRole('button', { name: '儲存變更' }),
        this.page.locator('button').filter({ hasText: '儲存變更' })
      ],
      { name: 'edit child submit' }
    );
  }

  async expectValidationState() {
    const dialog = await this.dialog();
    await expectAnyVisible(
      [
        dialog.locator('[aria-invalid="true"]'),
        dialog.getByText(/必填|格式|請輸入|錯誤/),
        dialog.locator('.text-red-500, .text-destructive, .text-danger')
      ],
      { name: 'child dialog validation' }
    );
  }

  async expectModalScrollLock() {
    const bodyOverflow = await this.page.locator('body').evaluate((element) => getComputedStyle(element).overflow);
    const htmlOverflow = await this.page.locator('html').evaluate((element) => getComputedStyle(element).overflow);
    expect([bodyOverflow, htmlOverflow].some((value) => ['hidden', 'clip'].includes(value))).toBeTruthy();
  }

  private async selectLabeledOption(labelText: string, value: string, index: number) {
    const dialog = await this.dialog();
    const section = dialog.locator('label').filter({ hasText: labelText }).locator('xpath=ancestor::div[1]');
    const nativeSelect = section.locator('select').nth(index);

    if ((await nativeSelect.count()) > 0) {
      await nativeSelect.selectOption({ label: value });
      return;
    }

    const trigger = section.locator('[role="combobox"], button[aria-haspopup="listbox"], [data-slot="select-trigger"]').nth(index);
    await trigger.click();
    await clickFirstVisible(
      [
        this.page.getByRole('option', { name: value }),
        this.page.locator('[role="option"], [data-radix-collection-item], li').filter({ hasText: value })
      ],
      { name: `${labelText} ${value}` }
    );
  }
}
