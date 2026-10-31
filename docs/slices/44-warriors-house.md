# Slice 44: Warriors' House and Drill Ground Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The third elite type. A Warriors' House replaces four Townhouses in a 4×4 block
along any road, with an Infirmary within 6 tiles, for 100 dr and a permit from Healthy and
well fed. Its Drill Ground across the road employs 8 from the labor pool. The house wears
8 units of armor a month, peddled from the Arms Vendor, and has no appeal need. Its sites
show in the inspector, the Elites map mode (red) and a notice.

**Architecture:** `EliteType` gains `warriorsHouse`, so `PermitType` folds into it.
`ELITE_SITES` gets the Drill Ground annex and the Infirmary neighbour. An elite's appeal
need becomes `number | null`, and `null` skips both the placement test and the demotion
test. Armor joins `MONTHLY_NEED` for the Warriors' House. The inspector's elite meters are
shared by the three types, since a third case has arrived.

**Spec:** `docs/superpowers/specs/2026-10-30-warriors-house-design.md`, "The Warriors' House
and the Drill Ground".

## Decisions (closest to Zeus, recorded in the commit)

1. **The site line needs the Infirmary.** Slice 39 shows an elite's site line only once one
   of its neighbours stands within 6 tiles. The warriors have one neighbour, so the line
   appears with the Infirmary, and "no Infirmary within 6 tiles" is said only when placing.
   Without that, every Townhouse along any road would carry the line.
2. **Article:** "Needs an Infirmary within 6 tiles".
3. **The house inspector shows no appeal line**, since warriors don't need any.
4. **The Drill Ground's inspector** shows its tile and workers; training is the next slice.
5. **Red** on the Elites map mode. A block placeable for several types shows the guild, then
   scholars, then warriors: the scarcer site wins.
6. **The models** are the owner's picks: Tower court, with a hoplite drilling while
   supplied, and Row of posts, with hoplites at the posts while staffed.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Placing a Warriors' House

**Files:** `src/sim/buildings.ts`, `src/sim/housing.ts`, `src/sim/elites.ts`,
`src/sim/state.ts`, `src/sim/safety.ts`, `tests/sim/warriors.test.ts`, `tests/sim/helpers.ts`.

- [x] **Step 1:** Failing tests: 4×4 over four Townhouses, 100 dr and a warriors permit;
  keeps 240 residents and their stocks; any road; Drill Ground across it, clear ground;
  an Infirmary within 6 tiles; no appeal test; tax multiplier 2; Drill Ground staffed from
  the pool, can't be demolished alone, goes with its house; fire 8, the Drill Ground
  neither burns nor collapses.
- [x] **Step 2:** Implement.

### Task 3: Armor and demotion

**Files:** `src/sim/food.ts`, `src/sim/elites.ts`, tests.

- [x] **Step 1:** Failing tests: 8 units of armor a month; peddled 24 from an Arms
  Vendor; unstarted until its first armor; breaks up a month after armor runs out, taking
  its Drill Ground; ugly neighbours never demote it.
- [x] **Step 2:** Implement.

### Task 4: Inspector, sites, map mode, reports

**Files:** `src/sim/inspect.ts`, `src/sim/overlays.ts`, `src/sim/elite-sites.ts`, tests.

- [x] **Step 1:** Failing tests: house and Drill Ground inspectors; the site line; the map
  reading; the notice; the population row; the supplies column.
- [x] **Step 2:** Implement.

### Task 5: Toolbar, models, docs

**Files:** `src/ui/*`, `src/render/*`, `docs/*`.

- [x] **Step 1:** Tool in the Elite menu, map key, colour, the chosen models wired in.
- [x] **Step 2:** Numbers reference, roadmap; typecheck, test, build.
