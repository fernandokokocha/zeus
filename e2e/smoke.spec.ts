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
  const drawer = page.locator('#toolbar .tool-drawer');
  if (!(await drawer.getByRole('heading', { name: group, exact: true }).isVisible())) {
    await page.locator('#toolbar .tool-groups').getByRole('button', { name: group, exact: true }).click();
  }
  await drawer.getByRole('button', { name: tool }).click();
}

async function place(page: Page, group: string, tool: RegExp, at: [number, number]): Promise<void> {
  await chooseTool(page, group, tool);
  await drag(page, at, at);
}

test('boots, builds a street with services, food, culture, fleece, oil, cloth, a cloth vendor, materials, sanctuaries and decorations and maintenance, and settlers move in', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#population')).toHaveText('Population 0');
  await expect(page.locator('#treasury')).toHaveText('5,000 dr');
  await expect(page.locator('#toolbar button')).toHaveCount(13);
  const noticeLog = page.locator('#notice-log');
  await page.getByRole('button', { name: 'Notices' }).click();
  await expect(noticeLog).toContainText('No notices yet');
  await page.keyboard.press('n');
  await expect(noticeLog).toBeHidden();
  const charters = page.locator('#charters-panel');
  await page.getByRole('button', { name: 'Charters' }).click();
  await expect(charters).toContainText('Well fed: 0 / 24 months');
  await expect(charters).toContainText("Traders' Guild permits: 0");
  await page.keyboard.press('c');
  await expect(charters).toBeHidden();

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
  await place(page, 'Hygiene & Safety', /^Fountain/, [18, 48]);
  await place(page, 'Administration', /^Tax Office/, [20, 48]);
  await place(page, 'Distribution', /^Granary/, [23, 47]);
  await place(page, 'Distribution', /^Agora/, [17, 53]);
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
  await place(page, 'Hygiene & Safety', /^Maintenance Office/, [9, 46]);
  await page.getByRole('button', { name: /^Road \(/ }).click();
  await drag(page, [29, 50], [37, 50]);
  await place(page, 'Industry', /^Timber Mill/, [33, 51]);
  await place(page, 'Industry', /^Masonry Shop/, [31, 51]);
  await place(page, 'Industry', /^Foundry/, [32, 48]);
  await place(page, 'Industry', /^Sculpture Studio/, [34, 48]);
  await place(page, 'Industry', /^Weaver/, [35, 51]);
  await place(page, 'Mythology', /^Artisans' Guild/, [36, 48]);
  await place(page, 'Mythology', /^Forge of Hephaestus/, [50, 53]);
  await expect(page.locator('#status')).toHaveText('Needs 13 loads of marble in storehouses (has 0)');
  await page.getByRole('button', { name: /^Road \(/ }).click();
  await drag(page, [37, 50], [44, 50]);
  await place(page, 'Distribution', /^Agora/, [40, 46]);
  await place(page, 'Distribution', /^Cloth Vendor/, [40, 44]);
  await place(page, 'Elite', /^Traders' Guild/, [46, 53]);
  await expect(page.locator('#status')).toHaveText("A Traders' Guild goes over four Townhouses forming a 4×4 block");
  await page.keyboard.press('r');
  await expect(page.locator('#status')).toHaveText('Rotated 90° counterclockwise');
  await page.keyboard.press('Escape');
  await expect(page.locator('#treasury')).not.toHaveText('5,000 dr');

  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('#population')).not.toHaveText('Population 0', { timeout: 15_000 });
  await expect(page.locator('#labor')).toHaveText(/^(Unemployed|Need) \d+/);
  const inspector = page.locator('#inspector');
  const inspect = async (at: [number, number]) => {
    const tile = await tileOnScreen(page, ...at);
    await page.mouse.click(tile.x, tile.y, { button: 'right' });
  };
  await inspect([9, 51]);
  await expect(inspector.locator('.meter-label')).toHaveText(['Food', 'Water', 'Fleece', 'Oil', 'Culture']);
  const paused = await inspector.innerText();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(inspector).not.toHaveText(paused, { timeout: 20_000 });
  await inspector.screenshot({ path: 'test-results/inspector-house.png' });
  await inspect([27, 47]);
  await expect(inspector.locator('.meter')).toHaveCount(9);
  await inspector.screenshot({ path: 'test-results/inspector-storehouse.png' });
  await page.screenshot({ path: 'test-results/inspected-storehouse.png' });
  await inspect([17, 51]);
  await expect(inspector.locator('.meter')).toHaveCount(1);
  await inspector.screenshot({ path: 'test-results/inspector-vendor.png' });
  await inspect([40, 44]);
  await expect(inspector).toContainText('Cloth Vendor');
  await page.locator('#inspector-close').click();
  const centre = await tileOnScreen(page, START_VIEW_CENTER.x, START_VIEW_CENTER.y);
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.wheel(0, -800);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'test-results/screenshot.png' });
  const legend = page.locator('#overlay-legend');
  await page.keyboard.press('o');
  await expect(legend).toContainText('Appeal');
  await page.screenshot({ path: 'test-results/appeal.png' });
  const mapModes = page.locator('#map-modes');
  await expect(mapModes.getByRole('button')).toHaveCount(11);
  for (const [mode, title] of [
    ['Water', 'Water access'],
    ['Food', 'Food in houses'],
    ['Supply', 'Fleece and oil in houses'],
    ['Culture', 'Culture points'],
    ['Fire', 'Fire risk'],
    ['Collapse', 'Collapse risk'],
    ['Tax', 'Tax collection'],
    ['Houses', 'House level'],
    ['Guilds', "Traders' Guild sites"],
    ['Staff', 'Staffing'],
  ]) {
    await mapModes.getByRole('button', { name: mode, exact: true }).click();
    await expect(legend).toContainText(title);
  }
  await mapModes.getByRole('button', { name: 'Guilds', exact: true }).click();
  await expect(legend).toContainText('Within 4 tiles of the Main Road');
  await page.screenshot({ path: 'test-results/guild-sites.png' });
  await mapModes.getByRole('button', { name: 'Staff', exact: true }).click();
  await page.screenshot({ path: 'test-results/staffing.png' });
  await mapModes.getByRole('button', { name: 'Staff', exact: true }).click();
  await expect(legend).toBeHidden();
  await page.keyboard.press('o');
  await expect(legend).toContainText('Staffing');
  await page.keyboard.press('o');
  await expect(legend).toBeHidden();
  await page.keyboard.press('c');
  await expect(charters).toContainText(/Well fed: \d+ \/ 24 months/);
  await page.screenshot({ path: 'test-results/charters.png' });
  await page.keyboard.press('c');

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '❚❚' })).toHaveClass(/active/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '4×' })).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
