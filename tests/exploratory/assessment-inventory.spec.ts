import { test, expect } from '../../src/fixtures/test';
import { AdminShellPage } from '../../src/pages/admin-shell';
import { FrontdeskPage } from '../../src/pages/frontdesk-page';
import { LoginPage } from '../../src/pages/login-page';
import { waitForUiSettled } from '../../src/helpers/locator';

interface QuestionSnapshot {
  index: number;
  category: string;
  question: string;
  progress: string;
  headings: string[];
}

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function pickCategory(headings: string[], progress: string, question: string): string {
  const genericPatterns = [
    /wetpaint/i,
    /題目|question/i,
    /上傳|upload/i,
    /開始|繼續|下一步|下一題|返回|重試|完成/i,
    /^\d+\s*\/\s*\d+$/,
    /^yiy$/i
  ];

  const candidate = headings.find((heading) => {
    const normalized = normalizeLine(heading);
    return normalized.length > 1 && !genericPatterns.some((pattern) => pattern.test(normalized));
  });

  if (candidate) {
    return normalizeLine(candidate);
  }

  if (progress) {
    return `未辨識分類 (${progress})`;
  }

  if (question) {
    return '未辨識分類';
  }

  return '未知';
}

async function collectQuestionSnapshot(page: import('@playwright/test').Page, index: number) {
  await waitForUiSettled(page, 5_000).catch(() => undefined);

  const headings = (
    await page
      .locator('h1, h2, h3, h4, [role="heading"]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
          .filter((text) => text.length > 0)
      )
      .catch(() => [])
  ) as string[];

  const progress = normalizeLine(
    (
      (await page.locator('body').textContent().catch(() => ''))?.match(/\d+\s*\/\s*\d+/)?.[0] || ''
    )
  );

  const question = normalizeLine(
    (
      await page
        .locator('main, [role="main"], body')
        .innerText()
        .catch(() => '')
    )
      .split('\n')
      .map((line) => normalizeLine(line))
      .find((line) => {
        if (!line || line.length < 6) {
          return false;
        }

        return ![
          /wetpaint/i,
          /^yiy$/i,
          /開始|繼續|下一步|下一題|重試|完成|上傳|upload/i,
          /^\d+\s*\/\s*\d+$/
        ].some((pattern) => pattern.test(line));
      }) || ''
  );

  return {
    index,
    category: pickCategory(headings, progress, question),
    question,
    progress,
    headings
  } satisfies QuestionSnapshot;
}

async function collectOverviewCategories(page: import('@playwright/test').Page) {
  const knownCategories = ['粗大動作', '精細動作', '社會情緒', '語言理解', '語言表達', '認知'];
  const discovered = new Set<string>();

  for (let step = 0; step < 6; step += 1) {
    await waitForUiSettled(page, 3_000).catch(() => undefined);

    const text = await page.locator('body').innerText().catch(() => '');
    for (const category of knownCategories) {
      if (text.includes(category)) {
        discovered.add(category);
      }
    }

    const nextButton = page.getByRole('button').filter({ hasText: /開始檢測|開始教學|取消/ }).last();
    if (await nextButton.count().catch(() => 0)) {
      break;
    }
  }

  return Array.from(discovered);
}

async function clickFirstMatchingButton(page: import('@playwright/test').Page, pattern: RegExp) {
  const groups = [page.getByRole('button').filter({ hasText: pattern }), page.locator('button').filter({ hasText: pattern })];

  for (const group of groups) {
    const count = await group.count().catch(() => 0);
    for (let index = count - 1; index >= 0; index -= 1) {
      const candidate = group.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      await candidate.click({ force: true }).catch(() => undefined);
      await waitForUiSettled(page, 5_000).catch(() => undefined);
      return true;
    }
  }

  return false;
}

async function collectActionCandidates(page: import('@playwright/test').Page) {
  return page
    .locator('body *')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => {
          const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
          const element = node as HTMLElement;
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            text,
            role: element.getAttribute('role'),
            disabled: (element as HTMLButtonElement).disabled ?? false,
            visible: rect.width > 0 && rect.height > 0,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        })
        .filter((item) => /(開始檢測|繼續檢測)/.test(item.text))
    )
    .catch(() => []);
}

test.describe('Assessment inventory', () => {
  test('@stateful @inventory @exploratory 管理者前台 YIY 題目分類盤點', async ({ page, accounts }, testInfo) => {
    test.setTimeout(10 * 60 * 1000);

    const loginPage = new LoginPage(page);
    const adminShell = new AdminShellPage(page);
    const frontdesk = new FrontdeskPage(page);
    const childName = 'YIY';
    const apiResponses: Array<{ url: string; status: number; body: string }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (!/assessment|question|task|development|child|answer|video|report/i.test(url)) {
        return;
      }

      const contentType = response.headers()['content-type'] || '';
      if (!/json/i.test(contentType)) {
        return;
      }

      const body = await response.text().catch(() => '');
      if (!body || body.length > 200_000) {
        return;
      }

      apiResponses.push({
        url,
        status: response.status(),
        body
      });
    });

    await loginPage.goto();
    await loginPage.login(accounts.admin);
    await adminShell.expectAdminShellReady();
    await adminShell.gotoFrontdeskFromUserMenu();
    await frontdesk.expectLoaded();
    await frontdesk.openChildByName(childName);
    await frontdesk.openDevelopmentTab();
    await frontdesk.openAssessmentEntry();
    const overviewCategories = await collectOverviewCategories(page);
    const overviewButtons = await page
      .locator('button')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
          disabled: (node as HTMLButtonElement).disabled
        }))
      )
      .catch(() => []);
    const actionCandidates = await collectActionCandidates(page);

    await testInfo.attach('assessment-overview-categories', {
      body: Buffer.from(JSON.stringify(overviewCategories, null, 2), 'utf-8'),
      contentType: 'application/json'
    });
    await testInfo.attach('assessment-overview-buttons', {
      body: Buffer.from(JSON.stringify(overviewButtons, null, 2), 'utf-8'),
      contentType: 'application/json'
    });
    await testInfo.attach('assessment-action-candidates', {
      body: Buffer.from(JSON.stringify(actionCandidates, null, 2), 'utf-8'),
      contentType: 'application/json'
    });

    const clickedStart = await clickFirstMatchingButton(page, /繼續檢測|開始檢測/);
    const overviewStartCandidates = await collectActionCandidates(page);
    await testInfo.attach('assessment-overview-start-candidates', {
      body: Buffer.from(JSON.stringify(overviewStartCandidates, null, 2), 'utf-8'),
      contentType: 'application/json'
    });

    const overviewStartButton = page.locator('button:has-text("開始檢測")').last();
    const clickedOverviewStart = await overviewStartButton.isVisible().catch(() => false);
    if (clickedOverviewStart) {
      await overviewStartButton.click({ force: true }).catch(() => undefined);
      await waitForUiSettled(page, 5_000).catch(() => undefined);
    }
    await clickFirstMatchingButton(page, /開始教學|開始測驗|開始作答|下一步|繼續/);

    await testInfo.attach('assessment-post-start-text', {
      body: Buffer.from(`clickedStart=${clickedStart}\nclickedOverviewStart=${clickedOverviewStart}\n\n${await page.locator('body').innerText().catch(() => '')}`, 'utf-8'),
      contentType: 'text/plain'
    });

    const firstQuestionText = await page.locator('body').innerText().catch(() => '');
    await testInfo.attach('assessment-first-question-text', {
      body: Buffer.from(firstQuestionText, 'utf-8'),
      contentType: 'text/plain'
    });
    await testInfo.attach('assessment-api-responses', {
      body: Buffer.from(JSON.stringify(apiResponses, null, 2), 'utf-8'),
      contentType: 'application/json'
    });

    const snapshots: QuestionSnapshot[] = [];

    for (let index = 1; index <= 60; index += 1) {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/上傳|錄影|重新錄製|送出影片|影片預覽/.test(bodyText)) {
        break;
      }

      const snapshot = await collectQuestionSnapshot(page, index);
      const previous = snapshots[snapshots.length - 1];
      const duplicated =
        previous &&
        previous.category === snapshot.category &&
        previous.question === snapshot.question &&
        previous.progress === snapshot.progress;

      if (!duplicated) {
        snapshots.push(snapshot);
      }

      const choiceButton = page.locator('main button:enabled').first();
      if (!(await choiceButton.isVisible().catch(() => false))) {
        break;
      }

      await choiceButton.click().catch(() => undefined);
      await waitForUiSettled(page, 2_000).catch(() => undefined);

      const nextClicked = await clickFirstMatchingButton(page, /下一題|下一步|繼續|送出|完成/);
      if (!nextClicked) {
        const fallbackNext = page.locator('main button:enabled').last();
        if (await fallbackNext.isVisible().catch(() => false)) {
          await fallbackNext.click().catch(() => undefined);
          await waitForUiSettled(page, 3_000).catch(() => undefined);
        } else {
          break;
        }
      }
    }

    const categoryCounts = snapshots.reduce<Record<string, number>>((accumulator, snapshot) => {
      accumulator[snapshot.category] = (accumulator[snapshot.category] || 0) + 1;
      return accumulator;
    }, {});

    const summary = {
      childName,
      reachedState: snapshots.length > 0 ? 'question' : 'unknown',
      overviewCategories,
      discoveredQuestions: snapshots.length,
      categoryCounts,
      snapshots
    };

    await testInfo.attach('assessment-inventory-summary', {
      body: Buffer.from(JSON.stringify(summary, null, 2), 'utf-8'),
      contentType: 'application/json'
    });

    expect(overviewCategories.length).toBeGreaterThan(0);
  });
});
