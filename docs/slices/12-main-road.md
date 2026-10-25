# Slice 12: Main Road Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The 8-tile entry road becomes the Main Road: a long, generated, paved road that
enters at the middle of the west edge and runs east in long straight runs and right-angle
turns until it reaches the coast. It can't be demolished, it looks different from ordinary
roads, and settlers still walk in along it. Every seed produces a good one, and a test
proves it on 100 seeds.

**Architecture:** A new sim module `main-road.ts` lays the road out as an ordered list of
tiles from a seeded RNG, after the terrain and deposits are generated, and forces its
tiles to grass. `generateTerrain` returns it in place of the entry point. `GameState`
gets a per-tile `mainRoad` flag next to `roads`, and `entry` stays as the road's first
tile. `demolish` skips main-road tiles. The renderer draws main-road tiles with their own
paved material. `main.ts` reads an optional `?seed=` from the URL.

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "The Main Road".

## Global Constraints

- **Map:** 100×100. Water begins somewhere in x 87–95 on every row (coast noise).
- **Main Road** (spec): enters at `(0, 50)`, ends on the last land tile before water.
  3–5 horizontal runs, all going east, joined by vertical runs that wander up and down.
  Every run is at least 12 tiles long. Every tile has y in 25–74 (the middle half).
- Code rules from `CLAUDE.md` apply.

## Layout rules (ours, within the spec)

1. **Run length** is the number of steps between its two corners (the entry and the
   shore count as corners). 12 steps means 13 tiles, so a run always has two 4×4 blocks'
   worth of straight edge beside it, corners excluded.
2. **Turn columns.** With *h* horizontal runs there are *h − 1* turns. They are spread
   over x 12–68 at random with at least 12 between them, so the last run starts at x ≤ 68
   and reaches water (x ≥ 87) in at least 19 steps.
3. **Vertical runs** go up or down at random, 12–24 steps. A direction that would leave
   y 25–74 is flipped. From any y in that band one direction has 24 or more steps of room,
   so a vertical run always fits.
4. The road only ever goes east or vertically, so it can never cross itself.
5. The road uses the map's RNG after the deposits, so terrain for a seed is unchanged.

## Decisions (closest to Zeus, recorded in the PR)

1. **Guild range** in the robustness test is the spec's "nearest tile 4 tiles or closer",
   measured the way the game measures building distance (`footprintDistance`, the larger
   of dx and dy). "Room for 8 placements" means 8 non-overlapping 4×4s on buildable,
   road-free land, counted greedily.
2. **Roadblocks** may still go on the Main Road; demolishing removes the roadblock but
   not the road.
3. **Seeds in the URL:** `?seed=N` starts a game on seed N; without it the default seed
   is used. The camera still starts at the entry.
4. **Paved stone placeholder:** pale limestone slabs a hair above ground, with darker
   joints, so it reads as paving next to the dirt roads. It goes into the redesign
   backlog.

## Review Focus

1. **Robustness on 100 seeds.** Task 2.
2. **Demolish over the Main Road:** buildings and ordinary roads in the area go, the Main
   Road stays, and the version bumps. Task 3.
3. **Small test maps** still get an ordinary 8-tile entry road from `grassGame`, so
   existing tests are untouched. `mainRoadGame` gives a small map whose entry road is a
   Main Road.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Generating the Main Road

**Files:** Create `src/sim/main-road.ts`, `tests/sim/main-road.test.ts`. Modify
`src/sim/map.ts`, `tests/sim/map.test.ts`.

- [x] **Step 1:** Write failing tests over seeds 1–100: the road starts at `(0, 50)` on
  the west edge; each step is to a 4-neighbour; no tile repeats; its last tile touches
  water and no earlier tile is water; it has 3–5 horizontal runs, alternating with
  vertical ones; every run is 12 steps or longer; every tile is in y 25–74; its tiles are
  grass; at least 8 non-overlapping 4×4 placements fit within guild range. Also: the
  same seed gives the same road, and different seeds give different roads.
- [x] **Step 2:** Implement `layMainRoad(rng, terrain, size)` and return `mainRoad` from
  `generateTerrain`. Tests pass.

### Task 3: The road in the game

**Files:** Modify `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/inspect.ts`,
`tests/sim/helpers.ts`, `tests/sim/commands.test.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a new game has road on every Main Road tile and
  its entry is the first one; demolishing an area across the Main Road removes the
  buildings and ordinary roads there but leaves the Main Road; a roadblock on it is
  removed; the inspector names a Main Road tile and says it can't be demolished; settlers
  walk in along it on a generated map.
- [x] **Step 2:** `newGameState` takes the Main Road tiles. Add `mainRoadGame` to the
  test helpers; `grassGame` keeps its ordinary entry road. Implement. Tests pass.

### Task 4: Rendering and seeds

**Files:** Modify `src/render/world-layer.ts`, `src/render/palette.ts`, `src/main.ts`,
`docs/redesign-backlog.md`.

- [x] **Step 1:** Draw Main Road tiles as paved stone with their own instanced mesh.
- [x] **Step 2:** `?seed=N` in the URL picks the seed.
- [x] **Step 3:** Add the paved Main Road to the redesign backlog.

### Task 5: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Fit the smoke test's street to the default seed's Main Road.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Look at the screenshot, and at a zoomed-out view of several seeds.

### Task 6: PR

- [x] **Step 1:** Tick slice 12 in `docs/roadmap.md`.
- [ ] **Step 2:** Open the PR `Slice 12: Main Road`. Wait for CI and Pages.
