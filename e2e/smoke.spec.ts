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

test('boots without errors and builds a road while paused', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await page.getByRole('button', { name: '❚❚' }).click();
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#treasury')).toHaveText('5,000 dr');

  await page.getByRole('button', { name: 'Demolish' }).click();
  await drag(page, [8, 45], [29, 45]);
  await page.getByRole('button', { name: /^Road \(/ }).click();
  await drag(page, [8, 45], [29, 45]);
  await expect(page.locator('#treasury')).not.toHaveText('5,000 dr');

  await page.screenshot({ path: 'test-results/screenshot.png' });
  expect(errors).toEqual([]);
});
