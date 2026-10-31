import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { describeTile } from '../../src/sim/inspect';
import { OVERLAYS, SERVING_WALKERS, buildingLook, overlayColumns } from '../../src/sim/overlays';
import { populationReport } from '../../src/sim/population';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { HOUSE_LEVELS, type HouseLevel } from '../../src/sim/housing';
import { ROAMER_REST_TICKS, ROAMER_SPECS } from '../../src/sim/roamers';
import { RISK_LIMIT, riskShare } from '../../src/sim/safety';
import { closestLotWithRoom } from '../../src/sim/settlers';
import { DISEASE_RISK_INCREMENTS, ELITE_DISEASE_RISK_INCREMENT, fallSick, type SickableLevel } from '../../src/sim/sickness';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { walkerTile } from '../../src/sim/walking';
import { grassGame, placeHouse, placedScholars, runTicks } from './helpers';

const FULL_RISK = RISK_LIMIT * TICKS_PER_MONTH;

function house(game: GameState, x: number, y: number, level: HouseLevel = 'shack', residents = 8): Building {
  placeHouse(game, x, y);
  const placed = game.buildings[game.buildings.length - 1];
  Object.assign(placed, { level, residents });
  return placed;
}

function monthsOf(risk: number): number {
  return risk / TICKS_PER_MONTH;
}

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

function ticksUntil(game: GameState, happened: () => boolean, limit: number): number {
  for (let ticks = 0; ticks < limit; ticks++) {
    if (happened()) return ticks;
    tick(game);
  }
  throw new Error(`Still waiting after ${limit} ticks`);
}

describe('disease risk', () => {
  it.each<[SickableLevel, number]>([
    ['shack', 15],
    ['hovel', 15],
    ['homestead', 10],
    ['tenement', 10],
    ['apartment', 5],
    ['townhouse', 5],
  ])('builds up in an occupied %s by %i a month', (level, increment) => {
    const game = grassGame();
    const occupied = house(game, 4, 4, level, HOUSE_LEVELS[level].capacity);
    runTicks(game, TICKS_PER_MONTH / 2);
    expect(DISEASE_RISK_INCREMENTS[level]).toBe(increment);
    expect(monthsOf(occupied.diseaseRisk)).toBe(increment / 2);
  });

  it("builds up in an elite house by a Townhouse's 5 a month", () => {
    const { game, scholars } = placedScholars();
    const before = scholars.diseaseRisk;
    runTicks(game, TICKS_PER_MONTH);
    expect(ELITE_DISEASE_RISK_INCREMENT).toBe(5);
    expect(monthsOf(scholars.diseaseRisk - before)).toBe(5);
  });

  it('stays at zero in a vacant lot and in other buildings', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    placeBuilding(game, 'taxOffice', 8, 4);
    runTicks(game, TICKS_PER_MONTH);
    expect(game.buildings.map((b) => b.diseaseRisk)).toEqual([0, 0]);
  });

  it('is full at 60', () => {
    const game = grassGame();
    const shack = house(game, 4, 4);
    shack.diseaseRisk = FULL_RISK - 15 * (TICKS_PER_MONTH / 2);
    runTicks(game, TICKS_PER_MONTH / 2 - 1);
    expect(riskShare(shack.diseaseRisk)).toBeLessThan(1);
    tick(game);
    expect(riskShare(shack.diseaseRisk)).toBe(1);
  });

  it('never builds up in a Hut, which keeps no food to spoil', () => {
    const game = grassGame();
    const hut = house(game, 4, 4, 'hut');
    runTicks(game, TICKS_PER_MONTH);
    expect(hut.diseaseRisk).toBe(0);
  });
});

describe('falling sick', () => {
  it('happens at random to a house at full risk, about once a month', () => {
    const game = grassGame();
    const hut = house(game, 4, 4);
    hut.diseaseRisk = FULL_RISK;
    const waited = ticksUntil(game, () => hut.sick, 6 * TICKS_PER_MONTH);
    expect(waited).toBeLessThan(6 * TICKS_PER_MONTH);
  });

  it('never happens below full risk', () => {
    const game = grassGame();
    const hut = house(game, 4, 4, 'townhouse', 60);
    hut.diseaseRisk = FULL_RISK - 6 * TICKS_PER_MONTH;
    runTicks(game, TICKS_PER_MONTH);
    expect(hut.sick).toBe(false);
  });

  it('never happens to a Hut, even next to a sick house', () => {
    const game = grassGame();
    const sick = house(game, 4, 4);
    const hut = house(game, 6, 4, 'hut');
    fallSick(game, sick);
    runTicks(game, TICKS_PER_MONTH);
    expect(hut.sick).toBe(false);
    expect(hut.diseaseRisk).toBe(0);
  });

  it('happens at once to a house at full risk next to a sick one', () => {
    const game = grassGame();
    const sick = house(game, 4, 4);
    const neighbour = house(game, 6, 4);
    fallSick(game, sick);
    neighbour.diseaseRisk = FULL_RISK;
    tick(game);
    expect(neighbour.sick).toBe(true);
  });

  it('posts a notice once per outbreak', () => {
    const game = grassGame();
    const hut = house(game, 4, 4, 'shack', 40);
    hut.diseaseRisk = FULL_RISK;
    ticksUntil(game, () => hut.sick, 6 * TICKS_PER_MONTH);
    runTicks(game, TICKS_PER_MONTH);
    expect(game.notices.filter((n) => n.text === 'Plague at 4,4')).toHaveLength(1);
  });
});

describe('a sick house', () => {
  it('adds 60 disease risk a month to houses within 1 tile, and none further', () => {
    const game = grassGame();
    const sick = house(game, 4, 4, 'townhouse', 60);
    const beside = house(game, 6, 4, 'townhouse', 60);
    const diagonal = house(game, 6, 6, 'townhouse', 60);
    const gap = house(game, 9, 4, 'townhouse', 60);
    fallSick(game, sick);
    runTicks(game, TICKS_PER_MONTH / 4);
    expect(monthsOf(beside.diseaseRisk)).toBeCloseTo((60 + 5) / 4);
    expect(monthsOf(diagonal.diseaseRisk)).toBeCloseTo((60 + 5) / 4);
    expect(monthsOf(gap.diseaseRisk)).toBeCloseTo(5 / 4);
  });

  it('loses a quarter of its residents, rounded up, at each month end', () => {
    const game = grassGame();
    const sick = house(game, 4, 4, 'tenement', 30);
    fallSick(game, sick);
    untilMonthEnd(game);
    expect(sick.residents).toBe(30 - 8);
    untilMonthEnd(game);
    expect(sick.residents).toBe(22 - 6);
  });

  it('takes no settlers', () => {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 6 }, { x: 19, y: 6 });
    game.entry = { x: 0, y: 6 };
    const sick = house(game, 4, 4, 'shack', 4);
    fallSick(game, sick);
    expect(closestLotWithRoom(game, game.entry)).toBeNull();
  });

  it('is cured once it is empty, and its risk is gone', () => {
    const game = grassGame();
    const sick = house(game, 4, 4, 'shack', 1);
    fallSick(game, sick);
    untilMonthEnd(game);
    expect(sick).toMatchObject({ residents: 0, sick: false, diseaseRisk: 0 });
  });

  it('counts its dead in the deaths by plague of the year', () => {
    const game = grassGame();
    const sick = house(game, 4, 4, 'tenement', 30);
    fallSick(game, sick);
    untilMonthEnd(game);
    expect(game.plagueDeaths.thisYear).toBe(8);
  });
});

describe('the Infirmary', () => {
  it('has Zeus numbers', () => {
    expect(BUILDING_SPECS.infirmary).toMatchObject({ name: 'Infirmary', width: 4, height: 4, cost: 35, workers: 11, appeal: [-2, -2, -2, -2] });
    expect(ROAMER_SPECS.healer).toMatchObject({ name: 'Healer', home: 'infirmary', range: 30 });
  });

  function staffedInfirmary(): GameState {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeBuilding(game, 'infirmary', 0, 11);
    house(game, 16, 16, 'shack', 40);
    return game;
  }

  it('sends a healer once staffed and rested', () => {
    const game = staffedInfirmary();
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers).toMatchObject([{ kind: 'healer', homeId: game.buildings[0].id }]);
  });

  it('has its healer reset disease risk and cure the houses he passes', () => {
    const game = staffedInfirmary();
    const sick = house(game, 6, 8, 'tenement', 40);
    const nearby = house(game, 10, 8, 'tenement', 40);
    const far = house(game, 14, 4, 'tenement', 40);
    fallSick(game, sick);
    nearby.diseaseRisk = FULL_RISK / 2;
    far.diseaseRisk = FULL_RISK / 2;
    runTicks(game, TICKS_PER_MONTH / 2);
    expect(sick.sick).toBe(false);
    expect(monthsOf(sick.diseaseRisk)).toBeLessThan(5);
    expect(monthsOf(nearby.diseaseRisk)).toBeLessThan(5);
    expect(monthsOf(far.diseaseRisk)).toBeGreaterThan(30);
  });
});

describe('what the player sees', () => {
  it('shows disease risk in the inspector of an occupied house, and its plague', () => {
    const game = grassGame();
    const hut = house(game, 4, 4);
    hut.diseaseRisk = 0.4 * FULL_RISK;
    expect(describeTile(game, 4, 4).lines).toContain('Disease risk 40%');
    expect(describeTile(game, 4, 4).lines).not.toContain('Sick with plague');
    fallSick(game, hut);
    expect(describeTile(game, 4, 4).lines).toContain('Sick with plague');
  });

  it('shows no disease risk for a vacant lot or a workplace', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    placeBuilding(game, 'taxOffice', 8, 4);
    expect(describeTile(game, 4, 4).lines.join()).not.toMatch(/Disease/);
    expect(describeTile(game, 8, 4).lines.join()).not.toMatch(/Disease/);
  });

  it('has a Disease map mode right after Risk, kept by the Infirmary and its healer', () => {
    expect(OVERLAYS.slice(OVERLAYS.indexOf('risk'), OVERLAYS.indexOf('risk') + 2)).toEqual(['risk', 'disease']);
    expect(SERVING_WALKERS.disease).toEqual(['healer']);
    const game = grassGame();
    placeBuilding(game, 'infirmary', 4, 4);
    expect(buildingLook(game, 'disease', game.buildings[0])).toBe('serving');
  });

  it('stands a column of disease risk on occupied houses, and a full plague column on sick ones', () => {
    const game = grassGame();
    const hut = house(game, 4, 4);
    placeHouse(game, 8, 4);
    hut.diseaseRisk = 0.25 * FULL_RISK;
    expect(overlayColumns(game, 'disease')).toEqual([{ building: hut, bars: [[{ kind: 'disease', share: 0.25 }]], details: ['Disease risk 25%'] }]);
    fallSick(game, hut);
    expect(overlayColumns(game, 'disease')).toEqual([{ building: hut, bars: [[{ kind: 'plague', share: 1 }]], details: ['Disease risk 25%', 'Sick with plague'] }]);
  });

  it('counts deaths by plague this year and last year in the Population report', () => {
    const game = grassGame();
    const sick = house(game, 4, 4, 'tenement', 30);
    fallSick(game, sick);
    untilMonthEnd(game);
    expect(populationReport(game).plagueDeaths).toEqual({ thisYear: { label: 'Year 1, so far', deaths: 8 }, lastYear: null });
    runTicks(game, TICKS_PER_YEAR - TICKS_PER_MONTH - 1);
    const yearOne = game.plagueDeaths.thisYear;
    tick(game);
    expect(yearOne).toBeGreaterThan(8);
    expect(populationReport(game).plagueDeaths.lastYear).toEqual({ label: 'Year 1', deaths: yearOne });
  });
});

describe('the inspector on an Infirmary', () => {
  it('describes it and its healer', () => {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeBuilding(game, 'infirmary', 0, 11);
    house(game, 16, 16, 'shack', 40);
    runTicks(game, 1);
    expect(describeTile(game, 0, 11).lines).toEqual(['Tile 0, 11', 'Workers 11/11', 'Healer getting ready', 'Fire risk 0%', 'Collapse risk 0%']);
    runTicks(game, ROAMER_REST_TICKS);
    const { x, y } = walkerTile(game.roamers[0]);
    expect(describeTile(game, x, y)).toMatchObject({ title: 'Healer', lines: ['From the Infirmary at 0, 11', `Walked ${game.roamers[0].step} of 30 tiles`] });
  });
});
