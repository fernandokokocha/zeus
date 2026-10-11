# Slice 6: Storehouse & fleece Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Hovels become Homesteads, and Homesteads become Tenements. Sheep graze where
they are placed and grow a fleece. A Carding Shed sends a shepherd to shear a sheep
with a full fleece within 40 tiles; he brings a load of fleece home, and the shed's
cart pusher takes it to a Storehouse. A Fleece Vendor on the agora sends a buyer to
fetch it, and a peddler roams and leaves houses fleece. A Homestead uses 2 units of
fleece a month.

**Architecture:** As in slice 5. A new sim module `sheep.ts` holds sheep (grazing,
wool) and shepherds (shearing). `carriers.ts` learns goods: every carrier kind names
the good it carries and the store it serves, so the shed's cart and the fleece buyer
are two more rows in its table. Buildings and carriers hold each good in a field of
its own name (`food`, `fleece`). Agora vendors become a family (food, fleece) instead
of one building type. `housing.ts` gains the Homestead, the Tenement and the fleece
need.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 6.

## Global Constraints

- **Buildings** (zeus-numbers): Storehouse 3×3, 12 workers, 25 dr, appeal -2,-2,-2,-2.
  Carding Shed 2×2, 8 workers, 16 dr, appeal -5,-3,-1. Fleece Vendor 2×2 on an agora,
  4 workers, 10 dr. Sheep 1×1 animal, 4 dr.
- **Storehouse:** 8 slots of 4 loads (32 loads).
- **Carding Shed:** shears sheep within 40 tiles; 7–8 loads of fleece a year.
- **Fleece use:** 2 units per house per month, Homestead and up.
- **Homestead:** 32 residents, food, water, fleece, 15 culture. Evolves at appeal 10,
  devolves at -2. Tax multiplier 2.
- **Tenement:** 40 residents, food, water, fleece, 35 culture. Evolves at appeal 20,
  devolves at 5. Tax multiplier 2.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **A sheep grows a full fleece in a year** (**ours**), and one shearing gives one
   load. A new sheep arrives with a full fleece, so the first shearing comes quickly.
2. **The shed rests 1.5 months between shearings** at full staff (**ours**), slower when
   understaffed: at most 8 loads a year, so with the walk it makes Zeus's 7–8, and 8
   sheep keep one shed busy.
3. **The shepherd walks cross-country**, as in Zeus: over roads and open grass or
   meadow, never through buildings. He shears the nearest sheep with a full fleece
   that no other shepherd is after. The sheep stands still while he comes.
4. **Sheep graze within 3 tiles of where they were placed** (**ours**), on open grass or
   meadow off the road, one step every few seconds. A sheep that is built over walks
   off to a free neighbour tile, or is lost if there is none. Demolish removes sheep.
5. **The shed holds up to 4 loads** (one cart); its shepherd stays home while it is
   full. Its cart pusher leaves as soon as there is fleece, like the farm's.
6. **Houses are filled to 3 months of fleece** (6 units), the same as food. Every
   occupied house takes it, so a Hovel has fleece when it is ready to become a
   Homestead.
7. **Vendors:** the Fleece Vendor takes any free agora spot, like the Food Vendor. Its
   buyer fetches 4 loads from the nearest staffed storehouse with fleece, and its
   peddler roams 44 tiles.

## Review Focus

1. **Hysteresis:** a Tenement at appeal 6 stays, at 5 falls back to a Homestead. Task 6.
2. **Shepherds and a changing world:** sheep demolished or built over, shed demolished,
   path blocked. Task 3.
3. **Storehouse room** counts carts on the way, like the granary. Task 4.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Vendors as a family

**Files:** Modify `src/sim/buildings.ts`, `src/sim/commands.ts`, `src/sim/inspect.ts`,
`src/ui/preview.ts`.

- [x] **Step 1:** Refactor: code that asks "is this the food vendor?" to place, reach
  or demolish a vendor asks "is this an agora vendor?". No behavior change.

### Task 3: Sheep and shearing

**Files:** Modify `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/pathfinding.ts`,
`src/sim/walking.ts`, `src/sim/tick.ts`, `src/sim/buildings.ts`. Create
`src/sim/sheep.ts`, `tests/sim/sheep.test.ts`.

- [x] **Step 1:** Write failing tests: a sheep is placed on open grass or meadow for
  4 dr, not on a road, building or rock; it grazes within 3 tiles of its spot; its
  fleece regrows in a year. A staffed Carding Shed sends its shepherd 1.5 months
  after staffing (slower at half staff, never without workers) to the nearest sheep
  with a full fleece within 40 tiles, across open land; he shears it and brings a load
  home. Not to a sheep another shepherd is after, nor while the shed holds 4 loads. A
  sheep demolished sends him home empty; a demolished shed takes him with it.
  Demolish removes sheep; a built-over sheep walks off.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Storehouse and fleece carriers

**Files:** Modify `src/sim/carriers.ts`, `src/sim/state.ts`, `src/sim/buildings.ts`.
Create `src/sim/storehouse.ts`, `tests/sim/storehouse.test.ts`.

- [x] **Step 1:** Write failing tests: the shed's cart pusher takes its fleece to the
  nearest staffed storehouse with room; a storehouse takes 32 loads in 8 slots of 4,
  counting carts on the way; the fleece buyer fetches 4 loads for his stall.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: Fleece peddler

**Files:** Modify `src/sim/roamers.ts`, `src/sim/food.ts`. Extend
`tests/sim/roamers.test.ts`.

- [x] **Step 1:** Write failing tests: a fleece peddler only sets out with fleece in
  his stall, and fills houses he passes to 6 units.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: Homestead and Tenement

**Files:** Modify `src/sim/housing.ts`, `src/sim/food.ts`, `tests/sim/housing.test.ts`.

- [x] **Step 1:** Write failing tests: a Hovel with fleece and appeal 10 becomes a
  Homestead of 32; without fleece it stays. A Homestead with 35 culture and appeal 20
  becomes a Tenement of 40. A Homestead uses 2 units of fleece a month and falls back
  when it runs out. A Tenement stays at appeal 6 and falls back at 5. A whole city
  with sheep reaches Homesteads.
- [x] **Step 2:** Implement. Tests pass.

### Task 7: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a house shows its fleece once it is a Hovel and
  what blocks the Homestead ("Needs for Homestead: fleece"); a storehouse shows its
  fleece and slots; a shed shows its fleece, shepherd and cart; a sheep shows its
  fleece; a shepherd describes his errand.
- [x] **Step 2:** Implement. Tests pass.

### Task 8: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/ui/tool-input.ts`, `src/ui/preview.ts`,
`src/render/models.ts`, `src/render/palette.ts`, `src/render/walker-layer.ts`.

- [x] **Step 1:** Tools for the Storehouse, Carding Shed, Fleece Vendor and Sheep.
- [x] **Step 2:** Models: Storehouse (a yard of 8 fenced slots with a roofed shed; bales
  fill the slots), Carding Shed (a timber shed with a fleece-strewn yard and a
  carding bench), Fleece Vendor (a stall hung with fleeces), Homestead (a larger house
  with an upper storey and a vine-shaded yard), Tenement (a two-storey block around a
  small courtyard). Walkers: sheep (woolly and shorn), shepherd (crook; a white bale
  on the way home), fleece cart, fleece buyer, fleece peddler.

### Task 9: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: place a storehouse, carding shed, fleece
  vendor and sheep, screenshot.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 10: PR

- [ ] **Step 1:** Tick slice 6 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [ ] **Step 2:** Open the PR `Slice 06: Storehouse & fleece`. Wait for CI and Pages.
