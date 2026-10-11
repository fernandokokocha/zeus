import { describe, expect, it } from 'vitest';
import { walkerPosition } from '../../src/sim/walking';

describe('walkerPosition', () => {
  const walk = {
    path: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    step: 0,
    progress: 0.5,
  };

  it('lies between the current and next tile, facing the next', () => {
    expect(walkerPosition(walk, 0)).toEqual({ x: 0.5, y: 0, facing: { x: 1, y: 0 } });
  });

  it('can look ahead onto the following tile', () => {
    expect(walkerPosition(walk, 0.75)).toEqual({ x: 1, y: 0.25, facing: { x: 0, y: 1 } });
  });

  it('stops at the end of the path', () => {
    expect(walkerPosition(walk, 5)).toEqual({ x: 1, y: 1, facing: { x: 0, y: 1 } });
  });
});
