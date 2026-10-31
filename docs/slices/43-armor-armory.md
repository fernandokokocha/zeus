# Slice 43: Armor and the Armory Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A new good, armor, made at a new workshop, the Armory, from bronze (1 load into
1 load, 6 a year at full staff), stored in storehouses and never traded. An Arms Vendor on
the Agora buys it for the peddler. Nobody wears armor yet: the Warriors' House will.

**Architecture:** `Good` gains `armor`, so `Building` and `Carrier` gain the stock field.
`TradeGood` excludes it beside scrolls. `src/sim/armor.ts` holds the Armory, shaped like the
Weaver: an `armoryBuyer` fetches bronze from storehouses only, an `armorCart` takes armor to
a storehouse. Armor becomes a `PeddledGood` with an `armsVendor` and its `armorBuyer`; no
residence uses it yet, so the peddler stocks none.

**Spec:** `docs/superpowers/specs/2026-10-30-warriors-house-design.md`, "Armor and the Armory".

## Decisions (closest to Zeus, recorded in the commit)

1. **An armor load takes 2 months** at full staff (6 a year), in proportion to staffing,
   and the Armory stops while 4 loads of armor wait for its cart, as the Weaver.
2. **No bronze is kept back.** Foundry carts still go to a Sculpture Studio with room first;
   the Armory's buyer and the Studio's buyer both take any whole load a storehouse holds.
3. **It is an industry** in the Ledger (priority, open or closed), listed after the Sculpture
   Studio. Its Production row makes armor and wants bronze, 6 loads a year each.
4. **Armor comes last** in goods lists, after Sculptures.
5. **No residence wears armor** in this slice, so the peddler carries none and the Supplies
   map mode shows no armor bar. The Warriors' House slice adds its 8 units a month.
6. **Placeholder models** for the Armory, stored armor, the armor cart and the two buyers,
   all added to the redesign backlog.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The good

**Files:** `src/sim/state.ts`, `src/sim/flows.ts`, `src/sim/storehouse.ts`, `src/sim/production.ts`,
`src/sim/inspect.ts`, `src/sim/carriers.ts`, `src/sim/commands.ts`, tests.

- [x] **Step 1:** Failing tests: no partner deals in armor; storehouses hold it in its own
  slots; the Ledger has an Armor row.
- [x] **Step 2:** Implement.

### Task 3: The Armory

**Files:** `src/sim/buildings.ts`, `src/sim/armor.ts`, `src/sim/carriers.ts`,
`src/sim/industries.ts`, `src/sim/production.ts`, `src/sim/safety.ts`, `src/sim/tick.ts`,
`tests/sim/armor.test.ts`.

- [x] **Step 1:** Failing tests: 2×2, 18 workers, 40 dr, appeal -8 to -5; a load of bronze
  into a load of armor in 2 months; half staff is half pace; no workers, no bronze, or 4
  armor waiting stops it; the buyer fetches 4 loads of bronze from a storehouse, only what
  fits, never from a Foundry; the cart takes armor to a storehouse; fire 8, no collapse;
  priority and Production row.
- [x] **Step 2:** Implement.

### Task 4: The Arms Vendor

**Files:** `src/sim/buildings.ts`, `src/sim/carriers.ts`, `src/sim/food.ts`, `src/sim/state.ts`,
`src/sim/overlays.ts`, tests.

- [x] **Step 1:** Failing tests: the vendor's buyer fetches 4 loads of armor, holds 8; the
  peddler gives no house any armor.
- [x] **Step 2:** Implement.

### Task 5: Inspector, toolbar, models, docs

**Files:** `src/sim/inspect.ts`, `src/ui/*`, `src/render/*`, `docs/redesign-backlog.md`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests: the inspector shows bronze held, armor waiting and what the
  Armory waits for; the vendor meter.
- [x] **Step 2:** Implement; Armory in the Industry menu, Arms Vendor in Distribution.
- [x] **Step 3:** Placeholder models; backlog and numbers reference; typecheck and build.
