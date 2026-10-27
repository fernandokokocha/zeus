import { describe, expect, it } from 'vitest';
import { axisTop, graphPoints, madeShare, net } from '../../src/ui/ledger-chapters';

describe('axisTop', () => {
  it('rounds up to 1, 2 or 5 times a power of ten', () => {
    expect(axisTop(13)).toBe(20);
    expect(axisTop(420)).toBe(500);
    expect(axisTop(501)).toBe(1000);
    expect(axisTop(2000)).toBe(2000);
  });

  it('never goes below 10, so an empty city still has an axis', () => {
    expect(axisTop(0)).toBe(10);
    expect(axisTop(3)).toBe(10);
  });
});

describe('graphPoints', () => {
  it('spreads the months across the width and puts the top of the axis at the top', () => {
    expect(graphPoints([0, 50, 100], 200, 80, 100)).toEqual([
      { x: 0, y: 80 },
      { x: 100, y: 40 },
      { x: 200, y: 0 },
    ]);
  });

  it('puts a single month at the left edge', () => {
    expect(graphPoints([25], 200, 80, 100)).toEqual([{ x: 0, y: 60 }]);
  });
});

describe('madeShare', () => {
  it('is what was made out of what the buildings could make', () => {
    expect(madeShare(30, 40)).toBe(0.75);
  });

  it('is nothing when there are no buildings to make the good', () => {
    expect(madeShare(0, 0)).toBe(0);
  });
});

describe('net', () => {
  it('is income less spending', () => {
    expect(net({ taxes: 900, wages: 400, construction: 250, sheep: 30 })).toBe(220);
  });
});
