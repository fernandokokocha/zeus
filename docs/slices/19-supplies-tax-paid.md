# Slice 19: Supplies and tax paid Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The last three tint modes on buildings become columns. Supplies replaces Food
and Supply: one bar per good a residence holds, each as tall as its stock against the
most the residence holds of it. Houses record the tax they pay each month, and Tax
becomes a column of what each house paid in the last 12 months, scaled to the biggest
payer on the map. Eight modes remain.

**Architecture:** `src/sim/economy.ts` records each house's payment in a new
`taxPaid` history on `Building` (the last 12 months, oldest first). In
`src/sim/overlays.ts` a column becomes a row of bars, each a stack of parts, so Supplies
stands several bars side by side; the building tint readers go, and only Appeal and
Guilds remain tint modes. `src/render/column-layer.ts` spreads a building's bars across
its footprint.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "Map modes".

## Global Constraints

- **Modes:** Water, Supplies, Culture, Appeal, Risk, Tax, Staff, Guilds.
- **Full heights:** a Supplies bar = `houseStockTarget` for that good; Tax = the biggest
  12-month total among occupied houses on the map.
- Top-bar controls whose text changes keep a fixed width.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the commit)

1. **Supplies bars** are the goods the inspector shows: food, fleece and oil on a house,
   plus cloth on a Traders' Guild. A bar never stands taller than full.
2. **Tax paid** is recorded for every house each month, 0 when it paid nothing, so a
   house that stops being reached shrinks over a year.
3. **Tax with nobody paying** stands every house at its stub.
4. **The tooltip** for Tax reads "Tax paid, last 12 months: 8.64 dr"; Supplies names
   each good's units and full amount.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Tax paid

**Files:** `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/economy.ts`,
`tests/sim/economy.test.ts`.

- [x] **Step 1:** Failing tests: a house records what it paid each month, 0 when not
  reached, and keeps only the last 12 months.
- [x] **Step 2:** Implement.

### Task 3: Supplies and Tax columns

**Files:** `src/sim/overlays.ts`, `tests/sim/overlays.test.ts`.

- [x] **Step 1:** Failing tests: eight modes; columns are rows of bars; Supplies bars
  per good on houses and guilds; Tax scaled to the biggest payer, guilds left out.
- [x] **Step 2:** Implement; remove the building tint readers.

### Task 4: Render and UI

**Files:** `src/render/column-layer.ts`, `src/render/palette.ts`,
`src/render/overlay-layer.ts`, `src/ui/map-modes.ts`.

- [x] **Step 1:** Bars side by side; colours for food, fleece, oil, cloth and tax.
- [x] **Step 2:** Tint scales for Appeal and Guilds only; mode names.

### Task 5: Smoke test and look

- [ ] **Step 1:** Update `e2e/smoke.spec.ts` for eight modes; screenshot Supplies and
  Tax; check them.
