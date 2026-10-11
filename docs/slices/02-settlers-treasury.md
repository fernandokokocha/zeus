# Slice 2: Settlers & treasury Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The city starts to live. You drag out vacant lots beside a road, settlers walk
in from the entry point along the roads, and each lot they reach becomes a Hut. The top
bar shows population, treasury and date. Roads and lots cost money.

**Architecture:** As in slice 1. New sim modules: `treasury.ts` (money), `housing.ts`
(house levels and capacity), `pathfinding.ts` (breadth-first search over roads) and
`walkers.ts` (settler spawning, walking and arrival, driven by `tick()`). The renderer
adds a walker layer that draws settlers with instancing every frame.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 2.

## Global Constraints

- **Treasury** starts at 5,000 dr. It can go negative, which is shown in red. Building
  is still allowed when it's negative.
- **Costs:** a vacant lot costs 10 dr (zeus-numbers). A road tile costs 2 dr (**ours**).
  Re-laying an existing road tile is free. Demolishing is free and refunds nothing.
- **Houses** are 2×2. A lot with no residents is a Vacant Lot; with residents it is a
  Hut (capacity 8). Shack needs food, which arrives in slice 4.
- **Walker speed** is 54.4 tiles per month, and 1 month = 300 ticks (30 s at 1×).
- **The placeholder Test Building is removed.** The house replaces it.
- Code rules from `CLAUDE.md` apply: numbers in definition tables, no *what* comments,
  no defensive `?.`/`!` in app code.

## Decisions (closest to Zeus, recorded in the PR)

1. A lot drag fills the rectangle with 2×2 lots anchored at the drag start. Blocked
   squares are skipped. If nothing fits, the first obstacle is reported.
2. Lots can be placed without road access, as in Zeus. Settlers only reach lots that
   touch a road connected to the entry.
3. One settler is sent per lot and carries exactly the room left (8 for an empty lot).
   A settler leaves the entry 10 times a month (every 3 s at 1×, **ours**) while some
   reachable lot has room. Of those lots, it takes the closest by road.
4. A lot becomes a Hut when its settler arrives. Appeal counts as 0 until slice 4,
   which already passes the Hut's evolve threshold of −10.
5. If a settler's destination is demolished, it re-targets the closest lot with room
   from where it stands. If the road ahead is removed, it re-routes. When neither
   works, it disappears.
6. Demolishing a house removes its residents.

## Review Focus

1. **Over-sending:** two settlers must never be sent to fill the same room. The room
   counts settlers already on the way. Tested in Task 4.
2. **The world changing under a walker:** destination demolished, road removed ahead,
   road removed under it. Tested in Task 4.
3. **Money on failure:** a rejected placement spends nothing. Tested in Task 2.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan on branch `slice-02-settlers-treasury`.

### Task 2: Treasury and costs

**Files:** Create `src/sim/treasury.ts`. Modify `src/sim/buildings.ts`,
`src/sim/state.ts`, `src/sim/commands.ts`, `tests/sim/commands.test.ts`.

- [x] **Step 1:** Write failing tests: the game starts with 5,000 dr; a road charges 2 dr
  per new tile and nothing for tiles that are already road; a rejected road spends
  nothing; the treasury may go negative and building still works.
- [x] **Step 2:** Add `treasury` to `GameState`, `STARTING_TREASURY` and `ROAD_TILE_COST`
  in `treasury.ts`, and charge in `placeRoad`. Run the tests and see them pass.

### Task 3: Vacant lots

**Files:** Create `src/sim/housing.ts`. Modify `src/sim/buildings.ts`,
`src/sim/commands.ts`, `src/sim/state.ts`, the tests.

- [x] **Step 1:** Write failing tests for `lotOrigins(from, to)`: a click is one lot, and
  a drag covers the rectangle in 2×2 steps from the start, in any direction.
- [x] **Step 2:** Write failing tests for `placeHouses(state, from, to)`: it places every
  lot that fits, skips blocked ones, charges 10 dr per lot placed, and fails with the
  first obstacle when none fit.
- [x] **Step 3:** Replace `testBuilding` with `house` (`cost: 10`), give `Building` a
  `residents` count, and add `HOUSE_LEVELS` (Hut 8, Shack 16 needing food) plus
  `houseCapacity` and `houseLevelName`. Make the old building tests use houses. Run
  the tests and see them pass.

### Task 4: Pathfinding and settlers

**Files:** Create `src/sim/pathfinding.ts`, `src/sim/walkers.ts`, `tests/sim/pathfinding.test.ts`,
`tests/sim/walkers.test.ts`. Modify `src/sim/clock.ts`, `src/sim/state.ts`.

- [x] **Step 1:** Write failing tests for `findRoadPath(state, from, targets)`: the
  shortest road path to the nearest target; `null` when the target is unconnected;
  never steps off road.
- [x] **Step 2:** Write failing tests for settlers: none spawn without a reachable lot;
  one spawns at the entry when a lot touches a connected road; it arrives after
  `ceil(distance / speed)` ticks and the lot becomes a Hut with 8 residents; two lots
  get two settlers and one lot never gets two; the closest lot fills first; a
  destination demolished mid-walk makes the settler re-target or vanish; a road
  removed ahead makes it re-route or vanish; population sums residents.
- [x] **Step 3:** Implement BFS pathfinding, `Walker` state, spawning, walking and
  arrival, called from `tick()`. Run all tests and see them pass.

### Task 5: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a vacant lot shows residents 0/8 and whether
  settlers can reach it; a Hut shows residents and "Needs for Shack: food"; a settler
  on a tile shows how many people it carries and where it's heading.
- [x] **Step 2:** Implement. Run the tests and see them pass.

### Task 6: UI and rendering

**Files:** Modify `index.html`, `src/style.css`, `src/ui/topbar.ts`, `src/ui/tools.ts`,
`src/ui/preview.ts`, `src/ui/tool-input.ts`, `src/render/models.ts`,
`src/render/palette.ts`, `src/main.ts`, `tests/ui/preview.test.ts`. Create
`src/render/walker-layer.ts`.

- [x] **Step 1:** Write failing preview tests: a lot drag previews each lot as valid
  (road access), warning (no road access) or invalid (blocked).
- [x] **Step 2:** Add population and treasury to the top bar (red when negative). The
  tool list becomes Road (2 dr), Housing (10 dr) and Demolish.
- [x] **Step 3:** Add models: the Vacant Lot is a bare plot with corner stakes and a sign,
  and the Hut is a mud-brick hut with a thatch roof and a door. Add the walker layer:
  the settler is a figure with a bundle on its back and a walking bob, interpolated
  between ticks and facing its direction of travel.

### Task 7: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: draw a road from the entry road, drag lots
  beside it, run at 4×, wait for the population to rise, and save the screenshot.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check that huts, lots and settlers read
  clearly.

### Task 8: PR

- [x] **Step 1:** Tick slice 2 in `docs/roadmap.md`.
- [x] **Step 2:** Open the PR `Slice 02: Settlers & treasury` with the playtest
  checklist, the decisions above, and what was left out. Wait for CI and the Pages
  deploy.
