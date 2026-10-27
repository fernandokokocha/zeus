# Slice 20: Ledger Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A Ledger window replaces the Charters panel. A Ledger button in the top bar and
the `L` key open it over the city, with five chapters down its left side: Population,
Production, Priorities, Treasury, Charter. Charter shows real data (what the Charters
panel showed); the other four are built on sample data, each marked "Sample data", so
the owner can judge the whole Ledger before slices 21–24 make it real.

**Architecture:** `src/ui/ledger.ts` owns the window: the chapter list, which chapter is
showing, and the toggles. Each chapter is a renderer in `src/ui/ledger-chapters.ts` that
takes a plain report object. `src/ui/ledger-samples.ts` holds the sample reports in the
exact shapes the later slices will compute from the simulation, so each later slice
swaps one sample for one sim function. `src/ui/charters.ts` keeps its text helpers and
loses its panel. Pure helpers (graph points, axis, bar shares, net) are tested in
`tests/ui/`.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "The Ledger".

## Global Constraints

- Chapters, in order: Population, Production, Priorities, Treasury, Charter.
- The Ledger remembers the last chapter opened; Population the first time.
- `C` and the Charters panel go.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the commit)

1. **The game keeps running** while the Ledger is open, as the Charters panel did; the
   speed controls stay usable.
2. **Escape closes it**, as well as `L` and its × button.
3. **Production bars** are scaled per good: the hatched bar is what the buildings could
   make, full width; the solid bar is the share of that actually made. Goods have
   different units, so one scale across rows would mean nothing.
4. **Sample Priorities controls work** on the sample rows (priority and Open/Closed
   change on screen) but change nothing in the game.
5. **Treasury** shows the categories as rows and this year / last year as columns, with
   income above spending and the net last.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Pure helpers

**Files:** `src/ui/ledger-chapters.ts`, `tests/ui/ledger.test.ts`.

- [x] **Step 1:** Failing tests: graph points span the box and scale to a rounded top;
  the axis top rounds up to a readable number; the made share of possible; the net of
  income and spending.
- [x] **Step 2:** Implement.

### Task 3: The window and chapters

**Files:** `index.html`, `src/style.css`, `src/ui/ledger.ts`,
`src/ui/ledger-chapters.ts`, `src/ui/ledger-samples.ts`, `src/ui/charters.ts`,
`src/main.ts`.

- [x] **Step 1:** Ledger button, `L`, Escape, chapter list, remembered chapter.
- [x] **Step 2:** Population, Production, Priorities, Treasury on samples; Charter real.
- [x] **Step 3:** Remove the Charters panel, its CSS and `C`.

### Task 4: Smoke test

- [x] **Step 1:** Update `e2e/smoke.spec.ts` from Charters to the Ledger.
