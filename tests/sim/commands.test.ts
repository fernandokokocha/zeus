import { describe, expect, it } from 'vitest';
import {
  checkBuildingPlacement,
  demolish,
  placeBuilding,
  placeRoad,
  roadPath,
} from '../../src/sim/commands';
import { NO_BUILDING, createGame, tileIndex } from '../../src/sim/state';
import { ENTRY_ROAD_LENGTH } from '../../src/sim/map';
import { grassGame, setTerrain } from './helpers';

describe('createGame', () => {
  it('starts with the entry road laid', () => {
    const game = createGame();
    for (let x = 0; x < ENTRY_ROAD_LENGTH; x++) {
      expect(game.roads[tileIndex(game, x, game.entry.y)]).toBe(true);
    }
  });
});

describe('roadPath', () => {
  it('goes horizontally, then vertically', () => {
    expect(roadPath({ x: 1, y: 1 }, { x: 3, y: 3 })).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
    ]);
  });

  it('handles drags up and to the left', () => {
    expect(roadPath({ x: 3, y: 3 }, { x: 1, y: 1 })).toEqual([
      { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 },
    ]);
  });

  it('is a single tile for a click', () => {
    expect(roadPath({ x: 4, y: 4 }, { x: 4, y: 4 })).toEqual([{ x: 4, y: 4 }]);
  });
});

describe('placeRoad', () => {
  it('lays road on every tile of the path and bumps the version', () => {
    const game = grassGame();
    const result = placeRoad(game, { x: 1, y: 1 }, { x: 3, y: 2 });
    expect(result).toEqual({ ok: true });
    for (const p of roadPath({ x: 1, y: 1 }, { x: 3, y: 2 })) {
      expect(game.roads[tileIndex(game, p.x, p.y)]).toBe(true);
    }
    expect(game.version).toBe(1);
  });

  it('rejects a path across water and lays nothing', () => {
    const game = grassGame();
    setTerrain(game, 3, 1, 'water');
    expect(placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 })).toEqual({ ok: false, reason: 'Cannot build on water' });
    expect(game.roads[tileIndex(game, 1, 1)]).toBe(false);
    expect(game.version).toBe(0);
  });

  it('rejects a path through a building', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 3, 0);
    expect(placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 })).toEqual({ ok: false, reason: 'A building is in the way' });
  });

  it('rejects a path leaving the map', () => {
    const game = grassGame();
    expect(placeRoad(game, { x: 18, y: 1 }, { x: 25, y: 1 })).toEqual({ ok: false, reason: 'Outside the map' });
  });

  it('crosses existing roads', () => {
    const game = grassGame();
    placeRoad(game, { x: 3, y: 0 }, { x: 3, y: 5 });
    expect(placeRoad(game, { x: 1, y: 2 }, { x: 6, y: 2 })).toEqual({ ok: true });
  });
});

describe('placeBuilding', () => {
  it('occupies exactly its footprint', () => {
    const game = grassGame();
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: true });
    const id = game.buildings[0].id;
    expect(game.buildingIdAt[tileIndex(game, 2, 2)]).toBe(id);
    expect(game.buildingIdAt[tileIndex(game, 3, 3)]).toBe(id);
    expect(game.buildingIdAt[tileIndex(game, 4, 4)]).toBe(NO_BUILDING);
  });

  it('rejects overlapping another building', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    expect(placeBuilding(game, 'testBuilding', 3, 3)).toEqual({ ok: false, reason: 'A building is in the way' });
    expect(game.buildings).toHaveLength(1);
  });

  it('rejects a road in the footprint', () => {
    const game = grassGame();
    placeRoad(game, { x: 3, y: 3 }, { x: 3, y: 3 });
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: false, reason: 'A road is in the way' });
  });

  it('rejects a footprint partly off the map', () => {
    const game = grassGame();
    expect(placeBuilding(game, 'testBuilding', 19, 19)).toEqual({ ok: false, reason: 'Outside the map' });
  });

  it('rejects unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 3, 2, 'forest');
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: false, reason: 'Cannot build on forest' });
  });

  it('reports road access from an orthogonally adjacent road only', () => {
    const game = grassGame();
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2)).toEqual({ obstacle: null, roadAccess: false });
    placeRoad(game, { x: 1, y: 1 }, { x: 1, y: 1 });
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2).roadAccess).toBe(false);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2).roadAccess).toBe(true);
  });
});

describe('demolish', () => {
  it('removes roads in the area', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 });
    demolish(game, { x: 2, y: 0 }, { x: 3, y: 2 });
    expect(game.roads[tileIndex(game, 1, 1)]).toBe(true);
    expect(game.roads[tileIndex(game, 2, 1)]).toBe(false);
    expect(game.roads[tileIndex(game, 3, 1)]).toBe(false);
    expect(game.roads[tileIndex(game, 4, 1)]).toBe(true);
  });

  it('removes a whole building when the area touches one of its tiles', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    demolish(game, { x: 3, y: 3 }, { x: 3, y: 3 });
    expect(game.buildings).toEqual([]);
    expect(game.buildingIdAt[tileIndex(game, 2, 2)]).toBe(NO_BUILDING);
  });

  it('clears forest to grass but leaves rock and water', () => {
    const game = grassGame();
    setTerrain(game, 2, 2, 'forest');
    setTerrain(game, 3, 2, 'marble');
    setTerrain(game, 4, 2, 'water');
    demolish(game, { x: 2, y: 2 }, { x: 4, y: 2 });
    expect(game.terrain[tileIndex(game, 2, 2)]).toBe('grass');
    expect(game.terrain[tileIndex(game, 3, 2)]).toBe('marble');
    expect(game.terrain[tileIndex(game, 4, 2)]).toBe('water');
  });

  it('accepts a drag in any direction, clamped to the map', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    demolish(game, { x: 25, y: 25 }, { x: -3, y: -3 });
    expect(game.buildings).toEqual([]);
    expect(game.roads.some(Boolean)).toBe(false);
  });
});
