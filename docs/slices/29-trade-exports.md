# Slice 29: Trade: exports Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A guild with a route exports. Its yard has **4 slots**, each set to off or to a
good the partner buys. The yard's **8 workers** fetch that good from storehouses (granaries
for food) until a slot holds a caravan load. With **5 merchants** home, a caravan forms,
walks the Main Road west and leaves the map for the route's round trip. Back, it walks to
the **Palace**, where its drachmas join the treasury on a new **Trade** line, then the
merchants walk home to the guild. Caravans can be clicked; those off the map are listed in
the yard's inspector.

**Architecture:** `src/sim/exports.ts` owns the yard's slots (`building.exportSlots`, four
`Good | null`), `setExportSlot`, how much each slot holds, and `state.caravans` with
`tickCaravans`. The yard's stock lives in its ordinary good fields, one pool per good;
slots are filled from that pool in order. Fetching reuses the carrier system: nine new
carrier kinds (`foodExport` … `clothExport`) are buyers whose home is the Trade Yard, and a
carrier's fetch capacity becomes a function of its home, so the yard's is its export slots'
room. A caravan is a walk with a **trip**: `out` (yard to the west edge), `away` (off the
map until `backAt`), `home` (west edge to the Palace) and `merchants` (Palace to the guild).
A caravan whose way is cut waits where it stands and retries every tick, so its drachmas
are never lost. The Treasury gains a `trade` income account.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "Exports (slice 29)".

## Decisions (closest to Zeus, recorded in the commit)

1. **The yard's stock is one pool per good.** Two slots exporting wood fill one after the
   other from the same pool; a caravan takes one caravan load from it.
2. **A slot switched off, or to another good, keeps what it held** in the yard's stock.
   Another slot exporting that good uses it; nothing carts it back yet (slice 30 builds the
   yard's trips back to the storehouses, for imports).
3. **The yard always employs** its 8 workers, route or not, like any workplace.
4. **Caravans form without yard workers.** The workers move goods; the merchants crew the
   caravan.
5. **One caravan forms per yard per tick,** from the first full slot.
6. **A caravan whose road is cut,** on any leg, waits where it stands ("Waiting: no road
   to the Palace", "Waiting: no road west") and carries on once a road exists. Merchants
   walking back whose guild is gone or unreachable are simply home.
7. **The notice** is posted at the Palace: "Caravan back from Argos: +150 dr".
8. **The guild's inspector** gains "Caravans out 1 of 4": merchants away are a caravan's
   five.
9. **Placeholder models:** our caravan is a merchant in white and blue leading a pack
   donkey: laden going out, with a money chest coming home, unladen walking back.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Slots and filling

**Files:** `src/sim/exports.ts`, `src/sim/carriers.ts`, `src/sim/state.ts`,
`src/sim/commands.ts`, `src/sim/buildings.ts`, `tests/sim/exports.test.ts`.

- [x] **Step 1:** Failing tests: a yard has four slots, off; a slot takes a good its
  partner buys and nothing else, and nothing without a route; the yard employs 8; its cart
  pushers fetch the good from storehouses (granaries for food) until the slot holds a
  caravan load; nothing moves without workers.
- [x] **Step 2:** Implement (carrier capacity as a function of the home is a refactor:
  carrier tests stay green unmodified).

### Task 3: Caravans

**Files:** `src/sim/exports.ts`, `src/sim/tick.ts`, `src/sim/treasury.ts`,
`src/sim/economy.ts`, `tests/sim/exports.test.ts`, `tests/sim/treasury.test.ts`.

- [x] **Step 1:** Failing tests: a full slot and 5 merchants home form a caravan that
  takes one load; at most 4 out from 20 merchants; it walks to the west edge, stays away
  for the round trip, walks to the Palace, pays (Trade account, notice) and the merchants
  walk home; it waits when the Palace can't be reached and carries on later; it still pays
  when its guild is gone.
- [x] **Step 2:** Implement.

### Task 4: Inspectors

**Files:** `src/sim/inspect.ts`, `tests/sim/exports.test.ts`.

- [x] **Step 1:** Failing tests: the caravan's inspector (partner, direction, goods, value,
  where it is); the yard's slots view and its caravans off the map with time remaining;
  the guild's "Caravans out" line.
- [x] **Step 2:** Implement.

### Task 5: UI and models

**Files:** `src/ui/inspector.ts`, `src/ui/yard-panel.ts`, `src/ui/ledger-chapters.ts`,
`src/style.css`, `src/render/walker-layer.ts`, `src/render/palette.ts`,
`docs/redesign-backlog.md`, `docs/reference/zeus-numbers.md`.

- [x] **Step 1:** The yard's slot panel: one row per slot, a choice of Off or each good
  the partner buys, and how full it is.
- [x] **Step 2:** The Treasury's Trade line; caravan figures; the caravan backlog entry.

### Task 6: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 29: Trade: exports`.
