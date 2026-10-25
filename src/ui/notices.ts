import { gameDate } from '../sim/clock';
import type { Point } from '../sim/point';
import type { GameState, Notice } from '../sim/state';
import { byId } from './dom';

export const FEED_SECONDS = 8;
export const FEED_FADE_SECONDS = 1;
export const FEED_LINES = 4;
const EMPTY_LOG = 'No notices yet';

export interface FeedLine {
  notice: Notice;
  fading: boolean;
}

export function noteArrivals(notices: Notice[], seen: Map<number, number>, now: number): void {
  const logged = new Set(notices.map((n) => n.id));
  for (const id of seen.keys()) if (!logged.has(id)) seen.delete(id);
  for (const notice of notices) if (!seen.has(notice.id)) seen.set(notice.id, now);
}

export function feedLines(notices: Notice[], seen: Map<number, number>, now: number): FeedLine[] {
  return notices
    .map((notice) => ({ notice, age: now - seenTime(seen, notice) }))
    .filter(({ age }) => age < FEED_SECONDS + FEED_FADE_SECONDS)
    .slice(-FEED_LINES)
    .map(({ notice, age }) => ({ notice, fading: age >= FEED_SECONDS }));
}

function seenTime(seen: Map<number, number>, notice: Notice): number {
  const time = seen.get(notice.id);
  if (time === undefined) throw new Error(`Notice ${notice.id} was never noted`);
  return time;
}

export function createNotices(state: GameState, focus: (at: Point) => void): { update(now: number): void } {
  const feed = byId('notice-feed');
  const log = byId('notice-log');
  const logLines = byId('notice-log-lines');
  const seen = new Map<number, number>();
  const shownInFeed = new Map<number, HTMLElement>();
  let loggedUpTo = -1;

  function toggleLog(): void {
    log.hidden = !log.hidden;
    feed.hidden = !log.hidden;
    loggedUpTo = -1;
  }

  function noticeLine(notice: Notice, text: string): HTMLElement {
    const { at } = notice;
    const line = document.createElement(at === null ? 'div' : 'button');
    line.className = 'notice';
    line.textContent = text;
    if (at !== null) {
      line.title = 'Show on the map';
      line.addEventListener('click', () => focus(at));
    }
    return line;
  }

  function updateFeed(now: number): void {
    const lines = feedLines(state.notices, seen, now);
    const showing = new Set(lines.map((line) => line.notice.id));
    for (const [id, element] of shownInFeed) {
      if (showing.has(id)) continue;
      element.remove();
      shownInFeed.delete(id);
    }
    for (const { notice, fading } of lines) {
      let element = shownInFeed.get(notice.id);
      if (!element) {
        element = noticeLine(notice, notice.text);
        shownInFeed.set(notice.id, element);
        feed.append(element);
      }
      element.classList.toggle('fading', fading);
    }
  }

  function updateLog(): void {
    const newest = state.notices.length === 0 ? 0 : state.notices[state.notices.length - 1].id;
    if (newest === loggedUpTo) return;
    loggedUpTo = newest;
    if (state.notices.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = EMPTY_LOG;
      logLines.replaceChildren(empty);
      return;
    }
    logLines.replaceChildren(...[...state.notices].reverse().map(logItem));
  }

  function logItem(notice: Notice): HTMLLIElement {
    const { month, year } = gameDate(notice.tick);
    const item = document.createElement('li');
    item.append(noticeLine(notice, `${month}, Year ${year}: ${notice.text}`));
    return item;
  }

  byId('notices-button').addEventListener('click', toggleLog);
  byId('notice-log-close').addEventListener('click', toggleLog);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n' && !e.repeat) toggleLog();
  });

  return {
    update(now) {
      noteArrivals(state.notices, seen, now);
      updateFeed(now);
      if (!log.hidden) updateLog();
    },
  };
}
