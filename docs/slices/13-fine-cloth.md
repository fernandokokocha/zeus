# Slice 13: Fine cloth Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A Weaver (2×2) sends a buyer to fetch fleece from a storehouse, weaves each load
of fleece into a load of fine cloth, and its cart pusher takes the cloth back to a
storehouse, where cloth fills its own slots. Houses don't use cloth; the Traders' Guild
will (slice 16). Fleece vendors keep getting fleece while a Weaver competes for it.

**Architecture:** The Olive Press pattern. Goods gain a `cloth` field on buildings and
carriers. Two new carrier kinds in `CARRIER_SPECS`: `weaverBuyer` (home weaver, fetches
fleece from storehouses, like `oliveBuyer`) and `clothCart` (home weaver, delivers cloth to
storehouses, like `oilCart`). A new sim module `cloth.ts` holds the weaving step, a mirror
of `pressOil`. `cloth` joins `STOREHOUSE_GOODS`, so it gets slots, an inspector meter and
a storehouse load model for free.

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "Fine cloth".

## Global Constraints

- **Weaver** (**ours**): 2×2, 12 workers, 40 dr, appeal -3,-2,-1, fire risk 5, never
  collapses.
- **Weaving** (**ours**): 1 load fleece → 1 load cloth, 6 loads a year at full staff
  (2 months a load), slower when understaffed, nothing without workers.
- **Weaver stock** (**ours**): 4 loads of fleece and 4 loads of cloth (one cart each).
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the commit and the final report)

1. **Fleece reaches a Weaver only through a storehouse.** The carding shed's cart keeps
   delivering to storehouses only (unlike olives, which go straight to a press), so a
   Weaver never intercepts fleece before vendors can see it.
2. **Fleece vendors come first.** A Weaver's buyer only takes fleece above 4 loads (one
   vendor buyer's load) in a storehouse. Without this, a year-long simulation of a shed, a
   vendor and a Weaver showed the nearer Weaver winning every race and the stall never
   getting fleece. Houses before luxuries. Otherwise buyers go to the nearest storehouse
   with fleece to spare; one who finds it gone walks home empty.
3. **Cloth is stored, never sold** this slice. No vendor, no house use (spec).
4. **Weaver's appeal and fire risk** follow the Carding Shed's (a textile workshop) but a
   little gentler, since weaving is quieter than carding: -3,-2,-1 and 5.
5. **Placeholder models**: Weaver is a plastered workshop with an upright loom under a
   porch, blue warp on it, a fleece basket when fleece is in, and bolts of blue cloth when
   cloth waits. Cloth cart carries blue bolts; the Weaver's buyer has a teal tunic and a
   fleece bundle. In the storehouse, cloth is stacked blue bolts. All go to the backlog.

## Review Focus

1. **Fleece competition:** vendor and Weaver both get fleece from one storehouse; a buyer
   finding the storehouse empty goes home empty without error. Task 3.
2. **Storehouse room** with cloth: its own slots, carts on the way reserve room. Task 3.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The Weaver weaves

**Files:** Modify `src/sim/buildings.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/carriers.ts`, `src/sim/safety.ts`, `src/sim/tick.ts`. Create `src/sim/cloth.ts`,
`tests/sim/cloth.test.ts`.

- [x] **Step 1:** Write failing tests: a Weaver costs 40 dr and hires 12; a staffed Weaver
  with fleece makes a load of cloth in 2 months at full staff, twice as long at half
  staff, never without workers; it waits for fleece; it stops while 4 loads of cloth wait.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Fleece in, cloth out

**Files:** Modify `src/sim/carriers.ts`, `src/sim/storehouse.ts`. Extend
`tests/sim/cloth.test.ts`.

- [x] **Step 1:** Write failing tests: the Weaver's buyer fetches fleece from the nearest
  storehouse up to 4 loads, not while full or while one is already out; its cart pusher
  takes cloth to the nearest staffed storehouse with room, counting carts on the way; cloth
  takes its own slots; the cart and buyer go out at once; a fleece vendor and a Weaver
  sharing one storehouse both get fleece; scarce fleece goes to the stall first; a buyer finding the spare fleece gone walks home empty;
  a whole chain (sheep → shed → storehouse → Weaver → storehouse) puts cloth in the
  storehouse within a year while the vendor's stall still fills.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a Weaver shows fleece in ("Fleece: 2 of 4 loads"),
  cloth out ("Cloth waiting: 4 loads"), progress ("Weaving: 50% of a load", "Waits for
  fleece", "Full of cloth: waits for its cart"), its cart and buyer; a storehouse shows a
  Cloth meter; the cloth cart describes its load.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/render/models.ts`, `src/render/palette.ts`,
`src/render/walker-layer.ts`, `src/render/storehouse-models.ts`,
`src/render/kit/storehouse.ts`.

- [x] **Step 1:** Weaver tool in the Industry group.
- [x] **Step 2:** Models: Weaver, cloth bolts in the storehouse, cloth cart, Weaver's buyer.

### Task 6: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Place a Weaver in the smoke test; the storehouse inspector has 9 meters.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 7: Docs and ship

- [x] **Step 1:** Tick slice 13 in `docs/roadmap.md`. Record the **ours** numbers in
  zeus-numbers. Add the Weaver, cloth cart, Weaver's buyer and stored cloth to the
  redesign backlog.
- [x] **Step 2:** Commit on `main` and push (no PR this slice, per the session prompt).
  Wait for CI and Pages.
