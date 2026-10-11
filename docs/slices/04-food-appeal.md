# Slice 4: Food & appeal Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Huts become Shacks. Wheat Farms on meadow grow a crop all year and harvest it
in July; a cart pusher hauls it to a Granary. An Agora with a Food Vendor sends a buyer
to fetch wheat from the granary and a peddler to stock the houses he passes. Shacks eat
monthly. Every building radiates appeal, Parks, Columns and Flower Gardens raise it, and
an appeal overlay shows it on the map. A house evolves to a Shack with food and appeal 0,
and falls back to a Hut when it runs out of food or its appeal sinks to -12.

**Architecture:** As in slice 3. New sim modules: `appeal.ts` (the appeal map),
`food.ts` (crops, harvest and eating), `carriers.ts` (cart pushers and buyers: walkers
that go to a building and come back). `housing.ts` gains evolution. The peddler is a
roamer whose service hands out food. Agora vendors are buildings that sit on an agora's
spot and reach the road through it.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 4.

## Global Constraints

- **Buildings** (zeus-numbers): Wheat Farm 3×3 on meadow, 10 workers, 20 dr. Granary
  4×4, 18 workers, 50 dr. Agora 3×6, no workers, 25 dr. Food Vendor 2×2 on an agora,
  4 workers, 10 dr. Park 1×1, 6 dr. Column 1×1, 8 dr. Flower Garden 2×2, 20 dr.
- **Appeal** by distance from the building's footprint (ring 1 is the footprint and its
  neighbours): Palace 18,18,18,15,15,15 · Tax Office -4,-3 · Fountain 4,4,2,2 · Wheat
  Farm -3,-2,-1 · Granary -12,-10,-8,-6 · Agora 12,12,10,10,8,8 · Park 3,2,1 ·
  Column 4,2,0 · Flower Garden 8,7,6. A house's appeal is the average over its tiles,
  rounded down.
- **Shack:** 16 residents, needs food. Evolves at appeal 0, devolves at appeal -12.
- **Food:** 1 load = 100 units. A farm grows 8 loads a year at full staff and harvests
  in July. Shacks eat 0.25 units per resident per month. Granary holds 32 loads.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **The crop grows all year** in proportion to staffing and is harvested on 1 July. A
   farm built in January brings in half a harvest, one built in June almost nothing.
2. **A cart carries 4 loads** (one granary slot, **ours**). One cart out per farm. It
   goes to the nearest staffed granary with room and walks back empty.
3. **A buyer carries up to 4 loads; a vendor holds up to 8 loads** (**ours**). The buyer
   goes whenever the stall has room and a staffed granary has wheat.
4. **A peddler hands out food** from his stall's stock as he passes, filling each house
   to 3 months of eating (**ours**). A Hut is stocked too, though it does not eat: that
   is how it gets the food to become a Shack. He only sets out when the stall has food.
5. **A house checks its level every tick**, one step at a time. It evolves when it meets
   the next level's needs and appeal reaches that level's "evolve" value; it devolves
   when it loses a need or appeal falls to its "devolve" value. Residents above the new
   capacity leave.
6. **Hut appeal is not checked**: a vacant lot becomes a Hut whatever its appeal.
7. **A farm needs every tile on meadow.**
8. **Granaries work at any staffing**: a staffed granary takes and gives wheat at once.
9. **Agora layout:** 3 wide, 6 deep. Its west two columns hold three 2×2 vendor spots,
   its east column is a paved walk. A vendor is placed by clicking a free spot.
   Demolishing a vendor leaves the agora; demolishing the agora removes its vendors.
10. **Parks, Columns and Flower Gardens need no road.**
11. **Appeal overlay** toggles with **O** or the "Appeal" button in the top bar.

## Review Focus

1. **Evolution hysteresis:** a Shack between -12 and 0 stays a Shack; a Hut there stays
   a Hut. Tested in Task 6.
2. **Carriers and a changing world:** granary demolished under a cart, road cut, home
   gone. Tested in Task 4.
3. **Food accounting:** nothing is created or lost on the way from farm to house except
   by eating. Tested in Tasks 3–5.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Appeal

**Files:** Modify `src/sim/buildings.ts`. Create `src/sim/appeal.ts`,
`tests/sim/appeal.test.ts`.

- [x] **Step 1:** Write failing tests: a building's appeal falls off by ring from its
  footprint; sources add up; a house's appeal is the floor of its tiles' average.
- [x] **Step 2:** Add the new buildings and every building's appeal to `BUILDING_SPECS`.
  Implement. Tests pass.

### Task 3: New buildings

**Files:** Modify `src/sim/commands.ts`, `tests/sim/commands.test.ts`.

- [x] **Step 1:** Write failing tests: a farm needs all-meadow ground; a vendor goes on
  a free agora spot only, reaches the road through its agora and hires workers;
  demolishing a vendor leaves the agora, demolishing the agora removes the vendors.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Farms, carts and granaries

**Files:** Create `src/sim/food.ts`, `src/sim/carriers.ts`, `tests/sim/food.test.ts`,
`tests/sim/carriers.test.ts`. Modify `src/sim/pathfinding.ts`, `src/sim/settlers.ts`,
`src/sim/state.ts`, `src/sim/tick.ts`.

- [x] **Step 1:** Refactor: settlers find their lot through a shared
  `nearestByRoad`. No behavior change.
- [x] **Step 2:** Write failing tests: a staffed farm grows a year's crop in a year,
  half at half staff, none without workers; it harvests on 1 July; a cart takes 4 loads
  to the nearest staffed granary with room, then walks home; none goes without a
  granary; a full granary takes no more; a cart whose granary is demolished picks
  another or brings its load home; a cart vanishes with its farm.
- [x] **Step 3:** Implement. Tests pass.

### Task 5: Agora, buyer, peddler, eating

**Files:** Modify `src/sim/carriers.ts`, `src/sim/roamers.ts`, `src/sim/food.ts`, the
tests.

- [x] **Step 1:** Write failing tests: a staffed vendor sends a buyer to a granary with
  wheat, who brings back up to 4 loads; no buyer when the stall is full or no granary
  has wheat; a peddler only leaves with food; he fills houses to 3 months of eating;
  Shacks eat 0.25 per resident each month, Huts don't.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: Evolution

**Files:** Modify `src/sim/housing.ts`, `tests/sim/housing.test.ts`.

- [x] **Step 1:** Write failing tests: a Hut with food and appeal 0 becomes a Shack and
  takes 16 residents; without food or at appeal -1 it stays a Hut; a Shack keeps its
  level at appeal -11 and devolves at -12 or when its food runs out, sending away
  residents above 8.
- [x] **Step 2:** Implement. Tests pass.

### Task 7: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a house shows its food and appeal and what blocks
  its next level ("needs: food, appeal 0 (has -3)"); a farm shows crop growth; a
  granary shows its loads; a vendor shows its stock; an agora lists its vendors; a
  decoration shows its appeal; carriers and peddlers describe their errand.
- [x] **Step 2:** Implement. Tests pass.

### Task 8: UI and rendering

**Files:** Modify `index.html`, `src/style.css`, `src/ui/*`, `src/render/*`,
`src/main.ts`, `tests/ui/preview.test.ts`.

- [x] **Step 1:** Write failing preview tests: a vendor previews its whole spot on an
  agora and invalid elsewhere; a park without road is valid.
- [x] **Step 2:** Tools for the new buildings. Appeal overlay with a legend, toggled
  with O or its button.
- [x] **Step 3:** Models: Shack (whitewashed walls, terracotta roof, grain jars), Wheat
  Farm (rows of wheat that ripen as the crop grows, a barn), Granary (stone storehouse
  with domed silos, sacks as it fills), Agora (paved plaza, marked spots), Food Vendor
  (awning stall with bread and baskets), Park, Column, Flower Garden. Walkers: cart
  pusher with a cart of sacks, buyer with an empty basket, peddler with a basket of
  bread on the head.

### Task 9: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: place a farm, granary, agora, vendor and park,
  toggle the appeal overlay, screenshot.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 10: PR

- [x] **Step 1:** Tick slice 4 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [x] **Step 2:** Open the PR `Slice 04: Food & appeal`. Wait for CI and Pages.

### Task 11: Playtest feedback

- [x] **Step 1:** Buyers buy whole loads only, and only set out when the stall has room
  for a load and a granary holds one. Harvests come in whole loads, rounded to the
  nearest.
- [x] **Step 2:** The granary shows one sack per load: eight stone bins of four sacks in
  front of the storehouse, filling bin by bin, updated on every delivery and purchase.
- [x] **Step 3:** **R** turns the next building a quarter turn clockwise, in the preview
  and when placed. A quarter turn swaps width and depth (Palace 6×9, Agora 6×3). The
  agora's vendor spots and walk turn with it, and a vendor takes its agora's turn.
  Models turn about their footprint's centre.
