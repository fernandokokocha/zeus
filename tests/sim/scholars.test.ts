import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { houseStockTarget } from '../../src/sim/food';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { SCHOLARS_HOUSE, LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { assignWorkers } from '../../src/sim/labor';
import { canBurn, canCollapse, catchFire } from '../../src/sim/safety';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { describeTile } from '../../src/sim/inspect';
import { overlayColumns } from '../../src/sim/overlays';
import { populationReport } from '../../src/sim/population';
import { treasuryReport } from '../../src/sim/treasury';
import { GUILD_BLOCK, guildBlock, placedScholars, runTicks, SCHOLARS_NEIGHBOURS, scholarsBlock, scholarsOf, supplyScholars } from './helpers';

const FAR = 1_000_000;

function place(game: GameState) {
  return placeBuilding(game, 'scholarsHouse', GUILD_BLOCK.x, GUILD_BLOCK.y);
}

function hasLibrary(game: GameState): boolean {
  return game.buildings.some((b) => b.type === 'library');
}

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

describe("placing a Scholars' House", () => {
  it('replaces four Townhouses forming a 4×4 block, for 100 dr and a permit', () => {
    const { game } = scholarsBlock();
    const before = game.treasury;
    expect(place(game)).toEqual({ ok: true });
    expect(scholarsOf(game)).toMatchObject({ x: GUILD_BLOCK.x, y: GUILD_BLOCK.y, residents: 240 });
    expect(game.treasury).toBe(before - 100);
    expect(game.permits.scholarsHouse).toBe(0);
    expect(BUILDING_SPECS.scholarsHouse).toMatchObject({ name: "Scholars' House", width: 4, height: 4, cost: 100 });
  });

  it("keeps the four houses' stocks and their latest water and culture", () => {
    const { game, houses } = scholarsBlock();
    houses.forEach((h, i) => {
      Object.assign(h, { food: 40, fleece: 6, oil: 5 });
      h.coveredUntil.water = 100 + i;
    });
    place(game);
    expect(scholarsOf(game)).toMatchObject({ food: 160, fleece: 24, oil: 20 });
    expect(scholarsOf(game).coveredUntil.water).toBe(103);
  });

  it('places its Library across the road, at no cost of its own', () => {
    const { game } = placedScholars();
    expect(game.buildings.find((b) => b.type === 'library')).toMatchObject({ x: GUILD_BLOCK.x, y: 17, rotation: 0 });
    expect(BUILDING_SPECS.library).toMatchObject({ name: 'Library', width: 4, height: 2, cost: 0, workers: 8, appeal: [] });
  });

  it('lines the Main Road as well as an ordinary road', () => {
    const { game } = guildBlock();
    game.permits.scholarsHouse = 1;
    for (const n of SCHOLARS_NEIGHBOURS) placeBuilding(game, n.type, n.x, n.y);
    expect(place(game)).toEqual({ ok: true });
  });

  it('needs a straight stretch of road all along its front', () => {
    const { game } = scholarsBlock();
    demolish(game, { x: 5, y: 16 }, { x: 5, y: 16 });
    expect(place(game)).toEqual({ ok: false, reason: "A Scholars' House must line a straight 4-tile stretch of road" });
  });

  it("needs the Library's ground clear", () => {
    const { game } = scholarsBlock();
    placeBuilding(game, 'park', 4, 18);
    expect(place(game)).toEqual({ ok: false, reason: "The Library's ground across the road isn't clear" });
  });

  it('needs a Theater, a Gymnasium and a Podium within 6 tiles', () => {
    expect(place(scholarsBlock([]).game)).toEqual({ ok: false, reason: 'Needs a Theater, a Gymnasium and a Podium within 6 tiles' });
    expect(place(scholarsBlock(['theater', 'gymnasium']).game)).toEqual({ ok: false, reason: 'Needs a Podium within 6 tiles' });
  });

  it('counts a neighbour by its nearest tile, 6 tiles out and no further', () => {
    const near = scholarsBlock(['theater', 'gymnasium']).game;
    placeRoad(near, { x: 13, y: 16 }, { x: 14, y: 16 });
    placeBuilding(near, 'podium', 13, 17);
    expect(place(near)).toEqual({ ok: false, reason: 'Needs a Podium within 6 tiles' });
    placeBuilding(near, 'podium', 7, 20);
    expect(place(near)).toEqual({ ok: true });
  });

  it('needs a permit from Learned city', () => {
    const { game } = scholarsBlock();
    game.permits.scholarsHouse = 0;
    expect(place(game)).toEqual({ ok: false, reason: "No Scholars' House permit: complete the Learned city charter" });
  });

  it('needs four Townhouses', () => {
    const { game, houses } = scholarsBlock();
    houses[1].level = 'apartment';
    expect(place(game)).toEqual({ ok: false, reason: "A Scholars' House goes over four Townhouses forming a 4×4 block" });
  });

  it('uses its own permit, not the guild’s', () => {
    const { game } = scholarsBlock();
    game.permits = { tradersGuild: 1, scholarsHouse: 0, warriorsHouse: 0 };
    expect(place(game).ok).toBe(false);
    game.permits = { tradersGuild: 0, scholarsHouse: 1, warriorsHouse: 0 };
    expect(place(game).ok).toBe(true);
  });
});

describe("a Scholars' House", () => {
  it("needs a Townhouse's needs, culture 45 and appeal 25, and pays a Townhouse's taxes", () => {
    expect(SCHOLARS_HOUSE).toMatchObject({ needs: ['food', 'water', 'fleece', 'oil', 'scrolls'], culture: 45, appeal: 25, taxMultiplier: 2, capacity: 240 });
  });

  it('pays tax at multiplier 2 once a tax collector passed', () => {
    const { game, scholars, library } = placedScholars();
    placeRoad(game, { x: 1, y: 5 }, { x: 9, y: 5 });
    supplyScholars(scholars);
    scholars.coveredUntil.tax = FAR;
    untilMonthEnd(game);
    expect(scholars.taxPaid.at(-1)).toBeCloseTo(240 * 0.18);
  });

  it("uses food per resident, four houses' fleece and oil, and 8 units of scroll a month", () => {
    const { game, scholars, library } = placedScholars();
    supplyScholars(scholars);
    Object.assign(scholars, { food: 100, fleece: 100, oil: 100, cloth: 100, scrolls: 100 });
    untilMonthEnd(game);
    expect(scholars).toMatchObject({ food: 40, fleece: 92, oil: 92, cloth: 100, scrolls: 92 });
  });

  it('staffs its Library from the labor pool', () => {
    const { game, library } = placedScholars();
    assignWorkers(game);
    expect(library.workers).toBe(8);
  });

  it('can burn like a house, taking its Library; the Library neither burns nor collapses', () => {
    const { game, scholars, library } = placedScholars();
    expect(canBurn(scholars)).toBe(true);
    expect(canBurn(library) || canCollapse(library)).toBe(false);
    catchFire(game, scholars);
    expect(hasLibrary(game)).toBe(false);
  });

  it('keeps its Library from being demolished alone, and takes it when demolished', () => {
    const { game } = placedScholars();
    demolish(game, { x: 3, y: 17 }, { x: 6, y: 18 });
    expect(hasLibrary(game)).toBe(true);
    demolish(game, GUILD_BLOCK, GUILD_BLOCK);
    expect(hasLibrary(game)).toBe(false);
    expect(game.buildingIdAt[tileIndex(game, 3, 17)]).toBe(0);
  });

  it('counts as a Townhouse for Learned city', () => {
    const { game, scholars, library } = placedScholars();
    supplyScholars(scholars);
    untilMonthEnd(game);
    expect(game.learnedCity.reset?.cause).toBe("Scholars' House at 3,12 missed philosophy");
  });
});

describe("a Scholars' House's reading", () => {
  it('turns each unit of scroll read into a page at a fully staffed Library', () => {
    const { game, scholars, library } = placedScholars();
    supplyScholars(scholars);
    untilMonthEnd(game);
    expect(library.workers).toBe(8);
    expect(scholars).toMatchObject({ scrolls: 16, pages: 8 });
  });

  it('makes a Work of Art of every 100 pages, with a notice', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.pages = 95;
    expect(game.worksOfArt).toBe(0);
    untilMonthEnd(game);
    expect(game.worksOfArt).toBe(1);
    expect(scholars.pages).toBe(3);
    expect(game.notices.map((n) => n.text)).toContain('The scholars at 3,12 completed a Work of Art');
  });

  it('makes no pages with an unstaffed Library, though the scrolls are still read', () => {
    const { game, scholars, library } = placedScholars();
    supplyScholars(scholars);
    for (const b of game.buildings) b.residents = b === scholars ? 1 : 0;
    untilMonthEnd(game);
    expect(library.workers).toBe(0);
    expect(scholars).toMatchObject({ scrolls: 16, pages: 0 });
  });
});

describe("a Scholars' House's scrolls", () => {
  function scrollMarket(game: GameState): Building {
    placeBuilding(game, 'agora', 0, 17);
    placeBuilding(game, 'scrollVendor', 0, 17);
    return game.buildings.find((b) => b.type === 'scrollVendor')!;
  }

  it('come from a Scroll Vendor, a 2×2 stall of 4 workers for 10 dr on an agora', () => {
    const { game } = placedScholars();
    placeBuilding(game, 'agora', 0, 17);
    const before = game.treasury;
    expect(placeBuilding(game, 'scrollVendor', 0, 17)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 10);
    expect(BUILDING_SPECS.scrollVendor).toMatchObject({ name: 'Scroll Vendor', width: 2, height: 2, workers: 4 });
  });

  it("are fetched by the vendor's buyer from a storehouse, 4 at a time", () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    const vendor = scrollMarket(game);
    placeRoad(game, { x: 13, y: 16 }, { x: 16, y: 16 });
    expect(placeBuilding(game, 'storehouse', 13, 17)).toEqual({ ok: true });
    const store = game.buildings.find((b) => b.type === 'storehouse')!;
    store.scrolls = 600;
    for (let i = 0; i < TICKS_PER_MONTH && vendor.scrolls === 0; i++) tick(game);
    expect(vendor.scrolls).toBe(400);
    expect(store.scrolls).toBe(200);
  });

  it('are peddled into the house, 3 months of them, and never into a Townhouse', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.scrolls = 0;
    const vendor = scrollMarket(game);
    vendor.scrolls = 400;
    for (let i = 0; i < TICKS_PER_MONTH && scholars.scrolls === 0; i++) tick(game);
    expect(scholars.scrolls).toBe(24);
    expect(vendor.scrolls).toBe(376);
    const townhouse = { ...scholars, type: 'house' as const, level: 'townhouse' as const };
    expect(houseStockTarget(townhouse, 'scrolls')).toBe(0);
  });

  it('start a new house: it stands unstarted until the first scroll arrives', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    Object.assign(scholars, { scrolls: 0, started: false });
    runTicks(game, 2 * LEVEL_CHANGE_TICKS);
    expect(scholarsOf(game)).toBe(scholars);
    expect(describeTile(game, 3, 12).lines).toContain('Waiting for its first scrolls: its needs count from then on');
  });
});

describe("a Scholars' House's demotion", () => {
  it('breaks it into four vacant lots a month after its scrolls run out', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.scrolls = 0;
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    expect(scholarsOf(game)).toBe(scholars);
    tick(game);
    expect(game.buildings.some((b) => b.type === 'scholarsHouse')).toBe(false);
    expect(hasLibrary(game)).toBe(false);
    expect(game.notices.at(-1)).toMatchObject({ text: "The Scholars' House at 3,12 broke up: it lacked scrolls. Its permit is lost", at: { x: 3, y: 12 } });
  });

  it('is stopped by scrolls arriving within the month', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.scrolls = 0;
    runTicks(game, LEVEL_CHANGE_TICKS / 2);
    scholars.scrolls = 24;
    tick(game);
    expect(scholars.pendingTicks).toBe(0);
  });

  it('keeps the Works of Art it made', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    game.worksOfArt = 3;
    scholars.scrolls = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.worksOfArt).toBe(3);
  });

  it('never comes to a supplied house, even with an unstaffed Library', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    for (let i = 0; i < 2 * LEVEL_CHANGE_TICKS; i++) {
      scholars.scrolls = 24;
      tick(game);
    }
    expect(scholarsOf(game)).toBe(scholars);
  });
});

describe("the inspector on a Scholars' House and its Library", () => {
  it('shows the house: residents, reading, supplies and scrolls', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.pages = 42;
    const description = describeTile(game, 3, 12);
    expect(description.title).toBe("Scholars' House");
    expect(description.lines).toContain('Residents 240/240');
    expect(description.lines).toContain('Reading: 42% of the way to the next Work of Art');
    expect(description.lines).toContain('Fully supplied');
    expect(description.meters.map((m) => m.label)).toEqual(['Food', 'Water', 'Fleece', 'Oil', 'Culture', 'Scrolls']);
    expect(description.meters.at(-1)).toEqual({ label: 'Scrolls', fill: 1, value: '24 units (3 months)', need: 'met' });
  });

  it('warns when the house has nothing to read', () => {
    const { game, scholars } = placedScholars();
    supplyScholars(scholars);
    scholars.scrolls = 0;
    tick(game);
    const description = describeTile(game, 3, 12);
    expect(description.lines).toContain('Missing scrolls: breaks up in 1 months');
    expect(description.meters.at(-1)).toEqual({ label: 'Scrolls', fill: 0, value: 'None', need: 'missing' });
  });

  it('shows the Library: workers, and that without them reading makes no Works of Art', () => {
    const { game } = placedScholars();
    expect(describeTile(game, 4, 17)).toMatchObject({
      title: 'Library',
      lines: ['Tile 3, 17', 'Workers 0/8', 'No workers: reading makes no Works of Art'],
    });
  });
});

describe("a Scholars' House in the reports", () => {
  it('has its row in the population chapter', () => {
    const { game, scholars } = placedScholars();
    expect(populationReport(game).levels.at(-1)).toEqual({ name: "Scholars' House", houses: 1, people: scholars.residents });
  });

  it('shows food, fleece, oil and scrolls in the supplies column', () => {
    const { game, scholars, library } = placedScholars();
    supplyScholars(scholars);
    const column = overlayColumns(game, 'supplies').find((c) => c.building === scholars)!;
    expect(column.details).toEqual(['Food 300 / 300', 'Fleece 24 / 40', 'Oil 24 / 40', 'Scrolls 24 / 24']);
  });

  it('puts the Works of Art in the treasury report', () => {
    const { game } = placedScholars();
    game.worksOfArt = 2;
    expect(treasuryReport(game).worksOfArt).toBe(2);
  });
});
