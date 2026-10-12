# Slice 9: Map Modes Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A bar of map modes along the bottom of the screen. Choosing one tints the map
with a reading, and a legend explains its colours: water, food, supply (fleece + oil),
culture, appeal, fire risk, collapse risk, tax coverage, house level and staffing.
Choosing the active mode again turns the overlay off. `O`
toggles the last chosen mode, so the slice-4 shortcut still shows appeal.

**Architecture:** A new sim module `overlays.ts` turns state into a reading per tile for
a given overlay: a number in the overlay's own units (appeal points, culture points,
months of food, share of risk, share of staff, house level index), or `null` where the
overlay says nothing. The appeal layer becomes a general overlay layer whose colours come
from one table of colour stops per overlay; the legend is drawn from the same stops. The
appeal toggle becomes the map-mode bar.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 9.

## Global Constraints

- Readings come from the sim's own rules (`serviceLeft`, `culturePoints`, `riskShare`,
  `monthlyUse`, `houseAppeal`'s map), never re-derived in render code.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **House overlays tint occupied houses only.** Vacant lots have nobody to serve, as in
   Zeus where the overlays report on residents.
2. **Water and tax coverage fade** with the time left on the walker's visit: green just
   served, yellow about to run out, red not covered.
3. **Food** is months of food in the house: red none, yellow one month, green the full
   3-month stock. A house that does not eat yet (a Hut) reads as none.
4. **Supply** counts fleece and oil held: red neither, yellow one, green both.
5. **Culture** is colour-banded at the house thresholds: 0, 15 (Hovel), 35 (Tenement),
   45 (Townhouse).
6. **Fire and collapse risk** tint every building that can burn or collapse, from green
   (just maintained) to red (at the limit). Buildings that never burn or collapse stay
   untinted.
7. **Staffing** tints every building that employs workers by its share of staff.
8. **House level** goes from pale (Hut) to deep blue (Townhouse).
9. **One overlay at a time**, as in Zeus. `O` keeps toggling the last one (appeal at
   first).

## Tasks

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Overlay readings

**Files:** Create `src/sim/overlays.ts`, `tests/sim/overlays.test.ts`.

- [x] **Step 1:** Write failing tests: appeal reads the appeal map; water reads the share
  of coverage left on occupied houses only, across the whole footprint; tax likewise;
  food reads months of food; supply counts fleece and oil; culture reads culture points;
  fire risk reads the risk share of buildings that can burn and nothing on a Park;
  collapse risk likewise; house level reads the level index; staffing reads the share
  of staff and nothing on a Park.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Overlay layer and map-mode bar

**Files:** Rename `src/render/appeal-layer.ts` to `src/render/overlay-layer.ts`, rename
`src/ui/appeal-toggle.ts` to `src/ui/map-modes.ts`. Modify `index.html`,
`src/style.css`, `src/main.ts`, `src/render/palette.ts`.

- [x] **Step 1:** Colour stops per overlay; the layer paints the chosen overlay's
  readings; the bar picks the overlay and shows its legend as swatches.

### Task 4: Smoke test and look

- [x] **Step 1:** Extend the smoke test: open each map mode, check its legend, and
  screenshot appeal and staffing.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshots and check them.

### Task 5: PR

- [x] **Step 1:** Tick slice 9 in `docs/roadmap.md`.
- [ ] **Step 2:** Open the PR `Slice 09: Map modes`. Wait for CI and Pages.
