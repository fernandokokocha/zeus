# Slice 21: Ledger: Treasury Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The Ledger's Treasury chapter shows real figures. Every drachma that enters or
leaves the treasury is booked under a category (taxes, wages, construction, sheep), per
year, and the chapter shows this year so far against last year, with the net.

**Architecture:** `src/sim/treasury.ts` owns the books: `Accounts`, `TreasuryReport`, a
`spend` that charges the treasury and books the category, and `treasuryReport(state)`.
`GameState` gains `accounts: { thisYear, lastYear }`; the year rolls over at the start of
January, before that month's wages and taxes are settled. Every treasury change in the sim
goes through `spend` or the monthly settlement. The UI's sample goes; the chapter
re-renders from `treasuryReport` while the Ledger is open.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "Treasury".

## Decisions (closest to Zeus, recorded in the commit)

1. **The year is the game's calendar year**, rolling over in January, as Zeus's finance
   overview does; it is not a rolling 12 months like Tax paid.
2. **January's wages and taxes belong to the new year**: the books roll over first.
3. **In year 1 the last-year column shows "–"**, since there was no year before the
   founding.
4. **Construction** is everything placed with the tools: buildings, houses, roads,
   roadblocks and a Traders' Guild. Ruins cost nothing and so book nothing. Sheep are
   their own category, as the spec lists them.
5. **The Ledger shows whole drachmas.** The books keep exact amounts; the chapter rounds.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The books

**Files:** `src/sim/treasury.ts`, `src/sim/state.ts`, `src/sim/economy.ts`,
`src/sim/commands.ts`, `tests/sim/treasury.test.ts`.

- [x] **Step 1:** Failing tests: roads, roadblocks, buildings and guilds book
  construction; sheep book sheep; monthly wages and taxes book theirs; January moves this
  year into last year and starts fresh; the report labels the years and has no last year
  in year 1.
- [x] **Step 2:** Implement.

### Task 3: The chapter

**Files:** `src/ui/ledger.ts`, `src/ui/ledger-chapters.ts`, `src/ui/ledger-samples.ts`,
`tests/ui/ledger.test.ts`.

- [x] **Step 1:** Treasury on `treasuryReport`, live while the Ledger is open, no sample
  badge; the sample goes.
