import { expect, type Locator, type Page } from '@playwright/test';
import type { ChildProfileData } from '../fixtures/child-data';
import { clickFirstVisible, expectAnyVisible, fillFirstVisible, firstVisible, maybeFirstVisible } from '../helpers/locator';

export class ChildProfileDialogPage {
  constructor(private readonly page: Page) {}

  private dialogCandidates(): Locator[] {
    return [this.page.getByTestId('child-form-dialog'), this.page.locator('[role="dialog"]'), this.page.locator('[data-state="open"]')];
  }

  private async dialog() {
    return firstVisible(this.dialogCandidates(), { name: 'child dialog' });
  }

  async openCreateDialog() {
    await clickFirstVisible(
      [
        this.page.getByTestId('child-create-trigger'),
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
        this.page.getByTestId('child-edit-trigger'),
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
      [dialog.getByTestId('child-name'), dialog.getByPlaceholder('請輸入孩童全名'), dialog.locator('input[placeholder="請輸入孩童全名"]')],
      data.childName,
      { name: 'child name' }
    );

    await fillFirstVisible([dialog.getByTestId('child-id'), dialog.locator('input[placeholder="F123456789"]')], data.childId, {
      name: 'child id'
    });

    await this.selectLabeledOption('孩童戶籍地', data.childBornCity, 0, 'child-birth-city');
    await this.selectLabeledOption('孩童戶籍地', data.childBornDistrict, 1, 'child-birth-district');

    if (data.sameResidence) {
      await clickFirstVisible([dialog.getByTestId('child-same-residence'), dialog.getByLabel(/同戶籍地/), dialog.locator('input[type="checkbox"]')], {
        name: 'same residence checkbox'
      });
    } else {
      await this.selectLabeledOption('孩童居住地', data.childResidenceCity, 0, 'child-residence-city');
      await this.selectLabeledOption('孩童居住地', data.childResidenceDistrict, 1, 'child-residence-district');
    }

    const dateInput = await firstVisible(
      [dialog.getByTestId('child-birth-date'), dialog.locator('input[type="date"]'), dialog.getByPlaceholder(/年\s*\/\s*月\s*\/\s*日/)],
      { name: 'birth date input' }
    );
    await dateInput.fill(data.childBirthDate);

    await clickFirstVisible(
      [
        dialog.getByTestId('child-gender').getByRole('radio', { name: data.childGender }),
        dialog.getByTestId('child-gender').locator('label, button').filter({ hasText: data.childGender }),
        dialog.getByRole('radio', { name: data.childGender }),
        dialog.locator('label, button').filter({ hasText: data.childGender })
      ],
      { name: `gender ${data.childGender}` }
    );

    await clickFirstVisible(
      [
        dialog.getByTestId('child-over37weeks').locator('label, button').filter({ hasText: data.over37Weeks === '否' ? /否/ : /^是$/ }),
        dialog.locator('label, button').filter({ hasText: data.over37Weeks === '否' ? /否/ : /^是$/ })
      ],
      { name: 'over 37 weeks' }
    );

    if (data.dueDate) {
      const dueDateInput = await maybeFirstVisible([dialog.getByTestId('child-due-date'), dialog.locator('input[name="dueDate"]')], {
        name: 'due date input',
        timeoutMs: 1_000
      });
      if (dueDateInput) {
        await dueDateInput.fill(data.dueDate);
      }
    }

    await clickFirstVisible(
      [dialog.getByTestId('child-weight').locator('label, button').filter({ hasText: data.birthWeight }), dialog.locator('label, button').filter({ hasText: data.birthWeight })],
      { name: 'birth weight' }
    );

    await clickFirstVisible(
      [
        dialog.getByTestId('child-is-indigenous').locator('label, button').filter({ hasText: data.isIndigenous === '是' ? /是/ : /否/ }),
        dialog.locator('label, button').filter({ hasText: data.isIndigenous === '是' ? /是/ : /否/ })
      ],
      { name: 'is indigenous' }
    );

    if (data.isIndigenous === '是' && data.indigenousType) {
      const tribeSelect = await maybeFirstVisible(
        [dialog.getByTestId('child-indigenous-type'), dialog.locator('select[name="indigenousTribe"]')],
        { name: 'indigenous tribe', timeoutMs: 1_000 }
      );
      if (tribeSelect) {
        await tribeSelect.selectOption({ label: data.indigenousType });
      }
    }
  }

  async uploadAvatar(filePath: string) {
    const dialog = await this.dialog();
    const uploadTarget = await firstVisible(
      [dialog.getByTestId('child-avatar-upload'), dialog.locator('input[type="file"]'), dialog.locator('button').filter({ hasText: /上傳|選擇圖片/ })],
      { name: 'avatar upload' }
    );

    if ((await uploadTarget.evaluate((node) => node.tagName.toLowerCase())) === 'input') {
      await uploadTarget.setInputFiles(filePath);
    } else {
      await dialog.locator('input[type="file"]').first().setInputFiles(filePath);
    }
  }

  async expectFilled(data: Pick<ChildProfileData, 'childName' | 'childId' | 'childBirthDate'>) {
    const dialog = await this.dialog();

    await expect(
      await firstVisible(
        [dialog.getByTestId('child-name'), dialog.getByPlaceholder('請輸入孩童全名'), dialog.locator('input[placeholder="請輸入孩童全名"]')],
        { name: 'child name value' }
      )
    ).toHaveValue(data.childName);

    await expect(
      await firstVisible([dialog.getByTestId('child-id'), dialog.locator('input[placeholder="F123456789"]')], { name: 'child id value' })
    ).toHaveValue(data.childId);

    await expect(
      await firstVisible(
        [dialog.getByTestId('child-birth-date'), dialog.locator('input[type="date"]'), dialog.getByPlaceholder(/年\s*\/\s*月\s*\/\s*日/)],
        { name: 'birth date value' }
      )
    ).toHaveValue(data.childBirthDate);
  }

  async expectAvatarSelected() {
    const dialog = await this.dialog();
    const fileInput = await maybeFirstVisible([dialog.locator('input[type="file"]')], { name: 'avatar file input', timeoutMs: 1_000 });
    if (fileInput) {
      await expect
        .poll(async () => {
          return fileInput.evaluate((node) => {
            if (!(node instanceof HTMLInputElement)) {
              return 0;
            }
            return node.files?.length ?? 0;
          });
        })
        .toBeGreaterThan(0);
      return;
    }

    await expectAnyVisible(
      [dialog.getByTestId('child-avatar-preview'), dialog.locator('img[src^="blob:"], img[src^="data:"]').first()],
      { name: 'avatar preview' }
    );
  }

  async submitCreate() {
    await clickFirstVisible(
      [this.page.getByTestId('child-form-submit'), this.page.getByRole('button', { name: '建立檔案' }), this.page.locator('button').filter({ hasText: '建立檔案' })],
      { name: 'create child submit' }
    );
  }

  async submitSave() {
    await clickFirstVisible(
      [this.page.getByTestId('child-form-submit'), this.page.getByRole('button', { name: '儲存變更' }), this.page.locator('button').filter({ hasText: '儲存變更' })],
      { name: 'edit child submit' }
    );
  }

  async close() {
    const dialog = await this.dialog();
    const closeTrigger = await maybeFirstVisible(
      [
        dialog.getByTestId('child-form-cancel'),
        dialog.getByRole('button', { name: /取消|關閉|返回/ }),
        dialog.locator('button').filter({ hasText: /取消|關閉|返回/ }),
        dialog.locator('button[aria-label*="close" i], button[aria-label*="關閉"]')
      ],
      { name: 'child dialog close', timeoutMs: 1_000 }
    );

    if (closeTrigger) {
      await closeTrigger.click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }

    await expect(dialog).toBeHidden({ timeout: 5_000 });
  }

  async expectValidationState() {
    const dialog = await this.dialog();
    await expectAnyVisible(
      [dialog.locator('[aria-invalid="true"]'), dialog.getByText(/必填|格式|請輸入|錯誤/), dialog.locator('.text-red-500, .text-destructive, .text-danger')],
      { name: 'child dialog validation' }
    );
  }

  async expectModalScrollLock() {
    const bodyOverflow = await this.page.locator('body').evaluate((element) => getComputedStyle(element).overflow);
    const htmlOverflow = await this.page.locator('html').evaluate((element) => getComputedStyle(element).overflow);
    expect([bodyOverflow, htmlOverflow].some((value) => ['hidden', 'clip'].includes(value))).toBeTruthy();
  }

  private async selectLabeledOption(labelText: string, value: string, index: number, testId?: string) {
    const dialog = await this.dialog();
    const testTarget = testId ? dialog.getByTestId(testId) : dialog.locator('[data-testid="__missing__"]');
    const section = dialog.locator('label').filter({ hasText: labelText }).locator('xpath=ancestor::div[1]');

    const explicitTarget = await maybeFirstVisible([testTarget], { name: `${labelText} explicit target`, timeoutMs: 500 });
    if (explicitTarget) {
      const tagName = await explicitTarget.evaluate((node) => node.tagName.toLowerCase()).catch(() => '');
      if (tagName === 'select') {
        await explicitTarget.selectOption({ label: value });
        return;
      }

      await explicitTarget.click();
      await clickFirstVisible(
        [this.page.getByRole('option', { name: value }), this.page.locator('[role="option"], [data-radix-collection-item], li').filter({ hasText: value })],
        { name: `${labelText} ${value}` }
      );
      return;
    }

    const nativeSelect = section.locator('select').nth(index);
    if ((await nativeSelect.count()) > 0) {
      await nativeSelect.selectOption({ label: value });
      return;
    }

    const trigger = section.locator('[role="combobox"], button[aria-haspopup="listbox"], [data-slot="select-trigger"]').nth(index);
    await trigger.click();
    await clickFirstVisible(
      [this.page.getByRole('option', { name: value }), this.page.locator('[role="option"], [data-radix-collection-item], li').filter({ hasText: value })],
      { name: `${labelText} ${value}` }
    );
  }
}
