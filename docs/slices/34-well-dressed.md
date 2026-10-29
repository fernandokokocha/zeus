# Slice 34: Well dressed Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Well dressed replaces Well fed as the Traders' Guild charter. For 24 months in a
row the city has at least one Townhouse (a guild counts as one), and none of them goes
without fleece or oil. Permits are held per elite type.

**Architecture:** `src/sim/charters.ts` swaps `tallyWellFed` for `tallyWellDressed`, still
run at month end before `eat`. `GameState.wellFed` becomes `wellDressed`, whose reset carries
a `cause` ("Townhouse at 40,22 ran out of oil"). `guildPermits` becomes
`permits: Record<EliteType, number>`, with `EliteType = 'tradersGuild'` for now. The Charter
chapter shows the new charter and one permit line per type.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Well dressed".

## Decisions (closest to Zeus, recorded in the commit)

1. **A month with no Townhouse resets a running count** and names the cause ("no
   Townhouse in the city"). With no count to lose it records nothing, so a young city's
   panel doesn't read "reset this month" every month before its first Townhouse.
2. **Fleece and oil stock targets rise from 3 to 5 months**, as food's did after the
   Well fed playtest: a house counts as going without once its stock is down to one
   month's use, and 3 months left a peddler only 2 months to come back. A guild now
   stocks 40 fleece and 40 oil.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Per-type permits

**Files:** `src/sim/state.ts`, `src/sim/housing.ts`, `src/sim/guild.ts`, `src/sim/charters.ts`,
tests using `guildPermits`.

- [x] **Step 1:** Rename `guildPermits` to `permits.tradersGuild`; tests follow the rename.

### Task 3: The Well dressed tally

**Files:** `src/sim/charters.ts`, `src/sim/tick.ts`, `src/sim/state.ts`, `src/sim/guild.ts`,
`tests/sim/charters.test.ts`, `tests/sim/guild.test.ts`.

- [x] **Step 1:** Failing tests: counts a month with a supplied Townhouse; grants a guild
  permit and a notice at 24, then restarts; resets naming the house and the good when
  fleece or oil runs out; a guild counts as a Townhouse and resets it too; lower houses
  never count or reset; no Townhouse resets a running count and leaves a zero count alone.
- [x] **Step 2:** Implement, delete Well fed, update the guild's "no permit" reason.

### Task 4: Stock targets

**Files:** `src/sim/food.ts`, `tests/sim/guild.test.ts`.

- [x] **Step 1:** Failing test: peddlers stock a guild to 40 fleece and 40 oil.
- [x] **Step 2:** Implement.

### Task 5: Charter chapter and docs

**Files:** `src/ui/charters.ts`, `tests/ui/charters.test.ts`, `docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests for the progress line and one permit line per type.
- [x] **Step 2:** Implement; update the numbers reference.
