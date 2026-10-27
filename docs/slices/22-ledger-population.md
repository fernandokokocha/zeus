# Slice 22: Ledger: Population Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The Ledger's Population chapter shows real figures: a graph of the population
one point a month since the founding, houses and people per level, and the reasons houses
are not evolving with how many houses each one holds back.

**Architecture:** `src/sim/population.ts` owns `populationHistory` recording and
`populationReport(state)`. `GameState` gains `populationHistory: number[]`, starting at
the founding's 0 and growing by one point at each month's settlement. The inspector's
"Needs for …" check moves into `evolutionBlockers` in `src/sim/housing.ts`, so the
inspector and the Ledger run the same check. The UI's sample goes; the chapter re-renders
from `populationReport` while the Ledger is open.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "Population".

## Decisions (closest to Zeus, recorded in the commit)

1. **The graph's first point is the founding**, population 0, so each year's label sits
   on its January.
2. **Population counts every resident**, Traders' Guild merchants included, as the top
   bar does.
3. **Every level is listed, empty ones as 0**, plus a Traders' Guild row; vacant lots are
   not a level and are left out.
4. **A house counts once under each reason it has.** Townhouses have nowhere to evolve
   and count under none. Reasons are sorted by how many houses they hold back.
5. **Reasons read like the inspector's, without the house's own value:** "needs: oil",
   "needs: culture 35", "needs: appeal 30".

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The records

**Files:** `src/sim/population.ts`, `src/sim/housing.ts`, `src/sim/inspect.ts`,
`src/sim/state.ts`, `src/sim/tick.ts`, `tests/sim/population.test.ts`.

- [x] **Step 1:** Failing tests: history starts at 0 and gains the population each
  month; levels count houses and people, guild included; blockers group houses by
  reason, most common first, townhouses excluded.
- [x] **Step 2:** Extract `evolutionBlockers`; inspector tests stay green unmodified.
- [x] **Step 3:** Implement.

### Task 3: The chapter

**Files:** `src/ui/ledger.ts`, `src/ui/ledger-chapters.ts`, `src/ui/ledger-samples.ts`.

- [x] **Step 1:** Population on `populationReport`, live while the Ledger is open, no
  sample badge; the sample goes.
