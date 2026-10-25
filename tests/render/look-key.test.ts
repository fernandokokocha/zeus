import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import type { BuildingType } from '../../src/sim/buildings';
import type { Building, GameState } from '../../src/sim/state';
import { lookKey } from '../../src/render/look-key';
import { mainRoadGame } from '../sim/helpers';

function town(): GameState {
  const game = mainRoadGame();
  for (const [type, x, y] of [
    ['storehouse', 0, 7],
    ['storehouse', 3, 7],
    ['fountain', 0, 11],
    ['podium', 2, 11],
    ['granary', 4, 11],
  ] as [BuildingType, number, number][]) {
    expect(placeBuilding(game, type, x, y).ok).toBe(true);
  }
  return game;
}

const keys = (game: GameState) => game.buildings.map((b) => lookKey(b, game));
const changedBy = (game: GameState, change: () => void) => {
  const before = keys(game);
  change();
  return keys(game).flatMap((key, i) => (key === before[i] ? [] : [game.buildings[i].type]));
};
const first = (game: GameState, type: BuildingType): Building => game.buildings.find((b) => b.type === type)!;

describe('lookKey', () => {
  it('changes only for the storehouse a cart delivers a load to', () => {
    const game = town();
    expect(changedBy(game, () => (first(game, 'storehouse').wood += UNITS_PER_LOAD))).toEqual(['storehouse']);
  });

  it('ignores stock below a whole load', () => {
    const game = town();
    expect(changedBy(game, () => (first(game, 'granary').food += UNITS_PER_LOAD - 1))).toEqual([]);
  });

  it('changes when a building gains its first workers', () => {
    const game = town();
    expect(changedBy(game, () => (first(game, 'fountain').workers = 4))).toEqual(['fountain']);
  });

  it('changes when a performance starts on the podium', () => {
    const game = town();
    expect(changedBy(game, () => (first(game, 'podium').performingUntil = game.tick + 10))).toEqual(['podium']);
  });
});
