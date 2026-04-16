import { expect, Locator, Page } from '@playwright/test';

type VisibleTarget = Locator;

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

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, '').replace(/臺/g, '台').trim().toLowerCase();
}

export async function maybeDismissOpenPopover(page: Page): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
}
