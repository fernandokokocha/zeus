# Slice 10: Materials & sculpture Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The city gathers the materials sanctuaries will need. A Timber Mill sends a
lumberjack to fell a forest tree, a Masonry Shop sends a quarryman to cut marble, and a
Foundry sends a miner to dig copper ore, which it casts into bronze. Each brings one load
home, and the workshop's cart pusher takes it to a Storehouse. A Sculpture Studio fetches
bronze, or is sent it straight from a foundry, and casts 4 loads of bronze into a
sculpture, which its cart takes to a storehouse. An Artisans' Guild can be placed and
staffed; its artisans build sanctuaries from slice 11. Felled forest grows back slowly.

**Architecture:** A new sim module `materials.ts` holds gatherers and sculpting.
Gatherers walk cross-country like growers, to an open tile next to the resource. A
felled forest tile stays forest terrain and records when it grows back in a per-tile
`felledUntil` array. Goods gain `wood`, `marble`, `bronze` and `sculptures` fields on
buildings and carriers; the storehouse shares its 8 slots among all its goods. The
bronze cart and buyer follow the olive cart and olive buyer: a studio is a store for
bronze, as a press is for olives.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 10.

## Global Constraints

- **Buildings** (zeus-numbers): Timber Mill 2×2, 12 workers, 35 dr, appeal -5,-4,-3,-2,
  fire 10. Masonry Shop 2×2, 15 workers, 75 dr, appeal -6,-5,-4,-3, collapse 10. Foundry
  2×2, 15 workers, 60 dr, appeal -10,-9,-8,-7,-6,-5, collapse 10. Sculpture Studio 2×2,
  12 workers, 100 dr, appeal -2,-1, collapse 10. Artisans' Guild 2×2, 25 workers, 35 dr,
  appeal -6,-6,-5, fire 5.
- **Output:** Timber Mill and Foundry 13 / 10 / 7–8 loads a year with the resource
  adjacent / within 10 / within 20 tiles. Masonry Shop 12 loads with marble within 20.
  Sculpture Studio 6 sculptures a year, 4 bronze → 1 sculpture.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **Gatherers walk to the resource**, as Zeus lumberjacks, quarrymen and miners do. The
   workshop rests between trips (12/13 of a month for mill and foundry, 1 month for the
   masonry shop, at full staff) and each trip brings one load. The walk itself makes
   far resources slower: at 54.4 tiles a month a round trip of 20 tiles adds about 0.4
   months and one of 40 adds 0.75, which gives Zeus's 13 / 10 / 7–8 loads.
2. **The resource must be within 20 tiles** of the workshop (all three, **ours** for
   wood and bronze, matching marble's). Workshops can be placed anywhere; the inspector
   says when nothing is in range.
3. **Each gatherer heads for a tile no other gatherer is after**, the nearest by walking.
4. **A felled tree grows back in 4 years** (**ours**). Marble and copper never run out,
   as in Zeus.
5. **The workshop holds up to 4 loads** (one cart), and its gatherer stays home while
   it is full, as the Growers' Lodge.
6. **The foundry's cart takes bronze to the nearest staffed Sculpture Studio with room**,
   and to a storehouse only when no studio has room, as olives go to a press first. A
   studio's buyer fetches bronze from storehouses.
7. **The studio holds 8 loads of bronze** (**ours**, two sculptures' worth so casting
   need not wait on each cart) and **4 sculptures**. One sculpture is one load. It casts
   a sculpture in 2 months at full staff (6 a year).
8. **The Artisans' Guild only hires** this slice; its artisans have nothing to build
   until slice 11's sanctuaries.

## Review Focus

1. **Felled forest** is no resource until it grows back, and growing back redraws it.
   Task 3.
2. **Gatherers and a changing world:** site demolished, workshop demolished, path
   blocked. Task 3.
3. **Storehouse room with seven goods.** Task 4.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Buildings and goods

**Files:** Modify `src/sim/buildings.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/safety.ts`, `src/sim/storehouse.ts`, `src/sim/carriers.ts`.

- [x] **Step 1:** Write failing tests: the five buildings cost and radiate as listed;
  their fire and collapse risks build up.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Gatherers

**Files:** Create `src/sim/materials.ts`, `tests/sim/materials.test.ts`. Modify
`src/sim/state.ts`, `src/sim/tick.ts`, `src/sim/commands.ts`.

- [x] **Step 1:** Write failing tests: a staffed mill sends its lumberjack after its rest
  (slower at half staff, never without workers) to the nearest forest within 20 tiles;
  he fells it and brings a load of wood home. The felled tile is no resource, then grows
  back in 4 years. Two mills fell different trees. A full mill keeps him home. A
  demolished site sends him home empty; a demolished mill takes him with it. The
  masonry shop and foundry do the same with marble and copper, which never run out.
  A mill next to forest makes about 13 loads a year, one 20 tiles away about 7–8.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Carts, studio and storehouse

**Files:** Modify `src/sim/carriers.ts`, `src/sim/materials.ts`, `src/sim/storehouse.ts`.
Extend `tests/sim/materials.test.ts`, `tests/sim/storehouse.test.ts`.

- [x] **Step 1:** Write failing tests: wood, marble and bronze carts take loads to the
  storehouse; bronze goes to a studio with room first; a studio's buyer fetches bronze
  from a storehouse; a staffed studio with 4 loads of bronze casts a sculpture in 2
  months at full staff, slower at half, and stops while 4 sculptures wait; its cart
  takes them to the storehouse; all goods share the 8 slots.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a workshop shows its stock, gatherer and cart, and
  says when nothing is in range; a studio shows bronze, sculptures and casting; a guild
  says its artisans wait for a sanctuary; a gatherer describes his errand; a felled
  forest tile says when it grows back.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/render/models.ts`, `src/render/palette.ts`,
`src/render/walker-layer.ts`, `src/render/terrain-layer.ts`.

- [x] **Step 1:** Tools for the five buildings.
- [x] **Step 2:** Models: Timber Mill (a shed with a saw bench and a log pile), Masonry
  Shop (a yard of cut marble blocks and a hoist), Foundry (a furnace house with a tall
  chimney and glowing mouth), Sculpture Studio (a workshop with a bronze statue on a
  plinth), Artisans' Guild (a hall with a portico and stacked tools). Felled forest
  shows a stump. Walkers: lumberjack (axe; log on the shoulder coming home), quarryman
  (pick; block coming home), miner (pick; ore coming home), wood, marble, bronze and
  sculpture carts, bronze buyer.

### Task 7: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: place the five buildings, screenshot.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 8: PR

- [ ] **Step 1:** Tick slice 10 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [ ] **Step 2:** Open the PR `Slice 10: Materials & sculpture`. Wait for CI and Pages.
