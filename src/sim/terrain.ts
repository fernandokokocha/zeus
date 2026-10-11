export type Terrain = 'grass' | 'meadow' | 'forest' | 'marble' | 'copper' | 'water';

export const BUILDABLE: ReadonlySet<Terrain> = new Set<Terrain>(['grass', 'meadow']);

export const TERRAIN_NAMES: Record<Terrain, string> = {
  grass: 'Grass',
  meadow: 'Meadow',
  forest: 'Forest',
  marble: 'Marble',
  copper: 'Copper ore',
  water: 'Water',
};
