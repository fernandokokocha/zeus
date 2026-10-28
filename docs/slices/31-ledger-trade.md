# Slice 31: Ledger: Trade Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A **Trade** chapter in the Ledger, between Treasury and Charter: the routes open
(guild, partner, round trip); every caravan on the road or away, ours and foreign, with its
goods, value and where it is; and this year against last year, exports by good and imports
by good, in loads and drachmas.

**Architecture:** `src/sim/trade-books.ts` owns the books: `GameState` gains
`tradeBooks: { thisYear, lastYear }`, each a `TradeYear` of exports and imports, a
`{ loads, drachmas }` tally per good. A caravan books its export when its drachmas reach
the Palace, and an import is booked when it unloads, the same moments the Treasury's Trade
and Imports lines move. `closeYear` rolls both books over in January.
`src/sim/trade-ledger.ts` builds `tradeReport(state)`, reusing the inspector's caravan
wording (`caravanCargo`, `months`, `drachmas`); it is kept apart from the books so the
core modules that book trade don't import the inspector. The Treasury's year labels move
into `yearLabels(state)`, shared by both reports.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "Ledger: Trade (slice 31)".

## Decisions (closest to Zeus, recorded in the commit)

1. **The year is the calendar year**, rolling over in January with the Treasury, so the
   Trade chapter and the Treasury's Trade and Imports lines always agree.
2. **An export counts when its money reaches the Palace,** not when the caravan sets off:
   trade money exists only once a caravan has carried it home. **An import counts when it
   unloads**, when it is paid for.
3. **Every caravan out is listed,** including merchants walking home from the Palace and
   foreign caravans walking or travelling home empty: they still hold merchants or one of
   the partner's caravans. Those rows show "–" for goods and value.
4. **Rows by good list only goods traded this year or last year,** and an empty section
   says so ("No exports yet").
5. **In year 1 the last-year column shows "–"**, as the Treasury does.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The books

**Files:** `src/sim/trade-books.ts`, `src/sim/state.ts`, `src/sim/treasury.ts`,
`src/sim/exports.ts`, `src/sim/imports.ts`, `tests/sim/trade-ledger.test.ts`.

- [x] **Step 1:** Failing tests: an export is booked at the Palace (loads, drachmas, by
  good), not before; an import when it unloads; January moves this year into last year.
- [x] **Step 2:** Implement.

### Task 3: The report

**Files:** `src/sim/trade-ledger.ts`, `src/sim/treasury.ts`, `src/sim/inspect.ts`,
`tests/sim/trade-ledger.test.ts`.

- [x] **Step 1:** Failing tests: routes; caravans in each part of their trips; goods rows
  for this and last year; no last year in year 1.
- [x] **Step 2:** Implement.

### Task 4: The chapter

**Files:** `src/ui/ledger.ts`, `src/ui/ledger-chapters.ts`.

- [x] **Step 1:** Trade chapter on `tradeReport`, live while the Ledger is open.

### Task 5: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 31: Ledger: Trade`.
