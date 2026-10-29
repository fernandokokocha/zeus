# Slice 37: Scholars' House and Library Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The second elite type. A Scholars' House replaces four Townhouses in a 4×4 block
along any road, with a Theater, a Gymnasium and a Podium within 6 tiles, for 100 dr and a
permit from Learned city. Its Library across the road (8 workers) fetches up to 4 scrolls
from storehouses; the house reads one a year, and each finished scroll is a Work of Art. A
Library with nothing to read for a month ends the house.

**Architecture:** The guild's generic parts move from `src/sim/guild.ts` to a new
`src/sim/elites.ts`: a per-type site rule (annex, road kind, neighbours), the blueprint,
the site survey and its reasons, raising, the annex link, needs and demotion. `guild.ts`
keeps the guild's site help (inspector line, map range, notice), which the next slice
generalises. `housing.ts` gets one housing table per elite type. `src/sim/scholars.ts` holds
reading and Works of Art; `GameState.worksOfArt` is a count shown in the top bar and the
Treasury chapter.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "The Scholars'
House and the Library".

## Decisions (closest to Zeus, recorded in the commit)

1. **Reading is whole units:** the house reads 1 unit of scroll every 36 ticks (100 a year),
   so stocks stay whole numbers. It reads whenever the Library holds a unit, staffed or not.
2. **The Library's buyer** is a Buyer like the vendors', fetching whole scrolls (up to 4 at a
   trip) whenever a whole scroll fits.
3. **Missing neighbours are listed together:** "Needs a Theater, a Gymnasium and a Podium
   within 6 tiles". They need only to stand there, staffed or not.
4. **Fire risk 8,** as the guild and a house. The Library neither burns nor collapses, as the
   yard.
5. **Site help (inspector, map mode, notice) stays the guild's** until the Elite sites slice.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Elites, generalised

**Files:** `src/sim/elites.ts`, `src/sim/guild.ts`, `src/sim/housing.ts`, `src/sim/commands.ts`,
`src/sim/food.ts`, callers, tests.

- [x] **Step 1:** Move the guild's blueprint, survey, raising, annex and demotion to
  `elites.ts`, keyed by type. Guild tests stay green (blueprint's `yard` is now `annex`).

### Task 3: Placing a Scholars' House

**Files:** `src/sim/buildings.ts`, `src/sim/elites.ts`, `src/sim/safety.ts`,
`tests/sim/scholars.test.ts`.

- [x] **Step 1:** Failing tests: 4×4 over four Townhouses, 100 dr and a permit; keeps up to
  240 residents and their stocks; any road; Library across it, clear ground; Theater,
  Gymnasium and Podium within 6 tiles; appeal 25; tax multiplier 2; Library can't be
  demolished alone, goes with its house.
- [x] **Step 2:** Implement.

### Task 4: The Library, reading and Works of Art

**Files:** `src/sim/scholars.ts`, `src/sim/carriers.ts`, `src/sim/elites.ts`, `src/sim/tick.ts`,
`src/sim/state.ts`, tests.

- [x] **Step 1:** Failing tests: the buyer fetches scrolls from storehouses up to 4; reading
  takes 1 unit every 36 ticks; 100 units make a Work of Art with a notice; an empty Library
  for a month breaks the house up, posting what it lacked; scrolls arriving stop it.
- [x] **Step 2:** Implement.

### Task 5: Inspector, Ledger, top bar, toolbar

**Files:** `src/sim/inspect.ts`, `src/sim/population.ts`, `src/sim/overlays.ts`,
`src/ui/*`, tests.

- [x] **Step 1:** Failing tests: house and Library inspectors; the population chapter row;
  Works of Art in the Treasury chapter.
- [x] **Step 2:** Implement; add the tool to the Elite menu and the count to the top bar.

### Task 6: Models and docs

- [x] **Step 1:** Placeholder models; typecheck and build.
- [x] **Step 2:** Backlog entries and the numbers reference.
