import { describe, expect, it } from 'vitest';
import type { Notice } from '../../src/sim/state';
import { FEED_FADE_SECONDS, FEED_LINES, FEED_SECONDS, feedLines, noteArrivals } from '../../src/ui/notices';

function notice(id: number): Notice {
  return { id, tick: 0, text: `Notice ${id}`, at: { x: 0, y: 0 } };
}

function seenAt(entries: [number, number][]): Map<number, number> {
  return new Map(entries);
}

describe('noteArrivals', () => {
  it('marks unseen notices as seen now and keeps earlier times', () => {
    const seen = seenAt([[1, 2]]);
    noteArrivals([notice(1), notice(2), notice(3)], seen, 10);
    expect([...seen]).toEqual([[1, 2], [2, 10], [3, 10]]);
  });

  it('forgets notices that left the log', () => {
    const seen = seenAt([[1, 2], [2, 3]]);
    noteArrivals([notice(2)], seen, 10);
    expect([...seen]).toEqual([[2, 3]]);
  });
});

describe('feedLines', () => {
  it(`shows a notice for ${FEED_SECONDS} s, then fades it for ${FEED_FADE_SECONDS} s`, () => {
    const notices = [notice(1)];
    const seen = seenAt([[1, 0]]);
    expect(feedLines(notices, seen, FEED_SECONDS - 0.1)).toEqual([{ notice: notices[0], fading: false }]);
    expect(feedLines(notices, seen, FEED_SECONDS + 0.1)).toEqual([{ notice: notices[0], fading: true }]);
    expect(feedLines(notices, seen, FEED_SECONDS + FEED_FADE_SECONDS)).toEqual([]);
  });

  it(`shows the newest ${FEED_LINES}, oldest first`, () => {
    const notices = [1, 2, 3, 4, 5, 6].map(notice);
    const seen = seenAt(notices.map((n) => [n.id, 0]));
    expect(feedLines(notices, seen, 1).map((line) => line.notice.id)).toEqual([3, 4, 5, 6]);
  });

  it('drops expired notices before counting', () => {
    const notices = [1, 2, 3].map(notice);
    const seen = seenAt([[1, 0], [2, 100], [3, 100]]);
    expect(feedLines(notices, seen, 101).map((line) => line.notice.id)).toEqual([2, 3]);
  });
});
