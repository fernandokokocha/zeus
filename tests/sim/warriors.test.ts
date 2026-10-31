import { describe, expect, it } from 'vitest';
import { houseAppeal } from '../../src/sim/appeal';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { houseStockTarget } from '../../src/sim/food';
import { ELITE_HOUSING, LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { describeTile } from '../../src/sim/inspect';
import { assignWorkers } from '../../src/sim/labor';
import { ELITE_SITE_READINGS, overlayColumns, overlayReadings } from '../../src/sim/overlays';
import { populationReport } from '../../src/sim/population';
import { canBurn, canCollapse, catchFire } from '../../src/sim/safety';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { GUILD_BLOCK, placedWarriors, runTicks, supplyWarriors, warriorsBlock, warriorsOf } from './helpers';

const FAR = 1_000_000;

function place(game: GameState) {
  return placeBuilding(game, 'warriorsHouse', GUILD_BLOCK.x, GUILD_BLOCK.y);
}

function hasDrillGround(game: GameState): boolean {
  return game.buildings.some((b) => b.type === 'drillGround');
}

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

function uglyArmory(game: GameState): void {
  const placed = placeBuilding(game, 'armory', 7, 17);
  if (!placed.ok) throw new Error(placed.reason);
}

describe("placing a Warriors' House", () => {
  it('replaces four Townhouses forming a 4×4 block, for 100 dr and a permit', () => {
    const { game } = warriorsBlock();
    const before = game.treasury;
    expect(place(game)).toEqual({ ok: true });
    expect(warriorsOf(game)).toMatchObject({ x: GUILD_BLOCK.x, y: GUILD_BLOCK.y, residents: 240 });
    expect(game.treasury).toBe(before - 100);
    expect(game.permits.warriorsHouse).toBe(0);
    expect(BUILDING_SPECS.warriorsHouse).toMatchObject({ name: "Warriors' House", width: 4, height: 4, cost: 100 });
  });

  it("keeps the four houses' stocks", () => {
    const { game, houses } = warriorsBlock();
    for (const h of houses) Object.assign(h, { food: 40, fleece: 6, oil: 5 });
    place(game);
    expect(warriorsOf(game)).toMatchObject({ food: 160, fleece: 24, oil: 20 });
  });

  it('places its Drill Ground across the road, at no cost of its own', () => {
    const { game } = placedWarriors();
    expect(game.buildings.find((b) => b.type === 'drillGround')).toMatchObject({ x: GUILD_BLOCK.x, y: 17, rotation: 0 });
    expect(BUILDING_SPECS.drillGround).toMatchObject({ name: 'Drill Ground', width: 4, height: 2, cost: 0, workers: 8, appeal: [] });
  });

  it("needs the Drill Ground's ground clear", () => {
    const { game } = warriorsBlock();
    placeBuilding(game, 'park', 4, 18);
    expect(place(game)).toEqual({ ok: false, reason: "The Drill Ground's ground across the road isn't clear" });
  });

  it('needs an Infirmary within 6 tiles, counted by its nearest tile', () => {
    expect(place(warriorsBlock(null).game)).toEqual({ ok: false, reason: 'Needs an Infirmary within 6 tiles' });
    expect(place(warriorsBlock({ x: 13, y: 17 }).game)).toEqual({ ok: false, reason: 'Needs an Infirmary within 6 tiles' });
    expect(place(warriorsBlock({ x: 12, y: 17 }).game)).toEqual({ ok: true });
  });

  it('needs a permit from Healthy and well fed', () => {
    const { game } = warriorsBlock();
    game.permits.warriorsHouse = 0;
    expect(place(game)).toEqual({ ok: false, reason: "No Warriors' House permit: complete the Healthy and well fed charter" });
  });

  it('needs no appeal: an Armory next door does not stop it', () => {
    const { game } = warriorsBlock();
    uglyArmory(game);
    expect(houseAppeal(game, { type: 'warriorsHouse', ...GUILD_BLOCK, rotation: 0 })).toBeLessThan(25);
    expect(place(game)).toEqual({ ok: true });
  });
});

describe("a Warriors' House", () => {
  it("needs a Townhouse's needs, culture 45 and armor, no appeal, and pays a Townhouse's taxes", () => {
    expect(ELITE_HOUSING.warriorsHouse).toMatchObject({ needs: ['food', 'water', 'fleece', 'oil', 'armor'], culture: 45, appeal: null, taxMultiplier: 2, capacity: 240 });
  });

  it('pays tax at multiplier 2 once a tax collector passed', () => {
    const { game, warriors } = placedWarriors();
    placeRoad(game, { x: 1, y: 5 }, { x: 9, y: 5 });
    supplyWarriors(warriors);
    warriors.coveredUntil.tax = FAR;
    untilMonthEnd(game);
    expect(warriors.taxPaid.at(-1)).toBeCloseTo(240 * 0.18);
  });

  it("uses food per resident, four houses' fleece and oil, and 8 units of armor a month", () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    Object.assign(warriors, { food: 100, fleece: 100, oil: 100, scrolls: 100, armor: 100 });
    untilMonthEnd(game);
    expect(warriors).toMatchObject({ food: 40, fleece: 92, oil: 92, scrolls: 100, armor: 92 });
  });

  it('staffs its Drill Ground from the labor pool', () => {
    const { game, drillGround } = placedWarriors();
    assignWorkers(game);
    expect(drillGround.workers).toBe(8);
  });

  it('can burn like a house, taking its Drill Ground; the Drill Ground neither burns nor collapses', () => {
    const { game, warriors, drillGround } = placedWarriors();
    expect(canBurn(warriors)).toBe(true);
    expect(canBurn(drillGround) || canCollapse(drillGround)).toBe(false);
    catchFire(game, warriors);
    expect(hasDrillGround(game)).toBe(false);
  });

  it('keeps its Drill Ground from being demolished alone, and takes it when demolished', () => {
    const { game } = placedWarriors();
    demolish(game, { x: 3, y: 17 }, { x: 6, y: 18 });
    expect(hasDrillGround(game)).toBe(true);
    demolish(game, GUILD_BLOCK, GUILD_BLOCK);
    expect(hasDrillGround(game)).toBe(false);
    expect(game.buildingIdAt[tileIndex(game, 3, 17)]).toBe(0);
  });

  it('counts as a Townhouse for Healthy and well fed', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    warriors.food = 0;
    untilMonthEnd(game);
    expect(game.healthyAndWellFed.reset?.cause).toBe("Warriors' House at 3,12 ran out of food");
  });
});

describe("a Warriors' House's armor", () => {
  function armsMarket(game: GameState): Building {
    placeBuilding(game, 'agora', 0, 17);
    placeBuilding(game, 'armsVendor', 0, 17);
    return game.buildings.find((b) => b.type === 'armsVendor')!;
  }

  it('is peddled into the house, 3 months of it, and never into a Townhouse', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    warriors.armor = 0;
    const vendor = armsMarket(game);
    vendor.armor = 400;
    for (let i = 0; i < TICKS_PER_MONTH && warriors.armor === 0; i++) tick(game);
    expect(warriors.armor).toBe(24);
    expect(vendor.armor).toBe(376);
    const townhouse = { ...warriors, type: 'house' as const, level: 'townhouse' as const };
    expect(houseStockTarget(townhouse, 'armor')).toBe(0);
  });

  it('starts a new house: it stands unstarted until the first armor arrives', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    Object.assign(warriors, { armor: 0, started: false });
    runTicks(game, 2 * LEVEL_CHANGE_TICKS);
    expect(warriorsOf(game)).toBe(warriors);
    expect(describeTile(game, 3, 12).lines).toContain('Waiting for its first armor: its needs count from then on');
  });
});

describe("a Warriors' House's demotion", () => {
  it('breaks it into four vacant lots a month after its armor runs out, taking the Drill Ground', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    warriors.armor = 0;
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    expect(warriorsOf(game)).toBe(warriors);
    tick(game);
    expect(game.buildings.some((b) => b.type === 'warriorsHouse')).toBe(false);
    expect(hasDrillGround(game)).toBe(false);
    expect(game.buildings.filter((b) => b.type === 'house' && b.x >= 3 && b.x <= 6 && b.y >= 12 && b.y <= 15)).toHaveLength(4);
    expect(game.notices.at(-1)).toMatchObject({ text: "The Warriors' House at 3,12 broke up: it lacked armor. Its permit is lost", at: { x: 3, y: 12 } });
  });

  it('never comes from ugly neighbours', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    uglyArmory(game);
    for (let i = 0; i < 2 * LEVEL_CHANGE_TICKS; i++) {
      warriors.armor = 24;
      tick(game);
    }
    expect(warriorsOf(game)).toBe(warriors);
    expect(warriors.pendingTicks).toBe(0);
  });
});

describe("the inspector on a Warriors' House and its Drill Ground", () => {
  it('shows the house: residents, supplies and armor, and no appeal', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    const description = describeTile(game, 3, 12);
    expect(description.title).toBe("Warriors' House");
    expect(description.lines).toContain('Residents 240/240');
    expect(description.lines).toContain('Fully supplied');
    expect(description.lines.some((line) => line.startsWith('Appeal'))).toBe(false);
    expect(description.meters.map((m) => m.label)).toEqual(['Food', 'Water', 'Fleece', 'Oil', 'Culture', 'Armor']);
    expect(description.meters.at(-1)).toEqual({ label: 'Armor', fill: 1, value: '24 units (3 months)', need: 'met' });
  });

  it('warns when the house has no armor', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    warriors.armor = 0;
    tick(game);
    const description = describeTile(game, 3, 12);
    expect(description.lines).toContain('Missing armor: breaks up in 1 months');
    expect(description.meters.at(-1)).toEqual({ label: 'Armor', fill: 0, value: 'None', need: 'missing' });
  });

  it('shows the Drill Ground: its tile, workers and company', () => {
    const { game } = placedWarriors();
    expect(describeTile(game, 4, 17)).toMatchObject({ title: 'Drill Ground', lines: ['Tile 3, 17', 'Workers 0/8', 'Company 0/8 hoplites', 'No workers: no hoplites are trained'] });
  });
});

describe("the Warriors' House site", () => {
  const siteLine = (game: GameState, x: number, y: number) => describeTile(game, x, y).lines.find((line) => /Warriors' House site/.test(line));
  const readingAt = (game: GameState, x: number, y: number) => overlayReadings(game, 'eliteSites')[tileIndex(game, x, y)];

  it("says a Warriors' House can be placed on a ready block, even with low appeal", () => {
    const { game } = warriorsBlock();
    uglyArmory(game);
    expect(siteLine(game, 5, 14)).toBe("Warriors' House site at 3, 12: a Warriors' House can be placed now");
  });

  it('shows nowhere without an Infirmary within 6 tiles', () => {
    expect(siteLine(warriorsBlock(null).game, 3, 12)).toBeUndefined();
  });

  it("names the Drill Ground's ground and a missing permit", () => {
    const { game } = warriorsBlock();
    placeBuilding(game, 'park', 4, 18);
    game.permits.warriorsHouse = 0;
    expect(siteLine(game, 3, 12)).toBe("Possible Warriors' House site at 3, 12: the Drill Ground's ground across the road isn't clear, no permit");
  });

  it('colours the block and its Drill Ground in the Elites map mode', () => {
    const { game } = warriorsBlock();
    for (const [x, y] of [[3, 12], [6, 15], [3, 17], [6, 18]]) expect(readingAt(game, x, y)).toBe(ELITE_SITE_READINGS.warriorsHouse);
    game.permits.warriorsHouse = 0;
    expect(readingAt(game, 3, 12)).toBeNull();
  });

  it('is announced once with a notice', () => {
    const { game } = warriorsBlock();
    runTicks(game, 3);
    expect(game.notices.filter((n) => n.text.startsWith("A Warriors' House can now be placed"))).toMatchObject([
      { text: "A Warriors' House can now be placed at 3,12", at: { x: 3, y: 12 } },
    ]);
  });
});

describe("a Warriors' House in the reports", () => {
  it('has its row in the population chapter', () => {
    const { game, warriors } = placedWarriors();
    expect(populationReport(game).levels.find((l) => l.name === "Warriors' House")).toEqual({ name: "Warriors' House", houses: 1, people: warriors.residents });
  });

  it('shows food, fleece, oil and armor in the supplies column', () => {
    const { game, warriors } = placedWarriors();
    supplyWarriors(warriors);
    const column = overlayColumns(game, 'supplies').find((c) => c.building === warriors)!;
    expect(column.details).toEqual(['Food 300 / 300', 'Fleece 24 / 40', 'Oil 24 / 40', 'Armor 24 / 24']);
  });
});
