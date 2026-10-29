import { describe, expect, it } from 'vitest';
import { houseAppeal } from '../../src/sim/appeal';
import { BUILDING_SPECS, footprintDistance } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { houseStockTarget } from '../../src/sim/food';
import { LEVEL_CHANGE_TICKS, TRADERS_GUILD } from '../../src/sim/housing';
import { laborSummary } from '../../src/sim/labor';
import { guildBlueprint } from '../../src/sim/guild';
import { describeTile } from '../../src/sim/inspect';
import { canBurn, canCollapse, catchFire } from '../../src/sim/safety';
import { population } from '../../src/sim/settlers';
import { NO_BUILDING, tileIndex, type Building, type GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { GUILD_BLOCK, GUILD_LOTS, guildBlock, guildOf, placedGuild, runTicks, setTerrain, supplyGuild } from './helpers';

const FAR = 1_000_000;

function blockLots(game: GameState): Building[] {
  return game.buildings.filter((b) => b.type === 'house' && footprintDistance({ ...GUILD_BLOCK, type: 'tradersGuild', rotation: 0 }, b) === 0);
}

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

const NOT_A_BLOCK = "A Traders' Guild goes over four Townhouses forming a 4×4 block";
const NOT_ALONG_MAIN_ROAD = "A Traders' Guild must line a straight 4-tile stretch of Main Road";
const YARD_NOT_CLEAR = "The yard's ground across the Main Road isn't clear";

function hasYard(game: GameState): boolean {
  return game.buildings.some((b) => b.type === 'tradeYard');
}

function yardOf(game: GameState): Building {
  const yard = game.buildings.find((b) => b.type === 'tradeYard');
  if (!yard) throw new Error('No yard');
  return yard;
}

describe("a Traders' Guild's blueprint", () => {
  const at = { type: 'tradersGuild', x: 10, y: 10 } as const;
  const along = (xs: number[], ys: number[]) => xs.flatMap((x) => ys.map((y) => ({ x, y })));

  it('lays the Main Road along its front and the yard across it, turning with the rotation', () => {
    expect(guildBlueprint({ ...at, rotation: 0 })).toEqual({
      road: along([10, 11, 12, 13], [14]),
      yard: { type: 'tradeYard', x: 10, y: 15, rotation: 0 },
    });
    expect(guildBlueprint({ ...at, rotation: 1 })).toEqual({
      road: along([9], [10, 11, 12, 13]),
      yard: { type: 'tradeYard', x: 7, y: 10, rotation: 1 },
    });
    expect(guildBlueprint({ ...at, rotation: 2 })).toEqual({
      road: along([10, 11, 12, 13], [9]),
      yard: { type: 'tradeYard', x: 10, y: 7, rotation: 2 },
    });
    expect(guildBlueprint({ ...at, rotation: 3 })).toEqual({
      road: along([14], [10, 11, 12, 13]),
      yard: { type: 'tradeYard', x: 15, y: 10, rotation: 3 },
    });
  });
});

describe("a Traders' Guild's Trade Yard", () => {
  it('cannot be demolished on its own', () => {
    const { game } = placedGuild();
    demolish(game, { x: 3, y: 17 }, { x: 6, y: 18 });
    expect(hasYard(game)).toBe(true);
  });

  it('goes with its guild when the guild is demolished', () => {
    const { game } = placedGuild();
    demolish(game, GUILD_BLOCK, GUILD_BLOCK);
    expect(hasYard(game)).toBe(false);
    expect(game.buildingIdAt[tileIndex(game, 3, 17)]).toBe(NO_BUILDING);
  });

  it('goes with its guild when the guild burns', () => {
    const { game, guild } = placedGuild();
    catchFire(game, guild);
    expect(hasYard(game)).toBe(false);
  });

  it('neither burns nor collapses', () => {
    const { game } = placedGuild();
    const yard = yardOf(game);
    expect(canBurn(yard) || canCollapse(yard)).toBe(false);
  });

  it('fills its cart pushers first, then its merchants', () => {
    const { game } = placedGuild();
    yardOf(game).workers = 18;
    expect(describeTile(game, 4, 17).lines[2]).toBe('Cart pushers 8/8, merchants 10/20');
    yardOf(game).workers = 5;
    expect(describeTile(game, 4, 17).lines[2]).toBe('Cart pushers 5/8, merchants 0/20');
  });

  it('says trade opens with a route', () => {
    const { game } = placedGuild();
    expect(describeTile(game, 4, 17)).toMatchObject({ title: 'Trade Yard', lines: ['Tile 3, 17', 'Workers 0/28', 'Cart pushers 0/8, merchants 0/20', 'Trade Yard: trade opens with a route'] });
  });
});

describe("placing a Traders' Guild", () => {
  it('replaces four Townhouses forming a 4×4 block, for 100 dr and a permit', () => {
    const { game } = guildBlock();
    const before = game.treasury;
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: true });
    expect(blockLots(game)).toEqual([]);
    expect(guildOf(game)).toMatchObject({ x: GUILD_BLOCK.x, y: GUILD_BLOCK.y, residents: 240 });
    expect(game.treasury).toBe(before - 100);
    expect(game.guildPermits).toBe(0);
    expect(BUILDING_SPECS.tradersGuild).toMatchObject({ width: 4, height: 4, cost: 100 });
  });

  it('keeps every resident of the four Townhouses, up to 240', () => {
    expect(TRADERS_GUILD.capacity).toBe(240);
    const { game, houses } = guildBlock();
    houses.forEach((h, i) => (h.residents = 50 + i));
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    expect(guildOf(game).residents).toBe(206);
  });

  it('is topped up to 240 by settlers', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.residents = 230;
    for (let i = 0; i < TICKS_PER_MONTH && guild.residents < 240; i++) tick(game);
    expect(guild.residents).toBe(240);
  });

  it("keeps the four houses' stocks and their latest water and culture", () => {
    const { game, houses } = guildBlock();
    houses.forEach((h, i) => {
      Object.assign(h, { food: 40, fleece: 6, oil: 5 });
      h.coveredUntil.water = 100 + i;
      h.coveredUntil.drama = 50;
    });
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    const guild = guildOf(game);
    expect(guild).toMatchObject({ food: 160, fleece: 24, oil: 20, cloth: 0 });
    expect(guild.coveredUntil).toMatchObject({ water: 103, drama: 50, philosophy: 0 });
  });

  it('needs a permit', () => {
    const { game } = guildBlock();
    game.guildPermits = 0;
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({
      ok: false,
      reason: "No Traders' Guild permit: complete the Well fed charter",
    });
  });

  it('needs all four houses to be Townhouses', () => {
    const { game, houses } = guildBlock();
    houses[2].level = 'apartment';
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('needs four houses, not three and an empty plot', () => {
    const { game } = guildBlock();
    demolish(game, GUILD_LOTS[3], GUILD_LOTS[3]);
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('needs the block exactly, not straddling it', () => {
    const { game } = guildBlock();
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x + 1, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('places its Trade Yard across the Main Road, at no cost of its own', () => {
    const { game } = placedGuild();
    expect(yardOf(game)).toMatchObject({ x: GUILD_BLOCK.x, y: 17, rotation: 0 });
    expect(BUILDING_SPECS.tradeYard).toMatchObject({ width: 4, height: 2, cost: 0, workers: 28, appeal: [] });
  });

  it('needs a straight stretch of Main Road all along its front', () => {
    const offByOne = guildBlock(17).game;
    expect(placeBuilding(offByOne, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_ALONG_MAIN_ROAD });
    const { game } = guildBlock();
    game.mainRoad[tileIndex(game, 6, 16)] = false;
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_ALONG_MAIN_ROAD });
  });

  it('needs the Main Road, not a plain road, along its front', () => {
    const { game } = guildBlock(25);
    placeRoad(game, { x: 0, y: 16 }, { x: 12, y: 16 });
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_ALONG_MAIN_ROAD });
  });

  it('turns with the rotation, so the front must face the Main Road', () => {
    const { game } = guildBlock();
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y, 2)).toEqual({ ok: false, reason: NOT_ALONG_MAIN_ROAD });
  });

  it("needs the yard's ground clear: no building, no road, buildable land", () => {
    const built = guildBlock().game;
    placeBuilding(built, 'park', 4, 18);
    const paved = guildBlock().game;
    placeRoad(paved, { x: 3, y: 17 }, { x: 6, y: 17 });
    const flooded = guildBlock().game;
    setTerrain(flooded, 6, 18, 'water');
    for (const game of [built, paved, flooded]) {
      expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: YARD_NOT_CLEAR });
    }
  });

  it('needs appeal 25 over the block', () => {
    const { game } = guildBlock();
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: 'Needs appeal 25 here (has 22)' });
  });

  it('sends its residents to work like any house', () => {
    const { game } = placedGuild();
    expect(population(game)).toBe(280);
    expect(laborSummary(game)).toMatchObject({ workforce: Math.floor(280 * 0.52), jobs: BUILDING_SPECS.tradeYard.workers });
  });

  it('pays tax at multiplier 1, half a Townhouse, once a tax collector passed', () => {
    expect(TRADERS_GUILD.taxMultiplier).toBe(1);
    const { game, guild } = placedGuild();
    placeRoad(game, { x: 1, y: 5 }, { x: 9, y: 5 });
    supplyGuild(guild);
    untilMonthEnd(game);
    expect(game.lastMonth.taxes).toBe(0);
    guild.coveredUntil.tax = FAR;
    untilMonthEnd(game);
    expect(game.lastMonth.taxes).toBeCloseTo(240 * 0.09);
    expect(guild.taxPaid.at(-1)).toBeCloseTo(240 * 0.09);
  });

  it('can burn like a house, leaving ruins', () => {
    const { game, guild } = placedGuild();
    expect(canBurn(guild)).toBe(true);
    catchFire(game, guild);
    expect(game.buildings.filter((b) => b.type === 'ruins')).toHaveLength(16);
  });
});

describe("a Traders' Guild's needs", () => {
  it('are a Townhouse\'s needs plus fine cloth, culture 45 and appeal 25', () => {
    expect(TRADERS_GUILD.needs).toEqual(['food', 'water', 'fleece', 'oil', 'cloth']);
    expect(TRADERS_GUILD).toMatchObject({ culture: 45, appeal: 25 });
  });

  it("uses food per resident, four houses' fleece and oil, and 8 cloth a month", () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    Object.assign(guild, { food: 100, fleece: 100, oil: 100, cloth: 100 });
    untilMonthEnd(game);
    expect(guild).toMatchObject({ food: 40, fleece: 92, oil: 92, cloth: 92 });
  });

  it('is stocked with 3 months of fleece and oil', () => {
    const { guild } = placedGuild();
    expect([houseStockTarget(guild, 'fleece'), houseStockTarget(guild, 'oil')]).toEqual([24, 24]);
  });

  it('is stocked with 3 months of cloth by a cloth peddler', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    placeBuilding(game, 'agora', 10, 17);
    placeBuilding(game, 'clothVendor', 10, 17);
    const vendor = game.buildings.find((b) => b.type === 'clothVendor')!;
    vendor.cloth = 400;
    for (let i = 0; i < TICKS_PER_MONTH && guild.cloth === 0; i++) tick(game);
    expect(guild.cloth).toBe(24);
    expect(vendor.cloth).toBe(376);
  });

  it('is covered by water carriers', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.water = 0;
    placeBuilding(game, 'fountain', 9, 14);
    for (let i = 0; i < TICKS_PER_MONTH && guild.coveredUntil.water === 0; i++) tick(game);
    expect(guild.coveredUntil.water).toBeGreaterThan(game.tick);
  });

  it('resets Well fed when it goes hungry', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.food = 0;
    untilMonthEnd(game);
    expect(game.wellFed.reset).toEqual({ tick: game.tick, house: "Traders' Guild at 3,12" });
  });
});

describe("a Traders' Guild's demotion", () => {
  it('breaks it into four vacant lots a month after placement without cloth', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    expect(guildOf(game)).toBe(guild);
    tick(game);
    expect(game.buildings.some((b) => b.type === 'tradersGuild')).toBe(false);
    expect(hasYard(game)).toBe(false);
    const lots = blockLots(game);
    expect(lots.map(({ x, y, residents }) => ({ x, y, residents }))).toEqual(GUILD_LOTS.map((lot) => ({ ...lot, residents: 0 })));
  });

  it('does not refund the lots or the permit', () => {
    const { game, guild } = placedGuild();
    const before = game.treasury;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings.some((b) => b.id === guild.id)).toBe(false);
    expect(game.treasury).toBe(before - game.lastMonth.wages);
    expect(game.guildPermits).toBe(0);
  });

  it('is stopped by cloth arriving within the month', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS / 2);
    guild.cloth = 24;
    tick(game);
    expect(guild.pendingTicks).toBe(0);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(guildOf(game)).toBe(guild);
  });

  it('never comes to a fully supplied guild', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    runTicks(game, 2 * LEVEL_CHANGE_TICKS);
    expect(guildOf(game)).toBe(guild);
    expect(guild.pendingTicks).toBe(0);
  });

  it('comes when the appeal falls below 25', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    expect(houseAppeal(game, guild)).toBe(27);
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings.some((b) => b.type === 'tradersGuild')).toBe(false);
  });

  it('posts a notice at its place naming what it lacked', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    Object.assign(guild, { cloth: 0, oil: 0 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.notices.at(-1)).toMatchObject({
      text: "The Traders' Guild at 3,12 broke up: it lacked oil, cloth. Its permit is lost",
      at: { x: 3, y: 12 },
    });
  });

  it('names missing culture and appeal with what it had', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.athletics = 0;
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.notices.at(-1)?.text).toBe(
      "The Traders' Guild at 3,12 broke up: it lacked culture 45 (has 25), appeal 25 (has 22). Its permit is lost",
    );
  });
});
