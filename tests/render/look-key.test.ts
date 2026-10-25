import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import type { BuildingType } from '../../src/sim/buildings';
import type { Building, GameState } from '../../src/sim/state';
import { lookKey } from '../../src/render/look-key';
import { catchFire } from '../../src/sim/safety';
import { mainRoadGame, placedGuild } from '../sim/helpers';

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
  it("changes when a Traders' Guild starts missing a need, and not as its clock runs", () => {
    const { game, guild } = placedGuild();
    expect(changedBy(game, () => (guild.pendingTicks = 1))).toEqual(['tradersGuild']);
    expect(changedBy(game, () => (guild.pendingTicks = 2))).toEqual([]);
    expect(changedBy(game, () => (guild.pendingTicks = 0))).toEqual(['tradersGuild']);
  });

  it("changes when a Traders' Guild's merchants leave", () => {
    const { game, guild } = placedGuild();
    expect(changedBy(game, () => (guild.residents = 0))).toEqual(['tradersGuild']);
  });

  it("burns as ruins whose key reads the fire", () => {
    const { game, guild } = placedGuild();
    catchFire(game, guild);
    const ruins = game.buildings.filter((b) => b.type === 'ruins');
    expect(ruins).toHaveLength(16);
    expect(ruins.every((b) => lookKey(b, game) === 'ruins/0/true')).toBe(true);
  });

  it('changes when a cloth vendor is staffed and when it gains a load', () => {
    const game = town();
    placeBuilding(game, 'agora', 7, 0);
    placeBuilding(game, 'clothVendor', 7, 0);
    const vendor = first(game, 'clothVendor');
    expect(changedBy(game, () => (vendor.workers = 4))).toEqual(['clothVendor']);
    expect(changedBy(game, () => (vendor.cloth += UNITS_PER_LOAD))).toEqual(['clothVendor']);
  });
});
