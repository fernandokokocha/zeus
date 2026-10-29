# Slice 36: Learned city Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Learned city, the Scholars' House charter. For 24 months in a row the city has at
least one Townhouse (elites count), and every one of them has full culture: philosophy,
athletics and drama all passed recently. Each completion grants a Scholars' House permit.

**Architecture:** `src/sim/charters.ts` keeps one counting routine and two charter
definitions, Well dressed and Learned city, which differ in what makes a Townhouse miss a
month. `GameState.learnedCity` sits beside `wellDressed`, and `permits` gains
`scholarsHouse`. The Scholars' House building arrives next slice, so its name comes from a
small elite-name table for now. The Charter chapter shows both charters.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Learned city".

## Decisions (closest to Zeus, recorded in the commit)

1. **A Townhouse missing several cultures is reported by the first one missed**, in the order
   philosophy, athletics, drama ("Townhouse at 31,18 missed philosophy").
2. **Culture is checked at month end**, from the house's coverage at that moment, the same
   test the culture need uses.
3. **No Townhouse resets a running count** with "no Townhouse in the city", as Well dressed.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The Learned city tally

**Files:** `src/sim/charters.ts`, `src/sim/tick.ts`, `src/sim/state.ts`, `src/sim/housing.ts`,
`tests/sim/charters.test.ts`.

- [x] **Step 1:** Failing tests: counts a month with full culture everywhere; grants a
  Scholars' House permit and a notice at 24, then restarts; resets naming the house and the
  culture missed; a guild counts; lower houses never count; no Townhouse resets a running count.
- [x] **Step 2:** Implement, sharing the counting with Well dressed.

### Task 3: Charter chapter and docs

**Files:** `src/ui/charters.ts`, `tests/ui/charters.test.ts`, `docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests for the Learned city progress line and the scholars' permit line.
- [x] **Step 2:** Implement; update the numbers reference.
