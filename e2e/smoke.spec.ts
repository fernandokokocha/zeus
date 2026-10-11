import { expect, test } from '@playwright/test';

test('boots and renders the map without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#toolbar button')).toHaveCount(3);

  const canvas = await page.locator('#view').boundingBox();
  expect(canvas!.width).toBeGreaterThan(0);

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/screenshot.png' });
  expect(errors).toEqual([]);
});
