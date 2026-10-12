# Slice 7: Olive oil Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Tenements become Apartments, and Apartments become Townhouses. Olive trees are
planted on meadow and bear a crop of olives. A Growers' Lodge sends a grower to pick a
ripe tree within 20 tiles; he brings a load of olives home, and the lodge's cart pusher
takes them to an Olive Press. The press turns each load of olives into a load of oil,
and its cart pusher takes the oil to a Storehouse. An Oil Vendor on the agora sends a
buyer to fetch it, and a peddler roams and leaves houses oil. An Apartment uses 2 units
of oil a month.

**Architecture:** As in slice 6. Olive trees are 1×1 buildings that need no road; their
`growth` is the ripening crop, as a wheat farm's is. A new sim module `olives.ts` holds
ripening, growers (who walk cross-country like shepherds, and through groves) and
pressing. Goods gain `olives` and `oil` fields on buildings and carriers. The olive cart
is a carrier whose store is the Olive Press. The storehouse shares its 8 slots between
fleece and oil. A house's use of each good comes from one table in `food.ts`.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 7.

## Global Constraints

- **Buildings** (zeus-numbers): Olive tree 1×1 on meadow, 3 dr, appeal 1. Growers' Lodge
  2×2, 12 workers, 25 dr, appeal -3,-2. Olive Press 2×2, 12 workers, 45 dr, appeal
  -4,-4,-2,-2. Oil Vendor 2×2 on an agora, 4 workers, 10 dr.
- **Growers' Lodge:** 20 loads of olives a year. **Olive Press:** 6 loads of oil a year,
  1 load of olives → 1 load of oil.
- **Oil use:** 2 units per house per month, Apartment and up.
- **Apartment:** 48 residents, food, water, fleece, oil, 35 culture. Evolves at appeal 30,
  devolves at 15. Tax multiplier 2.
- **Townhouse:** 60 residents, food, water, fleece, oil, 45 culture. Evolves at appeal
  100, devolves at 25. Tax multiplier 2.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **Olive trees are planted by dragging an area**, like housing lots: every free meadow
   tile in the area gets a tree. They need no road, like Zeus orchards.
2. **A tree ripens a crop in a year** (**ours**), and one picking gives one load. A newly
   planted tree arrives bearing ripe olives, like a new sheep's full fleece, so the
   first harvest comes quickly.
3. **The lodge rests 0.6 months between pickings** at full staff (**ours**), slower when
   understaffed: at most 20 loads a year, so 20 trees keep one lodge busy.
4. **The grower walks cross-country** like the shepherd, and through olive groves, so
   trees in the middle of a dense grove can be picked. He picks the nearest ripe tree
   within **20 tiles** (**ours**) that no other grower is after.
5. **The lodge holds up to 4 loads** (one cart); its grower stays home while it is full.
   Its cart pusher takes the olives straight to the nearest staffed press with room.
   Olives are not stored in storehouses.
6. **The press holds 4 loads of olives and 4 loads of oil** (**ours**, one cart each).
   It presses only with olives in and room for oil, at the rate of 6 loads a year at
   full staff. Its cart pusher takes oil to the nearest staffed storehouse with room.
7. **Storehouse slots:** each slot holds one good, so fleece and oil share the 8 slots.
   Carts on the way reserve their room.
8. **Houses are filled to 3 months of oil** (6 units), the same as fleece. Every occupied
   house takes it.

## Review Focus

1. **Storehouse room with two goods** counts slots per good and carts on the way. Task 5.
2. **Growers and a changing world:** tree demolished, lodge demolished, path blocked,
   dense groves. Task 4.
3. **Hysteresis:** an Apartment at appeal 16 stays, at 15 falls back. Task 7.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Refactors

**Files:** Modify `src/sim/food.ts`, `src/sim/inspect.ts`, `src/sim/commands.ts`.

- [x] **Step 1:** Refactor: a house's monthly use and stock target of each good come from
  one table. No behavior change.
- [x] **Step 2:** Refactor: placing housing lots by area becomes placing lots of a given
  building type. No behavior change.

### Task 3: Olive trees

**Files:** Modify `src/sim/buildings.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`.
Create `src/sim/olives.ts`, `tests/sim/olives.test.ts`.

- [x] **Step 1:** Write failing tests: olive trees are planted on every free meadow tile
  of a dragged area for 3 dr each, and refused on grass; a tree arrives ripe, and once
  picked ripens again in a year; it radiates appeal 1.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Growers' Lodge

**Files:** Modify `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/pathfinding.ts`,
`src/sim/olives.ts`. Extend `tests/sim/olives.test.ts`.

- [x] **Step 1:** Write failing tests: a staffed lodge sends its grower 0.6 months after
  staffing (slower at half staff, never without workers) to the nearest ripe tree within
  20 tiles, across open land and through groves; he picks it and brings a load home.
  Not to a tree another grower is after, nor while the lodge holds 4 loads. A tree
  demolished sends him home empty; a demolished lodge takes him with it.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: Olive Press, oil carts and the storehouse

**Files:** Modify `src/sim/carriers.ts`, `src/sim/storehouse.ts`, `src/sim/olives.ts`,
`src/sim/state.ts`, `src/sim/buildings.ts`. Extend `tests/sim/storehouse.test.ts`,
`tests/sim/olives.test.ts`.

- [x] **Step 1:** Write failing tests: the lodge's cart pusher takes olives to the nearest
  staffed press with room, counting carts on the way; a staffed press with olives makes
  a load of oil in 2 months at full staff, slower at half staff, and stops while 4 loads
  of oil wait; its cart pusher takes oil to the storehouse; fleece and oil share the
  storehouse's 8 slots; the oil buyer fetches 4 loads for his stall.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: Oil peddler

**Files:** Modify `src/sim/roamers.ts`, `src/sim/food.ts`. Extend
`tests/sim/roamers.test.ts`.

- [x] **Step 1:** Write failing tests: an oil peddler only sets out with oil in his stall,
  and fills houses he passes to 6 units.
- [x] **Step 2:** Implement. Tests pass.

### Task 7: Apartment and Townhouse

**Files:** Modify `src/sim/housing.ts`, `tests/sim/housing.test.ts`.

- [x] **Step 1:** Write failing tests: a Tenement with oil and appeal 30 becomes an
  Apartment of 48; without oil it stays. An Apartment with 45 culture and appeal 100
  becomes a Townhouse of 60. An Apartment uses 2 units of oil a month and falls back
  when it runs out. An Apartment stays at appeal 16 and falls back at 15. A whole city
  with an olive grove reaches Apartments.
- [x] **Step 2:** Implement. Tests pass.

### Task 8: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a house shows its oil once it is a Tenement and
  what blocks the Apartment ("Needs for Apartment: oil"); a tree shows its crop; a lodge
  shows its olives, grower and cart; a press shows its olives, oil, pressing and cart;
  a storehouse shows each good it holds; a grower describes his errand.
- [x] **Step 2:** Implement. Tests pass.

### Task 9: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/ui/tool-input.ts`, `src/ui/preview.ts`,
`src/render/models.ts`, `src/render/palette.ts`, `src/render/walker-layer.ts`.

- [x] **Step 1:** Tools for the Olive Tree (drag an area), Growers' Lodge, Olive Press and
  Oil Vendor.
- [x] **Step 2:** Models: olive tree (gnarled trunk, silvery crown, dark olives when
  ripe), Growers' Lodge (a farmhouse with a ladder and baskets of olives), Olive Press
  (a stone press house with a crushing stone and press beam; amphorae when oil waits),
  Oil Vendor (a stall of amphorae), Apartment (a three-storey block with a balcony),
  Townhouse (a peristyle house with a colonnaded garden court). Walkers: grower
  (basket; full on the way home), olive cart, oil cart, oil buyer, oil peddler.

### Task 10: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: plant a grove, place a lodge, press and oil
  vendor, screenshot.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 11: PR

- [x] **Step 1:** Tick slice 7 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [x] **Step 2:** Open the PR `Slice 07: Olive oil`. Wait for CI and Pages.
