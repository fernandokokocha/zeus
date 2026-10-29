import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, MAP_SIZE, generateTerrain } from '../../src/sim/map';

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
});
