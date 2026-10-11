# Slice 1: Foundation Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A deployed, playable sandbox. You can see the generated isometric map, pan
and zoom, draw roads, place and demolish a placeholder building, watch the clock run
at chosen speeds, and right-click anything to inspect it.

**Architecture:** `src/sim` is plain TypeScript game state, changed only through
commands and `tick()`, and tested with Vitest. `src/render` draws that state with
Three.js under a fixed orthographic isometric camera. `src/ui` is plain DOM panels and
mouse/keyboard input that turn into sim commands. `src/main.ts` wires them together in
a `requestAnimationFrame` loop with a fixed-timestep simulation.

**Tech Stack:** TypeScript, Vite, Three.js, Vitest, Playwright, GitHub Actions, GitHub
Pages.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`. Read it first,
together with `CLAUDE.md`.

## Global Constraints

- **Map:** 100×100 tiles from a fixed seed. Terrain is grass, meadow, forest, marble,
  copper and water. One entry point on the west edge with a pre-built road.
- **Time:** 1 month = 20 s at 1×. Speeds are 0 (pause), 1×, 2× and 4×.
- **Buildable terrain** is grass and meadow only.
- **Camera:** orthographic, 30° elevation and 45° azimuth (2:1 isometric), with no
  rotation.
- **Code boundary:** `src/sim` never imports `three`, `src/render`, `src/ui`, or touches
  the DOM.
- **UI:** no UI framework; plain DOM + CSS.
- **Code style:** no comments describing *what*, and no defensive `?.` or `!` in app
  code. The one allowed `!` is in tests.
- **Save/load:** none. Treasury and costs arrive in slice 2, so placement is free here.

## Review Focus

1. **A drag that leaves the map or ends over a panel.** Coordinates are clamped to the
   map: demolish clamps its rectangle, and a road that runs off the map is rejected with
   a reason. Tests are in Task 3.
2. **Placing onto a road, a building, unbuildable terrain or partly off-map.** The
   placement is rejected, nothing changes, and the reason appears in the status line.
   Tests are in Task 3.
3. **Demolishing an area that touches only one tile of a building.** The whole building
   goes and its tiles are freed. Test in Task 3.
4. **Opening the inspector twice, opening it while paused, or changing speed while it
   is open.** After closing it, the speed is what the player expects. Tests are in
   Task 4.
5. **Resizing the window or zooming to either extreme.** The aspect ratio stays correct
   and zoom is clamped. This is checked in the playtest checklist (Task 8).

---

### Task 1: Project scaffold and CI

**Files:**
- Create: `.gitignore`, `package.json` (via npm), `tsconfig.json`, `vite.config.ts`,
  `index.html`, `src/main.ts`, `src/style.css`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: the npm scripts `dev`, `build`, `typecheck`, `test`, `test:e2e` and
  `preview`. Later tasks run them.

- [x] **Step 1: Branch and initialize npm**

```bash
git checkout -b slice-01-foundation
npm init -y
npm install three
npm install -D typescript vite vitest @types/three @types/node @playwright/test
```

- [x] **Step 2: Set `package.json` fields**

Edit `package.json` so it contains these fields (keep the generated dependency blocks):

```json
{
  "name": "zeus",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "preview": "vite preview"
  }
}
```

Remove the generated `main`, `keywords`, `author`, `license` and `description` fields.

- [x] **Step 3: Write config files**

`.gitignore`:

```
node_modules
dist
test-results
playwright-report
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "e2e", "*.ts"]
}
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
```

- [x] **Step 4: Minimal page**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zeus</title>
  </head>
  <body>
    <canvas id="view"></canvas>
    <header id="topbar">
      <span id="date"></span>
      <span id="status"></span>
      <div id="speed"></div>
    </header>
    <nav id="toolbar"></nav>
    <aside id="inspector" hidden>
      <button id="inspector-close" aria-label="Close">×</button>
      <h2 id="inspector-title"></h2>
      <ul id="inspector-lines"></ul>
    </aside>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

`src/style.css`:

```css
:root {
  --parchment: #f3ead8;
  --ink: #3b2a1a;
  --terracotta: #c0643b;
}

body {
  margin: 0;
  overflow: hidden;
  font-family: Georgia, 'Times New Roman', serif;
  color: var(--ink);
}

#view {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
}

#topbar,
#toolbar,
#inspector {
  position: fixed;
  background: var(--parchment);
  border: 2px solid var(--terracotta);
  border-radius: 4px;
  padding: 6px 10px;
}

#topbar {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  align-items: center;
}

#status {
  color: var(--terracotta);
  min-width: 12em;
}

#toolbar {
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

#inspector {
  top: 60px;
  right: 8px;
  width: 260px;
}

#inspector-close {
  float: right;
}

#inspector h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

#inspector ul {
  margin: 0;
  padding-left: 18px;
}

button {
  font: inherit;
  background: #fffaf0;
  border: 1px solid var(--ink);
  border-radius: 3px;
  cursor: pointer;
}

button.active {
  background: var(--terracotta);
  color: var(--parchment);
}
```

`src/main.ts` (temporary; Task 7 replaces it):

```ts
import './style.css';

document.getElementById('date')!.textContent = 'Zeus';
```

- [x] **Step 5: CI and Pages workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: screenshot
          path: test-results/screenshot.png
          if-no-files-found: ignore
      - uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [x] **Step 6: Verify the build**

Run: `npm run build`
Expected: succeeds and writes `dist/index.html`.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + TypeScript project with CI and Pages deploy"
```

---

### Task 2: Seeded RNG and terrain generation

**Files:**
- Create: `src/sim/rng.ts`, `src/sim/point.ts`, `src/sim/terrain.ts`, `src/sim/map.ts`
- Test: `tests/sim/rng.test.ts`, `tests/sim/map.test.ts`

**Interfaces:**
- Produces:
  - `createRng(seed: number): Rng`, where `type Rng = () => number` returns values in
    [0, 1).
  - `interface Point { x: number; y: number }`.
  - `interface Rect { minX: number; minY: number; maxX: number; maxY: number }`.
  - `rectBetween(a: Point, b: Point): Rect`, `tilesIn(rect: Rect): Point[]` and
    `clampPoint(p: Point, size: number): Point`.
  - `type Terrain = 'grass' | 'meadow' | 'forest' | 'marble' | 'copper' | 'water'`.
  - `BUILDABLE: ReadonlySet<Terrain>` and `TERRAIN_NAMES: Record<Terrain, string>`.
  - `MAP_SIZE = 100`, `DEFAULT_SEED`, `ENTRY_ROAD_LENGTH = 8`.
  - `generateTerrain(seed: number): { terrain: Terrain[]; entry: Point }`. The terrain
    array is row-major, so tile (x, y) is at `y * MAP_SIZE + x`.

- [x] **Step 1: Write the failing tests**

`tests/sim/rng.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/sim/rng';

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng(1)()).not.toEqual(createRng(2)());
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
```

`tests/sim/map.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, ENTRY_ROAD_LENGTH, MAP_SIZE, generateTerrain } from '../../src/sim/map';

describe('generateTerrain', () => {
  it('is deterministic for a seed', () => {
    expect(generateTerrain(DEFAULT_SEED)).toEqual(generateTerrain(DEFAULT_SEED));
  });

  it('fills the whole map', () => {
    expect(generateTerrain(DEFAULT_SEED).terrain).toHaveLength(MAP_SIZE * MAP_SIZE);
  });

  it('contains every terrain type', () => {
    const kinds = new Set(generateTerrain(DEFAULT_SEED).terrain);
    expect([...kinds].sort()).toEqual(['copper', 'forest', 'grass', 'marble', 'meadow', 'water']);
  });

  it('puts the entry on the west edge with grass leading inland', () => {
    const { terrain, entry } = generateTerrain(DEFAULT_SEED);
    expect(entry.x).toBe(0);
    for (let x = 0; x < ENTRY_ROAD_LENGTH; x++) {
      expect(terrain[entry.y * MAP_SIZE + x]).toBe('grass');
    }
  });

  it('has water only near the east edge', () => {
    const { terrain } = generateTerrain(DEFAULT_SEED);
    terrain.forEach((kind, i) => {
      if (kind === 'water') expect(i % MAP_SIZE).toBeGreaterThan(MAP_SIZE / 2);
    });
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Failed to resolve import" for `src/sim/rng` and `src/sim/map`.

- [x] **Step 3: Implement**

`src/sim/rng.ts`:

```ts
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`src/sim/point.ts`:

```ts
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function rectBetween(a: Point, b: Point): Rect {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

export function tilesIn(rect: Rect): Point[] {
  const tiles: Point[] = [];
  for (let y = rect.minY; y <= rect.maxY; y++) {
    for (let x = rect.minX; x <= rect.maxX; x++) tiles.push({ x, y });
  }
  return tiles;
}

export function clampPoint(p: Point, size: number): Point {
  return {
    x: Math.min(Math.max(p.x, 0), size - 1),
    y: Math.min(Math.max(p.y, 0), size - 1),
  };
}
```

`src/sim/terrain.ts`:

```ts
export type Terrain = 'grass' | 'meadow' | 'forest' | 'marble' | 'copper' | 'water';

export const BUILDABLE: ReadonlySet<Terrain> = new Set<Terrain>(['grass', 'meadow']);

export const TERRAIN_NAMES: Record<Terrain, string> = {
  grass: 'Grass',
  meadow: 'Meadow',
  forest: 'Forest',
  marble: 'Marble',
  copper: 'Copper ore',
  water: 'Water',
};
```

`src/sim/map.ts`:

```ts
import type { Point } from './point';
import { createRng, type Rng } from './rng';
import type { Terrain } from './terrain';

export const MAP_SIZE = 100;
export const DEFAULT_SEED = 1500;
export const ENTRY_ROAD_LENGTH = 8;

const COAST_START = 14;
const COAST_JITTER = 8;
const FOREST_THRESHOLD = 0.64;
const MEADOW_THRESHOLD = 0.6;
const DEPOSIT_RADIUS = 2;
const MARBLE_DEPOSITS = 4;
const COPPER_DEPOSITS = 3;
const DEPOSIT_MARGIN = 10;
const DEPOSIT_COAST_CLEARANCE = 25;

export function generateTerrain(seed: number): { terrain: Terrain[]; entry: Point } {
  const rng = createRng(seed);
  const coast = noiseField(rng, 16);
  const forest = noiseField(rng, 10);
  const meadow = noiseField(rng, 12);

  const terrain: Terrain[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x > MAP_SIZE - COAST_START + coast(x, y) * COAST_JITTER) terrain.push('water');
      else if (forest(x, y) > FOREST_THRESHOLD) terrain.push('forest');
      else if (meadow(x, y) > MEADOW_THRESHOLD) terrain.push('meadow');
      else terrain.push('grass');
    }
  }

  placeDeposits(rng, terrain, 'marble', MARBLE_DEPOSITS);
  placeDeposits(rng, terrain, 'copper', COPPER_DEPOSITS);

  const entry = { x: 0, y: Math.floor(MAP_SIZE / 2) };
  for (let x = 0; x < ENTRY_ROAD_LENGTH; x++) terrain[entry.y * MAP_SIZE + x] = 'grass';

  return { terrain, entry };
}

function placeDeposits(rng: Rng, terrain: Terrain[], kind: Terrain, count: number): void {
  for (let i = 0; i < count; i++) {
    const cx = DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - DEPOSIT_MARGIN - DEPOSIT_COAST_CLEARANCE));
    const cy = DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - 2 * DEPOSIT_MARGIN));
    for (let y = cy - DEPOSIT_RADIUS; y <= cy + DEPOSIT_RADIUS; y++) {
      for (let x = cx - DEPOSIT_RADIUS; x <= cx + DEPOSIT_RADIUS; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= DEPOSIT_RADIUS ** 2) terrain[y * MAP_SIZE + x] = kind;
      }
    }
  }
}

function noiseField(rng: Rng, cellSize: number): (x: number, y: number) => number {
  const cells = Math.ceil(MAP_SIZE / cellSize) + 2;
  const corners = Array.from({ length: cells * cells }, () => rng());
  const corner = (cx: number, cy: number) => corners[cy * cells + cx];

  return (x, y) => {
    const fx = x / cellSize;
    const fy = y / cellSize;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    const tx = smoothstep(fx - cx);
    const ty = smoothstep(fy - cy);
    const top = lerp(corner(cx, cy), corner(cx + 1, cy), tx);
    const bottom = lerp(corner(cx, cy + 1), corner(cx + 1, cy + 1), tx);
    return lerp(top, bottom, ty);
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. If "contains every terrain type" fails because forest or meadow is
missing for seed 1500, try seeds 1501, 1502, … until it passes, and set
`DEFAULT_SEED` to the first one that does. Do not loosen the test.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "Generate seeded terrain with coast, forest, meadow and ore deposits"
```

---

### Task 3: Game state and placement commands

**Files:**
- Create: `src/sim/state.ts`, `src/sim/buildings.ts`, `src/sim/commands.ts`
- Test: `tests/sim/commands.test.ts`, `tests/sim/helpers.ts`

**Interfaces:**
- Consumes: everything Task 2 produces.
- Produces:
  - `type BuildingType = 'testBuilding'` and
    `BUILDING_SPECS: Record<BuildingType, { name: string; width: number; height: number }>`.
  - `type Speed = 0 | 1 | 2 | 4`.
  - `interface Building { id: number; type: BuildingType; x: number; y: number }`, where
    x and y are the top-left tile.
  - `interface GameState { size; terrain: Terrain[]; roads: boolean[]; buildings: Building[]; buildingIdAt: number[]; nextBuildingId; entry: Point; tick: number; speed: Speed; speedBeforeInspection: Speed | null; version: number }`.
  - `NO_BUILDING = 0`.
  - `newGameState(size, terrain, entry): GameState` and
    `createGame(seed = DEFAULT_SEED): GameState`.
  - `tileIndex(state, x, y): number`, `inBounds(state, x, y): boolean` and
    `clampToMap(state, p: Point): Point`.
  - `type Result = { ok: true } | { ok: false; reason: string }`.
  - `roadPath(from: Point, to: Point): Point[]` and
    `roadObstacle(state, x, y): string | null`.
  - `placeRoad(state, from, to): Result`.
  - `footprint(type, x, y): Point[]`.
  - `checkBuildingPlacement(state, type, x, y): { obstacle: string | null; roadAccess: boolean }`.
  - `hasRoadAccess(state, type, x, y): boolean`.
  - `placeBuilding(state, type, x, y): Result`.
  - `demolish(state, from: Point, to: Point): void`.
  - Every successful mutation increments `state.version`. The renderer rebuilds when it
    changes.

- [x] **Step 1: Write the test helper and failing tests**

`tests/sim/helpers.ts`:

```ts
import { newGameState, type GameState } from '../../src/sim/state';
import type { Terrain } from '../../src/sim/terrain';

export function grassGame(size = 20): GameState {
  return newGameState(size, new Array<Terrain>(size * size).fill('grass'), { x: 0, y: size / 2 });
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  state.terrain[y * state.size + x] = terrain;
}
```

`tests/sim/commands.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  checkBuildingPlacement,
  demolish,
  placeBuilding,
  placeRoad,
  roadPath,
} from '../../src/sim/commands';
import { NO_BUILDING, createGame, tileIndex } from '../../src/sim/state';
import { ENTRY_ROAD_LENGTH } from '../../src/sim/map';
import { grassGame, setTerrain } from './helpers';

describe('createGame', () => {
  it('starts with the entry road laid', () => {
    const game = createGame();
    for (let x = 0; x < ENTRY_ROAD_LENGTH; x++) {
      expect(game.roads[tileIndex(game, x, game.entry.y)]).toBe(true);
    }
  });
});

describe('roadPath', () => {
  it('goes horizontally, then vertically', () => {
    expect(roadPath({ x: 1, y: 1 }, { x: 3, y: 3 })).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
    ]);
  });

  it('handles drags up and to the left', () => {
    expect(roadPath({ x: 3, y: 3 }, { x: 1, y: 1 })).toEqual([
      { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 },
    ]);
  });

  it('is a single tile for a click', () => {
    expect(roadPath({ x: 4, y: 4 }, { x: 4, y: 4 })).toEqual([{ x: 4, y: 4 }]);
  });
});

describe('placeRoad', () => {
  it('lays road on every tile of the path and bumps the version', () => {
    const game = grassGame();
    const result = placeRoad(game, { x: 1, y: 1 }, { x: 3, y: 2 });
    expect(result).toEqual({ ok: true });
    for (const p of roadPath({ x: 1, y: 1 }, { x: 3, y: 2 })) {
      expect(game.roads[tileIndex(game, p.x, p.y)]).toBe(true);
    }
    expect(game.version).toBe(1);
  });

  it('rejects a path across water and lays nothing', () => {
    const game = grassGame();
    setTerrain(game, 3, 1, 'water');
    expect(placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 })).toEqual({ ok: false, reason: 'Cannot build on water' });
    expect(game.roads[tileIndex(game, 1, 1)]).toBe(false);
    expect(game.version).toBe(0);
  });

  it('rejects a path through a building', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 3, 0);
    expect(placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 })).toEqual({ ok: false, reason: 'A building is in the way' });
  });

  it('rejects a path leaving the map', () => {
    const game = grassGame();
    expect(placeRoad(game, { x: 18, y: 1 }, { x: 25, y: 1 })).toEqual({ ok: false, reason: 'Outside the map' });
  });

  it('crosses existing roads', () => {
    const game = grassGame();
    placeRoad(game, { x: 3, y: 0 }, { x: 3, y: 5 });
    expect(placeRoad(game, { x: 1, y: 2 }, { x: 6, y: 2 })).toEqual({ ok: true });
  });
});

describe('placeBuilding', () => {
  it('occupies exactly its footprint', () => {
    const game = grassGame();
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: true });
    const id = game.buildings[0].id;
    expect(game.buildingIdAt[tileIndex(game, 2, 2)]).toBe(id);
    expect(game.buildingIdAt[tileIndex(game, 3, 3)]).toBe(id);
    expect(game.buildingIdAt[tileIndex(game, 4, 4)]).toBe(NO_BUILDING);
  });

  it('rejects overlapping another building', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    expect(placeBuilding(game, 'testBuilding', 3, 3)).toEqual({ ok: false, reason: 'A building is in the way' });
    expect(game.buildings).toHaveLength(1);
  });

  it('rejects a road in the footprint', () => {
    const game = grassGame();
    placeRoad(game, { x: 3, y: 3 }, { x: 3, y: 3 });
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: false, reason: 'A road is in the way' });
  });

  it('rejects a footprint partly off the map', () => {
    const game = grassGame();
    expect(placeBuilding(game, 'testBuilding', 19, 19)).toEqual({ ok: false, reason: 'Outside the map' });
  });

  it('rejects unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 3, 2, 'forest');
    expect(placeBuilding(game, 'testBuilding', 2, 2)).toEqual({ ok: false, reason: 'Cannot build on forest' });
  });

  it('reports road access from an orthogonally adjacent road only', () => {
    const game = grassGame();
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2)).toEqual({ obstacle: null, roadAccess: false });
    placeRoad(game, { x: 1, y: 1 }, { x: 1, y: 1 });
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2).roadAccess).toBe(false);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(checkBuildingPlacement(game, 'testBuilding', 2, 2).roadAccess).toBe(true);
  });
});

describe('demolish', () => {
  it('removes roads in the area', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 });
    demolish(game, { x: 2, y: 0 }, { x: 3, y: 2 });
    expect(game.roads[tileIndex(game, 1, 1)]).toBe(true);
    expect(game.roads[tileIndex(game, 2, 1)]).toBe(false);
    expect(game.roads[tileIndex(game, 3, 1)]).toBe(false);
    expect(game.roads[tileIndex(game, 4, 1)]).toBe(true);
  });

  it('removes a whole building when the area touches one of its tiles', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    demolish(game, { x: 3, y: 3 }, { x: 3, y: 3 });
    expect(game.buildings).toEqual([]);
    expect(game.buildingIdAt[tileIndex(game, 2, 2)]).toBe(NO_BUILDING);
  });

  it('accepts a drag in any direction, clamped to the map', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    demolish(game, { x: 25, y: 25 }, { x: -3, y: -3 });
    expect(game.buildings).toEqual([]);
    expect(game.roads.some(Boolean)).toBe(false);
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Failed to resolve import" for `src/sim/commands` and
`src/sim/state`.

- [x] **Step 3: Implement**

`src/sim/buildings.ts`:

```ts
export type BuildingType = 'testBuilding';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  testBuilding: { name: 'Test Building', width: 2, height: 2 },
};
```

`src/sim/state.ts`:

```ts
import type { BuildingType } from './buildings';
import { DEFAULT_SEED, ENTRY_ROAD_LENGTH, MAP_SIZE, generateTerrain } from './map';
import { clampPoint, type Point } from './point';
import type { Terrain } from './terrain';

export type Speed = 0 | 1 | 2 | 4;

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
}

export interface GameState {
  size: number;
  terrain: Terrain[];
  roads: boolean[];
  buildings: Building[];
  buildingIdAt: number[];
  nextBuildingId: number;
  entry: Point;
  tick: number;
  speed: Speed;
  speedBeforeInspection: Speed | null;
  version: number;
}

export const NO_BUILDING = 0;

export function newGameState(size: number, terrain: Terrain[], entry: Point): GameState {
  const roads = new Array<boolean>(size * size).fill(false);
  for (let x = entry.x; x < entry.x + ENTRY_ROAD_LENGTH; x++) roads[entry.y * size + x] = true;
  return {
    size,
    terrain,
    roads,
    buildings: [],
    buildingIdAt: new Array<number>(size * size).fill(NO_BUILDING),
    nextBuildingId: 1,
    entry,
    tick: 0,
    speed: 1,
    speedBeforeInspection: null,
    version: 0,
  };
}

export function createGame(seed = DEFAULT_SEED): GameState {
  const { terrain, entry } = generateTerrain(seed);
  return newGameState(MAP_SIZE, terrain, entry);
}

export function tileIndex(state: GameState, x: number, y: number): number {
  return y * state.size + x;
}

export function inBounds(state: GameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.size && y < state.size;
}

export function clampToMap(state: GameState, p: Point): Point {
  return clampPoint(p, state.size);
}
```

`src/sim/commands.ts`:

```ts
import { BUILDING_SPECS, type BuildingType } from './buildings';
import { rectBetween, tilesIn, type Point } from './point';
import { NO_BUILDING, clampToMap, inBounds, tileIndex, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';

export type Result = { ok: true } | { ok: false; reason: string };

const OK: Result = { ok: true };

function fail(reason: string): Result {
  return { ok: false, reason };
}

export function roadPath(from: Point, to: Point): Point[] {
  const path: Point[] = [];
  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  for (let x = from.x; x !== to.x; x += stepX) path.push({ x, y: from.y });
  for (let y = from.y; y !== to.y; y += stepY) path.push({ x: to.x, y });
  path.push({ x: to.x, y: to.y });
  return path;
}

function terrainObstacle(state: GameState, x: number, y: number): string | null {
  const terrain = state.terrain[tileIndex(state, x, y)];
  return BUILDABLE.has(terrain) ? null : `Cannot build on ${TERRAIN_NAMES[terrain].toLowerCase()}`;
}

export function roadObstacle(state: GameState, x: number, y: number): string | null {
  if (!inBounds(state, x, y)) return 'Outside the map';
  if (state.buildingIdAt[tileIndex(state, x, y)] !== NO_BUILDING) return 'A building is in the way';
  return terrainObstacle(state, x, y);
}

export function placeRoad(state: GameState, from: Point, to: Point): Result {
  const path = roadPath(from, to);
  for (const p of path) {
    const obstacle = roadObstacle(state, p.x, p.y);
    if (obstacle) return fail(obstacle);
  }
  for (const p of path) state.roads[tileIndex(state, p.x, p.y)] = true;
  state.version++;
  return OK;
}

export function footprint(type: BuildingType, x: number, y: number): Point[] {
  const { width, height } = BUILDING_SPECS[type];
  return tilesIn({ minX: x, minY: y, maxX: x + width - 1, maxY: y + height - 1 });
}

function footprintObstacle(state: GameState, type: BuildingType, x: number, y: number): string | null {
  for (const p of footprint(type, x, y)) {
    if (!inBounds(state, p.x, p.y)) return 'Outside the map';
    if (state.roads[tileIndex(state, p.x, p.y)]) return 'A road is in the way';
    if (state.buildingIdAt[tileIndex(state, p.x, p.y)] !== NO_BUILDING) return 'A building is in the way';
    const obstacle = terrainObstacle(state, p.x, p.y);
    if (obstacle) return obstacle;
  }
  return null;
}

export function hasRoadAccess(state: GameState, type: BuildingType, x: number, y: number): boolean {
  const { width, height } = BUILDING_SPECS[type];
  const neighbours: Point[] = [];
  for (let dx = 0; dx < width; dx++) neighbours.push({ x: x + dx, y: y - 1 }, { x: x + dx, y: y + height });
  for (let dy = 0; dy < height; dy++) neighbours.push({ x: x - 1, y: y + dy }, { x: x + width, y: y + dy });
  return neighbours.some((p) => inBounds(state, p.x, p.y) && state.roads[tileIndex(state, p.x, p.y)]);
}

export function checkBuildingPlacement(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
): { obstacle: string | null; roadAccess: boolean } {
  return { obstacle: footprintObstacle(state, type, x, y), roadAccess: hasRoadAccess(state, type, x, y) };
}

export function placeBuilding(state: GameState, type: BuildingType, x: number, y: number): Result {
  const obstacle = footprintObstacle(state, type, x, y);
  if (obstacle) return fail(obstacle);
  const building = { id: state.nextBuildingId++, type, x, y };
  state.buildings.push(building);
  for (const p of footprint(type, x, y)) state.buildingIdAt[tileIndex(state, p.x, p.y)] = building.id;
  state.version++;
  return OK;
}

export function demolish(state: GameState, from: Point, to: Point): void {
  const doomed = new Set<number>();
  for (const p of tilesIn(rectBetween(clampToMap(state, from), clampToMap(state, to)))) {
    const i = tileIndex(state, p.x, p.y);
    state.roads[i] = false;
    if (state.buildingIdAt[i] !== NO_BUILDING) doomed.add(state.buildingIdAt[i]);
  }
  state.buildings = state.buildings.filter((b) => !doomed.has(b.id));
  state.buildingIdAt = state.buildingIdAt.map((id) => (doomed.has(id) ? NO_BUILDING : id));
  state.version++;
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS (all of Task 2 and Task 3).

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "Add game state with road, building and demolish commands"
```

---

### Task 4: Clock, speed, inspection pause, tile descriptions

**Files:**
- Create: `src/sim/clock.ts`, `src/sim/inspect.ts`
- Test: `tests/sim/clock.test.ts`, `tests/sim/inspect.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Speed`, `hasRoadAccess`, `BUILDING_SPECS`, `TERRAIN_NAMES`
  and `BUILDABLE`.
- Produces:
  - `TICKS_PER_SECOND = 10`, `SECONDS_PER_MONTH = 20` and `TICKS_PER_MONTH = 200`.
  - `tick(state): void`.
  - `gameDate(tick: number): { month: string; year: number }`.
  - `setSpeed(state, speed: Speed): void`.
  - `pauseForInspection(state): void` and `resumeAfterInspection(state): void`.
  - `interface Description { title: string; lines: string[] }` and
    `describeTile(state, x, y): Description`.

- [x] **Step 1: Write the failing tests**

`tests/sim/clock.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  TICKS_PER_MONTH,
  gameDate,
  pauseForInspection,
  resumeAfterInspection,
  setSpeed,
  tick,
} from '../../src/sim/clock';
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
```

`tests/sim/inspect.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { describeTile } from '../../src/sim/inspect';
import { grassGame, setTerrain } from './helpers';

describe('describeTile', () => {
  it('describes buildable terrain', () => {
    expect(describeTile(grassGame(), 4, 4)).toEqual({ title: 'Grass', lines: ['Tile 4, 4', 'Buildable'] });
  });

  it('describes unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 4, 4, 'marble');
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Marble', lines: ['Tile 4, 4', 'Not buildable'] });
  });

  it('describes a road', () => {
    const game = grassGame();
    placeRoad(game, { x: 4, y: 4 }, { x: 4, y: 4 });
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Road', lines: ['Tile 4, 4'] });
  });

  it('describes a building from any of its tiles, including missing road access', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    expect(describeTile(game, 3, 3)).toEqual({
      title: 'Test Building',
      lines: ['Tile 2, 2', 'Size 2×2', 'No road access: it will not work'],
    });
  });

  it('describes a building with road access', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(describeTile(game, 2, 2).lines).toContain('Has road access');
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Failed to resolve import" for `src/sim/clock` and
`src/sim/inspect`.

- [x] **Step 3: Implement**

`src/sim/clock.ts`:

```ts
import type { GameState, Speed } from './state';

export const TICKS_PER_SECOND = 10;
export const SECONDS_PER_MONTH = 20;
export const TICKS_PER_MONTH = TICKS_PER_SECOND * SECONDS_PER_MONTH;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function tick(state: GameState): void {
  state.tick++;
}

export function gameDate(tick: number): { month: string; year: number } {
  const months = Math.floor(tick / TICKS_PER_MONTH);
  return { month: MONTH_NAMES[months % 12], year: Math.floor(months / 12) + 1 };
}

export function setSpeed(state: GameState, speed: Speed): void {
  state.speed = speed;
  state.speedBeforeInspection = null;
}

export function pauseForInspection(state: GameState): void {
  if (state.speedBeforeInspection !== null || state.speed === 0) {
    state.speed = 0;
    return;
  }
  state.speedBeforeInspection = state.speed;
  state.speed = 0;
}

export function resumeAfterInspection(state: GameState): void {
  if (state.speedBeforeInspection === null) return;
  state.speed = state.speedBeforeInspection;
  state.speedBeforeInspection = null;
}
```

`src/sim/inspect.ts`:

```ts
import { BUILDING_SPECS } from './buildings';
import { hasRoadAccess } from './commands';
import { NO_BUILDING, tileIndex, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';

export interface Description {
  title: string;
  lines: string[];
}

export function describeTile(state: GameState, x: number, y: number): Description {
  const i = tileIndex(state, x, y);
  const buildingId = state.buildingIdAt[i];

  if (buildingId !== NO_BUILDING) {
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) throw new Error(`Tile ${x}, ${y} points at missing building ${buildingId}`);
    const spec = BUILDING_SPECS[building.type];
    return {
      title: spec.name,
      lines: [
        `Tile ${building.x}, ${building.y}`,
        `Size ${spec.width}×${spec.height}`,
        hasRoadAccess(state, building.type, building.x, building.y)
          ? 'Has road access'
          : 'No road access: it will not work',
      ],
    };
  }

  if (state.roads[i]) return { title: 'Road', lines: [`Tile ${x}, ${y}`] };

  const terrain = state.terrain[i];
  return {
    title: TERRAIN_NAMES[terrain],
    lines: [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'],
  };
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "Add game clock, speeds, inspection pause and tile descriptions"
```

---

### Task 5: Isometric view, camera controls, terrain rendering

**Files:**
- Create: `src/render/palette.ts`, `src/render/view.ts`, `src/render/camera-controls.ts`,
  `src/render/picking.ts`, `src/render/terrain-layer.ts`
- Modify: `src/main.ts` (temporary wiring so the map is visible)

**Interfaces:**
- Consumes: `GameState`, `Terrain`, `Point`.
- Produces:
  - `interface View { canvas: HTMLCanvasElement; renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.OrthographicCamera; target: THREE.Vector3 }`.
  - `createView(canvas, target: THREE.Vector3): View`, `resizeView(view)` and
    `placeCamera(view)`.
  - `attachCameraControls(view, mapSize): { update(dt: number): void }`.
  - `tileUnderPointer(view, clientX, clientY): Point`, which is unclamped.
  - `createTerrainLayer(state): THREE.Group`.
  - `PALETTE`, `TERRAIN_COLORS` and `tileHash(x, y): number` (in [0, 1)).
  - World coordinates: tile (x, y) covers world x ∈ [x, x+1], z ∈ [y, y+1], with ground
    at y = 0.

The renderer has no unit tests. Task 8's smoke test and screenshot verify it.

- [x] **Step 1: Palette**

`src/render/palette.ts`:

```ts
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
  ghostWarning: 0xf2c94c,
  ghostInvalid: 0xe0533d,
};

export function tileHash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
```

- [x] **Step 2: View and camera**

`src/render/view.ts`:

```ts
import * as THREE from 'three';
import { PALETTE } from './palette';

const ELEVATION = Math.PI / 6;
const ISO_DIRECTION = new THREE.Vector3(
  Math.cos(ELEVATION) * Math.SQRT1_2,
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.SQRT1_2,
);
const CAMERA_DISTANCE = 200;
const VISIBLE_WORLD_HEIGHT = 30;

export interface View {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  target: THREE.Vector3;
}

export function createView(canvas: HTMLCanvasElement, target: THREE.Vector3): View {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6b5a40, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2);
  sun.position.set(-30, 60, 20);
  scene.add(sun);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  const view = { canvas, renderer, scene, camera, target };
  resizeView(view);
  placeCamera(view);
  return view;
}

export function resizeView(view: View): void {
  const width = view.canvas.clientWidth;
  const height = view.canvas.clientHeight;
  view.renderer.setSize(width, height, false);
  const halfHeight = VISIBLE_WORLD_HEIGHT / 2;
  const halfWidth = (halfHeight * width) / height;
  view.camera.left = -halfWidth;
  view.camera.right = halfWidth;
  view.camera.top = halfHeight;
  view.camera.bottom = -halfHeight;
  view.camera.updateProjectionMatrix();
}

export function placeCamera(view: View): void {
  view.camera.position.copy(view.target).addScaledVector(ISO_DIRECTION, CAMERA_DISTANCE);
  view.camera.lookAt(view.target);
}
```

`src/render/camera-controls.ts`:

```ts
import * as THREE from 'three';
import { placeCamera, type View } from './view';

const KEY_PAN_PIXELS_PER_SECOND = 700;
const ZOOM_STEP = 1.1;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const MIDDLE_BUTTON = 1;
const SCREEN_RIGHT_ON_GROUND = new THREE.Vector3(1, 0, -1).normalize();
const SCREEN_UP_ON_GROUND = new THREE.Vector3(-1, 0, -1).normalize();
const GROUND_STRETCH_ALONG_SCREEN_UP = 1 / Math.sin(Math.PI / 6);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function attachCameraControls(view: View, mapSize: number): { update(dt: number): void } {
  const { canvas, camera, target } = view;
  const held = new Set<string>();
  let dragFrom: { x: number; y: number } | null = null;

  function pan(dxPixels: number, dyPixels: number): void {
    const worldPerPixel = (camera.top - camera.bottom) / camera.zoom / canvas.clientHeight;
    target.addScaledVector(SCREEN_RIGHT_ON_GROUND, -dxPixels * worldPerPixel);
    target.addScaledVector(SCREEN_UP_ON_GROUND, dyPixels * worldPerPixel * GROUND_STRETCH_ALONG_SCREEN_UP);
    target.x = clamp(target.x, 0, mapSize);
    target.z = clamp(target.z, 0, mapSize);
    placeCamera(view);
  }

  window.addEventListener('keydown', (e) => held.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== MIDDLE_BUTTON) return;
    e.preventDefault();
    dragFrom = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragFrom) return;
    pan(e.clientX - dragFrom.x, e.clientY - dragFrom.y);
    dragFrom = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === MIDDLE_BUTTON) dragFrom = null;
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      camera.zoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      camera.updateProjectionMatrix();
    },
    { passive: false },
  );

  return {
    update(dt) {
      const step = KEY_PAN_PIXELS_PER_SECOND * dt;
      let dx = 0;
      let dy = 0;
      if (held.has('a') || held.has('arrowleft')) dx += step;
      if (held.has('d') || held.has('arrowright')) dx -= step;
      if (held.has('w') || held.has('arrowup')) dy += step;
      if (held.has('s') || held.has('arrowdown')) dy -= step;
      if (dx !== 0 || dy !== 0) pan(dx, dy);
    },
  };
}
```

`src/render/picking.ts`:

```ts
import * as THREE from 'three';
import type { Point } from '../sim/point';
import type { View } from './view';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hit = new THREE.Vector3();

export function tileUnderPointer(view: View, clientX: number, clientY: number): Point {
  const rect = view.canvas.getBoundingClientRect();
  pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, view.camera);
  raycaster.ray.intersectPlane(GROUND, hit);
  return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
}
```

- [x] **Step 3: Terrain layer**

`src/render/terrain-layer.ts`:

```ts
import * as THREE from 'three';
import type { Point } from '../sim/point';
import { tileIndex, type GameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import { PALETTE, TERRAIN_COLORS, tileHash } from './palette';

const SHADE_VARIATION = 0.08;

export function createTerrainLayer(state: GameState): THREE.Group {
  const group = new THREE.Group();
  group.add(groundMesh(state));

  const forest = tilesOf(state, 'forest');
  group.add(scatter(forest, new THREE.ConeGeometry(0.32, 0.9, 6).translate(0, 0.75, 0), PALETTE.foliage));
  group.add(scatter(forest, new THREE.CylinderGeometry(0.06, 0.08, 0.3).translate(0, 0.15, 0), PALETTE.trunk));
  group.add(scatter(tilesOf(state, 'marble'), new THREE.DodecahedronGeometry(0.38).translate(0, 0.2, 0), PALETTE.marbleRock));
  group.add(scatter(tilesOf(state, 'copper'), new THREE.DodecahedronGeometry(0.32).translate(0, 0.15, 0), PALETTE.copperRock));
  return group;
}

function groundMesh(state: GameState): THREE.Mesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let y = 0; y < state.size; y++) {
    for (let x = 0; x < state.size; x++) {
      positions.push(x, 0, y, x, 0, y + 1, x + 1, 0, y, x + 1, 0, y, x, 0, y + 1, x + 1, 0, y + 1);
      color.setHex(TERRAIN_COLORS[state.terrain[tileIndex(state, x, y)]]);
      color.multiplyScalar(1 - SHADE_VARIATION / 2 + tileHash(x, y) * SHADE_VARIATION);
      for (let v = 0; v < 6; v++) colors.push(color.r, color.g, color.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function tilesOf(state: GameState, kind: Terrain): Point[] {
  const tiles: Point[] = [];
  state.terrain.forEach((terrain, i) => {
    if (terrain === kind) tiles.push({ x: i % state.size, y: Math.floor(i / state.size) });
  });
  return tiles;
}

function scatter(tiles: Point[], geometry: THREE.BufferGeometry, color: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ color }), tiles.length);
  const matrix = new THREE.Matrix4();
  tiles.forEach((tile, i) => {
    const jitterX = (tileHash(tile.x, tile.y) - 0.5) * 0.3;
    const jitterZ = (tileHash(tile.y, tile.x) - 0.5) * 0.3;
    matrix.makeTranslation(tile.x + 0.5 + jitterX, 0, tile.y + 0.5 + jitterZ);
    mesh.setMatrixAt(i, matrix);
  });
  return mesh;
}
```

- [x] **Step 4: Temporary wiring to see it**

Replace `src/main.ts`:

```ts
import * as THREE from 'three';
import './style.css';
import { attachCameraControls } from './render/camera-controls';
import { createTerrainLayer } from './render/terrain-layer';
import { createView, resizeView } from './render/view';
import { createGame } from './sim/state';

const state = createGame();
const canvas = document.getElementById('view') as HTMLCanvasElement;
const view = createView(canvas, new THREE.Vector3(state.entry.x + 15, 0, state.entry.y));
view.scene.add(createTerrainLayer(state));
const controls = attachCameraControls(view, state.size);
window.addEventListener('resize', () => resizeView(view));

let last = performance.now();
function frame(now: number): void {
  controls.update(Math.min((now - last) / 1000, 0.25));
  last = now;
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [x] **Step 5: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass. Run `npm run dev` too if a browser is available. If it isn't, the
visual check happens in Task 8.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "Render the map under an isometric orthographic camera with pan and zoom"
```

---

### Task 6: Roads, buildings and placement ghost

**Files:**
- Create: `src/render/models.ts`, `src/render/world-layer.ts`,
  `src/render/ghost-layer.ts`, `src/ui/tools.ts`, `src/ui/preview.ts`
- Test: `tests/ui/preview.test.ts`

**Interfaces:**
- Consumes:
  - `GameState`, `BUILDING_SPECS`, `roadPath`, `roadObstacle`, `footprint`,
    `checkBuildingPlacement`, `inBounds`, `clampToMap`, `rectBetween` and `tilesIn`.
  - `PALETTE`.
- Produces:
  - `type Tool = 'road' | 'demolish' | 'testBuilding'` and
    `TOOL_LABELS: Record<Tool, string>`.
  - `type PreviewKind = 'valid' | 'warning' | 'invalid'` and
    `interface PreviewTile extends Point { kind: PreviewKind }`.
  - `previewTiles(state, tool: Tool | null, dragStart: Point | null, hover: Point | null): PreviewTile[]`.
  - `createWorldLayer(): { group: THREE.Group; sync(state): void }`, which rebuilds when
    `state.version` changes.
  - `createGhostLayer(mapSize): { mesh: THREE.InstancedMesh; show(tiles: PreviewTile[]): void }`.

- [x] **Step 1: Write the failing preview tests**

`tests/ui/preview.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { placeRoad } from '../../src/sim/commands';
import { previewTiles } from '../../src/ui/preview';
import { grassGame, setTerrain } from '../sim/helpers';

describe('previewTiles', () => {
  it('shows nothing without a tool or hover tile', () => {
    expect(previewTiles(grassGame(), null, null, { x: 1, y: 1 })).toEqual([]);
    expect(previewTiles(grassGame(), 'road', null, null)).toEqual([]);
  });

  it('marks each road tile valid or invalid', () => {
    const game = grassGame();
    setTerrain(game, 2, 1, 'water');
    expect(previewTiles(game, 'road', { x: 1, y: 1 }, { x: 3, y: 1 })).toEqual([
      { x: 1, y: 1, kind: 'valid' },
      { x: 2, y: 1, kind: 'invalid' },
      { x: 3, y: 1, kind: 'valid' },
    ]);
  });

  it('warns about a building without road access', () => {
    const tiles = previewTiles(grassGame(), 'testBuilding', null, { x: 2, y: 2 });
    expect(tiles).toHaveLength(4);
    expect(tiles.every((t) => t.kind === 'warning')).toBe(true);
  });

  it('shows a building with road access as valid', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(previewTiles(game, 'testBuilding', null, { x: 2, y: 2 }).every((t) => t.kind === 'valid')).toBe(true);
  });

  it('drops off-map tiles of a building footprint and marks the rest invalid', () => {
    const tiles = previewTiles(grassGame(), 'testBuilding', null, { x: 19, y: 19 });
    expect(tiles).toEqual([{ x: 19, y: 19, kind: 'invalid' }]);
  });

  it('covers the dragged demolish rectangle, clamped to the map', () => {
    const tiles = previewTiles(grassGame(), 'demolish', { x: 18, y: 18 }, { x: 22, y: 19 });
    expect(tiles).toEqual([
      { x: 18, y: 18, kind: 'invalid' },
      { x: 19, y: 18, kind: 'invalid' },
      { x: 18, y: 19, kind: 'invalid' },
      { x: 19, y: 19, kind: 'invalid' },
    ]);
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL with "Failed to resolve import" for `src/ui/preview`.

- [x] **Step 3: Implement tools and preview**

`src/ui/tools.ts`:

```ts
export type Tool = 'road' | 'demolish' | 'testBuilding';

export const TOOL_LABELS: Record<Tool, string> = {
  road: 'Road',
  demolish: 'Demolish',
  testBuilding: 'Test Building',
};
```

`src/ui/preview.ts`:

```ts
import { checkBuildingPlacement, footprint, roadObstacle, roadPath } from '../sim/commands';
import { rectBetween, tilesIn, type Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import type { Tool } from './tools';

export type PreviewKind = 'valid' | 'warning' | 'invalid';

export interface PreviewTile extends Point {
  kind: PreviewKind;
}

export function previewTiles(
  state: GameState,
  tool: Tool | null,
  dragStart: Point | null,
  hover: Point | null,
): PreviewTile[] {
  if (!tool || !hover) return [];
  const start = dragStart ?? hover;

  switch (tool) {
    case 'road':
      return roadPath(start, hover)
        .filter((p) => inBounds(state, p.x, p.y))
        .map((p) => ({ ...p, kind: roadObstacle(state, p.x, p.y) ? 'invalid' : 'valid' }));
    case 'demolish':
      return tilesIn(rectBetween(clampToMap(state, start), clampToMap(state, hover))).map((p) => ({
        ...p,
        kind: 'invalid',
      }));
    case 'testBuilding': {
      const check = checkBuildingPlacement(state, tool, hover.x, hover.y);
      const kind: PreviewKind = check.obstacle ? 'invalid' : check.roadAccess ? 'valid' : 'warning';
      return footprint(tool, hover.x, hover.y)
        .filter((p) => inBounds(state, p.x, p.y))
        .map((p) => ({ ...p, kind }));
    }
  }
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [x] **Step 5: Models, world layer and ghost layer**

`src/render/models.ts`:

```ts
import * as THREE from 'three';
import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { PALETTE } from './palette';

const plaster = new THREE.MeshLambertMaterial({ color: PALETTE.plaster });
const terracotta = new THREE.MeshLambertMaterial({ color: PALETTE.terracotta });

function testBuildingModel(): THREE.Object3D {
  const { width, height } = BUILDING_SPECS.testBuilding;
  const group = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.8, height - 0.3), plaster);
  walls.position.set(width / 2, 0.4, height / 2);
  const roof = new THREE.Mesh(new THREE.ConeGeometry((width - 0.1) * Math.SQRT1_2, 0.6, 4), terracotta);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(width / 2, 1.1, height / 2);
  group.add(walls, roof);
  return group;
}

export const BUILDING_MODELS: Record<BuildingType, () => THREE.Object3D> = {
  testBuilding: testBuildingModel,
};
```

`src/render/world-layer.ts`:

```ts
import * as THREE from 'three';
import type { GameState } from '../sim/state';
import { BUILDING_MODELS } from './models';
import { PALETTE } from './palette';

const ROAD_HEIGHT = 0.02;
const roadGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const roadMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.road });

export function createWorldLayer(): { group: THREE.Group; sync(state: GameState): void } {
  const group = new THREE.Group();
  let renderedVersion = -1;
  let roads = new THREE.InstancedMesh(roadGeometry, roadMaterial, 0);

  return {
    group,
    sync(state) {
      if (state.version === renderedVersion) return;
      renderedVersion = state.version;
      group.clear();
      roads.dispose();
      roads = roadMesh(state);
      group.add(roads);

      for (const building of state.buildings) {
        const model = BUILDING_MODELS[building.type]();
        model.position.set(building.x, 0, building.y);
        group.add(model);
      }
    },
  };
}

function roadMesh(state: GameState): THREE.InstancedMesh {
  const roadTiles = state.roads.flatMap((isRoad, i) => (isRoad ? [i] : []));
  const mesh = new THREE.InstancedMesh(roadGeometry, roadMaterial, roadTiles.length);
  const matrix = new THREE.Matrix4();
  roadTiles.forEach((tile, n) => {
    matrix.makeTranslation((tile % state.size) + 0.5, ROAD_HEIGHT, Math.floor(tile / state.size) + 0.5);
    mesh.setMatrixAt(n, matrix);
  });
  return mesh;
}
```

Building models create fresh geometries on every rebuild. That is fine at slice 1
scale. If a later slice with many buildings shows a leak or slowdown, cache geometries
in `models.ts` then.

`src/render/ghost-layer.ts`:

```ts
import * as THREE from 'three';
import type { PreviewKind, PreviewTile } from '../ui/preview';
import { PALETTE } from './palette';

const GHOST_HEIGHT = 0.05;
const KIND_COLORS: Record<PreviewKind, THREE.Color> = {
  valid: new THREE.Color(PALETTE.ghostValid),
  warning: new THREE.Color(PALETTE.ghostWarning),
  invalid: new THREE.Color(PALETTE.ghostInvalid),
};

export function createGhostLayer(mapSize: number): { mesh: THREE.InstancedMesh; show(tiles: PreviewTile[]): void } {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false }),
    mapSize * mapSize,
  );
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(mapSize * mapSize * 3), 3);
  mesh.instanceColor = colors;
  mesh.count = 0;
  const matrix = new THREE.Matrix4();

  return {
    mesh,
    show(tiles) {
      tiles.forEach((tile, i) => {
        matrix.makeTranslation(tile.x + 0.5, GHOST_HEIGHT, tile.y + 0.5);
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, KIND_COLORS[tile.kind]);
      });
      mesh.count = tiles.length;
      mesh.instanceMatrix.needsUpdate = true;
      colors.needsUpdate = true;
    },
  };
}
```

`src/render` importing a *type* from `src/ui/preview` is allowed. The rule in
`CLAUDE.md` restricts `src/sim` only.

- [x] **Step 6: Verify and commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "Render roads, buildings and a placement ghost with validity colors"
```

---

### Task 7: UI panels, tool input, main loop

**Files:**
- Create: `src/ui/dom.ts`, `src/ui/topbar.ts`, `src/ui/toolbar.ts`, `src/ui/inspector.ts`,
  `src/ui/tool-input.ts`
- Modify: `src/main.ts` (final wiring, replacing the Task 5 version)

**Interfaces:**
- Consumes: everything earlier tasks produce.
- Produces:
  - `byId<T extends HTMLElement>(id): T`, which throws when the element is missing.
  - `createTopbar(state): { update(): void; showStatus(text: string): void }`.
  - `createToolbar(onChange: () => void): { current(): Tool | null; clear(): void }`.
  - `createInspector(state): { open(d: Description): void; close(): void; isOpen(): boolean }`.
  - `attachToolInput(deps): void`.

- [x] **Step 1: DOM helper and panels**

`src/ui/dom.ts`:

```ts
export function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id} in index.html`);
  return element as T;
}
```

`src/ui/topbar.ts`:

```ts
import { gameDate, setSpeed } from '../sim/clock';
import type { GameState, Speed } from '../sim/state';
import { byId } from './dom';

const SPEEDS: [string, Speed][] = [
  ['❚❚', 0],
  ['1×', 1],
  ['2×', 2],
  ['4×', 4],
];
const STATUS_SECONDS = 3;

export function createTopbar(state: GameState): { update(): void; showStatus(text: string): void } {
  const date = byId('date');
  const status = byId('status');
  const speedBox = byId('speed');
  let statusTimer = 0;

  const buttons = SPEEDS.map(([label, speed]) => {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => setSpeed(state, speed));
    speedBox.append(button);
    return { button, speed };
  });

  return {
    update() {
      const { month, year } = gameDate(state.tick);
      date.textContent = `${month}, Year ${year}`;
      for (const { button, speed } of buttons) button.classList.toggle('active', speed === state.speed);
    },
    showStatus(text) {
      status.textContent = text;
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => (status.textContent = ''), STATUS_SECONDS * 1000);
    },
  };
}
```

`src/ui/toolbar.ts`:

```ts
import { byId } from './dom';
import { TOOL_LABELS, type Tool } from './tools';

export function createToolbar(onChange: () => void): { current(): Tool | null; clear(): void } {
  const box = byId('toolbar');
  let current: Tool | null = null;

  const buttons = (Object.keys(TOOL_LABELS) as Tool[]).map((tool) => {
    const button = document.createElement('button');
    button.textContent = TOOL_LABELS[tool];
    button.addEventListener('click', () => select(current === tool ? null : tool));
    box.append(button);
    return { button, tool };
  });

  function select(tool: Tool | null): void {
    current = tool;
    for (const b of buttons) b.button.classList.toggle('active', b.tool === tool);
    onChange();
  }

  return { current: () => current, clear: () => select(null) };
}
```

`src/ui/inspector.ts`:

```ts
import { pauseForInspection, resumeAfterInspection } from '../sim/clock';
import type { Description } from '../sim/inspect';
import type { GameState } from '../sim/state';
import { byId } from './dom';

export function createInspector(state: GameState): {
  open(description: Description): void;
  close(): void;
  isOpen(): boolean;
} {
  const panel = byId('inspector');
  const title = byId('inspector-title');
  const lines = byId('inspector-lines');

  function close(): void {
    if (panel.hidden) return;
    panel.hidden = true;
    resumeAfterInspection(state);
  }

  byId('inspector-close').addEventListener('click', close);

  return {
    open(description) {
      pauseForInspection(state);
      title.textContent = description.title;
      lines.replaceChildren(
        ...description.lines.map((line) => {
          const item = document.createElement('li');
          item.textContent = line;
          return item;
        }),
      );
      panel.hidden = false;
    },
    close,
    isOpen: () => !panel.hidden,
  };
}
```

- [x] **Step 2: Tool input**

`src/ui/tool-input.ts`:

```ts
import type { View } from '../render/view';
import { demolish, placeBuilding, placeRoad, type Result } from '../sim/commands';
import { describeTile, type Description } from '../sim/inspect';
import type { Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import { tileUnderPointer } from '../render/picking';
import { previewTiles, type PreviewTile } from './preview';
import type { Tool } from './tools';

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

export interface ToolInputDeps {
  view: View;
  state: GameState;
  toolbar: { current(): Tool | null; clear(): void };
  ghost: { show(tiles: PreviewTile[]): void };
  inspector: { open(d: Description): void; close(): void; isOpen(): boolean };
  topbar: { showStatus(text: string): void };
}

export function attachToolInput({ view, state, toolbar, ghost, inspector, topbar }: ToolInputDeps): {
  refreshGhost(): void;
} {
  let dragStart: Point | null = null;
  let hover: Point | null = null;

  function refreshGhost(): void {
    ghost.show(previewTiles(state, toolbar.current(), dragStart, hover));
  }

  function apply(tool: Tool, from: Point, to: Point): void {
    let result: Result = { ok: true };
    if (tool === 'road') result = placeRoad(state, from, to);
    if (tool === 'demolish') demolish(state, from, to);
    if (tool === 'testBuilding') result = placeBuilding(state, tool, to.x, to.y);
    if (!result.ok) topbar.showStatus(result.reason);
  }

  view.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  view.canvas.addEventListener('mousedown', (e) => {
    const tile = tileUnderPointer(view, e.clientX, e.clientY);
    if (e.button === RIGHT_BUTTON) {
      if (inBounds(state, tile.x, tile.y)) inspector.open(describeTile(state, tile.x, tile.y));
      return;
    }
    if (e.button === LEFT_BUTTON && toolbar.current()) {
      dragStart = clampToMap(state, tile);
      refreshGhost();
    }
  });

  window.addEventListener('mousemove', (e) => {
    hover = clampToMap(state, tileUnderPointer(view, e.clientX, e.clientY));
    refreshGhost();
  });

  window.addEventListener('mouseup', (e) => {
    const tool = toolbar.current();
    if (e.button !== LEFT_BUTTON || !dragStart || !tool || !hover) return;
    apply(tool, dragStart, hover);
    dragStart = null;
    refreshGhost();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (inspector.isOpen()) inspector.close();
    else toolbar.clear();
    dragStart = null;
    refreshGhost();
  });

  return { refreshGhost };
}
```

Clamping `hover` to the map means a road dragged past the edge stops at the edge. The
"Outside the map" road rejection then only happens in tests that pass raw points.
That's intended: drags never fail just because the pointer overshot.

- [x] **Step 3: Final `src/main.ts`**

Replace `src/main.ts`:

```ts
import * as THREE from 'three';
import './style.css';
import { attachCameraControls } from './render/camera-controls';
import { createGhostLayer } from './render/ghost-layer';
import { createTerrainLayer } from './render/terrain-layer';
import { createView, resizeView } from './render/view';
import { createWorldLayer } from './render/world-layer';
import { TICKS_PER_SECOND, tick } from './sim/clock';
import { createGame } from './sim/state';
import { byId } from './ui/dom';
import { createInspector } from './ui/inspector';
import { attachToolInput } from './ui/tool-input';
import { createToolbar } from './ui/toolbar';
import { createTopbar } from './ui/topbar';

const MAX_TICKS_PER_FRAME = 40;
const MAX_FRAME_SECONDS = 0.25;
const START_VIEW_OFFSET = 15;

const state = createGame();
const view = createView(
  byId<HTMLCanvasElement>('view'),
  new THREE.Vector3(state.entry.x + START_VIEW_OFFSET, 0, state.entry.y),
);
view.scene.add(createTerrainLayer(state));
const world = createWorldLayer();
view.scene.add(world.group);
const ghost = createGhostLayer(state.size);
view.scene.add(ghost.mesh);

const controls = attachCameraControls(view, state.size);
const topbar = createTopbar(state);
const inspector = createInspector(state);
const input = attachToolInput({
  view,
  state,
  ghost,
  inspector,
  topbar,
  toolbar: createToolbar(() => input.refreshGhost()),
});
window.addEventListener('resize', () => resizeView(view));

let last = performance.now();
let pendingTicks = 0;

function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
  last = now;
  controls.update(dt);

  pendingTicks += dt * state.speed * TICKS_PER_SECOND;
  let ticks = 0;
  while (pendingTicks >= 1 && ticks < MAX_TICKS_PER_FRAME) {
    tick(state);
    pendingTicks--;
    ticks++;
  }
  if (ticks === MAX_TICKS_PER_FRAME) pendingTicks = 0;

  world.sync(state);
  topbar.update();
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

`createToolbar` gets its `onChange` callback before `input` exists. The arrow function
only dereferences `input` on click, which happens after construction finishes. If
TypeScript complains about use-before-assign, build the toolbar after `input` by
passing a `refresh` function through a small `let`, or split `attachToolInput` so that
`refreshGhost` is created first. Choose whichever reads cleaner.

- [x] **Step 4: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "Add top bar, toolbar, inspector and tool input; run the fixed-step game loop"
```

---

### Task 8: Smoke test, visual check, PR

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `docs/roadmap.md` (tick slice 1)

- [x] **Step 1: Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
  ],
});
```

- [x] **Step 2: Smoke test**

`e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('boots and renders the map without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('#date')).toHaveText('January, Year 1');
  await expect(page.locator('#toolbar button')).toHaveCount(3);

  const canvas = await page.locator('#view').boundingBox();
  expect(canvas!.width).toBeGreaterThan(0);

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/screenshot.png' });
  expect(errors).toEqual([]);
});
```

- [x] **Step 3: Run it**

```bash
npx playwright install chromium
npm run test:e2e
```

Expected: PASS.

- [x] **Step 4: Look at the screenshot**

Open `test-results/screenshot.png`. Check for:
- an isometric diamond-shaped map, not a top-down square;
- grass and meadow in distinguishable colors;
- forest trees, marble and copper rocks, and the east coast water;
- the short entry road on the west edge, in view;
- the toolbar, top bar and date visible.

Fix anything that looks wrong (camera angle, lighting too dark or washed out, colors
too similar) and re-run.

- [ ] **Step 5: Tick the roadmap and open the PR**

In `docs/roadmap.md`, change `- [ ] 1 · Foundation` to `- [x] 1 · Foundation`.

```bash
git add -A
git commit -m "Add Playwright smoke test; tick slice 1"
git push -u origin slice-01-foundation
gh pr create --title "Slice 01: Foundation" --body-file <(cat <<'EOF'
## Playtest checklist

- [ ] The map appears isometric. Coast to the east, forest clumps, meadows, marble (white) and copper (orange) rocks.
- [ ] WASD / arrow keys pan, middle-drag pans, the mouse wheel zooms; zoom stops at sensible limits.
- [ ] Resize the window: nothing stretches.
- [ ] Road: drag from one tile to another; an L-shaped preview follows the mouse, red where it can't go (water, forest, rocks, buildings). Releasing over a red tile shows a reason in the top bar and lays nothing.
- [ ] Test Building: hover shows a 2×2 preview, yellow without an adjacent road, green with one, red when blocked. Click to place.
- [ ] Demolish: drag a rectangle; roads and any building it touches disappear.
- [ ] Speed buttons switch between pause, 1×, 2× and 4×; at 4× a month passes in about 5 s.
- [ ] Right-click a tile, road or building: the game pauses and the inspector describes it. Closing it (× or Esc) resumes at the previous speed.
- [ ] Esc with a tool selected deselects it.

## Decisions I made

- <fill in every choice not covered by the spec or this plan>

## Left out

- <anything cut, or "nothing">
EOF
)
```

Fill in the two placeholder sections in the PR body before creating it. They are
session-specific, which is why this plan cannot write them.

- [ ] **Step 6: Merge**

When CI is green, run `gh pr merge --squash --delete-branch`. Then confirm the Pages
deploy job succeeded: `gh run list --branch main --limit 1`.
