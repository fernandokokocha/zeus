# Slice 35: Papyrus and the Scriptorium Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Two new goods. Papyrus is imported from Corinth (4 a caravan, 60 dr a load) and
nobody buys it from us. Scrolls are made by a new workshop, the Scriptorium, from 4 loads of
papyrus or 40 loads of fleece, and stored in storehouses. Nothing uses scrolls yet: the
Scholars' House will.

**Architecture:** `Good` gains `papyrus` and `scrolls`, so `Building` and `Carrier` gain the
two stock fields. A new `TradeGood` (every good but scrolls) types the trade tables, so
scrolls never reach a yard. `src/sim/scrolls.ts` holds the Scriptorium: its buyer fetches
papyrus first and fleece only when no storehouse has papyrus, one buyer at a time; each
load it finishes adds pages (papyrus 10, fleece 1) to `Building.pages`, and 40 pages make a
scroll. A scroll cart takes scrolls to a storehouse, and a yard unload cart brings imported
papyrus to one.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Papyrus and
the Scriptorium".

## Decisions (closest to Zeus, recorded in the commit)

1. **The Scriptorium holds 4 scrolls** waiting for its cart, as the Weaver holds 4 loads of
   cloth, and stops while they wait.
2. **One buyer at a time.** It fetches papyrus whenever a storehouse has some, otherwise
   fleece; the two are never out together, so the 4-load input limit holds exactly.
3. **It is an industry** in the Ledger (priority, open or closed), listed after the Weaver.
   Its Production row says it wants papyrus (24 loads a year), the recipe it prefers.
4. **Fire risk 5, never collapses,** as the Weaver.
5. **Placeholder models** for the Scriptorium, stored papyrus and scrolls, the scroll cart,
   the papyrus cart and the two buyers, all added to the redesign backlog.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The goods

**Files:** `src/sim/state.ts`, `src/sim/trade.ts`, `src/sim/storehouse.ts`, `src/sim/flows.ts`,
`src/sim/production.ts`, `src/sim/inspect.ts`, `src/sim/carriers.ts`, `src/sim/commands.ts`,
tests.

- [x] **Step 1:** Failing tests: Corinth sells papyrus at 60 dr, caravan load 4, and no
  partner buys papyrus or deals in scrolls; storehouses hold both in their own slots; an
  imported papyrus load is carried from the yard to a storehouse.
- [x] **Step 2:** Implement.

### Task 3: The Scriptorium

**Files:** `src/sim/buildings.ts`, `src/sim/scrolls.ts`, `src/sim/carriers.ts`,
`src/sim/industries.ts`, `src/sim/production.ts`, `src/sim/safety.ts`, `src/sim/tick.ts`,
`tests/sim/scrolls.test.ts`.

- [x] **Step 1:** Failing tests: 2×2, 12 workers, 50 dr; a papyrus load in half a month,
  a fleece load in a twentieth; 4 papyrus or 40 fleece make a scroll, mixed loads add up;
  papyrus is used before fleece; half staff is half pace; stops while 4 scrolls wait; the
  buyer fetches papyrus first, fleece only with no papyrus in storage, never both at once,
  never over 4 loads, and leaves 4 loads of fleece for vendors; the cart takes scrolls to a
  storehouse.
- [x] **Step 2:** Implement.

### Task 4: Inspector, Ledger and toolbar

**Files:** `src/sim/inspect.ts`, `src/ui/tools.ts`, tests.

- [x] **Step 1:** Failing tests: the inspector shows papyrus and fleece held, pages toward
  the next scroll and what it waits for; the Ledger lists the new goods and the industry.
- [x] **Step 2:** Implement; add the Scriptorium to the Industry menu.

### Task 5: Models and docs

**Files:** `src/render/*`, `src/ui/good-icons.ts`, `docs/redesign-backlog.md`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Placeholder models; typecheck and build.
- [x] **Step 2:** Backlog entries and the numbers reference.
