import { expect, Locator, Page } from '@playwright/test';

type VisibleTarget = Locator;
const DEFAULT_UI_SETTLE_TIMEOUT_MS = 12_000;

export async function firstVisible(
  candidates: VisibleTarget[],
  options: { timeoutMs?: number; name?: string } = {}
): Promise<VisibleTarget> {
  const timeoutMs = options.timeoutMs ?? 7_500;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    for (const candidate of candidates) {
      try {
        const count = await candidate.count();
        if (count > 0 && (await candidate.first().isVisible())) {
          return candidate.first();
        }
      } catch {
        // Ignore transient locator errors while waiting for UI to settle.
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Unable to find visible locator${options.name ? ` for ${options.name}` : ''}`);
}

export async function clickFirstVisible(
  candidates: VisibleTarget[],
  options: { timeoutMs?: number; name?: string } = {}
): Promise<VisibleTarget> {
  const locator = await firstVisible(candidates, options);
  await locator.click();
  return locator;
}

export async function fillFirstVisible(
  candidates: VisibleTarget[],
  value: string,
  options: { timeoutMs?: number; name?: string } = {}
): Promise<VisibleTarget> {
  const locator = await firstVisible(candidates, options);
  await locator.fill(value);
  return locator;
}

export async function expectAnyVisible(
  candidates: VisibleTarget[],
  options: { timeoutMs?: number; name?: string } = {}
): Promise<void> {
  const locator = await firstVisible(candidates, options);
  await expect(locator).toBeVisible();
}

export async function maybeFirstVisible(
  candidates: VisibleTarget[],
  options: { timeoutMs?: number; name?: string } = {}
): Promise<VisibleTarget | null> {
  try {
    return await firstVisible(candidates, options);
  } catch {
    return null;
  }
}

export async function isAnyVisible(
  candidates: VisibleTarget[],
  options: { timeoutMs?: number; name?: string } = {}
): Promise<boolean> {
  return (await maybeFirstVisible(candidates, options)) !== null;
}

async function hasVisibleLocator(locator: Locator): Promise<boolean> {
  try {
    const count = await locator.count();
    const limit = Math.min(count, 8);

    for (let index = 0; index < limit; index += 1) {
      if (await locator.nth(index).isVisible().catch(() => false)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export async function waitForUiSettled(page: Page, timeoutMs = DEFAULT_UI_SETTLE_TIMEOUT_MS): Promise<void> {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForLoadState('load').catch(() => undefined);

  const loadingCandidates = [
    page.locator('[aria-busy="true"]'),
    page.getByRole('progressbar'),
    page.locator('[data-testid*="loading"], [data-testid*="spinner"], [data-testid*="skeleton"]'),
    page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]'),
    page.locator('.animate-spin, svg.animate-spin'),
    page.getByText(/載入中|讀取中|loading/i)
  ];

  const startedAt = Date.now();
  while (Date.now() - startedAt <= timeoutMs) {
    let busy = false;

    for (const candidate of loadingCandidates) {
      if (await hasVisibleLocator(candidate)) {
        busy = true;
        break;
      }
    }

    if (!busy) {
      return;
    }

    await page.waitForTimeout(250);
  }
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, '').replace(/臺/g, '台').trim().toLowerCase();
}

export async function maybeDismissOpenPopover(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
}
