import { describe, expect, it } from 'vitest';
import { houseAppeal } from '../../src/sim/appeal';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks } from './helpers';

function street(): { game: GameState; house: Building } {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 2, 8);
  const house = game.buildings[0];
  house.residents = 8;
  return { game, house };
}

function shackOn(game: GameState, house: Building): void {
  Object.assign(house, { level: 'shack', residents: 16, food: 5 });
}

describe('a Hut', () => {
  it('becomes a Shack with food and appeal 0', () => {
    const { game, house } = street();
    house.food = 1;
    expect(houseAppeal(game, house)).toBe(0);
    tick(game);
    expect(house.level).toBe('shack');
  });

  it('stays a Hut without food', () => {
    const { game, house } = street();
    tick(game);
    expect(house.level).toBe('hut');
  });

  it('stays a Hut below appeal 0', () => {
    const { game, house } = street();
    placeBuilding(game, 'taxOffice', 5, 6);
    house.food = 1;
    expect(houseAppeal(game, house)).toBe(-2);
    tick(game);
    expect(house.level).toBe('hut');
  });

  it('draws settlers to fill its 16 places once a Shack', () => {
    const { game, house } = street();
    house.food = 100;
    runTicks(game, 6 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(house.residents).toBe(16);
  });
});

describe('a Shack', () => {
  it('keeps its level at appeal -11', () => {
    const { game, house } = street();
    shackOn(game, house);
    placeBuilding(game, 'granary', 4, 6);
    expect(houseAppeal(game, house)).toBe(-11);
    tick(game);
    expect(house.level).toBe('shack');
  });

  it('falls back to a Hut at appeal -12 or below, sending away residents above 8', () => {
    const { game, house } = street();
    shackOn(game, house);
    placeBuilding(game, 'granary', 4, 6);
    placeBuilding(game, 'taxOffice', 0, 6);
    expect(houseAppeal(game, house)).toBeLessThanOrEqual(-12);
    tick(game);
    expect(house.level).toBe('hut');
    expect(house.residents).toBe(8);
  });

  it('falls back to a Hut when its food runs out', () => {
    const { game, house } = street();
    shackOn(game, house);
    house.food = 0;
    tick(game);
    expect(house.level).toBe('hut');
    expect(house.residents).toBe(8);
  });
});
