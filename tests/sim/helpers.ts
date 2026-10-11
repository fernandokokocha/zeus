import { newGameState, type GameState } from '../../src/sim/state';
import type { Terrain } from '../../src/sim/terrain';

export function grassGame(size = 20): GameState {
  return newGameState(size, new Array<Terrain>(size * size).fill('grass'), { x: 0, y: size / 2 });
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  state.terrain[y * state.size + x] = terrain;
}
