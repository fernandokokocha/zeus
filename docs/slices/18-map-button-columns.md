# Slice 18: Map button and columns Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Map modes move from the bottom bar into a **Map ▾** dropdown in the top bar.
While a mode is on, the city switches to the Zeus view: buildings the mode reports on are
flattened to their footprint, buildings that serve the mode stay as they are, everything
else fades. Water, Culture, Risk and Staff stand a column on each reported building, and
hovering one shows its exact values. Fire and Collapse merge into Risk; Houses goes.

**Architecture:** `src/sim/overlays.ts` stays the one place that knows what each mode
reports. It gains `overlayColumns` (per building: stacked column parts, each a share of
full height, plus the tooltip lines) and `buildingLook` (reported, serving, faded).
Food, Supply and Tax keep tile readings until slice 19; Appeal and Guilds stay tile
modes. In `src/render`, a new `column-layer.ts` draws flat bases and columns with
instancing; `world-layer.ts` learns to hide or fade a placed model; `overlay-layer.ts`
only tints. In `src/ui`, `map-modes.ts` becomes the dropdown, the one-line ramp and the
hover tooltip.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "Map modes".

## Global Constraints

- **Modes this slice:** Water, Food, Supply, Culture, Appeal, Risk, Tax, Staff, Guilds.
- **Full heights:** Water = the 4-month service memory; Culture = 45, the Townhouse's
  culture points; Risk = the risk limit; Staff = fully staffed.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the commit)

1. **Culture over 45.** A house that has all three cultures (60 points) stands taller
   than full height, as the spec scales to 45. Full height marks "enough for Townhouse".
2. **Risk turns red at 80%** of the limit. Fire is orange and collapse is grey-brown below.
3. **Tile modes fade every building** (none reports or serves), so the tint reads clearly.
4. **Food, Supply and Tax** flatten the houses they report on and tint the base, with the
   servers from the spec's table (Supplies' servers for Food and Supply).
5. **The ramp under the Map button** is one line of the mode's stops, a swatch and a
   label each, for every tint mode, not only Appeal and Guilds.
6. **Tint modes get a tooltip too**, with the value behind the tint.
7. **Opening the dropdown** doesn't pause; choosing a mode closes it; `Escape` closes it.

## Review Focus

1. Tooltip values and column heights come from the same sim function.
2. Faded materials are cached clones, never mutations of shared materials.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Modes and columns in the sim

**Files:** `src/sim/overlays.ts`, `tests/sim/overlays.test.ts`.

- [x] **Step 1:** Failing tests: Risk replaces fire and collapse; Houses is gone; columns for
  water, culture (three parts), risk (higher risk, its kind, both in the details) and staff;
  a vacant lot gets no column; looks (reported, serving, faded) per mode.
- [x] **Step 2:** Implement.

### Task 3: Render

**Files:** `src/render/column-layer.ts`, `src/render/world-layer.ts`,
`src/render/overlay-layer.ts`, `src/render/palette.ts`.

- [x] **Step 1:** Column layer: flat bases, base stubs, stacked shafts.
- [x] **Step 2:** World layer hides reported buildings and fades the rest.

### Task 4: UI

**Files:** `index.html`, `src/ui/map-modes.ts`, `src/style.css`, `src/main.ts`.

- [x] **Step 1:** Map ▾ button and dropdown, label "Map: Water" / "Map: Off", `O` toggles.
- [x] **Step 2:** One-line ramp for tint modes; corner legend and bottom bar removed.
- [x] **Step 3:** Hover tooltip.

### Task 5: Smoke test and look

- [x] **Step 1:** Update `e2e/smoke.spec.ts` for the dropdown; screenshot Water, Culture,
  Risk and Staff; check them.
