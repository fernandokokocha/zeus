import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { ROAMER_REST_TICKS } from '../../src/sim/roamers';
import {
  SANCTUARY_SPECS,
  SANCTUARY_WORK,
  VISITS_PER_STAGE,
  builtStages,
  isFinished,
  suppliedStages,
  type Sanctuary,
} from '../../src/sim/sanctuaries';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks } from './helpers';

const ROAD_Y = 30;
const SITE = { x: 20, y: ROAD_Y + 1 };
const loads = (count: number) => count * UNITS_PER_LOAD;

function city(people = 400): { game: GameState; storehouse: Building } {
  const game = grassGame(60);
  placeRoad(game, { x: 0, y: ROAD_Y }, { x: 59, y: ROAD_Y });
  placeHouse(game, 0, 58);
  game.buildings[0].residents = people;
  placeBuilding(game, 'storehouse', 2, ROAD_Y - 3);
  return { game, storehouse: game.buildings[1] };
}

function forge(people = 400): { game: GameState; storehouse: Building; site: Building } {
  const { game, storehouse } = city(people);
  storehouse.marble = loads(13);
  expect(placeBuilding(game, 'hephaestusSanctuary', SITE.x, SITE.y)).toEqual({ ok: true });
  return { game, storehouse, site: game.buildings.at(-1)! };
}

function supplyFirstStage(site: Building): void {
  site.wood = loads(3);
  site.sculptures = loads(2);
}

function untilNoArtisans(game: GameState): void {
  for (let i = 0; i < 2 * TICKS_PER_MONTH && game.artisans.length > 0; i++) tick(game);
}

describe('placing a sanctuary', () => {
  it.each<[Sanctuary, number, number, number]>([
    ['demeterSanctuary', 18, 12, 840],
    ['athenaSanctuary', 16, 12, 2160],
    ['hephaestusSanctuary', 13, 8, 760],
  ])('a %s is %i×%i, costs %i dr and takes its initial marble from the storehouse', (type, width, height, cost) => {
    const { game, storehouse } = city();
    const initial = SANCTUARY_SPECS[type].initialMarble;
    storehouse.marble = initial + loads(1);
    const treasury = game.treasury;
    expect(placeBuilding(game, type, 10, ROAD_Y + 1)).toEqual({ ok: true });
    const site = game.buildings.at(-1)!;
    expect(game.treasury).toBe(treasury - cost);
    expect(storehouse.marble).toBe(loads(1));
    expect(site.marble).toBe(initial);
    expect(game.buildingIdAt[tileIndex(game, 10 + width - 1, ROAD_Y + height)]).toBe(site.id);
  });

  it('uses the zeus-numbers materials', () => {
    expect(SANCTUARY_SPECS.demeterSanctuary).toEqual({ god: 'Demeter', initialMarble: loads(27), needs: { marble: loads(110), wood: loads(20), sculptures: loads(10) } });
    expect(SANCTUARY_SPECS.athenaSanctuary).toEqual({ god: 'Athena', initialMarble: loads(24), needs: { marble: loads(67), wood: loads(22), sculptures: loads(8) } });
    expect(SANCTUARY_SPECS.hephaestusSanctuary).toEqual({ god: 'Hephaestus', initialMarble: loads(13), needs: { marble: loads(48), wood: loads(14), sculptures: loads(6) } });
  });

  it('takes marble from the fullest storehouses first', () => {
    const { game, storehouse } = city();
    placeBuilding(game, 'storehouse', 6, ROAD_Y - 3);
    const second = game.buildings.at(-1)!;
    storehouse.marble = loads(6);
    second.marble = loads(10);
    expect(placeBuilding(game, 'hephaestusSanctuary', SITE.x, SITE.y)).toEqual({ ok: true });
    expect(second.marble).toBe(0);
    expect(storehouse.marble).toBe(loads(3));
  });

  it('cannot be placed without its initial marble in storehouses', () => {
    const { game, storehouse } = city();
    storehouse.marble = loads(12);
    const treasury = game.treasury;
    expect(placeBuilding(game, 'hephaestusSanctuary', SITE.x, SITE.y)).toEqual({ ok: false, reason: 'Needs 13 loads of marble in storehouses (has 12)' });
    expect(game.treasury).toBe(treasury);
    expect(storehouse.marble).toBe(loads(12));
  });

  it('allows one sanctuary per god', () => {
    const { game, storehouse } = forge();
    storehouse.marble = loads(13);
    expect(placeBuilding(game, 'hephaestusSanctuary', SITE.x, SITE.y + 10)).toEqual({ ok: false, reason: 'Only one Forge of Hephaestus is allowed' });
  });

  it('hires nobody and radiates no appeal while under construction', () => {
    const { game, site } = forge();
    runTicks(game, 2);
    expect(site.workers).toBe(0);
    expect(appealMap(game)[tileIndex(game, SITE.x + 13, SITE.y + 3)]).toBe(0);
  });

  it('hires 60 workers and radiates 20,18,16,14,12,10 once finished', () => {
    const { game, site } = forge();
    site.production = SANCTUARY_WORK;
    runTicks(game, 2);
    expect(site.workers).toBe(60);
    const map = appealMap(game);
    [20, 18, 16, 14, 12, 10].forEach((value, ring) => expect(map[tileIndex(game, SITE.x + 12 + ring + 1, SITE.y + 3)]).toBe(value));
  });
});

describe("a storehouse's supply carts", () => {
  it('take wood and sculptures to a site, up to 4 loads a cart', () => {
    const { game, storehouse, site } = forge();
    storehouse.wood = loads(6);
    storehouse.sculptures = loads(1);
    runTicks(game, 2);
    expect(game.carriers.map((c) => [c.kind, c.wood + c.sculptures]).sort()).toEqual([['sculptureSupply', loads(1)], ['woodSupply', loads(4)]]);
    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(site.wood).toBe(loads(6));
    expect(site.sculptures).toBe(loads(1));
    expect(storehouse.wood).toBe(0);
  });

  it('take marble to a site', () => {
    const { game, storehouse, site } = forge();
    storehouse.marble = loads(2);
    runTicks(game, TICKS_PER_MONTH);
    expect(site.marble).toBe(loads(15));
  });

  it('bring only what the site still needs, counting carts on the way', () => {
    const { game, storehouse, site } = forge();
    site.wood = loads(9);
    storehouse.wood = loads(12);
    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(site.wood).toBe(loads(14));
    expect(storehouse.wood).toBe(loads(7));
    expect(game.carriers).toEqual([]);
  });

  it('stay home without workers', () => {
    const { game, storehouse } = forge(0);
    storehouse.wood = loads(4);
    runTicks(game, TICKS_PER_MONTH);
    expect(game.carriers).toEqual([]);
  });
});

describe('building a sanctuary', () => {
  function withGuild(people = 400): { game: GameState; site: Building; guild: Building } {
    const built = forge(people);
    placeBuilding(built.game, 'artisansGuild', 8, ROAD_Y - 2);
    return { ...built, guild: built.game.buildings.at(-1)! };
  }

  it('has a fifth of every material for each stage', () => {
    const { site } = forge();
    expect(suppliedStages(site)).toBe(0);
    supplyFirstStage(site);
    expect(suppliedStages(site)).toBe(1);
    site.marble = loads(48);
    site.wood = loads(14);
    site.sculptures = loads(6);
    expect(suppliedStages(site)).toBe(5);
  });

  it('gets an artisan from a staffed guild once rested', () => {
    const { game, site, guild } = withGuild();
    supplyFirstStage(site);
    runTicks(game, ROAMER_REST_TICKS - 1);
    expect(game.artisans).toEqual([]);
    tick(game);
    expect(game.artisans).toHaveLength(1);
    expect(game.artisans[0]).toMatchObject({ homeId: guild.id, destinationId: site.id });
  });

  it('counts each artisan who arrives as a visit', () => {
    const { game, site } = withGuild();
    supplyFirstStage(site);
    runTicks(game, ROAMER_REST_TICKS);
    untilNoArtisans(game);
    expect(site.production).toBe(1);
  });

  it('gets no artisans without materials for the next stage', () => {
    const { game } = withGuild();
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.artisans).toEqual([]);
  });

  it('gets no artisans from a guild without workers', () => {
    const { game, site } = withGuild(0);
    supplyFirstStage(site);
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.artisans).toEqual([]);
  });

  it('completes a stage after 4 visits and waits there for materials', () => {
    const { game, site } = withGuild();
    supplyFirstStage(site);
    runTicks(game, 4 * TICKS_PER_MONTH);
    expect(VISITS_PER_STAGE).toBe(4);
    expect(site.production).toBe(4);
    expect(builtStages(site)).toBe(1);
    expect(game.artisans).toEqual([]);
  });

  it('sends one artisan for the last visit even with two guilds', () => {
    const { game, site } = withGuild();
    placeBuilding(game, 'artisansGuild', 12, ROAD_Y - 2);
    supplyFirstStage(site);
    site.production = VISITS_PER_STAGE - 1;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.artisans).toHaveLength(1);
  });

  it('is finished after five stages', () => {
    const { game, site } = withGuild();
    site.marble = loads(48);
    site.wood = loads(14);
    site.sculptures = loads(6);
    site.production = SANCTUARY_WORK - 1;
    runTicks(game, ROAMER_REST_TICKS);
    untilNoArtisans(game);
    expect(isFinished(site)).toBe(true);
    expect(builtStages(site)).toBe(5);
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.artisans).toEqual([]);
  });

  it('sends its artisans away when demolished', () => {
    const { game, site } = withGuild();
    supplyFirstStage(site);
    runTicks(game, ROAMER_REST_TICKS);
    demolish(game, site, site);
    tick(game);
    expect(game.artisans).toEqual([]);
  });

  it('loses the artisans of a demolished guild', () => {
    const { game, site, guild } = withGuild();
    supplyFirstStage(site);
    runTicks(game, ROAMER_REST_TICKS);
    demolish(game, guild, guild);
    expect(game.artisans).toEqual([]);
  });
});
