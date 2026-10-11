import { describe, expect, it } from 'vitest';
import {
  TICKS_PER_MONTH,
  gameDate,
  pauseForInspection,
  resumeAfterInspection,
  setSpeed,
  togglePause,
} from '../../src/sim/clock';
import { tick } from '../../src/sim/tick';
import { grassGame } from './helpers';

describe('gameDate', () => {
  it('starts in January of year 1', () => {
    expect(gameDate(0)).toEqual({ month: 'January', year: 1 });
  });

  it('rolls over months and years', () => {
    expect(gameDate(TICKS_PER_MONTH * 13)).toEqual({ month: 'February', year: 2 });
  });
});

describe('tick', () => {
  it('advances time by one tick', () => {
    const game = grassGame();
    tick(game);
    expect(game.tick).toBe(1);
  });
});

describe('inspection pause', () => {
  it('pauses and restores the previous speed', () => {
    const game = grassGame();
    setSpeed(game, 4);
    pauseForInspection(game);
    expect(game.speed).toBe(0);
    resumeAfterInspection(game);
    expect(game.speed).toBe(4);
  });

  it('keeps the original speed when a second inspection opens over the first', () => {
    const game = grassGame();
    setSpeed(game, 2);
    pauseForInspection(game);
    pauseForInspection(game);
    resumeAfterInspection(game);
    expect(game.speed).toBe(2);
  });

  it('stays paused after inspecting a paused game', () => {
    const game = grassGame();
    setSpeed(game, 0);
    pauseForInspection(game);
    resumeAfterInspection(game);
    expect(game.speed).toBe(0);
  });

  it('lets a speed chosen during inspection win', () => {
    const game = grassGame();
    setSpeed(game, 1);
    pauseForInspection(game);
    setSpeed(game, 4);
    resumeAfterInspection(game);
    expect(game.speed).toBe(4);
  });
});

describe('togglePause', () => {
  it('pauses a running game', () => {
    const game = grassGame();
    setSpeed(game, 2);
    togglePause(game);
    expect(game.speed).toBe(0);
  });

  it('resumes at the last speed played', () => {
    const game = grassGame();
    setSpeed(game, 4);
    setSpeed(game, 0);
    togglePause(game);
    expect(game.speed).toBe(4);
  });

  it('resumes a game that was never sped up at 1×', () => {
    const game = grassGame();
    setSpeed(game, 0);
    togglePause(game);
    expect(game.speed).toBe(1);
  });

  it('resumes the speed played before an inspection paused the game', () => {
    const game = grassGame();
    setSpeed(game, 2);
    pauseForInspection(game);
    togglePause(game);
    expect(game.speed).toBe(2);
    resumeAfterInspection(game);
    expect(game.speed).toBe(2);
  });
});
