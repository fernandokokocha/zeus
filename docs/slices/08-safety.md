# Slice 8: Safety Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Buildings wear out. Each building with a fire risk increment builds up fire
risk, and each with a collapse risk increment builds up collapse risk, month by month. A
building whose fire risk reaches the limit catches fire: it is destroyed and leaves
burning ruins, which raise the fire risk of their neighbours until the fire burns out.
A building whose collapse risk reaches the limit collapses into rubble. A Maintenance
Office sends a superintendent to roam the streets; every building he passes has both
risks reset, and he puts out every fire he passes. Ruins are cleared with the demolish
tool.

**Architecture:** A new sim module `safety.ts` holds the risk tables, risk growth, fire
spread, ignition and collapse. Ruins are a 1×1 building type, one per tile of the
destroyed building, so they block placement, show in the inspector and are demolished
like any building. Destroying a building shares its cleanup (walkers, vendors on an
agora) with demolishing it. The superintendent is a roamer whose service is maintenance.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 8.

## Global Constraints

- **Risk increments** (zeus-numbers): fire — House 8, Tax Office 5, Wheat Farm 5,
  Granary 8, Storehouse 5, Carding Shed 5, Growers' Lodge 5. Collapse — Fountain 8,
  Granary 8, Agora 6, Olive Press 8, College 6. Every other building never burns and
  never collapses.
- **Collapse timing:** 60 ÷ increment = months until collapse, so risk grows by its
  increment each month and the limit is 60.
- **Maintenance Office:** 2×2, 5 workers, 10 dr, appeal 0. Superintendent range 44.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **Fire uses the collapse rule** (**ours**): fire risk grows by its increment each
   month and the building catches fire at 60. A House burns after 7.5 months untended, a
   Tax Office after 12. Deterministic, so the inspector can show how close it is.
2. **Only occupied houses build up fire risk.** A vacant lot has nobody to start a fire.
3. **A fire destroys the building at once**, as in Zeus: residents, workers and goods are
   lost and its walkers vanish. Every tile of it becomes ruins.
4. **Ruins burn for 2 months** (**ours**). While burning, each ruin tile adds **60 fire
   risk a month** (**ours**) to every building that can burn within 1 tile, so an
   untended neighbour catches fire within a month.
5. **The superintendent serves every building within 2 tiles** of the road he walks, the
   same reach as other roamers: both risks drop to 0 and burning ruins go out.
6. **Ruins stay until demolished.** Nothing can be built on them; demolishing them is
   free. Ruins have no appeal.
7. **A collapsing agora takes its vendors with it**, as demolishing it does.

## Review Focus

1. **Destroying vs demolishing** share one cleanup: walkers homed there vanish, vendors
   go with their agora, carriers and settlers bound there look elsewhere. Task 3.
2. **Fire spread** reaches only buildings that can burn, and stops when the fire is out.
   Task 4.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Refactor

**Files:** Modify `src/sim/commands.ts`.

- [x] **Step 1:** Refactor: demolish's cleanup of doomed buildings (vendors on a doomed
  agora, walkers homed there, tiles) becomes `removeBuildings(state, ids)`. No behavior
  change.

### Task 3: Risks, fire and collapse

**Files:** Create `src/sim/safety.ts`, `tests/sim/safety.test.ts`. Modify
`src/sim/buildings.ts`, `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`.

- [x] **Step 1:** Write failing tests: a Tax Office builds up 5 fire risk a month and
  burns after 12 months, leaving 4 burning ruin tiles; a vacant lot builds up none; an
  occupied house burns after 7.5 months and its residents are gone; a Fountain collapses
  after 7.5 months into rubble that is not burning; a Park never burns or collapses; a
  collapsing agora takes its vendor; ruins block placement and are cleared by demolish;
  a destroyed farm's cart pusher vanishes.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Fire spread

**Files:** Modify `src/sim/safety.ts`, `tests/sim/safety.test.ts`.

- [x] **Step 1:** Write failing tests: burning ruins raise a neighbouring house's fire risk
  by 60 a month and it catches fire; a fountain beside them never burns; a house 2 tiles
  away is untouched; ruins stop burning after 2 months and stop spreading.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: Maintenance Office

**Files:** Modify `src/sim/roamers.ts`, `src/sim/state.ts`, `src/sim/buildings.ts`.
Extend `tests/sim/safety.test.ts`.

- [x] **Step 1:** Write failing tests: a staffed Maintenance Office sends a superintendent
  who resets both risks of buildings within 2 tiles of his road, not farther; he puts
  out burning ruins he passes; a city with a Maintenance Office keeps its houses standing
  for years.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [ ] **Step 1:** Write failing tests: a house and a workplace show their fire risk and
  collapse risk as a share of the limit; a Park shows neither; ruins show whether they
  are burning and how to clear them; a superintendent describes his walk.
- [ ] **Step 2:** Implement. Tests pass.

### Task 7: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/render/models.ts`, `src/render/palette.ts`,
`src/render/walker-layer.ts`.

- [ ] **Step 1:** A Maintenance Office tool in a new Safety group.
- [ ] **Step 2:** Models: Maintenance Office (a workshop with a ladder, buckets and a tool
  rack), ruins (scorched stones and a charred beam; flames and smoke while burning).
  Walker: superintendent (with a bucket).

### Task 8: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [ ] **Step 1:** Extend the smoke test: place a Maintenance Office, screenshot.
- [ ] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 9: PR

- [ ] **Step 1:** Tick slice 8 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [ ] **Step 2:** Open the PR `Slice 08: Safety`. Wait for CI and Pages.
