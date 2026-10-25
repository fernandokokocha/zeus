# Slice 15: Charters Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A Charters panel, opened from the top bar, lists every charter with its
progress. The first charter is **Well fed**: no house that eats goes without food for 24
months in a row. Completing it grants a Traders' Guild permit, posts a notice and starts
the count again.

**Architecture:** A new sim module `charters.ts` tallies Well fed once a month, just
before houses eat (`tick.ts`), from the stocks they are about to eat from. Progress is
plain data in `state.wellFed` (`{ months, reset }`, where `reset` remembers the tick and
the house that last broke the streak), and the permit count in `state.guildPermits`.
Completion posts a notice that has no place on the map, so `Notice.at` becomes
`Point | null`; such a notice is a plain line, not a button. The UI (`src/ui/charters.ts`)
turns that state into panel lines with a pure function and shows them in a panel toggled
by a top-bar button and the C key.

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "Charters".

## Global Constraints

- **Well fed:** 24 months, one permit per completion (spec).
- **No look-key change:** no building is added and no model reads anything new.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **"Goes without food" is the meal that empties the stock:** at the monthly meal, a
   house that eats and whose food stock doesn't outlast the meal (stock at or below the
   month's need) went hungry. Checking for an already empty stock would miss Shacks: a
   Shack with no food devolves to a Hut, which doesn't eat, a tick before its next meal.
2. **Months with no house that eats don't count.** An empty city, or one of Huts, can't
   earn a permit by waiting. Those months don't reset the streak either.
3. **Several hungry houses in one month:** the reset names the first one (oldest
   building), with its level before it devolves.
4. **After a completion** the count restarts at 0 and the reset line clears, so the
   panel shows "Well fed: 0 / 24 months" until the next hungry house.
5. **The completion notice has no place on the map.** It reads "Charter complete: Well
   fed. A Traders' Guild permit is granted" and isn't clickable, like Zeus's messages
   that have no "go to".
6. **Panel key C**, next to N for notices. The panel opens beside the build menu.

## Review Focus

1. **The streak is counted from the stocks being eaten,** before `eat` runs, so the order
   in `tick.ts` matters and the tests go through `tick`. Task 2.
2. **Nullable notice place:** the one new `null` case is handled explicitly in the UI and
   tested. Task 3.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The Well fed charter

**Files:** Create `src/sim/charters.ts`, `tests/sim/charters.test.ts`. Modify
`src/sim/state.ts`, `src/sim/tick.ts`.

- [x] **Step 1:** Write failing tests: a fed Shack counts one month per meal; 24 fed
  months grant a permit, post the notice and restart at 0; a second 24 grant a second
  permit; a house whose meal empties its stock resets the count and is remembered as
  "Shack at 4,4 went hungry" with the tick; a Shack left without food resets the count
  before it devolves; Huts and vacant lots don't eat, so they neither count nor reset.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Notices without a place

**Files:** Modify `src/sim/notices.ts`, `src/sim/state.ts`, `src/ui/notices.ts`,
`tests/sim/notices.test.ts`.

- [x] **Step 1:** The completion notice test (in `tests/sim/charters.test.ts`) asserts
  `at: null`.
- [x] **Step 2:** `postNotice` takes `Point | null`; the feed and log show a placeless
  notice as a plain line instead of a "show on the map" button.

### Task 4: Charters panel

**Files:** Create `src/ui/charters.ts`, `tests/ui/charters.test.ts`. Modify
`index.html`, `src/style.css`, `src/main.ts`.

- [x] **Step 1:** Write failing tests for the panel's text: "Well fed: 14 / 24 months,
  reset 3 months ago (Hovel at 52,40 went hungry)", "reset this month", "1 month ago",
  no reset part before any reset, and "Traders' Guild permits: 1".
- [x] **Step 2:** Implement the button, the C key, and the panel, refreshed while open.

### Task 5: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** The smoke test opens the panel ("Well fed: 0 / 24 months",
  "Traders' Guild permits: 0") and closes it with C.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshots and check them.

### Task 6: Docs and ship

- [x] **Step 1:** Tick slice 15 in `docs/roadmap.md`. Record the charter numbers in
  zeus-numbers.
- [x] **Step 2:** Push to `main`, wait for CI and Pages.
