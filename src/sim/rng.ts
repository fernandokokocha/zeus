export type Rng = () => number;

export interface RngHolder {
  rngState: number;
}

export function nextRandom(holder: RngHolder): number {
  holder.rngState = (holder.rngState + 0x6d2b79f5) >>> 0;
  let t = holder.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createRng(seed: number): Rng {
  const holder = { rngState: seed >>> 0 };
  return () => nextRandom(holder);
}
