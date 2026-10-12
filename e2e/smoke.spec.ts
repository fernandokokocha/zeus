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

async function chooseTool(page: Page, group: string, tool: RegExp): Promise<void> {
  await page.getByRole('button', { name: `${group} ▸` }).click();
  await page.locator('#tool-menu').getByRole('button', { name: tool }).click();
}

async function place(page: Page, group: string | null, tool: RegExp, at: [number, number]): Promise<void> {
  if (group) await chooseTool(page, group, tool);
  else await page.locator('#toolbar').getByRole('button', { name: tool }).click();
  await drag(page, at, at);
}

test('boots, builds a street with services, food, culture, fleece, oil and decorations, and settlers move in', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#population')).toHaveText('Population 0');
  await expect(page.locator('#treasury')).toHaveText('5,000 dr');
  await expect(page.locator('#toolbar button')).toHaveCount(11);

  await page.getByRole('button', { name: 'Demolish' }).click();
  await drag(page, [8, 38], [30, 57]);
  await page.getByRole('button', { name: /^Road \(/ }).click();
  await drag(page, [8, 50], [29, 50]);
  await drag(page, [8, 50], [8, 45]);
  await drag(page, [8, 45], [29, 45]);
  await page.getByRole('button', { name: /^Housing/ }).click();
  await drag(page, [9, 48], [12, 49]);
  await drag(page, [9, 51], [16, 52]);
  await place(page, 'Husbandry', /^Wheat Farm/, [15, 48]);
  await place(page, null, /^Fountain/, [18, 48]);
  await place(page, 'Administration', /^Tax Office/, [20, 48]);
  await place(page, 'Distribution', /^Granary/, [23, 47]);
  await place(page, 'Distribution', /^Agora/, [18, 53]);
  await place(page, 'Distribution', /^Food Vendor/, [17, 51]);
  await place(page, 'Administration', /^Palace/, [25, 53]);
  await place(page, 'Aesthetics', /^Flower Garden/, [9, 53]);
  await place(page, 'Aesthetics', /^Column/, [12, 53]);
  await place(page, 'Aesthetics', /^Park/, [13, 53]);
  await place(page, 'Culture', /^College/, [10, 43]);
  await place(page, 'Culture', /^Podium/, [13, 43]);
  await place(page, 'Culture', /^Gymnasium/, [17, 43]);
  await place(page, 'Culture', /^Drama School/, [21, 43]);
  await place(page, 'Culture', /^Theater/, [26, 42]);
  await place(page, 'Distribution', /^Storehouse/, [27, 47]);
  await place(page, 'Industry', /^Carding Shed/, [29, 46]);
  await place(page, 'Distribution', /^Fleece Vendor/, [17, 53]);
  for (const at of [[27, 58], [29, 59], [31, 58], [28, 60]] as [number, number][]) await place(page, 'Husbandry', /^Sheep/, at);
await chooseTool(page, 'Husbandry', /^Olive Tree/);
await drag(page, [28, 61], [31, 62]);
await place(page, 'Husbandry', /^Growers' Lodge/, [29, 48]);
await place(page, 'Industry', /^Olive Press/, [29, 43]);
await place(page, 'Distribution', /^Oil Vendor/, [17, 55]);
  await page.keyboard.press('r');
  await expect(page.locator('#status')).toHaveText('Rotated 90°');
  await page.keyboard.press('Escape');
  await expect(page.locator('#treasury')).not.toHaveText('5,000 dr');

  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('#population')).not.toHaveText('Population 0', { timeout: 15_000 });
  await expect(page.locator('#labor')).toHaveText(/^(Unemployed|Need) \d+/);
  const centre = await tileOnScreen(page, START_VIEW_CENTER.x, START_VIEW_CENTER.y);
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.wheel(0, -800);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'test-results/screenshot.png' });
  await page.keyboard.press('o');
  await expect(page.locator('#appeal-legend')).toBeVisible();
  await page.screenshot({ path: 'test-results/appeal.png' });
  await page.getByRole('button', { name: 'Appeal' }).click();
  await expect(page.locator('#appeal-legend')).toBeHidden();

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '❚❚' })).toHaveClass(/active/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '4×' })).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
