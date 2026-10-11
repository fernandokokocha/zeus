# Slice 3: Workers & services Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The city starts to run. Huts supply workers, buildings hire them, and wages
are paid monthly. A Fountain sends a water carrier roaming the streets, and houses
remember that water came by. A Palace and a Tax Office with a roaming clerk turn the
huts into monthly tax income. The top bar shows unemployment.

**Architecture:** As in slice 2. New sim modules: `labor.ts` (workforce and staffing),
`roamers.ts` (service walkers that wander and serve houses), `walking.ts` (movement
shared by settlers and roamers) and `economy.ts` (the monthly wages and taxes). The
walker layer draws each walker kind with its own figure.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 3.

## Global Constraints

- **Labor:** the workforce is `floor(52% × population)`. Buildings that touch a road
  hire from it in placement order. A building's output scales with
  `workers / needed`; with no workers it does nothing.
- **Buildings** (zeus-numbers): Fountain 2×2, 4 workers, 16 dr. Tax Office 2×2,
  8 workers, 25 dr. Palace 9×6, 0 workers, 125 dr.
- **Wages:** 3 dr per employed worker per year, paid monthly (0.25 dr each).
- **Taxes:** a house pays `tax multiplier × residents × 0.09` dr a month while a clerk
  has passed it recently and a Palace that touches a road exists.
- **Roaming:** the walker leaves by the exit tile (the first road tile touching the
  building, clockwise from north). At each step it prefers road tiles it hasn't walked,
  then avoids turning back. After its range (water carrier 27, tax clerk 35) it walks
  home by the shortest road path. It serves every house within 2 tiles of each road
  tile it steps on, on the way out and back.
- **Treasury** becomes fractional; the top bar shows it rounded down.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. A service lasts **2 months** after a walker passes (**ours**). Water and tax coverage
   both use it.
2. A building sends **one walker at a time**. After it returns, the building rests a
   quarter of a month at full staff before sending the next (**ours**). Understaffing
   stretches the rest proportionally.
3. **Tax is paid monthly** by every covered house into the treasury, rather than the
   clerk carrying coins. This matches the reference's per-month tax formula.
4. **Only one Palace.** A second is rejected, as in Zeus.
5. **Buildings without road access hire nobody**, as Zeus's labor seekers need a road.
6. **Fountains need no water source**, as in Zeus.
7. **Random choice at junctions** uses a seeded RNG kept in the game state, so the
   game stays deterministic.
8. **Placement anchor:** Fountain, Tax Office and Palace are placed with a click, the
   footprint centered on the cursor.

## Review Focus

1. **Labor order:** earlier buildings fill first; a building cut off from the road
   frees its workers. Tested in Task 2.
2. **Walkers and a changing world:** home demolished, road cut under or ahead of a
   roamer. Tested in Task 4.
3. **Monthly money:** wages only for employed workers; taxes only with a working Palace
   and coverage. Tested in Task 5.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan on branch `slice-03-workers-services`.

### Task 2: Buildings and labor

**Files:** Modify `src/sim/buildings.ts`, `src/sim/commands.ts`, `src/sim/state.ts`,
`src/sim/tick.ts`. Create `src/sim/labor.ts`, `tests/sim/labor.test.ts`.

- [x] **Step 1:** Write failing tests for `placeBuilding`: a Fountain, Tax Office and
  Palace cost their price; a second Palace is rejected.
- [x] **Step 2:** Write failing tests for labor: the workforce is 52% of population,
  rounded down; buildings fill in placement order; a building without road access
  hires nobody; houses need no workers; the summary reports unemployed and missing
  workers.
- [x] **Step 3:** Implement. Run the tests and see them pass.

### Task 3: Shared walking

**Files:** Create `src/sim/walking.ts`, `tests/sim/walking.test.ts`. Modify
`src/sim/settlers.ts`, `src/sim/rng.ts`, the tests.

- [x] **Step 1:** Refactor: move walker speed, `walkerPosition` and `walkerTile` to
  `walking.ts`. No behavior change.
- [x] **Step 2:** Refactor: `createRng` steps a plain `{ rngState }` holder through
  `nextRandom`, so the game state can carry its RNG. No behavior change.

### Task 4: Roaming walkers

**Files:** Create `src/sim/roamers.ts`, `tests/sim/roamers.test.ts`.

- [x] **Step 1:** Write failing tests: the exit tile is searched clockwise from north;
  a staffed fountain sends a carrier from its exit tile; none without workers; a
  half-staffed one waits twice as long; one at a time; the carrier walks fresh road
  before turning back; it turns home after its range and disappears on arrival;
  houses within 2 tiles of its route get water for 2 months and farther ones don't;
  it vanishes when its home is demolished or the road under it removed, and
  re-routes home when the road ahead is cut.
- [x] **Step 2:** Implement. Run the tests and see them pass.

### Task 5: Wages and taxes

**Files:** Create `src/sim/economy.ts`, `tests/sim/economy.test.ts`. Modify
`src/sim/housing.ts`, `src/sim/treasury.ts`.

- [x] **Step 1:** Write failing tests: at each month start, wages are paid for employed
  workers only; a covered house pays its tax with a Palace on a road; no Palace, a
  Palace without road, or an uncovered house pays nothing; last month's figures are
  kept for the inspector.
- [x] **Step 2:** Implement. Run the tests and see them pass.

### Task 6: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a Hut shows water and tax status; a Fountain
  shows workers and its carrier; a building without road says it doesn't work; the
  Palace shows last month's taxes and wages; a roamer shows its home and how far it
  has walked.
- [x] **Step 2:** Implement. Run the tests and see them pass.

### Task 7: UI and rendering

**Files:** Modify `index.html`, `src/style.css`, `src/ui/*`, `src/render/*`,
`src/main.ts`, `tests/ui/preview.test.ts`.

- [x] **Step 1:** Write failing preview tests: a Palace previews centered on the cursor;
  a second Palace previews invalid.
- [x] **Step 2:** Tools for Fountain, Tax Office and Palace. Top bar shows
  "Unemployed N" or "Need N workers".
- [x] **Step 3:** Models: Fountain (paved square, round basin with water, column with a
  bowl), Tax Office (plastered office, terracotta roof, porch columns, coin chest),
  Palace (marble podium, colonnaded hall with a pediment, two wings, courtyard).
  Walkers: water carrier in white with a blue jar on the shoulder; tax clerk in deep
  red with a tablet.

### Task 8: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: place a Fountain, a Tax Office and a Palace on
  the street, check the toolbar and the labor label, and screenshot with walkers out.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check the new buildings and walkers.

### Task 9: PR

- [x] **Step 1:** Tick slice 3 in `docs/roadmap.md`.
- [x] **Step 2:** Open the PR `Slice 03: Workers & services` with the playtest
  checklist, the decisions above, and what was left out. Wait for CI and the Pages
  deploy.

### Task 10: Playtest feedback

- [x] **Step 1:** The inspector shows a house's water as a percentage that runs down
  until the next carrier.
- [x] **Step 2:** Working buildings look different from idle ones: a staffed fountain
  spills water from its bowl into the basin, an unstaffed one stands dry; a staffed Tax
  Office has an open chest of coins. The version bumps when a building starts or stops
  working.
- [x] **Step 3:** Roadblock: placed on a road for 6 dr (**ours**); roaming walkers never
  step onto it, settlers pass.
