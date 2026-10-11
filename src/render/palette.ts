import type { Terrain } from '../sim/terrain';

export const TERRAIN_COLORS: Record<Terrain, number> = {
  grass: 0x9bb860,
  meadow: 0xc9c25a,
  forest: 0x6f8f3f,
  marble: 0xd8d4c8,
  copper: 0xb07a4a,
  water: 0x3f7fb5,
};

export const PALETTE = {
  sky: 0x87b5d6,
  plaster: 0xf3ead8,
  terracotta: 0xc0643b,
  road: 0xb9a88a,
  foliage: 0x4f6f2c,
  trunk: 0x6b4a2b,
  marbleRock: 0xeeeae0,
  copperRock: 0xa0623a,
  ghostValid: 0x4caf50,
  ghostWarning: 0xf28c28,
  ghostInvalid: 0xe0533d,
};

export function tileHash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
