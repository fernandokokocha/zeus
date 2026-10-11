import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, ENTRY_ROAD_LENGTH, MAP_SIZE, generateTerrain } from '../../src/sim/map';

describe('generateTerrain', () => {
  it('is deterministic for a seed', () => {
    expect(generateTerrain(DEFAULT_SEED)).toEqual(generateTerrain(DEFAULT_SEED));
  });

  it('fills the whole map', () => {
    expect(generateTerrain(DEFAULT_SEED).terrain).toHaveLength(MAP_SIZE * MAP_SIZE);
  });

  it('contains every terrain type', () => {
    const kinds = new Set(generateTerrain(DEFAULT_SEED).terrain);
    expect([...kinds].sort()).toEqual(['copper', 'forest', 'grass', 'marble', 'meadow', 'water']);
  });

  it('puts the entry on the west edge with grass leading inland', () => {
    const { terrain, entry } = generateTerrain(DEFAULT_SEED);
    expect(entry.x).toBe(0);
    for (let x = 0; x < ENTRY_ROAD_LENGTH; x++) {
      expect(terrain[entry.y * MAP_SIZE + x]).toBe('grass');
    }
  });

  it('has water only near the east edge', () => {
    const { terrain } = generateTerrain(DEFAULT_SEED);
    terrain.forEach((kind, i) => {
      if (kind === 'water') expect(i % MAP_SIZE).toBeGreaterThan(MAP_SIZE / 2);
    });
  });
});
