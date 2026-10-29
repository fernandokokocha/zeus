import { describe, expect, it } from 'vitest';
import { footprint } from '../../src/sim/commands';
import { eliteBlueprint } from '../../src/sim/elites';
import { MAP_SIZE, ORIENTATIONS, generateTerrain, orientMap } from '../../src/sim/map';
import type { Point } from '../../src/sim/point';
import { BUILDABLE, type Terrain } from '../../src/sim/terrain';

const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);
const MIN_RUN = 12;
const ROTATIONS = [0, 1, 2, 3] as const;
const GUILD_PLACEMENTS = 7;
const CLEARABLE: ReadonlySet<Terrain> = new Set<Terrain>([...BUILDABLE, 'forest']);
const MAX_HORIZONTAL_RUNS = 3;
const DEPOSIT_ROAD_CLEARANCE = 8;
const BAND = { minY: MAP_SIZE / 4, maxY: (MAP_SIZE * 3) / 4 - 1 };

interface Run {
  dx: number;
  dy: number;
  steps: number;
}

type GeneratedMap = ReturnType<typeof generateTerrain>;

const CANONICAL_ENTRY = [
  { x: 0, y: MAP_SIZE / 2 },
  { x: 1, y: MAP_SIZE / 2 },
];

function canonical({ terrain, mainRoad }: GeneratedMap): GeneratedMap {
  const turned = ORIENTATIONS.map((o) => orientMap(terrain, mainRoad, o));
  const match = turned.find((map) => JSON.stringify(map.mainRoad.slice(0, 2)) === JSON.stringify(CANONICAL_ENTRY));
  if (!match) throw new Error('No orientation brings the entry to the middle of the west edge');
  return match;
}

function entryEdge({ mainRoad: [entry] }: GeneratedMap): string {
  if (entry.x === 0) return 'west';
  if (entry.x === MAP_SIZE - 1) return 'east';
  if (entry.y === 0) return 'north';
  return 'south';
}

function runsOf(road: Point[]): Run[] {
  const runs: Run[] = [];
  for (let i = 1; i < road.length; i++) {
    const dx = road[i].x - road[i - 1].x;
    const dy = road[i].y - road[i - 1].y;
    const last = runs.at(-1);
    if (last && last.dx === dx && last.dy === dy) last.steps++;
    else runs.push({ dx, dy, steps: 1 });
  }
  return runs;
}

function coastX(terrain: Terrain[], y: number): number {
  let x = 0;
  while (at(terrain, x, y) !== 'water') x++;
  return x;
}

function at(terrain: Terrain[], x: number, y: number): Terrain {
  return terrain[y * MAP_SIZE + x];
}

const index = (p: Point) => p.y * MAP_SIZE + p.x;
const inMap = (p: Point) => p.x >= 0 && p.y >= 0 && p.x < MAP_SIZE && p.y < MAP_SIZE;

function blueprintGrounds(road: Point[]): Point[][] {
  const onRoad = new Set(road.map(index));
  return road.flatMap((corner) =>
    ROTATIONS.flatMap((rotation) => {
      const [offset] = eliteBlueprint({ type: 'tradersGuild', x: 0, y: 0, rotation }).road;
      const guild = { type: 'tradersGuild', x: corner.x - offset.x, y: corner.y - offset.y, rotation } as const;
      const blueprint = eliteBlueprint(guild);
      const ground = [...footprint(guild), ...footprint(blueprint.annex)];
      const fits = blueprint.road.every((p) => inMap(p) && onRoad.has(index(p))) && ground.every((p) => inMap(p) && !onRoad.has(index(p)));
      return fits ? [ground] : [];
    }),
  );
}

function guildBlueprints(terrain: Terrain[], road: Point[]): number {
  const taken = new Set<number>();
  let count = 0;
  for (const ground of blueprintGrounds(road)) {
    if (ground.every((p) => CLEARABLE.has(terrain[index(p)]) && !taken.has(index(p)))) {
      ground.forEach((p) => taken.add(index(p)));
      count++;
    }
  }
  return count;
}

function tilesOf(terrain: Terrain[], kind: Terrain): Point[] {
  return terrain.flatMap((t, i) => (t === kind ? [{ x: i % MAP_SIZE, y: Math.floor(i / MAP_SIZE) }] : []));
}

function regionsOf(terrain: Terrain[], kind: Terrain): number {
  const seen = new Set<number>();
  let regions = 0;
  for (const start of tilesOf(terrain, kind)) {
    if (seen.has(index(start))) continue;
    regions++;
    const queue = [start];
    seen.add(index(start));
    while (queue.length > 0) {
      const p = queue.pop()!;
      for (const n of [{ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }]) {
        if (inMap(n) && terrain[index(n)] === kind && !seen.has(index(n))) {
          seen.add(index(n));
          queue.push(n);
        }
      }
    }
  }
  return regions;
}

describe.each(SEEDS)('the Main Road on seed %i', (seed) => {
  const { terrain, mainRoad } = canonical(generateTerrain(seed));
  const runs = runsOf(mainRoad);

  it('turned so it enters from the west, starts at the middle of the west edge', () => {
    expect(mainRoad[0]).toEqual({ x: 0, y: MAP_SIZE / 2 });
  });

  it('has the sea on the far side from the entry', () => {
    terrain.forEach((kind, i) => {
      if (kind === 'water') expect(i % MAP_SIZE).toBeGreaterThan(MAP_SIZE / 2);
    });
  });

  it('is a connected path that never crosses itself', () => {
    for (let i = 1; i < mainRoad.length; i++) {
      expect(Math.abs(mainRoad[i].x - mainRoad[i - 1].x) + Math.abs(mainRoad[i].y - mainRoad[i - 1].y)).toBe(1);
    }
    expect(new Set(mainRoad.map((p) => `${p.x},${p.y}`)).size).toBe(mainRoad.length);
  });

it('runs on grass', () => {
  for (const p of mainRoad) expect(at(terrain, p.x, p.y)).toBe('grass');
});

it('either reaches the water or ends inland, short of the coast', () => {
  const end = mainRoad.at(-1)!;
  const next = at(terrain, end.x + 1, end.y);
  if (next !== 'water') expect(end.x).toBeLessThan(coastX(terrain, end.y));
});

it('alternates eastward horizontal runs with vertical ones', () => {
  const horizontal = runs.filter((r) => r.dy === 0);
  expect(horizontal.length).toBeGreaterThanOrEqual(2);
  expect(horizontal.length).toBeLessThanOrEqual(MAX_HORIZONTAL_RUNS);
  expect(horizontal.every((r) => r.dx === 1)).toBe(true);
  runs.forEach((run, i) => expect(run.dy === 0).toBe(i % 2 === 0));
});

it('turns only one way vertically, never doubling back', () => {
  const directions = new Set(runs.filter((r) => r.dx === 0).map((r) => r.dy));
  expect(directions.size).toBe(1);
});

  it('has every run at 12 tiles or longer', () => {
    for (const run of runs) expect(run.steps).toBeGreaterThanOrEqual(MIN_RUN);
  });

  it('stays within the middle half of the map height', () => {
    for (const p of mainRoad) {
      expect(p.y).toBeGreaterThanOrEqual(BAND.minY);
      expect(p.y).toBeLessThanOrEqual(BAND.maxY);
    }
  });

  it('has exactly one marble deposit and one copper deposit', () => {
    expect(regionsOf(terrain, 'marble')).toBe(1);
    expect(regionsOf(terrain, 'copper')).toBe(1);
  });

  it('keeps every deposit tile more than 8 tiles from the Main Road', () => {
    for (const d of [...tilesOf(terrain, 'marble'), ...tilesOf(terrain, 'copper')]) {
      for (const p of mainRoad) expect(Math.max(Math.abs(d.x - p.x), Math.abs(d.y - p.y))).toBeGreaterThan(DEPOSIT_ROAD_CLEARANCE);
    }
  });

  it('puts no deposit where a Traders’ Guild blueprint could go', () => {
    const guildGround = new Set(blueprintGrounds(mainRoad).flat().map(index));
    for (const d of [...tilesOf(terrain, 'marble'), ...tilesOf(terrain, 'copper')]) expect(guildGround.has(index(d))).toBe(false);
  });

  it('leaves room for 7 Traders’ Guilds with their yards, on ground that is buildable or can be cleared', () => {
    expect(guildBlueprints(terrain, mainRoad)).toBeGreaterThanOrEqual(GUILD_PLACEMENTS);
  });
});

describe('the Main Road across seeds', () => {
  it('is the same for the same seed', () => {
    expect(generateTerrain(7).mainRoad).toEqual(generateTerrain(7).mainRoad);
  });

  it('enters from every edge of the map across seeds', () => {
    expect(new Set(SEEDS.map((seed) => entryEdge(generateTerrain(seed))))).toEqual(new Set(['west', 'east', 'north', 'south']));
  });

  it('differs between seeds', () => {
    const shapes = new Set(SEEDS.slice(0, 10).map((seed) => JSON.stringify(generateTerrain(seed).mainRoad)));
    expect(shapes.size).toBe(10);
  });

it('reaches the coast on some maps and ends inland on others', () => {
  const reachesWater = SEEDS.map((seed) => {
    const { terrain, mainRoad } = canonical(generateTerrain(seed));
    const end = mainRoad.at(-1)!;
    return at(terrain, end.x + 1, end.y) === 'water';
  });
  expect(reachesWater.filter(Boolean).length).toBeGreaterThanOrEqual(10);
  expect(reachesWater.filter((r) => !r).length).toBeGreaterThanOrEqual(50);
});

it('ends inland anywhere along a spectrum of lengths', () => {
  const inlandEnds = SEEDS.map((seed) => canonical(generateTerrain(seed)))
    .filter(({ terrain, mainRoad }) => at(terrain, mainRoad.at(-1)!.x + 1, mainRoad.at(-1)!.y) !== 'water')
    .map(({ mainRoad }) => mainRoad.at(-1)!.x);
  expect(Math.min(...inlandEnds)).toBeLessThan(35);
  expect(Math.max(...inlandEnds)).toBeGreaterThan(75);
  expect(new Set(inlandEnds).size).toBeGreaterThanOrEqual(30);
});
});
