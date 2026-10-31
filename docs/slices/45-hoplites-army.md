# Slice 45: Hoplites and the army roster Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A Warriors' House's Drill Ground trains hoplites: one every 2 months at full
staff, in proportion to staffing, while the house is started and has armor in stock. A
company holds at most 8 and is lost with its house. The Ledger gains an **Army** chapter
listing each company and the city's total, and a full company posts a notice.

**Architecture:** A new `src/sim/army.ts` holds the training tick and the roster report.
The company lives on the house (`hoplites`), the training progress on the Drill Ground's
`production`, as the Armory keeps its own. Hoplites are a count, not walkers.

**Spec:** `docs/superpowers/specs/2026-10-30-warriors-house-design.md`, "Hoplites and the
army roster".

## Decisions (closest to Zeus, recorded in the commit)

1. **Training is not paused by a missing need** other than armor. The spec names only a
   started house with armor in stock; a house that lacks something else breaks up within a
   month anyway, taking its company.
2. **The progress is kept** while training pauses (no armor, no workers), like the Armory's.
3. **Inspector:** the house says "Company 5/8 hoplites"; the Drill Ground adds the company
   and what it is doing: "Training: 50% of a hoplite" (the Armory's wording), "Company full", "Not training: waiting
   for its first armor", "Not training: the house has no armor", "No workers: no hoplites
   are trained".
4. **The Army chapter** sits after Trade. With no Warriors' House it says so and what one
   brings.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Training

**Files:** `src/sim/army.ts`, `src/sim/state.ts`, `src/sim/commands.ts`, `src/sim/tick.ts`,
`tests/sim/army.test.ts`.

- [x] **Step 1:** Failing tests: one hoplite after 2 months at full staff; half staff takes
  twice as long; none while unstarted, without armor or without workers; a company stops
  at 8; the notice on a full company, once; hoplites don't add residents; lost when the
  house breaks up.
- [x] **Step 2:** Implement.

### Task 3: Inspector and the army roster

**Files:** `src/sim/inspect.ts`, `src/sim/army.ts`, `src/ui/ledger*.ts`, tests.

- [x] **Step 1:** Failing tests: the house and Drill Ground lines; the roster report rows
  and total.
- [x] **Step 2:** Implement, and the Army chapter in the Ledger.

### Task 4: Docs

- [x] **Step 1:** Roadmap; typecheck, test, build.
