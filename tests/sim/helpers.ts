import { placeHouses, type Result } from '../../src/sim/commands';
import { tick } from '../../src/sim/tick';
import { newGameState, type GameState } from '../../src/sim/state';
import type { Terrain } from '../../src/sim/terrain';

export function grassGame(size = 20): GameState {
  return newGameState(size, new Array<Terrain>(size * size).fill('grass'), { x: 0, y: size / 2 });
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  state.terrain[y * state.size + x] = terrain;
}

export function placeHouse(state: GameState, x: number, y: number): Result {
  return placeHouses(state, { x, y }, { x, y });
}

export function runTicks(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) tick(state);
}

export function setMeadow(state: GameState, x: number, y: number, width: number, height: number): void {
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) setTerrain(state, x + dx, y + dy, 'meadow');
}

export function meadowGame(size = 20): GameState {
  const game = grassGame(size);
  setMeadow(game, 0, 0, size, size);
  return game;
}
