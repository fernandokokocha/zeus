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
  dirt: 0xb39566,
  mudBrick: 0xdcbf8f,
  fieldstone: 0xa59a8a,
  reed: 0xa88f5a,
  doorway: 0x3b2a1a,
  tunic: 0x4a74a8,
  skin: 0xd9a77a,
  bundle: 0x8a6a45,
  marbleRock: 0xeeeae0,
  copperRock: 0xa0623a,
  marble: 0xf6f3ec,
  paving: 0xd9cdb4,
  water: 0x5a9bd0,
  spray: 0xa9d3f2,
  bronze: 0xb08d57,
  carrierTunic: 0xf2efe6,
  carrierJar: 0x3c6fb4,
  clerkTunic: 0x8e2b2b,
  tablet: 0xe8dcb5,
  coins: 0xd9b23c,
  furrow: 0x8a6b45,
  sprout: 0x8fb04a,
  wheat: 0xe3c35c,
  sack: 0xc49a52,
  bread: 0xc4873f,
  awning: 0xb5452e,
  lawn: 0x7fa84a,
  petals: [0xd8433b, 0xf0c93a, 0x8f5bb5, 0xf7f2ea] as number[],
  peddlerTunic: 0x5d8a4a,
  buyerTunic: 0x3f8f8a,
  cartTunic: 0x8a6a45,
  appealHigh: 0x3fae4a,
  appealLow: 0xd8402f,
  ghostValid: 0x4caf50,
  ghostWarning: 0xf28c28,
  ghostInvalid: 0xe0533d,
};

export function tileHash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
