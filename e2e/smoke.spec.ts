import { expect, test, type Page } from '@playwright/test';

const VISIBLE_WORLD_HEIGHT = 30;
const START_VIEW_CENTER = { x: 15, y: 50 };

async function tileOnScreen(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = (await page.locator('#view').boundingBox())!;
  const pixelsPerUnit = box.height / VISIBLE_WORLD_HEIGHT;
  const dx = x + 0.5 - START_VIEW_CENTER.x;
  const dy = y + 0.5 - START_VIEW_CENTER.y;
  return {
    x: box.x + box.width / 2 + ((dx - dy) / Math.SQRT2) * pixelsPerUnit,
    y: box.y + box.height / 2 + ((dx + dy) / Math.SQRT2) * 0.5 * pixelsPerUnit,
  };
}

async function drag(page: Page, from: [number, number], to: [number, number]): Promise<void> {
  const start = await tileOnScreen(page, ...from);
  const end = await tileOnScreen(page, ...to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

test('boots, builds a street and settlers move in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#population')).toHaveText('Population 0');
  await expect(page.locator('#treasury')).toHaveText('5,000 dr');
  await expect(page.locator('#toolbar button')).toHaveCount(3);

  await page.getByRole('button', { name: 'Demolish' }).click();
  await drag(page, [8, 47], [22, 53]);
  await page.getByRole('button', { name: /^Road/ }).click();
  await drag(page, [8, 50], [22, 50]);
  await page.getByRole('button', { name: /^Housing/ }).click();
  await drag(page, [9, 48], [20, 49]);
  await drag(page, [9, 51], [20, 52]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#treasury')).not.toHaveText('5,000 dr');

  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('#population')).not.toHaveText('Population 0', { timeout: 15_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/screenshot.png' });

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '❚❚' })).toHaveClass(/active/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '4×' })).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
