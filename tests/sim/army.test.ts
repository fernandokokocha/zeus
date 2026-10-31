import { describe, expect, it } from 'vitest';
import { COMPANY_SIZE, HOPLITE_TICKS, armyReport, tickArmy } from '../../src/sim/army';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { describeTile } from '../../src/sim/inspect';
import { createGame, type GameState } from '../../src/sim/state';
import { placedWarriors, runTicks, supplyWarriors } from './helpers';

function drilling() {
  const placed = placedWarriors();
  supplyWarriors(placed.warriors);
  placed.drillGround.workers = 8;
  return placed;
}

function train(game: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) tickArmy(game);
}

describe('the Drill Ground', () => {
  it('trains one hoplite every 2 months at full staff', () => {
    const { game, warriors } = drilling();
    expect(HOPLITE_TICKS).toBe(2 * TICKS_PER_MONTH);
    train(game, HOPLITE_TICKS - 1);
    expect(warriors.hoplites).toBe(0);
    tickArmy(game);
    expect(warriors.hoplites).toBe(1);
  });

  it('trains in proportion to staffing', () => {
    const { game, warriors, drillGround } = drilling();
    drillGround.workers = 4;
    train(game, 2 * HOPLITE_TICKS - 1);
    expect(warriors.hoplites).toBe(0);
    tickArmy(game);
    expect(warriors.hoplites).toBe(1);
  });

  it('trains nobody without workers, before the first armor, or without armor in stock', () => {
    const idle = drilling();
    idle.drillGround.workers = 0;
    const unstarted = drilling();
    unstarted.warriors.started = false;
    const unarmed = drilling();
    unarmed.warriors.armor = 0;
    for (const { game, warriors } of [idle, unstarted, unarmed]) {
      train(game, HOPLITE_TICKS);
      expect(warriors.hoplites).toBe(0);
    }
  });

  it('stops at a full company of 8, and says so once', () => {
    const { game, warriors } = drilling();
    expect(COMPANY_SIZE).toBe(8);
    train(game, (COMPANY_SIZE + 2) * HOPLITE_TICKS);
    expect(warriors.hoplites).toBe(8);
    expect(game.notices.filter((n) => n.text.includes('full company'))).toMatchObject([
      { text: "The Warriors' House at 3,12 has a full company", at: { x: 3, y: 12 } },
    ]);
  });

  it("counts its hoplites among the house's residents", () => {
    const { game, warriors } = drilling();
    train(game, 3 * HOPLITE_TICKS);
    expect(warriors).toMatchObject({ hoplites: 3, residents: 240 });
  });

  it('loses the company with its house', () => {
    const { game, warriors } = drilling();
    warriors.hoplites = 5;
    warriors.armor = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(armyReport(game)).toEqual({ companies: [], hoplites: 0 });
  });

  it('trains in the running game', () => {
    const { game, warriors } = drilling();
    warriors.armor = 100;
    runTicks(game, HOPLITE_TICKS);
    expect(warriors.hoplites).toBe(1);
  });
});

describe('the inspector on hoplites', () => {
  const linesAt = (game: GameState, x: number, y: number) => describeTile(game, x, y).lines;

  it("shows the house's company", () => {
    const { game, warriors } = drilling();
    warriors.hoplites = 5;
    expect(linesAt(game, 3, 12)).toContain('Company 5/8 hoplites');
  });

  it('shows the Drill Ground training and how far the next hoplite is', () => {
    const { game, warriors } = drilling();
    warriors.hoplites = 2;
    train(game, TICKS_PER_MONTH);
    expect(linesAt(game, 3, 17)).toEqual(['Tile 3, 17', 'Workers 8/8', 'Company 2/8 hoplites', 'Training: 50% of a hoplite']);
  });

  it('says why the Drill Ground is not training', () => {
    const { game, warriors, drillGround } = drilling();
    const status = () => linesAt(game, 3, 17).at(-1);
    warriors.hoplites = 8;
    expect(status()).toBe('Company full');
    warriors.hoplites = 0;
    warriors.armor = 0;
    expect(status()).toBe('Not training: the house has no armor');
    warriors.started = false;
    expect(status()).toBe('Not training: waiting for its first armor');
    drillGround.workers = 0;
    expect(status()).toBe('No workers: no hoplites are trained');
  });
});

describe('the army roster', () => {
  it('lists each company and the total', () => {
    const { game, warriors } = drilling();
    warriors.hoplites = 5;
    expect(armyReport(game)).toEqual({ companies: [{ name: "Warriors' House at 3,12", hoplites: 5, of: 8 }], hoplites: 5 });
  });

  it("is empty without a Warriors' House", () => {
    expect(armyReport(createGame())).toEqual({ companies: [], hoplites: 0 });
  });
});
